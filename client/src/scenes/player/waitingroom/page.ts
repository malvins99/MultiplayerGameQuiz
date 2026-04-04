import { Room } from 'colyseus.js';
import { Router } from '../../../utils/Router';
import { TransitionManager } from '../../../utils/TransitionManager';
import { CharacterSelectPopup } from '../../../ui/shared/CharacterSelectPopup';
import { QRCodePopup } from '../../../ui/shared/QRCodePopup';
import { HAIR_OPTIONS, getHairById } from '../../../data/characterData';
import { OrientationManager } from '../../../utils/OrientationManager';
import { i18n } from '../../../utils/i18n';

export class PlayerWaitingRoomManager {
    room!: Room;
    isHost: boolean = false;
    mySessionId: string = '';
    isGameStarting: boolean = false;

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

    // Feature
    characterPopup: CharacterSelectPopup | null = null;
    characterPreviewEl: HTMLElement | null = null;
    qrPopup: QRCodePopup | null = null;

    constructor() {}

    async init(data: { room?: Room, isHost?: boolean, client?: any, isRestore?: boolean }) {
        if (data.room) {
            this.room = data.room;
            this.mySessionId = this.room.sessionId;
        }
        this.isHost = data.isHost !== undefined ? data.isHost : false;

        if (data.isRestore && !this.room && data.client) {
            await this.restoreRoom(data.client);
        }

        this.start();
    }

    async restoreRoom(client: any) {
        const reconnectionToken = localStorage.getItem('currentReconnectionToken');

        if (!reconnectionToken) {
            console.warn("Cannot restore player room: No reconnection token saved.");
            this.cleanupAndGoLobby();
            return;
        }

        try {
            console.log("Player reconnecting with token...");
            this.room = await client.reconnect(reconnectionToken);
            console.log("Player reconnected!", this.room);
            this.mySessionId = this.room.sessionId;

            // Perbarui token setelah reconnect berhasil
            localStorage.setItem('currentReconnectionToken', this.room.reconnectionToken);

            // Setup room listeners again
            this.setupRoomListeners();

        } catch (e) {
            console.warn("Player reconnection failed:", e);
            localStorage.removeItem('currentRoomId');
            localStorage.removeItem('currentSessionId');
            localStorage.removeItem('currentReconnectionToken');
            this.cleanupAndGoLobby();
        }
    }

    private startGameEngine(startScene: string, sceneData?: any) {
        import('../../../game').then((engine) => {
            engine.initializeGame(startScene, sceneData);
        }).catch(err => {
            console.error("Failed to load game engine:", err);
            window.location.href = '/';
        });
    }

    private startManager(managerName: string, data?: any) {
        if (managerName === 'LobbyManager') {
            import('../../lobby/page').then(m => {
                const manager = new m.LobbyManager();
                manager.init(data);
            });
        }
    }

    /** Bersihkan UI dan kembali ke lobby (tanpa ghost waiting-ui) */
    cleanupAndGoLobby() {
        if (this.waitingUI) this.waitingUI.classList.add('hidden');
        const waitingUiEl = document.getElementById('waiting-ui');
        if (waitingUiEl) waitingUiEl.classList.add('hidden');

        // TransitionManager handles countdown cleanup

        document.getElementById('exit-confirm-modal')?.remove();
        OrientationManager.disable();
        Router.navigate('/');
        this.startManager('LobbyManager');
    }

    setupRoomListeners() {
        // --- Room State Listeners ---
        this.room.state.listen("hostId", (hostId: string) => {
            if (hostId === this.mySessionId) {
                this.startGameEngine('HostWaitingRoomScene', { room: this.room, isHost: true });
            }
            this.updateUILayout();
        });

        // Player Add/Remove/Change
        this.room.state.players.onAdd((player: any, key: string) => {
            this.updateAll();
            player.listen("name", () => this.updateAll());
            player.listen("hairId", () => this.updateAll());
        });
        this.room.state.players.onRemove(() => this.updateAll());

        // Game Start
        this.room.onMessage("gameStarted", () => {
            this.handleGameStart();
        });

        // Kicked by Host
        this.room.onMessage("kicked", (payload: any) => {
            // Langsung keluar tanpa alert
            this.leaveRoom();
        });
    }

