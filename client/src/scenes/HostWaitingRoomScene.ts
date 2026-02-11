import Phaser from 'phaser';
import { Room } from 'colyseus.js';
import { Router } from '../utils/Router';
import { TransitionManager } from '../utils/TransitionManager';
import { CharacterSelectPopup } from '../ui/CharacterSelectPopup';
import { QRCodePopup } from '../ui/QRCodePopup';
import { HAIR_OPTIONS, getHairById } from '../data/characterData';

export class HostWaitingRoomScene extends Phaser.Scene {
    room!: Room;
    isHost: boolean = false;
    mySessionId: string = '';

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

        // Grab DOM elements
        this.waitingUI = document.getElementById('waiting-ui');
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

        // Hide lobby, show waiting room
        const lobbyUI = document.getElementById('lobby-ui');
        if (lobbyUI) lobbyUI.classList.add('hidden');
        if (this.waitingUI) this.waitingUI.classList.remove('hidden');

        // Display Room Code
        this.updateRoomCode();

        // Setup Host UI
        this.updateHostStatus();

        // --- Event Listeners ---

        // Back Button
        if (this.backBtn) {
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
                    });
                }
            };
        }

        // Name Input Sync
        if (this.nameInput) {
            // Set initial value from player state if available
            const myPlayer = this.room.state.players.get(this.mySessionId);
            if (myPlayer) {
                this.nameInput.value = myPlayer.name || 'Player';
            }

            // Send updates when user types
            this.nameInput.addEventListener('input', () => {
                this.room.send('updateName', { name: this.nameInput!.value });
            });
        }

        // --- Room State Listeners ---

        // Room Code
        this.room.state.listen("roomCode", (code: string) => {
            if (this.roomCodeEl) this.roomCodeEl.innerText = code;
            this.updateQrCode(code);
        });

        // Host ID
        this.room.state.listen("hostId", (hostId: string) => {
            if (hostId !== this.mySessionId) {
                this.scene.start('PlayerWaitingRoomScene', { room: this.room, isHost: false });
            }
            this.updateHostStatus();
        });

        // Sub Rooms Listener
        this.room.state.subRooms.onAdd((subRoom: any) => {
            this.updateRoomList();
            subRoom.playerIds.onAdd(() => this.updateAll());
            subRoom.playerIds.onRemove(() => this.updateAll());
        });

        // Player Add/Remove/Change
        this.room.state.players.onAdd((player: any, key: string) => {
            this.updateAll();
            // Listen for changes
            player.listen("name", () => this.updateAll());
            player.listen("hairId", () => this.updateAll());
            player.listen("subRoomId", () => this.updateAll());
        });

        this.room.state.players.onRemove(() => this.updateAll());

        // Game Start
        this.room.onMessage("gameStarted", () => {
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
        });

        // Initial render
        this.updateAll();

        // --- Character Customization ---
        const charPreviewBox = document.getElementById('character-preview-box');

        // Find the specific container for character selection
        const charSelectContainer = charPreviewBox?.parentElement?.parentElement; // section -> container

        if (charSelectContainer) {
            // Initialize Popup
            this.characterPopup = new CharacterSelectPopup(
                HAIR_OPTIONS,
                (hairId) => {
                    // On Confirm
                    this.room.send("updateHair", { hairId });
                },
                () => {
                    // On Close
                }
            );

            // Bind Click (Entire container or specific button)
            const spans = Array.from(charSelectContainer.querySelectorAll('.material-symbols-outlined'));
            const leftSpan = spans.find(el => el.textContent?.includes('chevron_left'));
            const rightSpan = spans.find(el => el.textContent?.includes('chevron_right'));

            const leftBtn = leftSpan?.closest('button');
            const rightBtn = rightSpan?.closest('button');

            if (charPreviewBox) {
                charPreviewBox.onclick = () => {
                    // Host cannot change character
                    if (this.isHost) return;

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

        // --- QR Code Popup ---
        if (!this.qrPopup) {
            this.qrPopup = new QRCodePopup(() => { });

            const qrImg = document.getElementById('room-qr-code');
            const qrContainer = qrImg?.parentElement;

            if (qrContainer) {
                qrContainer.onclick = () => {
                    // Wait for main loop or just ensure image is set
                    const img = document.getElementById('room-qr-code') as HTMLImageElement;
                    if (img && img.src) {
                        this.qrPopup?.show(img.src);
                    }
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

    leaveRoom() {
        if (this.room) {
            this.room.leave();
        }
        if (this.waitingUI) this.waitingUI.classList.add('hidden');
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

    updateHostStatus() {
        const isCurrentHost = this.room.state.hostId === this.mySessionId;
        const totalPlayers = this.room.state.players.size;
        const labelText = totalPlayers <= 1 ? 'PLAYER' : 'PLAYERS';

        const headerText = document.getElementById('waiting-header-text');
        if (headerText) {
            headerText.innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px; font-family: 'Press Start 2P'; font-size: 20px;">
                    <span style="color: #00ff88;">${totalPlayers}</span>
                    <span style="color: white; opacity: 0.9;">${labelText}</span>
                </div>
            `;
        }

        // Hide Player Count Header for host
        const headerCount = document.getElementById('player-count');
        if (headerCount) {
            headerCount.style.display = isCurrentHost ? 'none' : 'block';
        }

        // Hide Name Input for host
        const nameSection = document.getElementById('player-name-section');
        if (nameSection) {
            nameSection.style.display = isCurrentHost ? 'none' : 'block';
        }

        // Hide labels for host
        const roomCodeLabel = document.getElementById('room-code-label');
        if (roomCodeLabel) roomCodeLabel.style.display = isCurrentHost ? 'none' : 'block';

        const scanLabel = document.getElementById('scan-to-join-label');
        if (scanLabel) scanLabel.style.display = isCurrentHost ? 'none' : 'block';

        if (isCurrentHost) {
            // Move Start Button to left for host
            const leftContainer = document.getElementById('host-start-btn-container');
            if (leftContainer && this.startBtn) {
                this.startBtn.classList.remove('hidden'); // Fix: Ensure it's visible
                leftContainer.classList.remove('hidden');
                leftContainer.appendChild(this.startBtn);

                // Style adjustment for left column (Compact & Tight Style)
                this.startBtn.classList.remove('py-8', 'text-2xl', 'shadow-[0_10px_0_#000]', 'pixel-btn-green', 'mb-2', 'w-full', 'py-4', 'px-8', 'py-2');
                this.startBtn.classList.add('py-0', 'px-6', 'text-[10px]', 'shadow-none', 'bg-primary', 'hover:bg-white', 'text-black', 'rounded-xl', 'mx-auto', 'block', 'transition-all', 'font-bold');
                this.startBtn.innerText = 'START';

                this.startBtn.onclick = () => {
                    this.room.send("startGame");
                };
            }
            if (this.waitingMsg) this.waitingMsg.classList.add('hidden');
        } else {
            // Restore Start Button to bottom for player (if they somehow become non-host)
            const mainContent = document.getElementById('waiting-ui');
            if (mainContent && this.startBtn && this.startBtn.parentElement?.id === 'host-start-btn-container') {
                mainContent.appendChild(this.startBtn);
                this.startBtn.classList.add('py-8', 'text-2xl');
                this.startBtn.classList.remove('py-4', 'text-sm');
            }
            if (this.startBtn) this.startBtn.classList.add('hidden');
            if (this.waitingMsg) this.waitingMsg.classList.remove('hidden');
        }

        const charSection = document.getElementById('character-selection-section');
        if (charSection) {
            charSection.style.display = isCurrentHost ? 'none' : 'flex';
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

        // Unified View: Host and Players see ALL players
        const players: any[] = [];
        this.room.state.players.forEach((p: any, sessionId: string) => {
            players.push({ ...p, sessionId });
        });

        // Update Header dynamically (also update count if needed)
        this.updateHostStatus();

        let html = '';

        // Render player cards (Style matched to HostProgress v6)
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
                    <!-- Character (Middle) - Matched v6 Centering -->
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

        // Render empty slots up to 20 if needed (optional, but requested simple/clean)
        // User didn't explicitly ask for empty slots in new style, so we just show active players.

        this.playerGridEl.innerHTML = html;
        this.playerGridEl.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
            gap: 15px;
            padding: 10px;
            width: 100%;
        `;
    }

}
