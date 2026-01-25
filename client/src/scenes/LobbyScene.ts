import Phaser from 'phaser';
import { Client } from 'colyseus.js';

export class LobbyScene extends Phaser.Scene {
    client!: Client;

    constructor() {
        super('LobbyScene');
    }

    create() {
        // --- PROD VS DEV URL ---
        const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const host = window.location.hostname === 'localhost'
            ? 'ws://localhost:2567'
            : `${protocol}://${window.location.host}`; // On Railway, Client & Server are same domain

        this.client = new Client(host);

        // --- WIRE UP HTML OVERLAY ---
        const lobbyUI = document.getElementById('lobby-ui');
        const createBtn = document.getElementById('create-room-btn');
        const joinBtn = document.getElementById('join-room-btn');
        const diffSelect = document.getElementById('difficulty-select') as HTMLSelectElement;
        const subjSelect = document.getElementById('subject-select') as HTMLSelectElement;
        const codeInput = document.getElementById('room-code-input') as HTMLInputElement;

        // Ensure visible initially
        if (lobbyUI) lobbyUI.classList.remove('hidden');

        // Create Room Listener
        const onCreate = async () => {
            const difficulty = diffSelect ? diffSelect.value : 'mudah';
            const subject = subjSelect ? subjSelect.value : 'matematika';

            try {
                const room = await this.client.joinOrCreate("game_room", { difficulty, subject });
                console.log("Joined successfully", room);

                // HIDE LOBBY
                if (lobbyUI) lobbyUI.classList.add('hidden');

                this.scene.start('WaitingRoomScene', { room, isHost: true });

                // Cleanup listeners to prevent duplicates if scene restarts (simple way)
                createBtn?.removeEventListener('click', onCreate);
                joinBtn?.removeEventListener('click', onJoin);
            } catch (e) {
                console.error("Create room error", e);
                alert("Error creating room. Check console.");
            }
        };

        // Join Room Listener
        const onJoin = async () => {
            const code = codeInput ? codeInput.value : "";
            // TODO: Implement join by code logic properly
            try {
                // For now joining any room
                const room = await this.client.join("game_room");
                console.log("Joined successfully", room);

                // HIDE LOBBY
                if (lobbyUI) lobbyUI.classList.add('hidden');

                this.scene.start('WaitingRoomScene', { room, isHost: false });

                createBtn?.removeEventListener('click', onCreate);
                joinBtn?.removeEventListener('click', onJoin);
            } catch (e) {
                console.error("Join room error", e);
                alert("Error joining room. Check console.");
            }
        };

        // Attach - using onclick directly to be simple and override previous if any
        if (createBtn) createBtn.onclick = onCreate;
        if (joinBtn) joinBtn.onclick = onJoin;
    }
}
