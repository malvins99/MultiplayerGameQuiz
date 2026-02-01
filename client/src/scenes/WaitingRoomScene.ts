import Phaser from 'phaser';
import { Room } from 'colyseus.js';
import { Router } from '../utils/Router';

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

        // Hide lobby, show waiting room
        const lobbyUI = document.getElementById('lobby-ui');
        if (lobbyUI) lobbyUI.classList.add('hidden');
        if (this.waitingUI) this.waitingUI.classList.remove('hidden');

        // Display Room Code
        this.updateRoomCode();

        // Setup Host UI
        this.updateHostStatus();

        // --- Name Input Sync ---
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

        // --- Listeners ---

        // Room Code
        this.room.state.listen("roomCode", (code: string) => {
            if (this.roomCodeEl) this.roomCodeEl.innerText = code;
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
            if (this.waitingUI) this.waitingUI.classList.add('hidden');
            Router.navigate('/game');
            this.scene.start('GameScene', { room: this.room });
        });

        // Initial render
        this.updateAll();
    }

    updateAll() {
        this.updateRoomList();
        this.updatePlayerGrid();
    }

    updateRoomCode() {
        if (!this.roomCodeEl) return;
        const code = this.room.state.roomCode;
        this.roomCodeEl.innerText = code || '------';
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

            const borderClass = isMyRoom ? 'border-primary bg-primary/20' : 'border-white/10 bg-black/40 hover:border-white/30';
            const textClass = isMyRoom ? 'text-primary' : 'text-white';
            const btnClass = isFull
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : isMyRoom
                    ? 'bg-primary text-black font-bold'
                    : 'bg-secondary text-black font-bold hover:brightness-110';

            const btnText = isMyRoom ? 'JOINED' : isFull ? 'FULL' : 'JOIN';
            const action = (isFull || isMyRoom) ? '' : `onclick="window.switchRoom('${subRoom.id}')"`;

            // Get player names in this room
            let playerNames = '';
            subRoom.playerIds.forEach((sessionId: string) => {
                const player = this.room.state.players.get(sessionId);
                if (player) {
                    const isMe = sessionId === this.mySessionId;
                    playerNames += `<span class="text-[8px] ${isMe ? 'text-primary' : 'text-white/60'} uppercase">${player.name}</span>`;
                }
            });
            if (!playerNames) playerNames = '<span class="text-[8px] text-white/30 italic">Empty</span>';

            html += `
                <div class="border-2 ${borderClass} p-2 transition-colors">
                    <div class="flex justify-between items-center mb-1">
                        <span class="text-[10px] font-bold uppercase ${textClass}">${subRoom.id}</span>
                        <button ${action} class="px-2 py-0.5 text-[8px] uppercase rounded-sm ${btnClass}">
                            ${btnText}
                        </button>
                    </div>
                    <div class="text-[9px] text-white/40 uppercase mb-1">${playerCount}/${subRoom.capacity} Players</div>
                    <div class="flex flex-col gap-0.5">${playerNames}</div>
                </div>
            `;
        });

        this.roomListEl.innerHTML = html;

        // Expose switch function globally for onclick (simpler than event delegation for now)
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

        // Render player cards
        playersInRoom.forEach((player) => {
            const isMe = player.sessionId === this.mySessionId;
            const isHost = player.sessionId === this.room.state.hostId;

            html += `
                <div class="bg-black/40 border-2 ${isMe ? 'border-primary' : 'border-white/10'} p-2 flex items-center gap-2">
                    <div class="w-2 h-2 ${isHost ? 'bg-accent' : 'bg-primary'}"></div>
                    <span class="text-xs font-bold uppercase truncate ${isMe ? 'text-primary' : 'text-white'}">${player.name || 'Unknown'}</span>
                    ${isHost ? '<span class="text-[8px] text-accent">(H)</span>' : ''}
                </div>
            `;
        });

        // Render empty slots
        for (let i = playersInRoom.length; i < maxPlayers; i++) {
            html += `
                <div class="bg-black/20 border-2 border-white/5 p-2 flex items-center gap-2 opacity-30">
                    <div class="w-2 h-2 bg-white/20"></div>
                    <span class="text-[9px] uppercase italic text-white/30">Empty</span>
                </div>
            `;
        }

        this.playerGridEl.innerHTML = html;
    }
}
