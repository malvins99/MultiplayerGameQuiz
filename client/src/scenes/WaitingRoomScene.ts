import Phaser from 'phaser';
import { Room } from 'colyseus.js';

export class WaitingRoomScene extends Phaser.Scene {
    room!: Room;
    isHost: boolean = false;

    // UI Elements
    waitingUI!: HTMLElement | null;
    roomCodeEl!: HTMLElement | null;
    playerListEl!: HTMLElement | null;
    startBtn!: HTMLElement | null;
    waitingMsg!: HTMLElement | null;

    constructor() {
        super('WaitingRoomScene');
    }

    init(data: { room: Room, isHost: boolean }) {
        this.room = data.room;
        this.isHost = data.isHost;
    }

    create() {
        // Grab DOM elements
        this.waitingUI = document.getElementById('waiting-ui');
        this.roomCodeEl = document.getElementById('display-room-code');
        this.playerListEl = document.getElementById('player-list');
        this.startBtn = document.getElementById('start-game-btn');
        this.waitingMsg = document.getElementById('waiting-msg');

        // Show UI
        if (this.waitingUI) this.waitingUI.classList.remove('hidden');

        // Display Room Code (from state if available, else fallback)
        this.updateRoomCode();

        // Setup Host UI
        if (this.isHost) {
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

        // Listeners for Room Code (it might take a moment to sync)
        this.room.state.listen("roomCode", (code: string) => {
            if (this.roomCodeEl) this.roomCodeEl.innerText = code;
        });

        // Player Updates
        this.room.state.players.onAdd(() => this.updatePlayerList());
        this.room.state.players.onRemove(() => this.updatePlayerList());

        // Game Start Listener
        this.room.onMessage("gameStarted", () => {
            if (this.waitingUI) this.waitingUI.classList.add('hidden');
            this.scene.start('GameScene', { room: this.room });
        });

        // Initial render
        this.updatePlayerList();
    }

    updateRoomCode() {
        if (!this.roomCodeEl) return;
        // Check if state is available
        const code = this.room.state.roomCode;
        if (code) {
            this.roomCodeEl.innerText = code;
        } else {
            // Fallback or wait for sync
            this.roomCodeEl.innerText = "Loading...";
        }
    }

    updatePlayerList() {
        if (!this.playerListEl) return;

        let html = '';
        this.room.state.players.forEach((player: any) => {
            html += `<li class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-primary text-sm">face</span>
                        <span>${player.name || "Unknown Player"}</span>
                     </li>`;
        });
        this.playerListEl.innerHTML = html;
    }
}
