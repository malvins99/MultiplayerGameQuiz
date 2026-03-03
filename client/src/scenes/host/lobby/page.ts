import Phaser from 'phaser';
import { Room, Client } from 'colyseus.js';
import { supabaseB, SESSION_TABLE, PARTICIPANT_TABLE } from '../../../lib/supabaseB';
import { supabase } from '../../../lib/supabase';
import { Player } from '../../../../../shared/state';
import { Router } from '../../../utils/Router';
import { TransitionManager } from '../../../utils/TransitionManager';
import { CharacterSelectPopup } from '../../../ui/CharacterSelectPopup';
import { QRCodePopup } from '../../../ui/QRCodePopup';
import { HAIR_OPTIONS, getHairById } from '../../../data/characterData';
import * as QRCode from 'qrcode';

export class HostWaitingRoomScene extends Phaser.Scene {
    room!: Room;
    isHost: boolean = false;
    mySessionId: string = '';
    isGameStarting: boolean = false;
    isManuallyLeaving: boolean = false;
    isRestore: boolean = false;
    isReconnecting: boolean = false; // Guard: cegah multiple restoreRoom() berjalan bersamaan

    // UI Elements
    waitingUI: HTMLElement | null = null;
    roomCodeEl: HTMLElement | null = null;
    playerGridEl: HTMLElement | null = null;
    playerCountEl: HTMLElement | null = null;
    startBtn: HTMLElement | null = null;
    waitingMsg: HTMLElement | null = null;
    nameInput: HTMLInputElement | null = null;
    roomListEl: HTMLElement | null = null;
    hostIndicatorEl: HTMLElement | null = null;

    // New Elements
    copyCodeBtn: HTMLElement | null = null;
    copyFeedback: HTMLElement | null = null;
    roomQrCode: HTMLImageElement | null = null;
    backBtn: HTMLElement | null = null;
    countdownOverlay: HTMLElement | null = null;
    countdownText: HTMLElement | null = null;

    // Feature
    characterPopup: CharacterSelectPopup | null = null;
    characterPreviewEl: HTMLElement | null = null;
    qrPopup: QRCodePopup | null = null;

    // Group Management State
    allFetchedGroups: any[] = [];
    selectedGroups: Map<string, any> = new Map();
    groupSearchQuery: string = '';

    // Friend Management State
    allFetchedFriends: any[] = [];
    selectedFriends: Map<string, any> = new Map();
    friendSearchQuery: string = '';

    constructor() {
        super('HostWaitingRoomScene');
    }

    init(data: { room?: Room, isHost?: boolean, client?: any, isRestore?: boolean }) {
        if (data.room) {
            this.room = data.room;
            this.mySessionId = this.room.sessionId;
            this.registry.set('room', this.room);
        }
        if (data.client) {
            this.registry.set('client', data.client);
        }
        this.isHost = data.isHost !== undefined ? data.isHost : true;

        // Simpan flag restore — jangan panggil restoreRoom() di sini karena UI belum ada.
        // Restore akan dipanggil di create() setelah overlay loading muncul.
        this.isRestore = !!data.isRestore;

        if (this.room) {
            this.room.onMessage('timerUpdate', () => {
                // No-op: actual timer UI is handled by HostProgressScene or GameScene
            });
        }
    }

    async restoreRoom(client: any) {
        // Guard: cegah multiple restoreRoom() berjalan bersamaan
        if (this.isReconnecting) {
            console.warn("[Restore] Already reconnecting, skipping.");
            return;
        }
        this.isReconnecting = true;

        // Tutup room lama yang mati
        try {
            if (this.room) {
                this.room.removeAllListeners?.();
                this.room.leave?.();
            }
        } catch (_) { /* ignore */ }
        this.room = null as any;

        const savedRoomId = localStorage.getItem('currentRoomId');
        const savedSessionId = localStorage.getItem('currentSessionId');

        if (!savedRoomId) {
            console.warn("[Restore] No room ID saved.");
            this.isReconnecting = false;
            this.cleanupAndGoLobby();
            return;
        }

        // Delay minimal — beri waktu server menyelesaikan onLeave lama
        await new Promise(resolve => setTimeout(resolve, 100));

        const maxRetries = 999999;
        const retryDelay = 2000; // Retry santai setiap 2 detik

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`[Restore] Attempt ${attempt} via joinById...`);

                const profile = JSON.parse(localStorage.getItem('game_user_profile') || '{}');
                const name = profile.nickname || profile.fullname || "Host";

                this.room = await client.joinById(savedRoomId, {
                    name,
                    sessionId: savedSessionId,
                    isHost: true
                });

                // Berhasil!
                this.mySessionId = this.room.sessionId;
                localStorage.setItem('currentReconnectionToken', this.room.reconnectionToken ?? '');
                localStorage.setItem('currentRoomId', this.room.id);
                localStorage.setItem('currentSessionId', this.room.sessionId);

                const initRestore = () => {
                    this.setupRoomListeners();
                    this.setupStateListeners();
                    this.updateRoomCode();
                    this.updateHostStatus();
                    this.updateAll();
                };
                if (this.room.state) {
                    initRestore();
                } else {
                    this.room.onStateChange.once(() => initRestore());
                }
                console.log(`[Restore] ✅ Session restored on attempt ${attempt}! SessionId: ${this.mySessionId}`);

