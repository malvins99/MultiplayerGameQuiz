import Phaser from 'phaser';
import { Room } from 'colyseus.js';
import { supabaseB, SESSION_TABLE, PARTICIPANT_TABLE } from '../lib/supabaseB';
import { Player } from '../../../server/src/rooms/GameState';
import { Router } from '../utils/Router';
import { TransitionManager } from '../utils/TransitionManager';
import { CharacterSelectPopup } from '../ui/CharacterSelectPopup';
import { QRCodePopup } from '../ui/QRCodePopup';
import { HAIR_OPTIONS, getHairById } from '../data/characterData';

export class HostWaitingRoomScene extends Phaser.Scene {
    room!: Room;
    isHost: boolean = false;
    mySessionId: string = '';
    isGameStarting: boolean = false; // Flag to prevent double transition

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

    constructor() {
        super('HostWaitingRoomScene');
    }

    init(data: { room: Room, isHost: boolean }) {
        this.room = data.room;
        this.isHost = data.isHost;
        this.mySessionId = this.room.sessionId;
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

        // Display Room Code
        this.updateRoomCode();

        // Setup Host UI
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

        // --- Room State Listeners ---

        this.room.state.listen("roomCode", (code: string) => {
            if (this.roomCodeEl) this.roomCodeEl.innerText = code || '------';
            this.updateQrCode(code);
            this.updateJoinUrl(code);
        });

        this.room.state.listen("hostId", (hostId: string) => {
            if (hostId !== this.mySessionId && this.isHost) {
                window.location.reload(); // Host lost status
            } else if (hostId !== this.mySessionId && !this.isHost) {
                // Player logic
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
                    // Reset opacity if it was hidden
                    this.countdownOverlay.style.opacity = '1';
                }
                if (this.countdownText) this.countdownText.innerText = val.toString();
            } else if (val === 0) {
                // Countdown finished, wait for start
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

        this.updateAll();

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
            
            <div class="relative z-10 flex h-screen w-full flex-row p-6 gap-6 font-display">
                <!-- LOGO -->
                <img src="/logo/gameforsmart.webp" class="absolute top-0 left-8 w-64 z-20 object-contain drop-shadow-[0_0_15px_rgba(0,255,136,0.3)] hover:scale-105 transition-transform" />

                <!-- Back Button REMOVED -->

                <!-- LEFT PANEL (Code, QR, URL, Start) -->
                <section class="w-1/3 min-w-[350px] max-w-[450px] bg-surface-dark border-4 border-primary/30 rounded-3xl p-8 flex flex-col items-center shadow-[0_0_30px_rgba(0,255,85,0.1)] relative overflow-hidden mt-24 bg-opacity-90 backdrop-blur-sm">
                    <div class="absolute inset-0 pixel-bg-pattern opacity-10 pointer-events-none"></div>

                    <!-- Room Code -->
                    <div class="w-full bg-black/40 border-2 border-primary/50 rounded-xl p-4 flex items-center justify-between relative group hover:border-primary transition-all mb-4">
                        <span id="host-room-code" class="text-4xl text-primary font-['Press_Start_2P'] tracking-widest mx-auto drop-shadow-[0_0_10px_rgba(0,255,85,0.5)]">CODE</span>
                        <button id="copy-code-btn" class="absolute right-4 text-white/50 hover:text-white transition-colors cursor-pointer"><span class="material-symbols-outlined">content_copy</span></button>
                    </div>

                    <!-- QR Code -->
                    <div class="flex-1 w-full flex items-center justify-center my-4 relative">
                        <button id="host-qr-expand-btn" class="absolute top-0 right-0 text-white/20 hover:text-white transition-colors cursor-pointer p-2 hover:scale-110 active:scale-95">
                            <span class="material-symbols-outlined">open_in_full</span>
                        </button>
                        <div class="bg-white p-4 rounded-xl aspect-square w-full max-w-[280px] flex items-center justify-center shadow-[0_0_20px_rgba(0,255,85,0.2)]">
                            <img id="host-qr-img" src="" class="w-full h-full object-contain" />
                        </div>
                    </div>

                    <!-- URL Box -->
                    <div id="copy-url-container" class="w-full bg-black/40 border-2 border-secondary/50 rounded-xl p-4 flex items-center justify-between mb-8 group hover:border-secondary transition-all cursor-pointer relative">
                        <span id="host-join-url" class="text-[8px] text-secondary font-['Press_Start_2P'] whitespace-nowrap mr-2 select-all">https://...</span>
                        <div class="w-8 h-8 flex items-center justify-center rounded-lg bg-secondary/10 group-hover:bg-secondary/20 transition-colors">
                            <span class="material-symbols-outlined text-secondary group-hover:text-white text-sm">content_copy</span>
                        </div>
                    </div>

                    <!-- Start Button REMOVED from here -->
                    <!-- Start Button REMOVED from here -->
                </section>

                <!-- RIGHT PANEL (Players) -->
                <section class="flex-1 bg-surface-dark border-4 border-purple-500/30 rounded-3xl p-8 flex flex-col shadow-[0_0_30px_rgba(204,0,255,0.1)] relative overflow-hidden mt-24 bg-opacity-90 backdrop-blur-sm">
                    <div class="absolute inset-0 pixel-bg-pattern opacity-10 pointer-events-none"></div>

                    <!-- Header -->
                    <div class="flex items-center justify-between mb-6 border-b-2 border-purple-500/20 pb-4">
                        <div class="flex items-center gap-4">
                            <h2 id="host-player-count" class="text-2xl text-secondary font-['Press_Start_2P'] tracking-wide drop-shadow-[0_0_10px_rgba(0,212,255,0.5)]">0 Players</h2>
                        </div>

                        <div class="flex items-center gap-4">
                            <!-- Back Button MOVED here -->
                            <button id="host-back-btn" class="px-6 py-3 bg-red-500 text-white font-['Press_Start_2P'] uppercase text-xs rounded-xl border-b-4 border-red-700 hover:brightness-110 active:border-b-0 active:translate-y-1 transition-all shadow-lg cursor-pointer">
                                BACK
                            </button>

                            <!-- Start Button -->
                            <button id="host-start-btn" class="px-8 py-3 bg-primary text-black font-['Press_Start_2P'] uppercase text-sm rounded-xl border-b-4 border-green-700 hover:brightness-110 active:border-b-0 active:translate-y-1 transition-all shadow-[0_0_15px_rgba(0,255,85,0.3)] cursor-pointer">
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
                        <div id="host-player-grid" class="grid grid-cols-3 xl:grid-cols-4 gap-4 w-full h-full overflow-y-auto custom-scrollbar p-2 hidden"></div>
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
        `;

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

        // QR Expand Logic
        const expandBtn = document.getElementById('host-qr-expand-btn');
        if (expandBtn) {
            // Ensure Popup is initialized
            if (!this.qrPopup) this.qrPopup = new QRCodePopup(() => { });

            expandBtn.onclick = () => {
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
            import('../data/characterData').then(({ getHairById }) => {
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
            this.room.leave();
        }

        // Clear local storage session
        localStorage.removeItem('mindventure_room');

        if (this.waitingUI) this.waitingUI.classList.add('hidden');
        const lobbyUI = document.getElementById('lobby-ui');
        if (lobbyUI) lobbyUI.classList.remove('hidden');
        Router.navigate('/');
        this.scene.start('LobbyScene');
        // Clean up overlay
        if (this.countdownOverlay) {
            this.countdownOverlay.remove();
            this.countdownOverlay = null;
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
        this.updatePlayerGrid();

        const myPlayer = this.room.state.players.get(this.mySessionId);
        if (myPlayer) {
            this.updateCharacterPreview(myPlayer.hairId || 0);
        }
    }

    updateRoomCode() {
        const code = this.room.state.roomCode;
        if (this.roomCodeEl) {
            this.roomCodeEl.innerText = code || '------';
        }
        this.updateQrCode(code);
    }

    updateQrCode(code: string) {
        if (this.roomQrCode && code) {
            const url = `${window.location.origin}?room=${code}`;
            this.roomQrCode.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(url)}`;
        }
    }

    updateHostStatus() {
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
                hostHeader.innerText = `${totalPlayers} ${label}`;
            }
        } else {
            // Player view header logic (Existing)
            const labelText = totalPlayers === 1 ? 'PLAYER' : 'PLAYERS';
            const headerText = document.getElementById('waiting-header-text');
            if (headerText) {
                headerText.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 12px; font-family: 'Press Start 2P'; font-size: 20px;">
                        <span style="color: #00ff88;">${totalPlayers}</span>
                        <span style="color: white; opacity: 0.9;">${labelText}</span>
                    </div>
                `;
            }
        }

        // -- OLD LOGIC for Player View (Hide unnecessary things if mistakenly shown) --
        if (!this.isHost) {
            // Ensure player logic remains active if needed
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
            const action = (this.isHost || isFull || isMyRoom) ? '' : `onclick="window.switchRoom('${subRoom.id}')"`;
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
                        <div class="flex items-center gap-2 ${nameColor} text-[10px] font-bold uppercase truncate">
                            <span class="material-symbols-outlined text-[10px] opacity-70">person</span>
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

        this.roomListEl.innerHTML = html;

        // Expose switch function globally
        (window as any).switchRoom = (roomId: string) => {
            this.room.send("switchRoom", { roomId });
        };
    }

    updatePlayerGrid() {
        const gridEl = this.isHost ? document.getElementById('host-player-grid') : document.getElementById('player-grid');
        if (!gridEl) return;

        // Unified View: Host and Players see ALL players (EXCEPT HOST)
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
                    this.startBtn.classList.add('opacity-50', 'cursor-not-allowed');
                    this.startBtn.onclick = null; // Disable
                }
                if (startHint) startHint.classList.remove('hidden');
            } else {
                if (emptyState) emptyState.classList.add('hidden');
                if (gridEl) gridEl.classList.remove('hidden');
                if (this.startBtn) {
                    this.startBtn.classList.remove('opacity-50', 'cursor-not-allowed');
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

            html += `
                <div style="
                    background: rgba(20, 20, 35, 0.9); 
                    ${borderClass}
                    padding: 12px; 
                    border-radius: 16px; 
                    display: flex; 
                    flex-direction: column; 
                    align-items: center; 
                    justify-content: center;
                    gap: 10px; 
                    position: relative; 
                    aspect-ratio: 1 / 1.1;
                    width: 100%;
                    max-width: 140px;
                    margin: 0 auto;
                    transition: transform 0.2s ease;
                ">
                    <!-- Character (Middle) -->
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
                })()}
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

        console.log("Game Starting... Transitioning.");

        // UPDATE SUPABASE STATUS TO "ACTIVE" (Only for Host)
        // Done here to ensure status changes ONLY when game actually starts (after countdown)
        if (this.isHost && this.room && this.room.state && this.room.state.roomCode) {
            supabaseB
                .from(SESSION_TABLE)
                .update({ status: 'active', started_at: new Date().toISOString() })
                .eq('game_pin', this.room.state.roomCode)
                .then(({ error }) => {
                    if (error) console.error("Failed to set session active:", error);
                    else console.log("Session ACTIVE. Countdown finished.");
                });
        }

        // Clean Overlay
        if (this.countdownOverlay) {
            this.countdownOverlay.remove();
            this.countdownOverlay = null;
        }

        TransitionManager.close(() => {
            if (this.waitingUI) this.waitingUI.classList.add('hidden');

            if (this.isHost) {
                Router.navigate('/host/progress');
                this.scene.start('HostProgressScene', { room: this.room });
            } else {
                Router.navigate('/game');
                this.scene.start('GameScene', { room: this.room });
            }
        });
    }

}