    private start() {
        // Multi-Language Support Event
        window.addEventListener('languageChanged', () => {
            if (this.backBtn) this.backBtn.innerText = i18n.t('player_lobby.exit');
            const chooseBtn = document.getElementById('player-choose-char-btn');
            if (chooseBtn) chooseBtn.innerText = i18n.t('player_lobby.choose_character');

            const exitTitle = document.getElementById('exit-confirm-title');
            if (exitTitle) exitTitle.innerHTML = i18n.t('player_lobby.dialog_exit_title');

            const exitDesc = document.getElementById('exit-confirm-desc');
            if (exitDesc) exitDesc.innerHTML = i18n.t('player_lobby.dialog_exit_desc');

            const exitCancel = document.getElementById('exit-cancel-btn');
            if (exitCancel) exitCancel.innerText = i18n.t('player_lobby.dialog_exit_cancel');

            const exitConfirm = document.getElementById('exit-confirm-btn');
            if (exitConfirm) exitConfirm.innerText = i18n.t('player_lobby.dialog_exit_confirm');

            this.updatePlayerGrid();
        });

        // Grab DOM elements
        this.waitingUI = document.getElementById('waiting-ui');

        // Hide lobby, show waiting room
        const lobbyUI = document.getElementById('lobby-ui');
        if (lobbyUI) lobbyUI.classList.add('hidden');
        if (this.waitingUI) {
            this.waitingUI.classList.remove('hidden');
            this.setupPlayerUI(); // Inject new HTML structure
        }

        // Re-grab new elements after injection
        this.playerGridEl = document.getElementById('player-grid');
        this.playerCountEl = document.getElementById('player-count-value');
        this.nameInput = document.getElementById('header-player-name') as HTMLInputElement;
        this.backBtn = document.getElementById('player-back-btn');

        // Setup Event Listeners
        if (this.backBtn) {
            this.backBtn.onclick = () => {
                this.showExitConfirm();
            };
        }

        const chooseCharBtn = document.getElementById('player-choose-char-btn');
        if (chooseCharBtn) {
            chooseCharBtn.onclick = () => {
                const myPlayer = this.room.state.players.get(this.mySessionId);
                this.characterPopup?.show(myPlayer?.hairId || 0);
            };
        }

        // Setup listeners if room is ready (normal join)
        if (this.room) {
            this.setupRoomListeners();
        }

        // Initialize Character Popup
        this.characterPopup = new CharacterSelectPopup(
            HAIR_OPTIONS,
            (hairId) => { if (this.room) this.room.send("updateHair", { hairId }) },
            () => { }
        );

        // Initial render
        this.updateAll();
        this.updateUILayout();

        // Using shared TransitionManager for countdown

        // Listen for Countdown
        if (this.room) {
            this.room.state.listen("countdown", (val: number, previousVal: number) => {
                if (val > 0) {
                    // --- GLOBAL UNIFIED COUNTDOWN ---
                    TransitionManager.ensureClosed();
                    TransitionManager.setCountdownText(val.toString());

                    // --- OPTIMIZATION: Start Game Transition Early ---
                    this.handleGameStart();
                } else if (val === 0 && (previousVal || 0) > 0) {
                    TransitionManager.setCountdownText("GO!");
                }
            });

            // Listen for State Start (Still kept as fallback if countdown is skipped)
            this.room.state.listen("isGameStarted", (isStarted: boolean) => {
                if (isStarted) this.handleGameStart();
            });

            // Enforce Landscape early in waiting room
            OrientationManager.requireLandscape();
        }
    }

    handleGameStart() {
        if (this.isGameStarting) return;
        this.isGameStarting = true;

        // TransitionManager handles countdown cleanup

        // --- OPTIMIZATION: Instant Transition ---
        // We use ensureClosed() to skip the 650ms "close" animation delay
        // as the countdown is already visible or will be shown by GameScene.
        TransitionManager.ensureClosed();

        if (this.waitingUI) this.waitingUI.classList.add('hidden');
        Router.navigate('/game');
        this.startGameEngine('GameScene', { room: this.room });
    }

