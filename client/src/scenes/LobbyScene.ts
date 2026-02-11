import Phaser from 'phaser';
import { Client, Room } from 'colyseus.js';
import { Router } from '../utils/Router';
import { TransitionManager } from '../utils/TransitionManager';
import { authService } from '../services/AuthService';

export class LobbyScene extends Phaser.Scene {
    client!: Client;

    // UI Elements
    lobbyUI: HTMLElement | null = null;

    constructor() {
        super('LobbyScene');
    }

    create() {
        this.initializeClient();
        this.initializeUI();
        this.setupEventListeners();

        // Check routing on load
        window.addEventListener('popstate', () => this.handleRouting());
        this.handleRouting();

        // Check for Room Code in URL (Auto-Join from QR)
        const urlParams = new URLSearchParams(window.location.search);
        const roomCode = urlParams.get('room');
        if (roomCode) {
            console.log("Auto-joining room from URL:", roomCode);
            this.handleJoinRoom(roomCode);
            // Clean URL
            const url = new URL(window.location.href);
            url.searchParams.delete('room');
            window.history.replaceState({}, '', url);
        }
    }

    initializeClient() {
        const envServerUrl = import.meta.env.VITE_SERVER_URL;
        let host = envServerUrl;

        if (!host) {
            const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
            host = window.location.hostname === 'localhost'
                ? 'ws://localhost:2567'
                : `${protocol}://${window.location.host}`;
        }

        console.log("Connecting to Colyseus server:", host);
        this.client = new Client(host);
    }

    initializeUI() {
        this.lobbyUI = document.getElementById('lobby-ui');

        // --- Populate User Profile Widget ---
        this.populateUserProfile();
    }

    populateUserProfile() {
        const profile = authService.getStoredProfile();
        const nameEl = document.getElementById('lobby-user-name');
        const avatarEl = document.getElementById('lobby-user-avatar') as HTMLImageElement;
        const avatarFallback = document.getElementById('lobby-user-avatar-fallback');

        if (profile) {
            // Set username
            if (nameEl) {
                nameEl.innerText = profile.nickname || profile.fullname || profile.username || profile.email || 'Guest';
            }

            // Set avatar
            if (avatarEl && profile.avatar_url) {
                avatarEl.src = profile.avatar_url;
                avatarEl.classList.remove('hidden');
                if (avatarFallback) avatarFallback.classList.add('hidden');

                avatarEl.onerror = () => {
                    avatarEl.classList.add('hidden');
                    if (avatarFallback) avatarFallback.classList.remove('hidden');
                };
            }
        }
    }

    setupEventListeners() {
        // --- LOBBY MENU ---
        const lobbyMenuBtn = document.getElementById('lobby-menu-btn');
        const lobbyMenuDropdown = document.getElementById('lobby-menu-dropdown');
        const lobbyLogoutBtn = document.getElementById('lobby-menu-logout-btn');

        if (lobbyMenuBtn && lobbyMenuDropdown) {
            lobbyMenuBtn.onclick = (e) => {
                e.stopPropagation();
                const isHidden = lobbyMenuDropdown.classList.contains('hidden');
                if (isHidden) {
                    lobbyMenuDropdown.classList.remove('hidden');
                    requestAnimationFrame(() => {
                        lobbyMenuDropdown.classList.remove('scale-95', 'opacity-0');
                        lobbyMenuDropdown.classList.add('scale-100', 'opacity-100');
                    });
                } else {
                    lobbyMenuDropdown.classList.remove('scale-100', 'opacity-100');
                    lobbyMenuDropdown.classList.add('scale-95', 'opacity-0');
                    setTimeout(() => lobbyMenuDropdown.classList.add('hidden'), 200);
                }
            };

            // Close menu on outside click
            document.addEventListener('click', (e) => {
                if (!lobbyMenuDropdown.classList.contains('hidden')) {
                    if (!lobbyMenuDropdown.contains(e.target as Node) && !lobbyMenuBtn.contains(e.target as Node)) {
                        lobbyMenuDropdown.classList.remove('scale-100', 'opacity-100');
                        lobbyMenuDropdown.classList.add('scale-95', 'opacity-0');
                        setTimeout(() => lobbyMenuDropdown.classList.add('hidden'), 200);
                    }
                }
            });
        }

        // --- LOGOUT CONFIRMATION MODAL ---
        const logoutModal = document.getElementById('logout-modal');
        const logoutModalBackdrop = document.getElementById('logout-modal-backdrop');
        const logoutModalName = document.getElementById('logout-modal-name');
        const logoutCancelBtn = document.getElementById('logout-cancel-btn');
        const logoutConfirmBtn = document.getElementById('logout-confirm-btn');

        const showLogoutModal = () => {
            // Tutup dropdown menu dulu
            if (lobbyMenuDropdown) {
                lobbyMenuDropdown.classList.remove('scale-100', 'opacity-100');
                lobbyMenuDropdown.classList.add('scale-95', 'opacity-0');
                setTimeout(() => lobbyMenuDropdown.classList.add('hidden'), 200);
            }

            // Set nama user di modal
            const profile = authService.getStoredProfile();
            if (logoutModalName && profile) {
                logoutModalName.innerText = profile.nickname || profile.fullname || profile.username || profile.email || 'User';
            }

            // Tampilkan modal
            if (logoutModal) logoutModal.classList.remove('hidden');
        };

        const hideLogoutModal = () => {
            if (logoutModal) logoutModal.classList.add('hidden');
        };

        if (lobbyLogoutBtn) {
            lobbyLogoutBtn.onclick = () => showLogoutModal();
        }

        if (logoutCancelBtn) {
            logoutCancelBtn.onclick = () => hideLogoutModal();
        }

        if (logoutModalBackdrop) {
            logoutModalBackdrop.onclick = () => hideLogoutModal();
        }

        if (logoutConfirmBtn) {
            logoutConfirmBtn.onclick = async () => {
                hideLogoutModal();
                await authService.signOut();
                TransitionManager.transitionTo(() => {
                    this.toggleUI('');
                    Router.navigate('/login');
                    this.scene.start('LoginScene');
                });
            };
        }

        // --- LOBBY UI ---
        const createRoomBtn = document.getElementById('create-room-btn');
        const joinBtn = document.getElementById('join-room-btn');
        const codeInput = document.getElementById('room-code-input') as HTMLInputElement;

        if (createRoomBtn) {
            createRoomBtn.onclick = () => {
                TransitionManager.transitionTo(() => {
                    this.toggleUI('');
                    this.scene.start('SelectQuizScene', { client: this.client });
                });
            };
        }

        if (joinBtn) {
            joinBtn.onclick = () => {
                this.handleJoinRoom(codeInput?.value);
            };
        }
    }

