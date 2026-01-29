import Phaser from 'phaser';
import { Client, Room } from 'colyseus.js';

export class LobbyScene extends Phaser.Scene {
    client!: Client;
    selectedDifficulty: string = 'mudah';

    // UI Elements
    lobbyUI: HTMLElement | null = null;
    createRoomUI: HTMLElement | null = null;

    constructor() {
        super('LobbyScene');
    }

    create() {
        // --- PROD VS DEV URL ---
        // Verify if VITE_SERVER_URL is set in environment (e.g. Vercel)
        const envServerUrl = import.meta.env.VITE_SERVER_URL;

        let host = envServerUrl;

        if (!host) {
            // Fallback for local development if env not set
            const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
            host = window.location.hostname === 'localhost'
                ? 'ws://localhost:2567'
                : `${protocol}://${window.location.host}`;
        }

        console.log("Connecting to Colyseus server:", host);
        this.client = new Client(host);

        // --- UI Elements ---
        this.lobbyUI = document.getElementById('lobby-ui');
        this.createRoomUI = document.getElementById('create-room-ui');
        const createRoomBtn = document.getElementById('create-room-btn');
        const joinBtn = document.getElementById('join-room-btn');
        const codeInput = document.getElementById('room-code-input') as HTMLInputElement;
        const backBtn = document.getElementById('back-to-lobby-btn');
        const confirmCreateBtn = document.getElementById('confirm-create-room-btn');
        const subjSelect = document.getElementById('subject-select') as HTMLSelectElement;
        const difficultyBtns = document.querySelectorAll('.difficulty-btn');

        // Ensure lobby is visible initially
        this.showLobby();

        // --- "Create Room" Button → Go to Create Room Page ---
        if (createRoomBtn) {
            createRoomBtn.onclick = () => {
                window.location.hash = '/create';
            };
        }

        // --- Back Button → Return to Lobby ---
        if (backBtn) {
            backBtn.onclick = () => {
                window.location.hash = '/';
            };
        }

        // --- Difficulty Buttons ---
        difficultyBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active from all
                difficultyBtns.forEach(b => b.classList.remove('border-primary', 'border-secondary', 'border-accent'));
                difficultyBtns.forEach(b => b.classList.add('border-white/10'));

                // Add active to clicked
                const diff = (btn as HTMLElement).dataset.difficulty || 'mudah';
                this.selectedDifficulty = diff;

                const colorClass = diff === 'mudah' ? 'border-primary' : diff === 'sedang' ? 'border-secondary' : 'border-accent';
                btn.classList.remove('border-white/10');
                btn.classList.add(colorClass);
            });
        });

        // Select first difficulty by default
        if (difficultyBtns.length > 0) {
            (difficultyBtns[0] as HTMLElement).click();
        }

        // --- Handle URL Hash Change ---
        window.addEventListener('hashchange', () => this.handleRouting());

        // Initial route check
        if (!window.location.hash) window.location.hash = '/';
        this.handleRouting();

        // --- "Buat Room" Button → Create Room and Navigate ---
        if (confirmCreateBtn) {
            confirmCreateBtn.onclick = async () => {
                const difficulty = this.selectedDifficulty;
                const subject = subjSelect ? subjSelect.value : 'matematika';

                try {
                    const room = await this.client.joinOrCreate("game_room", { difficulty, subject });
                    console.log("Room created!", room);

                    // Hide create room UI
                    if (this.createRoomUI) this.createRoomUI.classList.add('hidden');

                    // Navigate to Waiting Room
                    window.location.hash = '/waiting';
                    this.scene.start('WaitingRoomScene', { room, isHost: true });
                } catch (e) {
                    console.error("Create room error", e);
                    alert("Error creating room. Check console.");
                }
            };
        }

        // --- Join Button ---
        if (joinBtn) {
            joinBtn.onclick = async () => {
                const code = codeInput ? codeInput.value.trim() : "";

                if (!code || code.length !== 6) {
                    alert("Please enter a valid 6-digit room code.");
                    return;
                }

                try {
                    // Join room by room code
                    // Note: Colyseus doesn't support join-by-custom-code natively out of box
                    // We'd need server-side filter or matchmaking. For now, joining any available room.
                    const rooms = await this.client.getAvailableRooms("game_room");
                    const targetRoom = rooms.find((r: any) => r.metadata?.roomCode === code);

                    let room: Room;
                    if (targetRoom) {
                        room = await this.client.joinById(targetRoom.roomId);
                    } else {
                        // Fallback: just join any room for now
                        room = await this.client.join("game_room");
                    }

                    console.log("Joined room!", room);

                    // Hide lobby
                    if (this.lobbyUI) this.lobbyUI.classList.add('hidden');

                    // Navigate to Waiting Room
                    this.scene.start('WaitingRoomScene', { room, isHost: false });
                } catch (e) {
                    console.error("Join room error", e);
                    alert("Error joining room. Check console.");
                }
            };
        }
    }

    handleRouting() {
        const hash = window.location.hash;

        if (hash === '#/' || hash === '') {
            this.showLobby();
        } else if (hash === '#/create') {
            this.showCreateRoom();
        }
    }

    showLobby() {
        if (this.lobbyUI) this.lobbyUI.classList.remove('hidden');
        if (this.createRoomUI) this.createRoomUI.classList.add('hidden');
    }

    showCreateRoom() {
        if (this.lobbyUI) this.lobbyUI.classList.add('hidden');
        if (this.createRoomUI) this.createRoomUI.classList.remove('hidden');
    }
}
