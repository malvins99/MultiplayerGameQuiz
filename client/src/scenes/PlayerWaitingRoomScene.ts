import Phaser from 'phaser';
import { Room } from 'colyseus.js';
import { Router } from '../utils/Router';
import { TransitionManager } from '../utils/TransitionManager';
import { CharacterSelectPopup } from '../ui/CharacterSelectPopup';
import { QRCodePopup } from '../ui/QRCodePopup';
import { HAIR_OPTIONS, getHairById } from '../data/characterData';

export class PlayerWaitingRoomScene extends Phaser.Scene {
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
    countdownOverlay: HTMLElement | null = null;
    countdownText: HTMLElement | null = null;

    // Feature
    characterPopup: CharacterSelectPopup | null = null;
    characterPreviewEl: HTMLElement | null = null;
    qrPopup: QRCodePopup | null = null;

    constructor() {
        super('PlayerWaitingRoomScene');
    }

    init(data: { room: Room, isHost: boolean }) {
        this.room = data.room;
        this.isHost = data.isHost;
        this.mySessionId = this.room.sessionId;
    }

    create() {
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
                this.leaveRoom();
            };
        }

        const chooseCharBtn = document.getElementById('player-choose-char-btn');
        if (chooseCharBtn) {
            chooseCharBtn.onclick = () => {
                const myPlayer = this.room.state.players.get(this.mySessionId);
                this.characterPopup?.show(myPlayer?.hairId || 0);
            };
        }

        // --- Room State Listeners ---
        this.room.state.listen("hostId", (hostId: string) => {
            if (hostId === this.mySessionId) {
                this.scene.start('HostWaitingRoomScene', { room: this.room, isHost: true });
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

        // Initialize Character Popup
        this.characterPopup = new CharacterSelectPopup(
            HAIR_OPTIONS,
            (hairId) => this.room.send("updateHair", { hairId }),
            () => { }
        );

        // Initial render
        this.updateAll();
        this.updateUILayout();

        // Inject Countdown Overlay (Shared)
        this.createCountdownOverlay();

        // Listen for Countdown
        this.room.state.listen("countdown", (val: number) => {
            if (val > 0) {
                if (this.countdownOverlay) this.countdownOverlay.classList.remove('hidden');
                if (this.countdownText) this.countdownText.innerText = val.toString();
            } else if (val === 0) {
                if (this.countdownText) this.countdownText.innerText = "GO!";
            }
        });

        // Listen for State Start
        this.room.state.listen("isGameStarted", (isStarted: boolean) => {
            if (isStarted) this.handleGameStart();
        });
    }

    handleGameStart() {
        if (this.isGameStarting) return;
        this.isGameStarting = true;

        if (this.countdownOverlay) {
            this.countdownOverlay.remove();
            this.countdownOverlay = null;
        }

        TransitionManager.close(() => {
            if (this.waitingUI) this.waitingUI.classList.add('hidden');
            Router.navigate('/game');
            this.scene.start('GameScene', { room: this.room });
        });
    }

    createCountdownOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'player-countdown-overlay';
        overlay.className = 'fixed inset-0 z-50 bg-black/90 flex items-center justify-center hidden';
        overlay.innerHTML = `
            <div class="flex flex-col items-center animate-bounce">
                <div id="player-countdown-text" class="text-[80px] md:text-[120px] font-['Press_Start_2P'] text-[#00ff88] drop-shadow-[0_0_30px_rgba(0,255,136,0.6)]">
                    10
                </div>
                <div class="text-white/50 font-['Press_Start_2P'] text-xs md:text-sm mt-4 tracking-widest uppercase">
                    Get Ready!
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        this.countdownOverlay = overlay;
        this.countdownText = document.getElementById('player-countdown-text');
    }

    setupPlayerUI() {
        if (!this.waitingUI) return;

        // Inject Styles (Standard Theme)
        const styleId = 'player-waiting-room-styles';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.innerHTML = `
                .player-content-box {
                    background: #1a1a20;
                    border: 4px solid #000;
                    box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
                    border-radius: 20px;
                    width: 95%;
                    max-width: 1100px;
                    height: 480px; /* Reduced height */
                    position: relative;
                    padding: 25px;
                    display: flex;
                    flex-direction: column;
                    margin-top: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(0,0,0,0.2);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #00ff88;
                    border-radius: 10px;
                    border: 2px solid #1a1a20;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #00cc6e;
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
                    font-size: 11px;
                    font-weight: bold;
                    border: none;
                    border-bottom: 4px solid #b91c1c; /* red-700 */
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                    transition: all 0.1s;
                }
                .btn-exit-standard:hover {
                    filter: brightness(1.1);
                }
                .btn-exit-standard:active {
                    border-bottom-width: 0;
                    transform: translateY(4px);
                }
                .player-count-box {
                    background: rgba(0, 0, 0, 0.4);
                    border: 2px solid #00ff88;
                    border-radius: 10px;
                    padding: 8px 15px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    box-shadow: 0 0 10px rgba(0, 255, 136, 0.1);
                }
                .player-count-value {
                    color: #00ff88;
                    font-family: 'Press Start 2P';
                    font-size: 14px;
                }
                .neon-title-standard {
                    font-family: 'Press Start 2P';
                    font-size: 38px;
                    color: #00ff88;
                    text-shadow: 0 0 15px rgba(0, 255, 136, 0.4), 3px 3px 0px #000;
                    text-transform: uppercase;
                    letter-spacing: 4px;
                }
                .player-card-standard {
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    border-radius: 16px;
                    padding: 12px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 10px;
                    position: relative;
                    transition: all 0.2s ease;
                }
                .player-card-active {
                    border: 2px solid #00ff88 !important;
                    background: rgba(0, 255, 136, 0.02);
                }
                .pill-you {
                    background: #00ff88;
                    color: black;
                    font-family: 'Press Start 2P';
                    font-size: 8px;
                    padding: 5px 20px;
                    border-radius: 100px;
                    font-weight: bold;
                    white-space: nowrap;
                    text-transform: uppercase;
                }
                .standard-pixel-btn {
                    height: 52px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 4px solid #000;
                    cursor: pointer;
                    font-family: 'Press Start 2P';
                    text-transform: uppercase;
                    transition: transform 0.1s;
                }
                .standard-pixel-btn:active {
                    transform: scale(0.96);
                }
                .btn-choose-char-green {
                    padding: 0 40px;
                    background: #00ff88;
                    border-radius: 12px;
                    color: black;
                    font-size: 11px;
                    font-weight: bold;
                    box-shadow: inset -4px -4px 0px rgba(0,0,0,0.2);
                }
                .btn-choose-char-green:active {
                    box-shadow: none;
                }
                @keyframes play-idle {
                    from { background-position: 0 0; }
                    to { background-position: -864px 0; }
                }
            `;
            document.head.appendChild(style);
        }

        this.waitingUI.innerHTML = `
            <div class="fixed inset-0 pointer-events-none pixel-bg-pattern opacity-10"></div>
            
            <!-- LOGO TOP RIGHT -->
            <img src="/logo/gameforsmart.webp" class="absolute top-6 right-8 w-48 z-20 object-contain drop-shadow-[0_0_15px_rgba(0,255,136,0.3)]" />

            <div class="relative z-10 flex flex-col items-center justify-center w-full h-screen p-4 overflow-hidden">
                <!-- Header (Logo Space + Title) -->
                <div class="mb-2 flex flex-col items-center">
                    <div class="mb-[-10px] z-20">
                        <img src="/logo/Zigma-logo.webp" class="w-64 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
                    </div>
                    <h1 class="neon-title-standard">Ruang Tunggu</h1>
                </div>

                <!-- Main Content Box (Host Style Container) -->
                <div class="player-content-box">
                    <!-- Standard Header Section (Inside Box) -->
                    <div class="player-header-section">
                        <div class="player-count-box">
                            <span class="material-symbols-outlined text-[#00ff88] text-xl">person</span>
                            <span id="player-count-value" class="player-count-value">1</span>
                        </div>
                    </div>

                    <!-- Player Grid -->
                    <div id="player-grid" class="flex-1 overflow-y-auto custom-scrollbar px-2">
                        <!-- Player items injected here -->
                    </div>
                </div>

                <div class="flex items-center gap-4 mt-8">
                    <!-- EXIT Button (Red Host Style) -->
                    <button id="player-back-btn" class="standard-pixel-btn btn-exit-standard">
                        EXIT
                    </button>

                    <!-- Pill Choose Character (Host Start Button Style) -->
                    <button id="player-choose-char-btn" class="standard-pixel-btn btn-choose-char-green">
                        Choose Character
                    </button>
                </div>
            </div>
        `;
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

    leaveRoom() {
        if (this.room) {
            this.room.leave();
        }
        if (this.waitingUI) this.waitingUI.classList.add('hidden');

        // Remove overlay
        if (this.countdownOverlay) {
            this.countdownOverlay.remove();
            this.countdownOverlay = null;
        }

        const lobbyUI = document.getElementById('lobby-ui');
        if (lobbyUI) lobbyUI.classList.remove('hidden');
        Router.navigate('/');
        this.scene.start('LobbyScene');
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
        if (!this.playerGridEl) return;

        const players: any[] = [];
        this.room.state.players.forEach((p: any, sessionId: string) => {
            if (!p.isHost) {
                players.push({ ...p, sessionId });
            }
        });

        this.updateUILayout();

        let html = '';

        players.forEach((player) => {
            const isMe = player.sessionId === this.mySessionId;
            const cardClass = isMe ? 'player-card-standard player-card-active' : 'player-card-standard';
            const youPill = isMe ? '<div class="absolute -bottom-3 left-1/2 -translate-x-1/2 pill-you">YOU</div>' : '';

            html += `
                <div class="${cardClass}" style="
                    aspect-ratio: 1 / 1.1;
                    width: 100%;
                    max-width: 148px;
                    margin: 0 auto;
                ">
                    <!-- Character (Middle) -->
                    <div style="width: 76px; height: 76px; background: radial-gradient(circle, rgba(0,212,255,0.05) 0%, rgba(255,255,255,0) 70%); border-radius: 16px; display: flex; align-items: center; justify-content: center; overflow: hidden; border: 1px solid rgba(255,255,255,0.03);">
                         <div style="
                            position: relative;
                            width: 32px; height: 32px; 
                            transform: scale(2.0);
                         ">
                            <div style="
                                position: absolute; inset: 0;
                                background-image: url('/assets/base_idle_strip9.png');
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
                    <div style="text-align: center; width: 100%;">
                        <span style="font-size: 9px; color: ${isMe ? '#00ff88' : 'white'}; font-family: 'Press Start 2P', cursive; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block;">
                            ${player.name || 'PLAYER'}
                        </span>
                    </div>

                    ${youPill}
                </div>
            `;
        });

        this.playerGridEl.innerHTML = html;
        this.playerGridEl.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(148px, 1fr));
            gap: 12px;
            padding: 10px;
            width: 100%;
            justify-content: center;
        `;

        // Expose name update globally
        (window as any).updatePlayerName = (name: string) => {
            this.room.send('updateName', { name });
        };
    }

}
