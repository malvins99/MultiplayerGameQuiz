import Phaser from 'phaser';
import { Room } from 'colyseus.js';
import { Router } from '../utils/Router';
import { TransitionManager } from '../utils/TransitionManager';

export class WaitingRoomScene extends Phaser.Scene {
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

    constructor() {
        super('WaitingRoomScene');
    }

    init(data: { room: Room, isHost: boolean }) {
        this.room = data.room;
        this.isHost = data.isHost;
        this.mySessionId = this.room.sessionId;
    }

    create() {
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
        this.room.state.listen("hostId", () => {
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
            player.listen("subRoomId", () => this.updateAll());
        });

        this.room.state.players.onRemove(() => this.updateAll());

        // Game Start
        this.room.onMessage("gameStarted", () => {
            TransitionManager.close(() => {
                if (this.waitingUI) this.waitingUI.classList.add('hidden');
                Router.navigate('/game');
                this.scene.start('GameScene', { room: this.room });
            });
        });

        // Initial render
        this.updateAll();
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
        this.updateRoomList();
        this.updatePlayerGrid();
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
            // Create a full join URL
            const url = `${window.location.origin}?room=${code}`;
            // Encode it
            this.roomQrCode.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(url)}`;
        }
    }

    updateHostStatus() {
        const isCurrentHost = this.room.state.hostId === this.mySessionId;

        if (this.hostIndicatorEl) {
            this.hostIndicatorEl.innerText = isCurrentHost ? 'You are: HOST' : 'You are: Guest';
        }

        if (isCurrentHost) {
            if (this.startBtn) {
                this.startBtn.classList.remove('hidden');
                this.startBtn.onclick = () => {
                    this.room.send("startGame");
                };
            }
            if (this.waitingMsg) this.waitingMsg.classList.add('hidden');
        } else {
            if (this.startBtn) this.startBtn.classList.add('hidden');
            if (this.waitingMsg) this.waitingMsg.classList.remove('hidden');
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
            const action = (isFull || isMyRoom) ? '' : `onclick="window.switchRoom('${subRoom.id}')"`;

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

                    <button ${action} class="w-full py-3 text-xs uppercase rounded-lg border-b-4 active:border-b-0 active:translate-y-1 transition-all ${btnClass} font-['Press_Start_2P'] tracking-wide">
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

        const myPlayer = this.room.state.players.get(this.mySessionId);
        const mySubRoomId = myPlayer ? myPlayer.subRoomId : "";

        // Find current room object to know capacity
        const currentSubRoom = this.room.state.subRooms.find((r: any) => r.id === mySubRoomId);
        const maxPlayers = currentSubRoom ? currentSubRoom.capacity : 4;

        // Filter players in MY subroom
        const playersInRoom: any[] = [];
        this.room.state.players.forEach((p: any, sessionId: string) => {
            if (p.subRoomId === mySubRoomId) {
                playersInRoom.push({ ...p, sessionId });
            }
        });

        // Update count
        if (this.playerCountEl) {
            this.playerCountEl.innerText = `(${playersInRoom.length}/${maxPlayers})`;
        }

        let html = '';

        // Render player cards (Horizontal Compact Style)
        playersInRoom.forEach((player) => {
            const isMe = player.sessionId === this.mySessionId;
            const isHost = player.sessionId === this.room.state.hostId;

            // Neon border for self
            const borderClass = isMe ? 'border-primary shadow-[0_0_10px_rgba(0,255,85,0.2)]' : 'border-white/10';
            const bgClass = isMe ? 'bg-black/60' : 'bg-black/40';

            html += `
                <div class="${bgClass} border-2 ${borderClass} p-3 rounded-xl flex items-center gap-3 transition-colors">
                    <div class="w-3 h-3 rounded-full ${isHost ? 'bg-accent shadow-[0_0_10px_#cc00ff]' : 'bg-primary shadow-[0_0_10px_#00ff55]'}"></div>
                    <div class="flex flex-col overflow-hidden">
                        <span class="text-xs font-bold uppercase truncate font-['Space_Grotesk'] tracking-wide ${isMe ? 'text-primary' : 'text-white'}">${player.name || 'Unknown'}</span>
                        ${isHost ? '<span class="text-[8px] text-accent font-bold tracking-widest">HOST</span>' : ''}
                    </div>
                </div>
            `;
        });

        // Render empty slots (Horizontal Compact Style)
        for (let i = playersInRoom.length; i < maxPlayers; i++) {
            html += `
                <div class="bg-black/20 border-2 border-dashed border-white/5 p-3 rounded-xl flex items-center gap-3 opacity-50">
                    <div class="w-3 h-3 bg-white/10 rounded-full"></div>
                    <span class="text-[10px] uppercase italic text-white/20 font-bold">Empty Slot</span>
                </div>
            `;
        }

        this.playerGridEl.innerHTML = html;
    }
}