    // createCountdownOverlay removed - using global TransitionManager

    setupPlayerUI() {
        if (!this.waitingUI) return;

        // Inject Styles (Standard Theme)
        const styleId = 'player-waiting-room-styles';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.innerHTML = `
                .player-content-box {
                    background: #2d5a27;
                    border: none;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
                    border-radius: 20px;
                    width: 95%;
                    max-width: 1100px;
                    height: auto;
                    min-height: 220px;
                    max-height: 520px;
                    position: relative;
                    padding: 25px;
                    display: flex;
                    flex-direction: column;
                    margin-top: 10px;
                }
                .custom-scrollbar {
                    scrollbar-width: none !important;
                    -ms-overflow-style: none !important;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    display: none !important;
                }
                .player-header-section {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    margin-bottom: 20px;
                    padding-bottom: 15px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                }
                /* Red Exit Button Style */
                .btn-exit-standard {
                    padding: 0 30px;
                    height: 52px;
                    background: #ef4444; /* red-500 */
                    border-radius: 12px;
                    color: white;
                    font-family: 'Retro Gaming';
                    text-transform: uppercase;
                    font-size: 11px;
                    border: none;
                    border-bottom: 4px solid #b91c1c; /* red-700 */
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                    transition: all 0.1s;
                    cursor: pointer;
                }
                .btn-exit-standard:hover {
                    filter: brightness(1.1);
                }
                .btn-exit-standard:active {
                    border-bottom-width: 0;
                    transform: translateY(4px);
                }
                .player-count-box {
                    background: transparent;
                    border: 2px solid #FFFFFF;
                    border-radius: 10px;
                    padding: 8px 12px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .player-count-value {
                    color: #FFFFFF;
                    font-family: 'Retro Gaming';
                    font-size: 16px;
                }
                .material-symbols-outlined {
                    font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
                }
                .neon-title-standard {
                    font-family: 'Retro Gaming';
                    font-size: 38px;
                    color: #00ff88;
                    text-shadow: 0 0 15px rgba(0, 255, 136, 0.4), 3px 3px 0px #000;
                    text-transform: uppercase;
                    letter-spacing: 4px;
                }
                .player-card-standard {
                    background: #6CC452;
                    border: none;
                    border-radius: 16px;
                    padding: 8px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0px;
                    position: relative;
                    transition: all 0.2s ease;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                    min-height: 140px;
                }
                .player-card-active {
                    /* No border as requested, maybe a subtle scale or shadow if needed, but keeping it simple for now */
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                }
                .pill-you {
                    background: #FFFFFF;
                    color: #6CC452;
                    font-family: 'Retro Gaming';
                    font-size: 10px;
                    padding: 6px 20px;
                    border-radius: 100px;
                    font-weight: bold;
                    white-space: nowrap;
                    text-transform: uppercase;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .standard-pixel-btn {
                    height: 52px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    font-family: 'Retro Gaming';
                    text-transform: uppercase;
                    transition: all 0.1s;
                }
                .standard-pixel-btn:active {
                    border-bottom-width: 0;
                    transform: translateY(4px);
                }
                .btn-choose-char-green {
                    padding: 0 40px;
                    background: #92C140;
                    border-radius: 12px;
                    color: white;
                    font-family: 'Retro Gaming';
                    text-transform: uppercase;
                    font-size: 11px;
                    border: none;
                    border-bottom: 4px solid #478D47;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                }
                .btn-choose-char-green:active {
                    box-shadow: none;
                }
                @keyframes play-idle {
                    from { background-position: 0 0; }
                    to { background-position: -864px 0; }
                }

                /* Responsive Additions */
                .logo-tl {
                    position: absolute;
                    top: -30px;
                    left: -40px;
                    width: 16rem; /* 256px (w-64) */
                }
                .logo-tr {
                    position: absolute;
                    top: -45px;
                    right: -15px;
                    width: 20rem; /* 320px (w-80) */
                }
                .player-grid-responsive {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(148px, 1fr));
                    gap: 12px;
                    padding: 10px;
                    width: 100%;
                    justify-content: center;
                }
                .player-card-wrapper {
                    aspect-ratio: 1 / 1.1;
                    width: 100%;
                    max-width: 148px;
                    margin: 0 auto;
                }
                
                @media (max-width: 932px) and (orientation: landscape) {
                    .logo-tl {
                        top: -10px !important;
                        left: -15px !important;
                        width: 8rem !important;
                    }
                    .logo-tr {
                        top: -15px !important;
                        right: -5px !important;
                        width: 10rem !important;
                    }
                    .player-content-box {
                        margin-top: 10px !important;
                        padding: 10px !important;
                        min-height: 120px !important;
                        max-height: 55vh !important;
                        margin-bottom: 50px !important;
                    }
                    .player-header-section {
                        margin-bottom: 10px !important;
                        padding-bottom: 8px !important;
                    }
                    .pt-16 {
                        padding-top: 2rem !important;
                    }
                }
                
                @media (max-width: 768px) {
                    .logo-tl {
                        top: -15px;
                        left: -20px;
                        width: 9rem;
                    }
                    .logo-tr {
                        top: -20px;
                        right: -5px;
                        width: 11rem;
                    }
                    .player-content-box {
                        margin-top: 20px;
                        padding: 15px;
                        min-height: 160px;
                        flex: 1;
                        max-height: calc(100vh - 160px);
                        margin-bottom: 70px;
                    }
                    .fixed.bottom-10 {
                        bottom: 1.2rem !important;
                    }
                    .btn-exit-standard {
                        padding: 0 16px;
                        height: 40px;
                        font-size: 10px;
                    }
                    .btn-choose-char-green {
                        padding: 0 16px;
                        height: 40px;
                        font-size: 10px;
                    }
                    .player-grid-responsive {
                        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
                        gap: 8px;
                        padding: 5px;
                    }
                    .player-card-wrapper {
                        max-width: 100%;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        this.waitingUI.innerHTML = `
            <!-- Full-Screen Background — same as home page -->
            <div class="absolute inset-0" style="background: linear-gradient(180deg, #6CC452 0%, #478D47 100%);"></div>

            <!-- Pixel-art Background Decorations -->
            <div class="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <!-- Subtle pixel grid pattern -->
                <div class="absolute inset-0 opacity-[0.06]" style="background-image: radial-gradient(#2d5a30 1px, transparent 1px); background-size: 24px 24px;"></div>

                <!-- L1: Back Layer (Small/Medium, Slow) -->
                <div class="absolute top-[10%] opacity-20 animate-[drift_80s_linear_infinite]" style="transform: scale(1.0); left: -10%;">
                    <div class="relative w-10 h-3 bg-white">
                        <div class="absolute -top-1 left-2 w-3 h-1 bg-white"></div>
                    </div>
                </div>
                <div class="absolute top-[45%] opacity-15 animate-[drift_95s_linear_infinite_reverse]" style="transform: scale(0.8); left: 80%;">
                    <div class="relative w-12 h-4 bg-[#D3EE98]">
                        <div class="absolute -top-2 left-3 w-4 h-2 bg-[#D3EE98]"></div>
                    </div>
                </div>
                <div class="absolute top-[15%] opacity-15 animate-[drift_110s_linear_infinite]" style="transform: scale(1.2); left: 40%;">
                    <div class="relative w-14 h-4 bg-white">
                        <div class="absolute -top-2 left-4 w-5 h-2 bg-white"></div>
                    </div>
                </div>

                <!-- L2: Mid Layer (Medium) -->
                <div class="absolute top-[25%] opacity-40 animate-[drift_45s_linear_infinite]" style="transform: scale(1.8); left: 15%;">
                    <div class="relative w-16 h-5 bg-[#D3EE98]">
                        <div class="absolute -top-3 left-4 w-6 h-3 bg-[#D3EE98]"></div>
                        <div class="absolute -top-5 left-8 w-4 h-5 bg-[#D3EE98]"></div>
                    </div>
                </div>
                <div class="absolute top-[65%] opacity-35 animate-[drift_55s_linear_infinite_reverse]" style="transform: scale(1.5); left: 60%;">
                    <div class="relative w-14 h-4 bg-white">
                        <div class="absolute -top-2 left-4 w-5 h-2 bg-white"></div>
                        <div class="absolute -top-4 left-7 w-3 h-4 bg-white"></div>
                    </div>
                </div>
                <div class="absolute top-[5%] opacity-25 animate-[drift_70s_linear_infinite]" style="transform: scale(1.7); left: 75%;">
                    <div class="relative w-16 h-5 bg-[#D3EE98]">
                        <div class="absolute -top-3 left-5 w-6 h-3 bg-[#D3EE98]"></div>
                    </div>
                </div>

                <!-- L3: Front Layer (Large, Faster) -->
                <div class="absolute top-[40%] opacity-30 animate-[drift_35s_linear_infinite]" style="transform: scale(2.5); left: -20%;">
                    <div class="relative w-12 h-4 bg-[#FEFF9F]">
                        <div class="absolute -top-2 left-2 w-4 h-2 bg-[#FEFF9F]"></div>
                        <div class="absolute -top-4 left-5 w-4 h-4 bg-[#FEFF9F]"></div>
                    </div>
                </div>
                <div class="absolute top-[75%] opacity-25 animate-[drift_40s_linear_infinite_reverse]" style="transform: scale(2.2); left: 40%;">
                    <div class="relative w-18 h-6 bg-white">
                        <div class="absolute -top-3 left-5 w-7 h-3 bg-white"></div>
                        <div class="absolute -top-6 left-10 w-5 h-6 bg-white"></div>
                    </div>
                </div>
                <div class="absolute top-[50%] opacity-20 animate-[drift_30s_linear_infinite]" style="transform: scale(3.0); left: 10%;">
                    <div class="relative w-14 h-4 bg-[#FEFF9F]">
                        <div class="absolute -top-2 left-4 w-5 h-2 bg-[#FEFF9F]"></div>
                    </div>
                </div>

                <!-- Floating Particles -->
                <div class="firefly !bg-[#FEFF9F] !shadow-[0_0_15px_rgba(254,255,159,0.9)]" style="top: 25%; left: 15%; animation-delay: 0s;"></div>
                <div class="firefly !bg-white !shadow-[0_0_15px_rgba(255,255,255,0.8)]" style="top: 65%; left: 80%; animation-delay: 1.5s;"></div>
                <div class="firefly !bg-[#D3EE98] !shadow-[0_0_15px_rgba(211,238,152,0.9)]" style="top: 45%; left: 45%; animation-delay: 3s;"></div>
                <div class="firefly !bg-[#FEFF9F] !shadow-[0_0_15px_rgba(254,255,159,0.9)]" style="top: 85%; left: 20%; animation-delay: 4.5s;"></div>
                <div class="firefly !bg-white !shadow-[0_0_15px_rgba(255,255,255,0.8)]" style="top: 15%; left: 70%; animation-delay: 6s;"></div>
            </div>

            <!-- Walking Characters Container -->
            <div id="player-waiting-characters-container" class="absolute inset-0 z-0 overflow-hidden pointer-events-none"></div>
            
            <!-- LOGO ZIGMA: Tengah atas di mobile, Kiri atas di desktop -->
            <img src="/logo/Zigma-logo-fix.webp" id="player-logo-zigma"
                class="z-20 object-contain" style="position:absolute; top:0px; left:50%; transform:translateX(-50%); width:10rem;" />
            
            <!-- LOGO GAME FOR SMART: Sembunyi di mobile, Kanan atas di desktop -->
            <img src="/logo/gameforsmart-logo-fix.webp" id="player-logo-gfs"
                class="z-20 object-contain" style="position:absolute; display:none;" />

            <div class="relative z-10 flex flex-col items-center justify-start w-full h-screen p-4 md:pt-20 pt-16 overflow-hidden">
                <!-- Main Content Box (Host Style Container) -->
                <div class="player-content-box">
                    <div class="player-header-section">
                        <div class="player-count-box">
                            <span class="material-symbols-outlined text-white text-xl">person</span>
                            <span id="player-count-value" class="player-count-value">1</span>
                        </div>
                    </div>

                    <!-- Player Grid -->
                    <div id="player-grid" class="flex-1 overflow-y-auto custom-scrollbar px-2 player-grid-responsive">
                        <!-- Player items injected here -->
                    </div>
                </div>
            </div>

            <!-- Sticky Bottom Buttons -->
            <div class="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 z-30 w-[90%] md:w-auto justify-center">
                <!-- EXIT Button (Red Host Style) -->
                <button id="player-back-btn" class="standard-pixel-btn btn-exit-standard">
                    ${i18n.t('player_lobby.exit')}
                </button>

                <!-- Pill Choose Character (Host Start Button Style) -->
                <button id="player-choose-char-btn" class="standard-pixel-btn btn-choose-char-green">
                    ${i18n.t('player_lobby.choose_character')}
                </button>
            </div>
        `;

        // Responsive logo positioning: Desktop = 2 logo (asli), Mobile = hanya Zigma tengah
        const pZigmaLogo = document.getElementById('player-logo-zigma');
        const pGfsLogo = document.getElementById('player-logo-gfs');
        const updatePlayerLogos = () => {
            const isDesktop = window.innerWidth >= 768;
            if (pZigmaLogo) {
                if (isDesktop) {
                    pZigmaLogo.style.top = '-30px';
                    pZigmaLogo.style.left = '-40px';
                    pZigmaLogo.style.transform = 'none';
                    pZigmaLogo.style.width = '16rem';
                } else {
                    pZigmaLogo.style.top = '0px';
                    pZigmaLogo.style.left = '50%';
                    pZigmaLogo.style.transform = 'translateX(-50%)';
                    pZigmaLogo.style.width = '10rem';
                }
            }
            if (pGfsLogo) {
                if (isDesktop) {
                    pGfsLogo.style.display = 'block';
                    pGfsLogo.style.top = '-45px';
                    pGfsLogo.style.right = '-15px';
                    pGfsLogo.style.width = '20rem';
                } else {
                    pGfsLogo.style.display = 'none';
                }
            }
        };
        updatePlayerLogos();
        window.addEventListener('resize', updatePlayerLogos);

        // Start Walking Character Spawner (sama seperti home page)
        this.startWaitingCharacterSpawner('player-waiting-characters-container');
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

        // Render Tools (Right Hand)
        const toolsLayer = document.createElement('div');
        toolsLayer.style.backgroundImage = `url('/assets/tools_idle_strip9.png')`;
        toolsLayer.style.width = '96px';
        toolsLayer.style.height = '64px';
        toolsLayer.style.backgroundSize = '864px 64px';
        toolsLayer.style.imageRendering = 'pixelated';
        toolsLayer.style.position = 'absolute';
        toolsLayer.style.top = '50%';
        toolsLayer.style.left = '50%';
        toolsLayer.style.transform = 'translate(-50%, -50%) scale(5)'; // Centered and SCALED UP (5x)
        toolsLayer.style.animation = 'play-idle 1s steps(9) infinite';
        container.appendChild(toolsLayer);

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

    showExitConfirm() {
        // Hapus modal lama jika ada
        document.getElementById('exit-confirm-modal')?.remove();

        const modal = document.createElement('div');
        modal.id = 'exit-confirm-modal';
        modal.style.cssText = `
            position: fixed; inset: 0; z-index: 9999;
            background: rgba(0,0,0,0.75);
            display: flex; align-items: center; justify-content: center;
            animation: fadeIn 0.15s ease;
        `;
        modal.innerHTML = `
            <style>
                @keyframes popIn {
                    from { transform: scale(0.85); opacity: 0; }
                    to   { transform: scale(1);    opacity: 1; }
                }
                #exit-confirm-box {
                    animation: popIn 0.2s cubic-bezier(.34,1.56,.64,1);
                    background: #1a1a2e;
                    border: 3px solid #ef4444;
                    border-radius: 16px;
                    box-shadow: 0 0 40px rgba(239,68,68,0.3), 0 20px 60px rgba(0,0,0,0.8);
                    padding: 36px 40px;
                    text-align: center;
                    min-width: 320px;
                    max-width: 90vw;
                }
                #exit-confirm-box h2 {
                    font-family: 'Press Start 2P', monospace;
                    font-size: 14px;
                    color: #ef4444;
                    margin-bottom: 12px;
                    line-height: 1.6;
                }
                #exit-confirm-box p {
                    font-family: 'Press Start 2P', monospace;
                    font-size: 9px;
                    color: rgba(255,255,255,0.6);
                    margin-bottom: 28px;
                    line-height: 1.8;
                }
                .exit-btn-row {
                    display: flex;
                    gap: 12px;
                    justify-content: center;
                }
                .btn-cancel-exit {
                    font-family: 'Press Start 2P', monospace;
                    font-size: 9px;
                    padding: 12px 24px;
                    background: rgba(255,255,255,0.08);
                    border: 2px solid rgba(255,255,255,0.15);
                    border-radius: 10px;
                    color: white;
                    cursor: pointer;
                    transition: all 0.15s;
                }
                .btn-cancel-exit:hover { background: rgba(255,255,255,0.15); }
                .btn-confirm-exit {
                    font-family: 'Press Start 2P', monospace;
                    font-size: 9px;
                    padding: 12px 24px;
                    background: #ef4444;
                    border: 2px solid #b91c1c;
                    border-radius: 10px;
                    color: white;
                    cursor: pointer;
                    transition: all 0.15s;
                    border-bottom-width: 4px;
                }
                .btn-confirm-exit:hover { filter: brightness(1.15); }
                .btn-confirm-exit:active { border-bottom-width: 2px; transform: translateY(2px); }
            </style>
            <div id="exit-confirm-box" ${i18n.getLanguage() === 'ar' ? 'dir="rtl"' : ''}>
                <h2 id="exit-confirm-title">${i18n.t('player_lobby.dialog_exit_title')}</h2>
                <p id="exit-confirm-desc">${i18n.t('player_lobby.dialog_exit_desc')}</p>
                <div class="exit-btn-row">
                    <button class="btn-cancel-exit" id="exit-cancel-btn">${i18n.t('player_lobby.dialog_exit_cancel')}</button>
                    <button class="btn-confirm-exit" id="exit-confirm-btn">${i18n.t('player_lobby.dialog_exit_confirm')}</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Klik di luar modal → tutup
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });

        document.getElementById('exit-cancel-btn')?.addEventListener('click', () => {
            modal.remove();
        });

        document.getElementById('exit-confirm-btn')?.addEventListener('click', () => {
            modal.remove();
            this.leaveRoom();
        });
    }

    leaveRoom() {
        if (this.room) {
            this.room.leave();
        }

        // Hapus session data
        localStorage.removeItem('currentRoomId');
        localStorage.removeItem('currentSessionId');
        localStorage.removeItem('currentReconnectionToken');

        // IMPORTANT: Clear any zombie pending join codes so we don't auto-join again
        localStorage.removeItem('pendingJoinRoomCode');

        if (this.waitingUI) this.waitingUI.classList.add('hidden');
        OrientationManager.disable();

        // TransitionManager handles iris/overlay

        const lobbyUI = document.getElementById('lobby-ui');
        if (lobbyUI) lobbyUI.classList.remove('hidden');

        // Use replace to prevent "Back" from re-joining
        Router.replace('/');

        // Explicitly tell lobby we are exiting so it doesn't auto-join
        this.startManager('LobbyManager', { didExit: true });
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

    updateUILayout() {
        let totalPlayers = 0;
        this.room.state.players.forEach((p: any) => {
            if (!p.isHost) totalPlayers++;
        });

        if (this.playerCountEl) {
            this.playerCountEl.innerText = totalPlayers.toString();
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

            const btnText = isMyRoom ? i18n.t('host_lobby.joined') : isFull ? i18n.t('host_lobby.full') : i18n.t('host_lobby.join');
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
            if (count === 0) playerListHTML = `<span class="text-[10px] text-white/30 italic pl-1">${i18n.t('host_lobby.empty')}</span>`;

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
        if (!this.playerGridEl) return;

        // Use Map to ensure deduplication by sessionId
        const playerMap = new Map<string, any>();
        this.room.state.players.forEach((p: any, sessionId: string) => {
            if (!p.isHost && !playerMap.has(sessionId)) {
                playerMap.set(sessionId, {
                    sessionId,
                    name: p.name,
                    hairId: p.hairId,
                    isHost: p.isHost,
                });
            }
        });
        const players = Array.from(playerMap.values());

        // Ensure current player is always first
        players.sort((a, b) => {
            if (a.sessionId === this.mySessionId) return -1;
            if (b.sessionId === this.mySessionId) return 1;
            return 0; // maintain original order for other players
        });

        this.updateUILayout();

        let html = '';

        players.forEach((player) => {
            const isMe = player.sessionId === this.mySessionId;
            const cardClass = isMe ? 'player-card-standard player-card-active' : 'player-card-standard';
            const youPill = isMe ? `<div class="absolute -bottom-3 left-1/2 -translate-x-1/2 pill-you">${i18n.t('player_lobby.you')}</div>` : '';

            html += `
                <div class="${cardClass} player-card-wrapper">
                    <!-- Character (Middle) -->
                    <div style="width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; overflow: visible; margin-top: 5px;">
                         <div style="
                            position: relative;
                            width: 32px; height: 32px; 
                            transform: scale(3.5) translateY(4px);
                         ">
                            <div style="
                                position: absolute; inset: 0;
                                background-image: url('/assets/characters/Human/IDLE/base_idle_strip9.png');
                                background-repeat: no-repeat;
                                background-position: -32px -16px;
                                image-rendering: pixelated;
                            "></div>
                            <div style="
                                position: absolute; inset: 0;
                                background-image: url('/assets/characters/Human/IDLE/tools_idle_strip9.png');
                                background-repeat: no-repeat;
                                background-position: -32px -16px;
                                image-rendering: pixelated;
                            "></div>
                            ${(() => {
                    const hair = getHairById(player.hairId || 0);
                    if (player.hairId > 0 && hair) {
                        return `
                                        <div style="
                                            position: absolute; inset: 0;
                                            background-image: url('/assets/characters/Human/IDLE/${hair.idleKey}_strip9.png');
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
                    <div style="text-align: center; width: 100%; margin-top: 2px; padding: 0 4px;">
                        <span style="font-size: 11px; color: #FFFFFF; font-family: 'Press Start 2P', cursive; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; width: 100%; ${isMe ? 'text-shadow: 0 0 5px rgba(255, 255, 255, 0.3);' : ''}">
                            ${player.name || i18n.t('host_lobby.player_upper')}
                        </span>
                    </div>

                    ${youPill}
                </div>
            `;
        });

        this.playerGridEl.innerHTML = html;

        // Expose name update globally
        (window as any).updatePlayerName = (name: string) => {
            this.room.send('updateName', { name });
        };
    }

    // Walking character spawner — sama persis seperti home page
    private waitingSpawnerInterval: any = null;
    startWaitingCharacterSpawner(containerId: string) {
        if (this.waitingSpawnerInterval) {
            clearInterval(this.waitingSpawnerInterval);
            this.waitingSpawnerInterval = null;
        }

        const container = document.getElementById(containerId);
        if (!container) return;

        const checkAndSpawn = () => {
            const activeChars = container.querySelectorAll('.walking-char').length;
            if (activeChars >= 3) return;
            const chance = activeChars === 0 ? 0.8 : 0.4;
            if (Math.random() < chance) {
                this.spawnWalkingCharacter(container);
            }
        };

        checkAndSpawn();
        this.waitingSpawnerInterval = setInterval(checkAndSpawn, 5000);
    }

    spawnWalkingCharacter(container: HTMLElement) {
        const char = document.createElement('div');
        char.className = 'walking-char';

        const fromRight = Math.random() > 0.5;
        const speed = 20 + Math.random() * 10;

        if (fromRight) {
            char.style.animation = `base-walk-cycle 0.8s steps(8) infinite, walk-across-left ${speed}s linear forwards`;
            char.style.transform = 'scale(-1, 1)';
        } else {
            char.style.animation = `base-walk-cycle 0.8s steps(8) infinite, walk-across-right ${speed}s linear forwards`;
            char.style.transform = 'scale(1, 1)';
        }

        container.appendChild(char);

        setTimeout(() => {
            if (char.parentElement) char.remove();
        }, speed * 1000 + 500);
    }
}