                this.hideRestoringOverlay();
                this.isReconnecting = false;
                return;

            } catch (e: any) {
                console.warn(`[Restore] Attempt ${attempt} failed:`, e?.message || e);
                this.room = null as any;

                // Jangan pernah menyerah! Tunggu dan coba lagi
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
        }

        // Ini secara praktis tidak akan terjangkau karena maxRetries sangat besar
        this.isReconnecting = false;
        this.cleanupAndGoLobby();
    }

    /** Layar loading profesional saat restorasi */
    showRestoringOverlay() {
        // Hapus jika sudah ada
        document.getElementById('zigma-restore-overlay')?.remove();

        const overlay = document.createElement('div');
        overlay.id = 'zigma-restore-overlay';
        overlay.className = 'fixed inset-0 z-[100] bg-[#0f0f1a] flex flex-col items-center justify-center';
        overlay.innerHTML = `
            <div class="flex flex-col items-center gap-8 animate-pulse">
                <!-- Glowing Logo/Icon -->
                <div class="relative">
                    <div class="absolute inset-0 bg-primary/20 blur-3xl rounded-full"></div>
                    <span class="material-symbols-outlined text-primary text-[80px] relative drop-shadow-[0_0_20px_rgba(0,255,136,0.5)]">sync</span>
                </div>
                
                <div class="space-y-4 text-center">
                    <h2 class="text-white font-['Press_Start_2P'] text-sm md:text-base tracking-[4px] uppercase">Restoring Session</h2>
                    <p class="text-primary/60 font-['Press_Start_2P'] text-[9px] animate-bounce tracking-widest">Syncing with server...</p>
                </div>

                <!-- Progress Bar Style -->
                <div class="w-64 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/10 mt-4">
                    <div class="h-full bg-primary shadow-[0_0_15px_rgba(0,255,136,0.8)] w-1/2 animate-[loading_2s_infinite_easeInOut]"></div>
                </div>
            </div>
            <style>
                @keyframes loading {
                    0% { transform: translateX(-100%); width: 30%; }
                    50% { width: 60%; }
                    100% { transform: translateX(350%); width: 30%; }
                }
            </style>
        `;
        document.body.appendChild(overlay);
    }

    hideRestoringOverlay() {
        const overlay = document.getElementById('zigma-restore-overlay');
        if (overlay) {
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 0.5s ease';
            setTimeout(() => overlay.remove(), 500);
        }
    }

    /** Bersihkan UI dan kembali ke lobby */
    cleanupAndGoLobby() {
        // Sembunyikan waiting-ui agar tidak ghost di atas lobby
        if (this.waitingUI) this.waitingUI.classList.add('hidden');
        const waitingUiEl = document.getElementById('waiting-ui');
        if (waitingUiEl) waitingUiEl.classList.add('hidden');

        // Hapus countdown overlay jika ada
        if (this.countdownOverlay) {
            this.countdownOverlay.remove();
            this.countdownOverlay = null;
        }

        Router.navigate('/host/select-quiz');
        this.scene.start('LobbyScene');
    }

    /** Muncullkan Notifikasi Toast Kustom */
    showToast(message: string, isError: boolean = false) {
        let toastContainer = document.getElementById('zigma-toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'zigma-toast-container';
            toastContainer.className = 'fixed top-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-[99999] pointer-events-none';
            document.body.appendChild(toastContainer);
        }

        const toast = document.createElement('div');
        // Zigma game theme: glowing borders, press start font
        const bgColor = isError ? 'bg-red-950/90' : 'bg-black/90';
        const borderColor = isError ? 'border-red-500' : 'border-primary';
        const textColor = isError ? 'text-red-400' : 'text-primary';
        const shadowColor = isError ? 'shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'shadow-[0_0_15px_rgba(0,255,136,0.5)]';
        const icon = isError ? 'error' : 'check_circle';

        toast.className = `flex items-center gap-3 px-6 py-4 md:px-8 md:py-5 rounded-xl border-2 ${bgColor} ${borderColor} ${shadowColor} transform translate-y-[-100%] opacity-0 transition-all duration-300 ease-out pointer-events-auto backdrop-blur-sm`;

        toast.innerHTML = `
            <span class="material-symbols-outlined ${textColor} text-xl md:text-2xl">${icon}</span>
            <span class="text-white font-['Press_Start_2P'] text-[8px] md:text-[10px] leading-snug max-w-[250px] md:max-w-[400px] break-words">
                ${message}
            </span>
        `;

        toastContainer.appendChild(toast);

        // Animate in
        requestAnimationFrame(() => {
            toast.classList.remove('translate-y-[-100%]', 'opacity-0');
            toast.classList.add('translate-y-0', 'opacity-100');
        });

        // Auto remove
        setTimeout(() => {
            toast.classList.remove('translate-y-0', 'opacity-100');
            toast.classList.add('translate-y-[-100%]', 'opacity-0');
            setTimeout(() => {
                if (toastContainer?.contains(toast)) {
                    toastContainer.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
    setupRoomListeners() {
        if (!this.room) return;

        // Listen for players joining/leaving
        this.room.state.players.onAdd((player: any, sessionId: string) => {
            console.log("Player join:", player.name);
            this.updatePlayerGrid();
            this.updateHostStatus();

            // Listen for name changes
            player.onChange(() => {
                this.updatePlayerGrid();
            });
        });

        this.room.state.players.onRemove((player: any, sessionId: string) => {
            console.log("Player left:", player.name);
            this.updatePlayerGrid();
            this.updateHostStatus(); // Updates player count text
        });

        // Listen for game start message
        this.room.onMessage("start_game", (message) => {
            console.log("Game start message received!");
            // this.startCountdown(); // Removed as method doesn't exist, overlay handled by state listener
        });

        // AUTO RECONNECT logic if connection is lost
        this.room.onLeave((code) => {
            console.log(`[Host] Disconnected from room with code: ${code}`);
            if (code !== 1000 && !this.isGameStarting && !this.isManuallyLeaving) {
                console.warn("[Host] Connection lost unexpectedly. Attempting to reconnect...");
                // Null-kan this.room dulu agar restoreRoom() bisa mulai fresh
                this.room = null as any;
                const client = this.registry.get('client');
                if (client) {
                    this.restoreRoom(client);
                } else {
                    console.error("[Host] Cannot auto-reconnect: Client not found in registry.");
                }
            }
        });
    }

    /**
     * Pasang semua room.state.listen dan room.onMessage listener.
     * Dipanggil dari create() jika room sudah ada, atau dari restoreRoom() setelah reconnect.
     */
    setupStateListeners() {
        if (!this.room) return;

        this.room.state.listen("roomCode", (code: string) => {
            if (this.roomCodeEl) this.roomCodeEl.innerText = code || '------';
            this.updateQrCode(code);
            this.updateJoinUrl(code);
        });

        this.room.state.listen("hostId", (hostId: string) => {
            // Only reload if we are absolutely sure we are NOT the host anymore
            // AND we were supposed to be the host.
            // But be careful: upon reconnection, hostId might be reassigned differently if we joined as a "new" client.
            // Best to just update UI unless strictly required.
            if (this.isHost && hostId !== this.mySessionId) {
                console.warn("Host ID changed and does not match my session ID.");
                // alert("Host status lost."); // Optional feedback
            }
            this.updateHostStatus();
        });

        this.room.state.subRooms.onAdd((subRoom: any) => {
            this.updateRoomList();
            subRoom.playerIds.onAdd(() => this.updateAll());
            subRoom.playerIds.onRemove(() => this.updateAll());
        });

        this.room.state.players.onAdd((player: any, key: string) => {
            this.updateAll();
            player.listen("name", () => this.updateAll());
            player.listen("hairId", () => this.updateAll());
            player.listen("subRoomId", () => this.updateAll());
        });

        this.room.state.players.onRemove(() => this.updateAll());

        // Listen for Countdown
        this.room.state.listen("countdown", (val: number) => {
            if (val > 0) {
                if (this.countdownOverlay) {
                    this.countdownOverlay.classList.remove('hidden');
                    this.countdownOverlay.style.opacity = '1';
                }
                if (this.countdownText) this.countdownText.innerText = val.toString();
            } else if (val === 0) {
                if (this.countdownText) this.countdownText.innerText = "GO!";
            }
        });

        // Listen for Game Start (State)
        this.room.state.listen("isGameStarted", (isStarted: boolean) => {
            if (isStarted) this.handleGameStart();
        });

        // Listen for Game Start (Message)
        this.room.onMessage("gameStarted", () => {
            this.handleGameStart();
        });

        // Safety net: on first full state change, update room code/QR/URL
        // This handles the case where listen("roomCode") misses initial value
        this.room.onStateChange.once((state: any) => {
            console.log("[onStateChange.once] Full state received, roomCode:", state.roomCode);
            if (state.roomCode) {
                if (this.roomCodeEl) this.roomCodeEl.innerText = state.roomCode;
                this.updateQrCode(state.roomCode);
                this.updateJoinUrl(state.roomCode);
            }
        });
    }

    create() {
        // Inject shared styles (play-idle)
        const styleId = 'waiting-room-common-styles';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.innerHTML = `
                @keyframes play-idle {
                    from { background-position: 0 0; }
                    to { background-position: -864px 0; }
                }
            `;
            document.head.appendChild(style);
        }

        this.waitingUI = document.getElementById('waiting-ui');

        // Hide lobby, show waiting room container
        const lobbyUI = document.getElementById('lobby-ui');
        if (lobbyUI) lobbyUI.classList.add('hidden');
        if (this.waitingUI) this.waitingUI.classList.remove('hidden');

        // IF HOST: Inject Custom Layout
        if (this.isHost) {
            this.createHostLayout();
            // Map Host specific elements
            this.roomCodeEl = document.getElementById('host-room-code');
            this.startBtn = document.getElementById('host-start-btn');
            this.backBtn = document.getElementById('host-back-btn');
            this.roomQrCode = document.getElementById('host-qr-img') as HTMLImageElement;
            this.copyCodeBtn = document.getElementById('copy-code-btn');

            // IF RESTORE: Langsung reconnect di background tanpa overlay loading
            if (this.isRestore && !this.room) {
                const client = this.registry.get('client');
                if (client) {
                    // Jadwal restoreRoom() di tick berikutnya agar UI sempat dirender browser
                    setTimeout(() => this.restoreRoom(client), 100);
                } else {
                    // Tidak ada client, langsung kembali ke lobby
                    this.cleanupAndGoLobby();
                }
            }
        } else {
            // Player Logic (Original DOM mapping)
            this.roomCodeEl = document.getElementById('display-room-code');
            this.playerGridEl = document.getElementById('player-grid');
            this.playerCountEl = document.getElementById('player-count');
            this.startBtn = document.getElementById('start-game-btn');
            this.waitingMsg = document.getElementById('waiting-msg');
            this.nameInput = document.getElementById('player-name-input') as HTMLInputElement;
            this.roomListEl = document.getElementById('room-list');
            this.hostIndicatorEl = document.getElementById('host-indicator');
            this.copyCodeBtn = document.getElementById('copy-code-btn');
            this.copyFeedback = document.getElementById('copy-feedback');
            this.roomQrCode = document.getElementById('room-qr-code') as HTMLImageElement;
            this.backBtn = document.getElementById('waiting-back-btn');
        }

        // Immediately populate roomCode/QR/link from URL (works even before room reconnect)
        this.updateRoomCode();

        // Setup room jika sudah tersedia (alur normal, bukan restore)
        if (this.room) {
            // SAVE TOKEN for future refreshes!
            localStorage.setItem('currentReconnectionToken', this.room.reconnectionToken);
            localStorage.setItem('currentRoomId', this.room.id);
            localStorage.setItem('currentSessionId', this.room.sessionId);

            const initRoom = () => {
                this.setupRoomListeners();
                this.setupStateListeners(); // Pasang semua state listener
                this.updateAll();           // Update UI langsung
            };

            if (this.room.state) {
                initRoom();
            } else {
                this.room.onStateChange.once(() => initRoom());
            }
        }

        // Setup Host UI (ada guard di dalam method jika room null)
        this.updateHostStatus();

        // --- Event Listeners ---

        // Back Button (Player Only - Host handled in createHostLayout)
        if (this.backBtn && !this.isHost) {
            this.backBtn.onclick = () => {
                this.leaveRoom();
            };
        }

        // Copy Code Button
        if (this.copyCodeBtn) {
            this.copyCodeBtn.onclick = () => {
                const code = this.room.state.roomCode;
                if (code) {
                    navigator.clipboard.writeText(code).then(() => {
                        this.showCopyFeedback();

                        // Icon Check Animation
                        const iconSpan = this.copyCodeBtn?.querySelector('.material-symbols-outlined');
                        if (iconSpan) {
                            const originalText = iconSpan.textContent;
                            iconSpan.innerHTML = 'check';
                            iconSpan.classList.add('text-primary');
                            setTimeout(() => {
                                iconSpan.innerHTML = 'content_copy';
                                iconSpan.classList.remove('text-primary');
                            }, 2000);
                        }
                    });
                }
            };
        }

        // Name Input Sync (Only for Player)
        if (this.nameInput) {
            const myPlayer = this.room.state.players.get(this.mySessionId);
            if (myPlayer) {
                this.nameInput.value = myPlayer.name || 'Player';
            }
            this.nameInput.addEventListener('input', () => {
                this.room.send('updateName', { name: this.nameInput!.value });
            });
        }

        // State listeners dipindah ke setupStateListeners()
        // Dipanggil di atas jika this.room ada, atau di restoreRoom() setelah reconnect

        // --- Character & QR Popup (Only for Player) ---
        if (!this.isHost) {
            this.setupCharacterCustomization();
            this.setupQRPopup();
        }
    }

    createHostLayout() {
        if (!this.waitingUI) return;

        // NEW 2-COLUMN HOST LAYOUT
        this.waitingUI.innerHTML = `
            <div class="fixed inset-0 pointer-events-none overflow-hidden pixel-bg-pattern opacity-15"></div>
            
            <div class="relative z-10 flex h-screen w-full flex-col md:flex-row p-4 md:p-6 pt-16 md:pt-6 gap-4 md:gap-6 font-display overflow-y-auto md:overflow-hidden custom-scrollbar">
                <!-- LOGO TOP LEFT -->
                <img src="/logo/Zigma-logo.webp" class="absolute w-24 md:w-96 top-2 left-2 md:-top-[60px] md:-left-[65px] z-20 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" />

                <!-- LOGO TOP RIGHT -->
                <img src="/logo/gameforsmart.webp" class="absolute w-28 md:w-64 top-2 right-2 md:top-2 md:right-2 z-20 object-contain drop-shadow-[0_0_15px_rgba(0,255,136,0.3)]" />

                <!-- Back Button REMOVED -->

                <!-- LEFT PANEL (Code, QR, URL, Start) -->
                <section class="w-full md:w-1/3 md:min-w-[350px] md:max-w-[450px] bg-surface-dark border-4 border-primary/30 rounded-3xl p-4 md:p-6 flex flex-col items-center shadow-[0_0_30px_rgba(0,255,85,0.1)] relative mt-4 md:mt-16 shrink-0 bg-opacity-90 backdrop-blur-sm shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
                    <div class="absolute inset-0 pixel-bg-pattern opacity-10 pointer-events-none"></div>

                    <!-- Room Code -->
                    <div class="w-full bg-black/40 border-2 border-primary/50 rounded-xl p-3 md:p-4 flex items-center justify-between relative group hover:border-primary transition-all mb-4">
                        <span id="host-room-code" class="text-3xl md:text-4xl text-primary font-['Press_Start_2P'] tracking-widest mx-auto drop-shadow-[0_0_10px_rgba(0,255,85,0.5)]">CODE</span>
                        <button id="copy-code-btn" class="absolute right-4 text-white/50 hover:text-white transition-colors cursor-pointer"><span class="material-symbols-outlined">content_copy</span></button>
                    </div>

                    <!-- QR Code -->
                    <div class="flex-1 w-full flex items-center justify-center my-2 relative">
                        <div class="bg-white p-4 rounded-xl aspect-square w-full max-w-[340px] flex items-center justify-center shadow-[0_0_20px_rgba(0,255,85,0.2)] cursor-pointer hover:scale-[1.02] transition-transform">
                            <img id="host-qr-img" src="" class="w-full h-full object-contain" />
                        </div>
                    </div>

                    <!-- URL Box -->
                    <div id="copy-url-container" class="w-full bg-black/40 border-2 border-secondary/50 rounded-xl p-4 flex items-center justify-between mb-4 group hover:border-secondary transition-all cursor-pointer relative overflow-hidden">
                        <span id="host-join-url" class="text-[10px] md:text-xs text-secondary font-['Press_Start_2P'] whitespace-nowrap overflow-hidden text-ellipsis flex-1 min-w-0 mr-2 select-all">https://...</span>
                        <div class="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg bg-secondary/10 group-hover:bg-secondary/20 transition-colors">
                            <span class="material-symbols-outlined text-secondary group-hover:text-white text-sm">content_copy</span>
                        </div>
                    </div>

                    <!-- Start Button REMOVED from here -->
                    <!-- Start Button REMOVED from here -->
                </section>

                <!-- RIGHT PANEL (Players) -->
                <section class="flex-1 w-full min-h-[400px] mb-8 md:mb-0 bg-surface-dark border-4 border-primary/30 rounded-3xl p-4 md:p-8 flex flex-col shadow-[0_0_30px_rgba(0,255,85,0.1)] relative bg-opacity-90 backdrop-blur-sm shadow-[0_4px_30px_rgba(0,0,0,0.5)] md:mt-16">
                    <div class="absolute inset-0 pixel-bg-pattern opacity-10 pointer-events-none overflow-hidden rounded-3xl"></div>

                    <!-- Header -->
                    <div class="flex flex-col md:flex-row items-center justify-between mb-4 md:mb-6 border-b-2 border-purple-500/20 pb-4 gap-4 md:gap-0 z-10 w-full">
                        <div class="flex items-center gap-4">
                            <h2 id="host-player-count" class="text-xl md:text-2xl text-secondary font-['Press_Start_2P'] tracking-wide drop-shadow-[0_0_10px_rgba(0,212,255,0.5)]">0 Players</h2>
                            <div class="flex gap-2">
                                <button id="host-manage-users-btn" class="w-10 h-10 md:w-12 md:h-12 bg-surface border-2 border-primary/50 text-white flex items-center justify-center rounded-xl hover:bg-white/10 hover:border-primary transition-all shadow-[0_0_15px_rgba(0,255,85,0.2)]">
                                    <span class="material-symbols-outlined text-xl md:text-2xl text-primary">group</span>
                                </button>
                                <button id="host-add-user-btn" class="w-10 h-10 md:w-12 md:h-12 bg-surface border-2 border-primary/50 text-white flex items-center justify-center rounded-xl hover:bg-white/10 hover:border-primary transition-all shadow-[0_0_15px_rgba(0,255,85,0.2)]">
                                    <span class="material-symbols-outlined text-xl md:text-2xl text-primary">person_add</span>
                                </button>
                            </div>
                        </div>

                        <div class="flex items-center gap-4">
                            <!-- Back Button MOVED here -->
                            <button id="host-back-btn" class="px-4 md:px-[30px] h-[40px] md:h-[52px] flex items-center justify-center bg-red-500 text-white font-['Press_Start_2P'] uppercase text-[10px] md:text-[11px] rounded-xl border-b-4 border-red-700 hover:brightness-110 active:border-b-0 active:translate-y-1 transition-all shadow-lg cursor-pointer shrink-0">
                                EXIT
                            </button>

                            <!-- Start Button -->
                            <button id="host-start-btn" class="px-6 md:px-8 py-2 md:py-3 h-[40px] md:h-[52px] bg-primary text-black font-['Press_Start_2P'] uppercase text-xs md:text-sm rounded-xl border-b-4 border-green-700 hover:brightness-110 active:border-b-0 active:translate-y-1 transition-all shadow-[0_0_15px_rgba(0,255,85,0.3)] cursor-pointer shrink-0">
                                Start
                            </button>
                        </div>
                    </div>

                    <!-- Player List / Empty State -->
                    <div id="host-player-area" class="flex-1 w-full relative overflow-hidden">
                        <!-- Empty State -->
                        <div id="host-empty-state" class="absolute inset-0 flex flex-col items-center justify-center opacity-50 space-y-4">
                            <div class="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center border-2 border-white/10">
                                <span class="material-symbols-outlined text-6xl text-white/20">person_add</span>
                            </div>
                            <p class="text-white/30 font-['Press_Start_2P'] text-xs tracking-widest animate-pulse">Waiting for players to join...</p>
                        </div>
                        
                        <!-- Grid Container -->
                        <div id="host-player-grid" class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-4 w-full h-full overflow-y-auto custom-scrollbar p-2 hidden z-10 relative"></div>
                    </div>
                </section>
                </section>
            </div>

            <!-- CONFIRM BACK MODAL -->
            <div id="host-back-confirm-modal" class="fixed inset-0 z-50 hidden flex items-center justify-center bg-black/80 backdrop-blur-sm">
                <div class="bg-surface-dark border-4 border-red-500 rounded-3xl p-8 max-w-sm w-full shadow-[0_0_50px_rgba(255,0,0,0.3)] text-center relative overflow-hidden">
                    <div class="absolute inset-0 pixel-bg-pattern opacity-10 pointer-events-none"></div>
                    
                    <span class="material-symbols-outlined text-6xl text-red-500 mb-4 drop-shadow-[0_0_10px_rgba(255,0,0,0.5)]">warning</span>
                    
                    <h3 class="text-xl text-white font-['Press_Start_2P'] mb-4 leading-relaxed">LEAVE ROOM?</h3>
                    <p class="text-white/60 font-['Press_Start_2P'] text-[10px] mb-8 leading-loose">
                        Room will be destroyed and all players disconnected.
                    </p>

                    <div class="flex gap-4 justify-center">
                        <button id="host-confirm-no" class="px-6 py-3 bg-white/10 text-white font-['Press_Start_2P'] text-xs rounded-xl border-b-4 border-white/20 hover:bg-white/20 active:border-b-0 active:translate-y-1 transition-all">
                            NO
                        </button>
                        <button id="host-confirm-yes" class="px-6 py-3 bg-red-500 text-white font-['Press_Start_2P'] text-xs rounded-xl border-b-4 border-red-700 hover:brightness-110 active:border-b-0 active:translate-y-1 transition-all shadow-[0_0_15px_rgba(255,0,0,0.4)]">
                            YES
                        </button>
                    </div>
                </div>
            </div>

            <!-- MANAGE GROUPS MODAL (NEW DESIGN) -->
            <div id="host-manage-users-modal" class="fixed inset-0 z-50 hidden flex items-center justify-center bg-black/80 backdrop-blur-sm z-[60]">
                <div class="bg-surface-dark border-4 border-primary rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-[0_0_50px_rgba(0,255,136,0.2)] relative overflow-hidden flex flex-col max-h-[85vh]">
                    <div class="absolute inset-0 pixel-bg-pattern opacity-10 pointer-events-none"></div>
                    
                    <div class="flex justify-between items-center mb-6 z-10 shrink-0">
                        <h3 class="text-lg md:text-xl text-white font-['Press_Start_2P'] drop-shadow-[0_0_10px_rgba(0,255,136,0.5)] flex items-center gap-3">
                            <span class="material-symbols-outlined text-primary text-3xl">group</span>
                            Invite Groups
                        </h3>
                        <button id="close-manage-users-btn" class="text-white/50 hover:text-white transition-colors cursor-pointer w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10">
                            <span class="material-symbols-outlined text-2xl">close</span>
                        </button>
                    </div>

                    <!-- Search Input -->
                    <div class="bg-black/40 border border-transparent rounded-xl flex items-center p-2 mb-4 shrink-0 relative z-10 focus-within:border-primary transition-colors">
                        <input type="text" id="group-search-input" placeholder="Search group..." class="flex-1 bg-transparent px-3 text-white outline-none focus:outline-none focus:ring-0 focus:border-transparent border-none font-['Press_Start_2P'] text-[10px] md:text-[11px] placeholder:text-white/30 w-full" />
                        <button id="group-search-btn" class="w-10 h-10 rounded-lg bg-primary/20 text-primary border border-primary/50 flex items-center justify-center hover:bg-primary hover:text-black transition-all cursor-pointer shrink-0">
                            <span class="material-symbols-outlined text-lg">search</span>
                        </button>
                    </div>

                    <!-- Selected Groups -->
                    <div id="selected-groups-container" class="shrink-0 flex flex-col gap-3 relative z-10 hidden mb-4">
                        <div class="flex items-center gap-2">
                            <span class="text-primary font-['Press_Start_2P'] text-[9px] uppercase tracking-wide">SELECTED</span>
                            <span id="selected-groups-count" class="bg-primary/20 text-primary px-2 py-0.5 rounded text-[8px] font-['Press_Start_2P'] border border-primary/30">0</span>
                        </div>
                        <div class="flex flex-wrap gap-2" id="selected-groups-list"></div>
                        <div class="w-full h-[1px] bg-white/10 mt-2"></div>
                    </div>

                    <!-- List Area -->
                    <div id="manage-users-list" class="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3 relative z-10 pb-4">
                        <!-- Populated dynamically -->
                    </div>

                    <!-- Footer -->
                    <div class="flex items-center justify-between mt-4 pt-4 border-t border-white/10 z-10 shrink-0">
                        <button id="cancel-invite-groups-btn" class="px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-['Press_Start_2P'] text-[10px] rounded-xl border-b-4 border-white/20 active:border-b-0 active:translate-y-1 transition-all cursor-pointer">
                            CANCEL
                        </button>
                        <button id="confirm-invite-groups-btn" class="px-7 py-3 bg-primary text-black font-['Press_Start_2P'] font-bold text-[10px] rounded-xl border-b-4 border-green-700 hover:brightness-110 active:border-b-0 active:translate-y-1 transition-all shadow-[0_0_15px_rgba(0,255,136,0.3)] cursor-pointer opacity-50 pointer-events-none">
                            INVITE
                        </button>
                    </div>
                </div>
            </div>

            <!-- ADD USER MODAL -->
            <div id="host-add-user-modal" class="fixed inset-0 z-50 hidden flex items-center justify-center bg-black/80 backdrop-blur-sm z-[60]">
                <div class="bg-surface-dark border-4 border-secondary rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-[0_0_50px_rgba(0,212,255,0.2)] relative overflow-hidden flex flex-col max-h-[85vh]">
                    <div class="absolute inset-0 pixel-bg-pattern opacity-10 pointer-events-none"></div>
                    
                    <div class="flex justify-between items-center mb-6 z-10 shrink-0">
                        <h3 class="text-lg md:text-xl text-white font-['Press_Start_2P'] drop-shadow-[0_0_10px_rgba(0,212,255,0.5)] flex items-center gap-3">
                            <span class="material-symbols-outlined text-secondary text-3xl">person_add</span>
                            Invite Friends
                        </h3>
                        <button id="close-add-user-btn" class="text-white/50 hover:text-white transition-colors cursor-pointer w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10">
                            <span class="material-symbols-outlined text-2xl">close</span>
                        </button>
                    </div>

                    <!-- Search Input -->
                    <div class="bg-black/40 border border-transparent rounded-xl flex items-center p-2 mb-4 shrink-0 relative z-10 focus-within:border-secondary transition-colors">
                        <input type="text" id="friend-search-input" placeholder="Search friend..." class="flex-1 bg-transparent px-3 text-white outline-none focus:outline-none focus:ring-0 focus:border-transparent border-none font-['Press_Start_2P'] text-[10px] md:text-[11px] placeholder:text-white/30 w-full" />
                        <button id="friend-search-btn" class="w-10 h-10 rounded-lg bg-secondary/20 text-secondary border border-secondary/50 flex items-center justify-center hover:bg-secondary hover:text-black transition-all cursor-pointer shrink-0">
                            <span class="material-symbols-outlined text-lg">search</span>
                        </button>
                    </div>

                    <!-- Selected Friends -->
                    <div id="selected-friends-container" class="shrink-0 flex flex-col gap-3 relative z-10 mb-4 hidden">
                        <div class="flex items-center gap-2">
                            <span class="text-secondary font-['Press_Start_2P'] text-[9px] uppercase tracking-wide">SELECTED</span>
                            <span id="selected-friends-count" class="bg-secondary/20 text-secondary px-2 py-0.5 rounded text-[8px] font-['Press_Start_2P'] border border-secondary/30">0</span>
                        </div>
                        <div class="flex flex-wrap gap-2" id="selected-friends-list">
                        </div>
                        <div class="w-full h-[1px] bg-white/10 mt-2"></div>
                    </div>

                    <!-- List Area -->
                    <div id="manage-friends-list" class="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3 relative z-10 pb-4">
                    </div>

                    <!-- Footer -->
                    <div class="flex items-center justify-between mt-4 pt-4 border-t border-white/10 z-10 shrink-0">
                        <button id="cancel-invite-friends-btn" class="px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-['Press_Start_2P'] text-[10px] rounded-xl border-b-4 border-white/20 active:border-b-0 active:translate-y-1 transition-all cursor-pointer">
                            CANCEL
                        </button>
                        <button id="confirm-invite-friends-btn" class="px-7 py-3 bg-secondary text-black font-['Press_Start_2P'] font-bold text-[10px] rounded-xl border-b-4 border-cyan-700 hover:brightness-110 active:border-b-0 active:translate-y-1 transition-all shadow-[0_0_15px_rgba(0,212,255,0.3)] cursor-pointer opacity-50 pointer-events-none">
                            INVITE
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Host Exit Confirm Modal
        const hostExitModal = document.createElement('div');
        hostExitModal.id = 'host-back-confirm-modal';
        hostExitModal.className = 'fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 hidden backdrop-blur-sm';
        hostExitModal.innerHTML = `
            <div class="bg-surface-dark border-4 border-red-500/50 rounded-2xl p-6 md:p-8 max-w-sm w-full text-center shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                <span class="material-symbols-outlined text-5xl text-red-500 mb-4 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]">warning</span>
                <h3 class="text-white font-['Press_Start_2P'] text-sm md:text-base leading-loose mb-6">End Game Wait<br>& Close Room?</h3>
                <div class="flex flex-col gap-3">
                    <button id="host-confirm-yes" class="w-full py-4 bg-red-500 text-white font-['Press_Start_2P'] uppercase text-[10px] md:text-xs rounded-xl border-b-4 border-red-700 hover:brightness-110 active:border-b-0 active:translate-y-1 transition-all cursor-pointer">
                        YES, END GAME
                    </button>
                    <button id="host-confirm-no" class="w-full py-4 bg-white/10 text-white font-['Press_Start_2P'] uppercase text-[10px] md:text-xs rounded-xl hover:bg-white/20 transition-all cursor-pointer">
                        CANCEL
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(hostExitModal);

        // Create Countdown Overlay
        const overlay = document.createElement('div');
        overlay.id = 'countdown-overlay';
        overlay.className = 'fixed inset-0 z-50 bg-black/90 flex items-center justify-center hidden';
        overlay.innerHTML = `
            <div class="flex flex-col items-center animate-bounce">
                <div id="countdown-text" class="text-[120px] font-['Press_Start_2P'] text-[#00ff88] drop-shadow-[0_0_30px_rgba(0,255,136,0.6)]">
                    10
                </div>
                <div class="text-white/50 font-['Press_Start_2P'] text-sm mt-4 tracking-widest uppercase">
                    Game Starting...
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        this.countdownOverlay = overlay;
        this.countdownText = document.getElementById('countdown-text');

        // Re-assign references
        this.roomCodeEl = document.getElementById('host-room-code');
        this.roomQrCode = document.getElementById('host-qr-img') as HTMLImageElement;
        this.copyCodeBtn = document.getElementById('copy-code-btn');
        this.backBtn = document.getElementById('host-back-btn');
        this.startBtn = document.getElementById('host-start-btn');

        // MODAL LOGIC
        const modal = document.getElementById('host-back-confirm-modal');
        const yesBtn = document.getElementById('host-confirm-yes');
        const noBtn = document.getElementById('host-confirm-no');

        if (this.backBtn) {
            this.backBtn.onclick = () => {
                if (modal) modal.classList.remove('hidden');
            };
        }
        if (yesBtn) {
            yesBtn.onclick = () => {
                if (modal) modal.classList.add('hidden');
                this.leaveRoom();
            };
        }
        if (noBtn) {
            noBtn.onclick = () => {
                if (modal) modal.classList.add('hidden');
            };
        }

        // URL Copy Logic
        const urlBtn = document.getElementById('copy-url-container');
        if (urlBtn) {
            urlBtn.onclick = () => {
                const url = document.getElementById('host-join-url')?.innerText;
                if (url) {
                    navigator.clipboard.writeText(url).then(() => {
                        // Icon Check Animation
                        const iconSpan = urlBtn.querySelector('.material-symbols-outlined');
                        if (iconSpan) {
                            iconSpan.innerHTML = 'check';
                            iconSpan.classList.add('text-primary');
                            setTimeout(() => {
                                iconSpan.innerHTML = 'content_copy';
                                iconSpan.classList.remove('text-primary');
                            }, 2000);
                        }
                    });
                }
            };
        }

        // QR Click Logic
        const qrContainer = document.getElementById('host-qr-img')?.parentElement;
        if (qrContainer) {
            // Ensure Popup is initialized
            if (!this.qrPopup) this.qrPopup = new QRCodePopup(() => { });

            qrContainer.onclick = () => {
                const img = document.getElementById('host-qr-img') as HTMLImageElement;
                if (img && img.src) {
                    this.qrPopup?.show(img.src);
                }
            };
        }

        // Start Button Binding
        if (this.startBtn) {
            this.startBtn.classList.remove('hidden');
            this.startBtn.onclick = () => {
                this.room.send("startGame");
            };
        }

        // Host manage users button binding
        const manageUsersBtn = document.getElementById('host-manage-users-btn');
        const manageUsersModal = document.getElementById('host-manage-users-modal');
        const closeManageUsersBtn = document.getElementById('close-manage-users-btn');

        if (manageUsersBtn && manageUsersModal) {
            manageUsersBtn.onclick = () => {
                manageUsersModal.classList.remove('hidden');
                this.updateManageUsersList();
            };
        }
        if (closeManageUsersBtn && manageUsersModal) {
            closeManageUsersBtn.onclick = () => {
                manageUsersModal.classList.add('hidden');
            };
        }

        // Host add user button binding
        const addUserBtn = document.getElementById('host-add-user-btn');
        const addUserModal = document.getElementById('host-add-user-modal');
        const closeAddUserBtn = document.getElementById('close-add-user-btn');
        const modalInviteCode = document.getElementById('modal-invite-code');
        const modalCopyLinkBtn = document.getElementById('modal-copy-link-btn');

        if (addUserBtn && addUserModal) {
            addUserBtn.onclick = () => {
                addUserModal.classList.remove('hidden');
                this.updateFriendsList();
            };
        }
        if (closeAddUserBtn && addUserModal) {
            closeAddUserBtn.onclick = () => {
                addUserModal.classList.add('hidden');
            };
        }
        if (modalCopyLinkBtn) {
            modalCopyLinkBtn.onclick = () => {
                const url = document.getElementById('host-join-url')?.innerText;
                if (url) {
                    navigator.clipboard.writeText(url).then(() => {
                        const iconSpan = modalCopyLinkBtn.querySelector('.material-symbols-outlined');
                        const textSpan = modalCopyLinkBtn.querySelector('span:last-child') as HTMLElement;
                        if (iconSpan && textSpan) {
                            const origIcon = iconSpan.innerHTML;
                            const origText = textSpan.innerText;
                            iconSpan.innerHTML = 'check';
                            iconSpan.classList.add('text-secondary');
                            textSpan.innerText = 'COPIED!';
                            textSpan.classList.add('text-secondary');
                            setTimeout(() => {
                                iconSpan.innerHTML = origIcon;
                                iconSpan.classList.remove('text-secondary');
                                textSpan.innerText = origText;
                                textSpan.classList.remove('text-secondary');
                            }, 2000);
                        }
                    });
                }
            };
        }
    }

    async updateManageUsersList() {
        const listContainer = document.getElementById('manage-users-list');
        if (!listContainer) return;

        // Show loading state
        listContainer.innerHTML = `
            <div class="py-12 flex flex-col items-center justify-center gap-3">
                <span class="material-symbols-outlined text-4xl text-gray-300 animate-spin">refresh</span>
                <span class="text-gray-400 font-bold text-sm tracking-wide text-center">
                    Loading groups...
                </span>
            </div>
        `;

        try {
            const profileStr = localStorage.getItem('game_user_profile');
            let userId = null;
            if (profileStr) {
                const profile = JSON.parse(profileStr);
                userId = profile.id;
            }

            if (!userId) {
                listContainer.innerHTML = `
                    <div class="py-12 flex flex-col items-center justify-center gap-3">
                        <span class="material-symbols-outlined text-4xl text-gray-300">groups</span>
                        <span class="text-gray-400 font-bold text-sm tracking-wide text-center">
                            Please login to<br>view groups.
                        </span>
                    </div>
                `;
                return;
            }

            // Fetch groups where user is creator
            const { data: createdGroups, error: errCreated } = await supabase
                .from('groups')
                .select('*')
                .eq('creator_id', userId);

            // Fetch groups where user is member
            const { data: memberGroupsObj, error: errMemberObj } = await supabase
                .from('groups')
                .select('*')
                .contains('members', JSON.stringify([{ user_id: userId }]));

            const { data: memberGroupsStr } = await supabase
                .from('groups')
                .select('*')
                .contains('members', JSON.stringify([userId]));

            const allGroupsMap = new Map();

            if (createdGroups && !errCreated) {
                createdGroups.forEach(g => allGroupsMap.set(g.id, g));
            }
            if (memberGroupsObj && !errMemberObj) {
                memberGroupsObj.forEach(g => allGroupsMap.set(g.id, g));
            }
            if (memberGroupsStr) {
                memberGroupsStr.forEach(g => allGroupsMap.set(g.id, g));
            }

            const groups = Array.from(allGroupsMap.values());

            // Extract unique creator IDs
            const creatorIds = Array.from(new Set(groups.map((g: any) => g.creator_id).filter(id => !!id)));

            // Fetch profiles for creators
            let profilesMap = new Map();
            if (creatorIds.length > 0) {
                const { data: profilesData } = await supabase
                    .from('profiles')
                    .select('id, username')
                    .in('id', creatorIds);
                if (profilesData) {
                    profilesData.forEach(p => profilesMap.set(p.id, p));
                }
            }

            // Calculate canInvite and creatorName
            this.allFetchedGroups = groups.map((group: any) => {
                let canInvite = false;
                if (group.creator_id === userId) {
                    canInvite = true;
                } else if (Array.isArray(group.members)) {
                    const memberObj = group.members.find((m: any) => m.user_id === userId);
                    if (memberObj && (memberObj.role === 'owner' || memberObj.role === 'admin')) {
                        canInvite = true;
                    }
                }
                const creatorProfile = profilesMap.get(group.creator_id);
                const creatorName = creatorProfile?.username || 'Creator';
                return { ...group, canInvite, creatorName };
            });

            // Bind global handlers only once
            if (!(window as any).toggleSelectGroup) {
                (window as any).toggleSelectGroup = (groupId: string) => {
                    if (this.selectedGroups.has(groupId)) {
                        this.selectedGroups.delete(groupId);
                    } else {
                        const grp = this.allFetchedGroups.find(g => g.id === groupId);
                        if (grp) this.selectedGroups.set(groupId, grp);
                    }
                    this.renderManageUsersList();
                    this.renderSelectedGroups();
                };

                (window as any).removeSelectedGroup = (groupId: string) => {
                    this.selectedGroups.delete(groupId);
                    this.renderManageUsersList();
                    this.renderSelectedGroups();
                };

                const searchInput = document.getElementById('group-search-input') as HTMLInputElement;
                if (searchInput) {
                    searchInput.addEventListener('input', (e) => {
                        this.groupSearchQuery = (e.target as HTMLInputElement).value.toLowerCase();
                        this.renderManageUsersList();
                    });
                }

                const searchBtn = document.getElementById('group-search-btn');
                if (searchBtn) {
                    searchBtn.onclick = () => {
                        this.renderManageUsersList();
                    };
                }

                const confirmBtn = document.getElementById('confirm-invite-groups-btn');
                if (confirmBtn) {
                    confirmBtn.onclick = async () => {
                        if (this.selectedGroups.size > 0) {
                            try {
                                const profileStr = localStorage.getItem('game_user_profile');
                                const currentRoomId = localStorage.getItem('currentRoomId'); // This is the 6-digit code
                                if (!profileStr || !currentRoomId) throw new Error("Missing profile or room ID");
                                const profile = JSON.parse(profileStr);

                                const notificationsToInsert: any[] = [];

                                this.selectedGroups.forEach((group) => {
                                    if (Array.isArray(group.members)) {
                                        group.members.forEach((member: any) => {
                                            // Don't invite yourself
                                            if (member.user_id !== profile.id) {
                                                notificationsToInsert.push({
                                                    user_id: member.user_id,
                                                    actor_id: profile.id,
                                                    type: 'sessionGroup',
                                                    entity_type: 'session',
                                                    from_group_id: group.id,
                                                    content: {
                                                        message: `${profile.username || 'Someone'} invited your group to a game!`,
                                                        roomCode: currentRoomId
                                                    }
                                                });
                                            }
                                        });
                                    }
                                });

                                if (notificationsToInsert.length > 0) {
                                    const { error } = await supabase.from('notifications').insert(notificationsToInsert);
                                    if (error) throw error;
                                }

                                this.showToast(`Successfully sent invites to ${this.selectedGroups.size} groups!`);
                                const modal = document.getElementById('host-manage-users-modal');
                                if (modal) modal.classList.add('hidden');
                                this.selectedGroups.clear();
                                this.renderSelectedGroups();
                                this.renderManageUsersList();

                            } catch (error: any) {
                                console.error('Failed to send group invites:', error);
                                this.showToast('Failed to send invites: ' + (error?.message || String(error)), true);
                            }
                        }
                    };
                }

                const cancelBtn = document.getElementById('cancel-invite-groups-btn');
                if (cancelBtn) {
                    cancelBtn.onclick = () => {
                        const modal = document.getElementById('host-manage-users-modal');
                        if (modal) modal.classList.add('hidden');
                    };
                }
            }

            this.selectedGroups.clear();
            this.groupSearchQuery = '';
            const searchInput = document.getElementById('group-search-input') as HTMLInputElement;
            if (searchInput) searchInput.value = '';

            this.renderManageUsersList();
            this.renderSelectedGroups();

        } catch (error) {
            console.error("Error fetching groups:", error);
            listContainer.innerHTML = `
                <div class="py-12 flex flex-col items-center justify-center gap-3">
                    <span class="material-symbols-outlined text-4xl text-gray-300">error</span>
                    <span class="text-gray-400 font-bold text-sm tracking-wide text-center">
                        Failed to load groups.
                    </span>
                </div>
            `;
        }
    }

    renderManageUsersList() {
        const listContainer = document.getElementById('manage-users-list');
        if (!listContainer) return;

        let filteredGroups = this.allFetchedGroups;
        if (this.groupSearchQuery.trim() !== '') {
            filteredGroups = filteredGroups.filter(g => (g.name || '').toLowerCase().includes(this.groupSearchQuery));
        }

        if (filteredGroups.length === 0) {
            listContainer.innerHTML = `
                <div class="py-12 flex flex-col items-center justify-center gap-3">
                    <span class="material-symbols-outlined text-4xl text-white/20">sentiment_dissatisfied</span>
                    <span class="text-white/30 font-['Press_Start_2P'] text-[9px] leading-loose text-center px-4">
                        ${this.allFetchedGroups.length === 0 ? "You haven't joined<br>any groups yet." : "No groups found<br>for your search."}
                    </span>
                </div>
            `;
            return;
        }

        let html = '';
        filteredGroups.forEach((group: any) => {
            const name = group.name || 'Unnamed Group';
            const avatar = group.avatar_url || '/logo/gameforsmart.webp';
            const memberCount = Array.isArray(group.members) ? group.members.length + 1 : 1;
            const isSelected = this.selectedGroups.has(group.id);
            const canInvite = group.canInvite;
            const creatorNameText = group.creatorName || 'Creator';

            let btnHtml = '';
            if (canInvite) {
                if (isSelected) {
                    btnHtml = `<button onclick="window.toggleSelectGroup('${group.id}')" class="px-3 py-2 bg-primary text-black border border-primary rounded-lg font-['Press_Start_2P'] text-[8px] transition-all cursor-pointer min-w-[70px] shadow-[0_0_10px_rgba(0,255,136,0.3)] flex items-center justify-center gap-1.5 hover:bg-green-400">
                        <span class="material-symbols-outlined text-[10px]">check</span> ADDED
                    </button>`;
                } else {
                    btnHtml = `<button onclick="window.toggleSelectGroup('${group.id}')" class="px-3 py-2 bg-primary/20 hover:bg-primary border border-primary text-primary hover:text-black rounded-lg font-['Press_Start_2P'] text-[8px] transition-all cursor-pointer min-w-[70px]">
                        ADD
                    </button>`;
                }
            } else {
                btnHtml = `<div class="px-3 py-2 text-white/30 font-['Press_Start_2P'] text-[7px] md:text-[8px] bg-white/5 border border-white/5 rounded-lg flex items-center justify-center min-w-[70px]">MEMBER</div>`;
            }

            html += `
                <div class="flex items-center justify-between p-3 md:p-4 bg-black/40 border border-white/10 rounded-xl hover:border-primary/50 transition-colors group">
                    <div class="flex flex-col gap-1.5 overflow-hidden pr-2 justify-center">
                        <span class="text-white font-['Press_Start_2P'] text-[9px] md:text-[10px] truncate tracking-wide leading-tight px-1">${name}</span>
                        <div class="flex items-center gap-4 text-white/50 font-['Press_Start_2P'] text-[6px] md:text-[7px] px-1">
                            <div class="flex items-center gap-1">
                                <span class="material-symbols-outlined text-[10px] mb-0.5">group</span>
                                <span>${memberCount}</span>
                            </div>
                            <div class="flex items-center gap-1 text-primary/70">
                                <span class="material-symbols-outlined text-[9px] mb-0.5">edit</span>
                                <span class="truncate max-w-[80px]">${creatorNameText}</span>
                            </div>
                        </div>
                    </div>
                    ${btnHtml}
                </div>
            `;
        });

        listContainer.innerHTML = html;
    }

    renderSelectedGroups() {
        const container = document.getElementById('selected-groups-container');
        const list = document.getElementById('selected-groups-list');
        const count = document.getElementById('selected-groups-count');
        const confirmBtn = document.getElementById('confirm-invite-groups-btn');

        if (!container || !list || !count || !confirmBtn) return;

        if (this.selectedGroups.size === 0) {
            container.classList.add('hidden');
            confirmBtn.classList.add('opacity-50', 'pointer-events-none');
            return;
        }

        container.classList.remove('hidden');
        count.innerText = `${this.selectedGroups.size}`;
        confirmBtn.classList.remove('opacity-50', 'pointer-events-none');

        let html = '';
        this.selectedGroups.forEach((group, id) => {
            const name = group.name || 'Unnamed';
            html += `
                <div class="flex items-center gap-1.5 bg-primary/20 text-primary border border-primary/50 px-3 py-2 rounded-lg text-[9px] font-['Press_Start_2P'] shadow-[0_0_10px_rgba(0,255,136,0.1)] transition-transform hover:scale-105">
                    <span class="truncate max-w-[120px]">${name}</span>
                    <button onclick="window.removeSelectedGroup('${id}')" class="flex items-center justify-center hover:bg-primary/40 rounded-md w-5 h-5 transition-colors cursor-pointer border border-transparent hover:border-primary">
                        <span class="material-symbols-outlined !text-[12px]">close</span>
                    </button>
                </div>
            `;
        });
        list.innerHTML = html;
    }

    async updateFriendsList() {
        const listContainer = document.getElementById('manage-friends-list');
        if (!listContainer) return;

        listContainer.innerHTML = `
            <div class="py-12 flex flex-col items-center justify-center gap-3">
                <span class="material-symbols-outlined text-3xl animate-spin text-secondary">refresh</span>
                <span class="text-white/50 font-['Press_Start_2P'] text-[8px] tracking-widest uppercase">Loading Friends...</span>
            </div>
        `;

        try {
            const profileStr = localStorage.getItem('game_user_profile');
            let userId = null;
            if (profileStr) {
                const profile = JSON.parse(profileStr);
                userId = profile.id;
            }

            if (!userId) {
                listContainer.innerHTML = `<div class="text-center text-red-500 py-4 font-['Press_Start_2P'] text-[10px]">Please login first.</div>`;
                return;
            }

            const { data: friendshipsData, error: friendshipsError } = await supabase
                .from('friendships')
                .select('*')
                .eq('addressee_id', userId)
                .eq('status', 'accepted');

            if (friendshipsError) {
                console.error("Error fetching friendships:", friendshipsError);
                throw friendshipsError;
            }

            if (!friendshipsData || friendshipsData.length === 0) {
                this.allFetchedFriends = [];
            } else {
                const friendIds = friendshipsData.map((f: any) =>
                    f.requester_id === userId ? f.addressee_id : f.requester_id
                );

                const { data: profilesData, error: profilesError } = await supabase
                    .from('profiles')
                    .select('id, username')
                    .in('id', friendIds);

                if (profilesError) {
                    console.error("Error fetching friend profiles:", profilesError);
                    throw profilesError;
                }

                this.allFetchedFriends = (profilesData || []).map((p: any) => ({
                    id: p.id,
                    username: p.username || 'Unknown'
                }));
            }

            // Bind global handlers only once
            if (!(window as any).toggleSelectFriend) {
                (window as any).toggleSelectFriend = (friendId: string) => {
                    if (this.selectedFriends.has(friendId)) {
                        this.selectedFriends.delete(friendId);
                    } else {
                        const friend = this.allFetchedFriends.find(f => f.id === friendId);
                        if (friend) this.selectedFriends.set(friendId, friend);
                    }
                    this.renderSelectedFriends();
                    this.renderFriendsList();
                };

                (window as any).removeSelectedFriend = (friendId: string) => {
                    this.selectedFriends.delete(friendId);
                    this.renderSelectedFriends();
                    this.renderFriendsList();
                };
            }

            this.selectedFriends.clear();
            this.friendSearchQuery = '';
            const searchInput = document.getElementById('friend-search-input') as HTMLInputElement;
            if (searchInput) {
                searchInput.value = '';
                searchInput.oninput = (e: any) => {
                    this.friendSearchQuery = e.target.value.toLowerCase();
                    this.renderFriendsList();
                };
            }

            const confirmFriendsBtn = document.getElementById('confirm-invite-friends-btn');
            if (confirmFriendsBtn) {
                confirmFriendsBtn.onclick = async () => {
                    if (this.selectedFriends.size > 0) {
                        try {
                            const profileStr = localStorage.getItem('game_user_profile');
                            const currentRoomId = localStorage.getItem('currentRoomId'); // This is the 6-digit code
                            if (!profileStr || !currentRoomId) throw new Error("Missing profile or room ID");
                            const profile = JSON.parse(profileStr);

                            const notificationsToInsert = Array.from(this.selectedFriends.values()).map(friend => ({
                                user_id: friend.id,
                                actor_id: profile.id,
                                type: 'sessionFriend',
                                entity_type: 'session',
                                content: {
                                    message: `${profile.username || 'A friend'} invited you to join a game!`,
                                    roomCode: currentRoomId
                                }
                            }));

                            if (notificationsToInsert.length > 0) {
                                const { error } = await supabase.from('notifications').insert(notificationsToInsert);
                                if (error) throw error;
                            }

                            this.showToast(`Successfully sent invites to ${this.selectedFriends.size} friends!`);
                            const modal = document.getElementById('host-add-user-modal');
                            if (modal) modal.classList.add('hidden');
                            this.selectedFriends.clear();
                            this.renderSelectedFriends();
                            this.renderFriendsList();

                        } catch (error: any) {
                            console.error('Failed to send friend invites:', error);
                            this.showToast('Failed to send invites: ' + (error?.message || String(error)), true);
                        }
                    }
                };
            }

            const cancelBtn = document.getElementById('cancel-invite-friends-btn');
            if (cancelBtn) {
                cancelBtn.onclick = () => {
                    document.getElementById('host-add-user-modal')?.classList.add('hidden');
                }
            }

            this.renderFriendsList();
            this.renderSelectedFriends();

        } catch (error: any) {
            console.error('Failed to load friends list:', error);
            listContainer.innerHTML = `<div class="text-center text-red-500 py-4 font-['Press_Start_2P'] text-[10px] leading-loose">Failed to load friends.<br/>${error?.message || String(error)}</div>`;
        }
    }

    renderFriendsList() {
        const listContainer = document.getElementById('manage-friends-list');
        if (!listContainer) return;

        let filteredFriends = this.allFetchedFriends;
        if (this.friendSearchQuery.trim() !== '') {
            filteredFriends = filteredFriends.filter(f => (f.username || '').toLowerCase().includes(this.friendSearchQuery));
        }

        if (filteredFriends.length === 0) {
            listContainer.innerHTML = `
                <div class="py-12 flex flex-col items-center justify-center gap-3">
                    <span class="material-symbols-outlined text-4xl text-white/20">sentiment_dissatisfied</span>
                    <span class="text-white/30 font-['Press_Start_2P'] text-[9px] leading-loose text-center px-4">
                        ${this.allFetchedFriends.length === 0 ? "You don't have<br>any friends yet." : "No friends found<br>for your search."}
                    </span>
                </div>
            `;
            return;
        }

        let html = '';
        filteredFriends.forEach((friend: any) => {
            const name = friend.username;
            const isSelected = this.selectedFriends.has(friend.id);
            const statusText = 'Friend';
            const statusColor = 'text-white/50';

            let btnHtml = '';
            if (isSelected) {
                btnHtml = `<button onclick="window.toggleSelectFriend('${friend.id}')" class="px-3 py-2 bg-secondary text-black border border-secondary rounded-lg font-['Press_Start_2P'] text-[8px] transition-all cursor-pointer min-w-[70px] shadow-[0_0_10px_rgba(0,212,255,0.3)] flex items-center justify-center gap-1.5 hover:bg-cyan-400">
                    <span class="material-symbols-outlined text-[10px]">check</span> ADDED
                </button>`;
            } else {
                btnHtml = `<button onclick="window.toggleSelectFriend('${friend.id}')" class="px-3 py-2 bg-secondary/20 hover:bg-secondary border border-secondary text-secondary hover:text-black rounded-lg font-['Press_Start_2P'] text-[8px] transition-all cursor-pointer min-w-[70px]">
                    ADD
                </button>`;
            }

            html += `
                <div class="flex items-center justify-between p-3 md:p-4 bg-black/40 border border-white/10 rounded-xl hover:border-secondary/50 transition-colors group">
                    <div class="flex flex-col gap-2 overflow-hidden pr-2 justify-center">
                        <span class="text-white font-['Press_Start_2P'] text-[9px] md:text-[10px] truncate tracking-wide leading-tight px-1">${name}</span>
                        <span class="${statusColor} font-['Press_Start_2P'] text-[7px] md:text-[8px] px-1">${statusText}</span>
                    </div>
                    ${btnHtml}
                </div>
            `;
        });

        listContainer.innerHTML = html;
    }

    renderSelectedFriends() {
        const container = document.getElementById('selected-friends-container');
        const list = document.getElementById('selected-friends-list');
        const count = document.getElementById('selected-friends-count');
        const confirmBtn = document.getElementById('confirm-invite-friends-btn');

        if (!container || !list || !count || !confirmBtn) return;

        if (this.selectedFriends.size === 0) {
            container.classList.add('hidden');
            confirmBtn.classList.add('opacity-50', 'pointer-events-none');
            return;
        }

        container.classList.remove('hidden');
        count.innerText = `${this.selectedFriends.size}`;
        confirmBtn.classList.remove('opacity-50', 'pointer-events-none');

        let html = '';
        this.selectedFriends.forEach((friend, id) => {
            const name = friend.username || 'Unknown';
            html += `
                <div class="flex items-center gap-1.5 bg-secondary/20 text-secondary border border-secondary/50 px-3 py-2 rounded-lg text-[9px] font-['Press_Start_2P'] shadow-[0_0_10px_rgba(0,212,255,0.1)] transition-transform hover:scale-105">
                    <span class="truncate max-w-[120px]">${name}</span>
                    <button onclick="window.removeSelectedFriend('${id}')" class="flex items-center justify-center hover:bg-secondary/40 rounded-md w-5 h-5 transition-colors cursor-pointer border border-transparent hover:border-secondary">
                        <span class="material-symbols-outlined !text-[12px]">close</span>
                    </button>
                </div>
            `;
        });
        list.innerHTML = html;
    }

    setupCharacterCustomization() {
        const charPreviewBox = document.getElementById('character-preview-box');
        const charSelectContainer = charPreviewBox?.parentElement?.parentElement;

        if (charSelectContainer) {
            this.characterPopup = new CharacterSelectPopup(
                HAIR_OPTIONS,
                (hairId) => this.room.send("updateHair", { hairId }),
                () => { }
            );

            const spans = Array.from(charSelectContainer.querySelectorAll('.material-symbols-outlined'));
            const leftBtn = spans.find(el => el.textContent?.includes('chevron_left'))?.closest('button');
            const rightBtn = spans.find(el => el.textContent?.includes('chevron_right'))?.closest('button');

            if (charPreviewBox) {
                charPreviewBox.onclick = () => {
                    const myPlayer = this.room.state.players.get(this.mySessionId);
                    this.characterPopup?.show(myPlayer?.hairId || 0);
                };
            }

            const cycleHair = (dir: number) => {
                const myPlayer = this.room.state.players.get(this.mySessionId);
                if (myPlayer) {
                    let newId = (myPlayer.hairId || 0) + dir;
                    if (newId < 0) newId = HAIR_OPTIONS.length - 1;
                    if (newId >= HAIR_OPTIONS.length) newId = 0;
                    this.room.send("updateHair", { hairId: newId });
                }
            };

            if (leftBtn) leftBtn.onclick = () => cycleHair(-1);
            if (rightBtn) rightBtn.onclick = () => cycleHair(1);
        }
    }

    setupQRPopup() {
        if (!this.qrPopup) {
            this.qrPopup = new QRCodePopup(() => { });
            const qrImg = document.getElementById('room-qr-code');
            const qrContainer = qrImg?.parentElement;
            if (qrContainer) {
                qrContainer.onclick = () => {
                    const img = document.getElementById('room-qr-code') as HTMLImageElement;
                    if (img && img.src) this.qrPopup?.show(img.src);
                };
            }
        }
    }

    updateCharacterPreview(hairId: number) {
        // Use the new stable ID
        const container = document.getElementById('character-preview-box');
        if (!container) return;

        // Clear content
        container.innerHTML = '';

        // Re-add background pattern
        const bg = document.createElement('div');
        bg.className = 'absolute inset-0 bg-[url("/assets/bg_pattern.png")] opacity-20';
        container.appendChild(bg);

        // Render Base
        const base = document.createElement('div');
        base.style.backgroundImage = `url('/assets/base_idle_strip9.png')`;
        base.style.width = '96px';
        base.style.height = '64px';
        base.style.backgroundSize = '864px 64px'; // 9 frames
        base.style.imageRendering = 'pixelated';
        base.style.position = 'absolute';
        base.style.top = '50%';
        base.style.left = '50%';
        base.style.transform = 'translate(-50%, -50%) scale(5)'; // Centered and SCALED UP (5x)
        base.style.animation = 'play-idle 1s steps(9) infinite';
        container.appendChild(base);

        // Render Hair
        if (hairId > 0) {
            import('../../../data/characterData').then(({ getHairById }) => {
                const hair = getHairById(hairId);
                if (hair) {
                    const hairLayer = document.createElement('div');
                    hairLayer.style.backgroundImage = `url('/assets/${hair.idleKey}_strip9.png')`;
                    hairLayer.style.width = '96px';
                    hairLayer.style.height = '64px';
                    hairLayer.style.backgroundSize = '864px 64px';
                    hairLayer.style.imageRendering = 'pixelated';
                    hairLayer.style.position = 'absolute';
                    hairLayer.style.top = '50%';
                    hairLayer.style.left = '50%';
                    hairLayer.style.transform = 'translate(-50%, -50%) scale(5)'; // Centered and SCALED UP (5x)
                    hairLayer.style.animation = 'play-idle 1s steps(9) infinite';
                    container.appendChild(hairLayer);
                }
            });
        }
    }

    async leaveRoom() {
        if (this.room) {
            // IF HOST: Delete from Supabase
            if (this.isHost) {
                const roomCode = this.room.state.roomCode;
                if (roomCode) {
                    try {
                        // Delete the session. 
                        // Note: If you have ON DELETE CASCADE setup in SQL for participants, this deletes them too.
                        // Otherwise, you might need to delete participants first.
                        // Assuming CASCADE or deleting session is enough for now.
                        const { error } = await supabaseB
                            .from(SESSION_TABLE)
                            .delete()
                            .eq('game_pin', roomCode);

                        if (error) {
                            console.error("Error cleaning up Supabase session:", error);
                        } else {
                            console.log("Supabase session deleted for code:", roomCode);
                        }
                    } catch (err) {
                        console.error("Cleanup error:", err);
                    }
                }
            }

            if (this.room) {
                this.room.send("manualLeave");
                this.isManuallyLeaving = true;
                this.room.leave();
            }

            // Clear local storage session
            localStorage.removeItem('currentRoomId');
            localStorage.removeItem('currentSessionId');
            localStorage.removeItem('currentReconnectionToken'); // v0.15 token

            if (this.waitingUI) this.waitingUI.classList.add('hidden');
            const lobbyUI = document.getElementById('lobby-ui');
            if (lobbyUI) lobbyUI.classList.remove('hidden');
            Router.navigate('/host/select-quiz');
            this.scene.start('LobbyScene');

            // Clean up overlay
            if (this.countdownOverlay) {
                this.countdownOverlay.remove();
                this.countdownOverlay = null;
            }
        }
    }

    showCopyFeedback() {
        if (this.copyFeedback) {
            this.copyFeedback.classList.remove('opacity-0');
            setTimeout(() => {
                this.copyFeedback?.classList.add('opacity-0');
            }, 2000);
        }
    }

    updateAll() {
        if (!this.room || !this.room.state) return; // Guard: room belum siap (sedang restore)
        this.updatePlayerGrid();

        const myPlayer = this.room.state.players.get(this.mySessionId);
        if (myPlayer) {
            this.updateCharacterPreview(myPlayer.hairId || 0);
        } else if (this.isHost) {
            // If host and not in players Map, we might still want to preview something 
            // but with the server change, the host should now be in the players map.
        }
    }

    updateRoomCode(retryCount: number = 0) {
        let code: string | undefined;

        // Priority 1: Extract from URL (always available after refresh)
        const pathMatch = window.location.pathname.match(/\/host\/(\d+)\/lobby/);
        if (pathMatch) {
            code = pathMatch[1];
        }

        // Priority 2: Extract from room state (if connected)
        if (!code && this.room?.state?.roomCode) {
            code = this.room.state.roomCode;
        }

        console.log("updateRoomCode called, code:", code, "retry:", retryCount);

        if (code) {
            if (this.roomCodeEl) {
                this.roomCodeEl.innerText = code;
            }
            this.updateQrCode(code);
            this.updateJoinUrl(code);
        } else if (retryCount < 10) {
            // State may not be synced yet, retry after a short delay
            console.log("updateRoomCode: code is empty, retrying in 500ms...");
            setTimeout(() => {
                this.updateRoomCode(retryCount + 1);
            }, 500);
        } else {
            console.warn("updateRoomCode: gave up retrying, code is still empty.");
            if (this.roomCodeEl) {
                this.roomCodeEl.innerText = '------';
            }
        }
    }

    updateQrCode(code: string) {
        if (this.roomQrCode && code) {
            const domain = window.location.origin; // e.g. http://localhost:5173 
            const url = `${domain}/join/${code}`;

            // Generate QR
            try {
                QRCode.toDataURL(url, {
                    width: 500,
                    margin: 2,
                    color: {
                        dark: '#000000',
                        light: '#ffffff'
                    }
                })
                    .then((dataUrl: string) => {
                        if (this.roomQrCode) {
                            this.roomQrCode.src = dataUrl;
                            this.roomQrCode.classList.remove('hidden'); // make sure it's visible
                        }
                    })
                    .catch((err: any) => {
                        console.error("QR Gen Error:", err);
                    });
            } catch (syncErr) {
                console.error("Synchronous QR Gen Error:", syncErr);
            }
        }
    }

    updateHostStatus() {
        if (!this.room) return; // Guard: room belum siap (sedang restore)
        const isCurrentHost = this.room.state.hostId === this.mySessionId;

        // Count only non-host players
        let totalPlayers = 0;
        this.room.state.players.forEach((p: any) => {
            if (!p.isHost) totalPlayers++;
        });

        // UPDATE HEADER TEXT
        if (this.isHost) {
            // New Host Layout Header
            const hostHeader = document.getElementById('host-player-count');
            if (hostHeader) {
                const label = totalPlayers === 1 ? 'Player' : 'Player';
                hostHeader.innerText = `${totalPlayers} ${label} `;
            }
        } else {
            // Player view header logic (Existing)
            const labelText = totalPlayers === 1 ? 'PLAYER' : 'PLAYERS';
            const headerText = document.getElementById('waiting-header-text');
            if (headerText) {
                headerText.innerHTML = `
            < div style = "display: flex; align-items: center; gap: 12px; font-family: 'Press Start 2P'; font-size: 20px;" >
                <span style="color: #00ff88;" > ${totalPlayers} </span>
                    < span style = "color: white; opacity: 0.9;" > ${labelText} </span>
                        </div>
                            `;
            }
        }

    }
    updateRoomList() {
        if (!this.roomListEl) return;

        const myPlayer = this.room.state.players.get(this.mySessionId);
        const mySubRoomId = myPlayer ? myPlayer.subRoomId : "";

        let html = '';
        this.room.state.subRooms.forEach((subRoom: any) => {
            const isMyRoom = subRoom.id === mySubRoomId;
            const playerCount = subRoom.playerIds.length;
            const isFull = playerCount >= subRoom.capacity;

            // Updated Styles for "Bigger/Professional" look
            const borderClass = isMyRoom ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(0,255,85,0.1)]' : 'border-white/10 bg-black/40 hover:border-white/30';
            const textClass = isMyRoom ? 'text-primary' : 'text-white';
            const btnClass = isFull
                ? 'bg-white/10 text-white/30 cursor-not-allowed border-gray-600'
                : isMyRoom
                    ? 'bg-primary text-black font-bold pixel-btn-green border-black'
                    : 'bg-secondary text-black font-bold pixel-btn-blue border-black hover:brightness-110';

            const btnText = isMyRoom ? 'JOINED' : isFull ? 'FULL' : 'JOIN';
            // Host cannot join rooms
            const action = (this.isHost || isFull || isMyRoom) ? '' : `onclick = "window.switchRoom('${subRoom.id}')"`;
            const btnVisibility = this.isHost ? 'invisible' : '';

            // Get player names
            let playerListHTML = '';
            let count = 0;
            subRoom.playerIds.forEach((sessionId: string) => {
                const player = this.room.state.players.get(sessionId);
                if (player) {
                    const isMe = sessionId === this.mySessionId;
                    const nameColor = isMe ? 'text-primary' : 'text-white/70';
                    playerListHTML += `
            < div class="flex items-center gap-2 ${nameColor} text-[10px] font-bold uppercase truncate" >
                <span class="material-symbols-outlined text-[10px] opacity-70" > person </span>
                            ${player.name}
        </div>`;
                    count++;
                }
            });
            if (count === 0) playerListHTML = '<span class="text-[10px] text-white/30 italic pl-1">Empty</span>';

            html += `
                <div class="w-full max-w-[320px] border-2 ${borderClass} p-4 rounded-xl transition-all duration-300 relative group">
                    <div class="flex justify-between items-center mb-3">
                        <span class="text-sm font-bold uppercase ${textClass} font-['Press_Start_2P'] tracking-tight">${subRoom.id}</span>
                        <div class="px-2 py-1 bg-black/60 rounded text-[10px] font-bold text-white/80 border border-white/5">
                            ${playerCount}/${subRoom.capacity}
                        </div>
                    </div>
                    
                    <div class="space-y-1 mb-4 min-h-[40px]">
                        ${playerListHTML}
                    </div>

                    <button ${action} class="w-full py-3 text-xs uppercase rounded-lg border-b-4 active:border-b-0 active:translate-y-1 transition-all ${btnClass} font-['Press_Start_2P'] tracking-wide ${btnVisibility}">
                        ${btnText}
                    </button>
                </div>
            `;
        });
        if (this.roomListEl) {
            this.roomListEl.innerHTML = html;
        }

        (window as any).switchRoom = (roomId: string) => {
            if (this.room) {
                this.room.send("switchRoom", { roomId });
            }
        };
    }

    showKickConfirm(sessionId: string, playerName: string) {
        // Hapus modal lama
        document.getElementById('kick-confirm-modal')?.remove();

        const modal = document.createElement('div');
        modal.id = 'kick-confirm-modal';
        modal.style.cssText = `
                position: fixed; inset: 0; z-index: 9999;
                background: rgba(0, 0, 0, 0.8);
                display: flex; align-items: center; justify-content: center;
                animation: fadeIn 0.15s ease;
                `;

        modal.innerHTML = `
                    <style>
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                #kick-box {
                    animation: shake 0.3s ease-in-out;
                    background: #1a1a2e;
                    border: 3px solid #ef4444; /* red-500 */
                    border-radius: 16px;
                    box-shadow: 0 0 50px rgba(239, 68, 68, 0.4);
                    padding: 30px;
                    text-align: center;
                    min-width: 300px;
                }
                .btn-c-red {
                    background: #ef4444; border-bottom: 4px solid #b91c1c; color: white;
                    font-family: 'Press Start 2P'; font-size: 10px; padding: 12px 20px; border-radius: 8px;
                    cursor: pointer; transition: all 0.1s;
                }
                .btn-c-red:active { border-bottom-width: 0; transform: translateY(4px); }
                .btn-c-gray {
                    background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); color: white;
                    font-family: 'Press Start 2P'; font-size: 10px; padding: 12px 20px; border-radius: 8px;
                    cursor: pointer; transition: all 0.1s;
                }
                .btn-c-gray:hover { background: rgba(255, 255, 255, 0.2); }
                </style>
                    <div id="kick-box">
                        <span class="material-symbols-outlined text-red-500 text-[48px] mb-4">block</span>
                        <h2 class="text-red-500 font-bold mb-2 font-['Press_Start_2P'] text-sm">KICK PLAYER ?</h2>
                        <p class="text-white/70 text-xs mb-6 font-['Press_Start_2P'] leading-relaxed">
                            Keluarkan <span class="text-white font-bold">${playerName}</span><br>dari ruangan?
                        </p>
                        <div class="flex justify-center gap-3">
                            <button id="cancel-kick" class="btn-c-gray">BATAL</button>
                            <button id="confirm-kick" class="btn-c-red">KICK!</button>
                        </div>
                    </div>
                `;

        document.body.appendChild(modal);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });

        document.getElementById('cancel-kick')?.addEventListener('click', () => {
            modal.remove();
        });

        document.getElementById('confirm-kick')?.addEventListener('click', () => {
            modal.remove();
            this.room.send("kickPlayer", { sessionId });
        });
    }

    updatePlayerGrid() {
        // Expose kick function globally so onclick works
        (window as any).confirmKick = (sessionId: string, playerName: string) => {
            this.showKickConfirm(sessionId, playerName);
        };

        const gridEl = this.isHost ? document.getElementById('host-player-grid') : document.getElementById('player-grid');
        if (!gridEl) return;

        // Hanya tampilkan player biasa — host adalah spectator murni, tidak masuk grid
        const players: any[] = [];
        this.room.state.players.forEach((p: any, sessionId: string) => {
            if (!p.isHost) {
                players.push({ ...p, sessionId });
            }
        });

        // Update Header dynamically
        this.updateHostStatus();

        // HOST Only: Handle Empty State
        if (this.isHost) {
            const emptyState = document.getElementById('host-empty-state');
            const startHint = document.getElementById('host-start-hint');

            if (players.length === 0) {
                if (emptyState) emptyState.classList.remove('hidden');
                if (gridEl) gridEl.classList.add('hidden');
                if (this.startBtn) {
                    this.startBtn.classList.add('opacity-50', 'pointer-events-none', 'grayscale');
                    this.startBtn.classList.remove('hover:brightness-110', 'active:border-b-0', 'active:translate-y-1');
                    this.startBtn.onclick = null; // Disable
                }
                if (startHint) startHint.classList.remove('hidden');
            } else {
                if (emptyState) emptyState.classList.add('hidden');
                if (gridEl) gridEl.classList.remove('hidden');
                if (this.startBtn) {
                    this.startBtn.classList.remove('opacity-50', 'pointer-events-none', 'grayscale');
                    this.startBtn.classList.add('hover:brightness-110', 'active:border-b-0', 'active:translate-y-1');
                    this.startBtn.onclick = () => this.room.send("startGame");
                }
                if (startHint) startHint.classList.add('hidden');
            }
        }

        let html = '';

        // Render player cards
        players.forEach((player) => {
            const isMe = player.sessionId === this.mySessionId;
            const borderClass = isMe ? 'border: 2px solid #00ff88; box-shadow: 0 0 15px rgba(0,255,136,0.3);' : 'border: 1px solid rgba(255,255,255,0.05);';

            // Kick Button (Host Only)
            let kickButtonHTML = '';
            if (this.isHost && !isMe) {
                kickButtonHTML = `
                                                    <button class="kick-btn absolute -top-1.5 -right-1.5 w-6 h-6 bg-red-500 border-2 border-red-700 rounded-full text-white flex items-center justify-center cursor-pointer z-10 shadow-md transition-all duration-300 opacity-100 pointer-events-auto md:opacity-0 md:pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto hover:!scale-110"
                onclick="window.confirmKick('${player.sessionId}', '${player.name.replace(/'/g, "\\'")}')"
                    >
                    <span class="material-symbols-outlined" style="font-size: 16px; font-weight: bold;">close</span>
                        </button>
                            `;
            }

            html += `
                        <div class="group relative flex flex-col items-center justify-center p-3 gap-2.5 rounded-2xl w-full max-w-[140px] mx-auto aspect-[1/1.1] transition-transform duration-200"
                style="
                background: rgba(20, 20, 35, 0.9); 
                    ${borderClass}
                ">
                    ${kickButtonHTML}

                <!-- Character(Middle) -->
                    <div style="width: 60px; height: 60px; background: radial-gradient(circle, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 70%); border-radius: 12px; display: flex; align-items: center; justify-content: center; overflow: hidden; border: 1px solid rgba(255,255,255,0.03);">
                        <div style="
                position: relative;
                width: 32px; height: 32px;
                transform: scale(1.6);
                ">
                    <!-- Base Body -->
                        <div style="
                position: absolute; inset: 0;
                background-image: url('/assets/base_idle_strip9.png');
                background-repeat: no-repeat;
                background-position: -32px -16px;
                image-rendering: pixelated;
                "></div>
                    <!-- Hair Layer -->
                        ${(() => {
                    // Menggunakan getHairById yang sudah diimport di atas file
                    const hair = getHairById(player.hairId || 0);
                    if (player.hairId > 0 && hair) {
                        return `
                                        <div style="
                                            position: absolute; inset: 0;
                                            background-image: url('/assets/${hair.idleKey}_strip9.png');
                                            background-repeat: no-repeat;
                                            background-position: -32px -16px;
                                            image-rendering: pixelated;
                                        "></div>
                                    `;
                    }
                    return '';
                })()
                }
                </div>
                    </div>

                    <!-- Player Name -->
                        <div style="text-align: center; width: 100%; padding: 0 2px;">
                            <span style="font-size: 8px; color: ${isMe ? '#00ff88' : 'white'}; font-family: 'Press Start 2P', cursive; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block;">
                                ${player.name || 'PLAYER'}
                </span>
                    </div>
                    </div>
                        `;
        });

        gridEl.innerHTML = html;
        if (this.isHost) {
            gridEl.style.cssText = `
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
                gap: 15px;
                padding: 10px;
                width: 100%;
                align-content: start;
                `;
        }
    }

    updateJoinUrl(code: string) {
        if (!code) return;
        const urlEl = document.getElementById('host-join-url');
        if (urlEl) {
            const baseUrl = window.location.origin;
            urlEl.innerText = `${baseUrl}/join/${code}`;
        }
    }

    handleGameStart() {
        if (this.isGameStarting) return;
        this.isGameStarting = true;

        console.log("[Host] Game Starting... Transitioning to Spectator Mode.");

        if (this.isHost && this.room && this.room.state && this.room.state.roomCode) {
            supabaseB
                .from(SESSION_TABLE)
                .update({ status: 'active', started_at: new Date().toISOString() })
                .eq('game_pin', this.room.state.roomCode)
                .then(({ error }) => {
                    if (error) console.error("Failed to set session active:", error);
                    else console.log("Session ACTIVE in Supabase.");
                });
        }

        if (this.countdownOverlay) {
            this.countdownOverlay.remove();
            this.countdownOverlay = null;
        }

        TransitionManager.close(() => {
            if (this.waitingUI) this.waitingUI.classList.add('hidden');

            if (this.isHost) {
                Router.navigate('/host/progress');
                TransitionManager.sceneTo(this, 'HostProgressScene', { room: this.room });
            } else {
                Router.navigate('/game');
                this.scene.start('GameScene', { room: this.room });
            }
        });
    }

}