    // --- NAVIGATION ---

    handleRouting() {
        const path = Router.getPath();

        if (path === '/' || path === '') {
            this.showLobby();
        } else {
            Router.replace('/');
            this.showLobby();
        }
    }

    showLobby() {
        this.toggleUI('lobby-ui');
    }

    toggleUI(id: string) {
        // Hide all known UIs
        const allUIs = ['lobby-ui', 'create-room-ui', 'quiz-selection-ui', 'quiz-settings-ui'];
        allUIs.forEach(uiId => {
            const el = document.getElementById(uiId);
            if (el) el.classList.add('hidden');
        });
        const target = document.getElementById(id);
        if (target) target.classList.remove('hidden');
    }

    // --- ACTIONS ---

    async handleJoinRoom(code: string | undefined) {
        const cleanCode = code ? code.trim() : "";
        if (!cleanCode || cleanCode.length !== 6) {
            alert("Please enter a valid 6-digit room code.");
            return;
        }

        try {
            const rooms = await this.client.getAvailableRooms("game_room");
            const targetRoom = rooms.find((r: any) => r.metadata?.roomCode === cleanCode);

            let room: Room;
            if (targetRoom) {
                room = await this.client.joinById(targetRoom.roomId);
            } else {
                room = await this.client.join("game_room");
            }

            this.lobbyUI?.classList.add('hidden');

            TransitionManager.transitionTo(() => {
                Router.navigate('/player/lobby');
                this.scene.start('PlayerWaitingRoomScene', { room, isHost: false });
            });

        } catch (e) {
            console.error("Join room error", e);
            alert("Error joining room.");
        }
    }

    async createRoom() {
        if (!this.selectedQuiz) return;

        // MAP CONFIGURATION
        let mapFile = 'map_baru1_tetap.tmj'; // Default Mudah
        if (this.settingsDifficulty === 'sedang') mapFile = 'map_baru3.tmj';
        if (this.settingsDifficulty === 'sulit') mapFile = 'map_baru3.tmj';

        // ENEMY COUNT CALCULATION
        // 5 soal -> 10 enemies, 10 soal -> 20 enemies
        const enemyCount = this.settingsQuestionCount === 5 ? 10 : 20;

        const options = {
            difficulty: this.settingsDifficulty,
            subject: this.selectedQuiz.category.toLowerCase(),
            quizId: this.selectedQuiz.id,
            quizTitle: this.selectedQuiz.title,
            map: mapFile,
            questionCount: this.settingsQuestionCount,
            enemyCount: enemyCount,
            timer: this.settingsTimer
        };

        try {
            const room = await this.client.joinOrCreate("game_room", options);
            console.log("Room created!", room);

            // Save options for Restart functionality
            this.registry.set('lastGameOptions', options);

            // Hide all overlays
            this.toggleUI(''); // Hides everything since '' matches nothing

            // Navigate to Waiting Room
            Router.navigate('/host/lobby');
            this.scene.start('HostWaitingRoomScene', { room, isHost: true });
        } catch (e) {
            console.error("Create room error", e);
            alert("Error creating room. Check console.");
        }
    }
}
