import Phaser from 'phaser';
import { Client, Room } from 'colyseus.js';
import { Router } from '../utils/Router';
import { TransitionManager } from '../utils/TransitionManager';
import { authService } from '../services/AuthService';
import { supabaseB, SESSION_TABLE, PARTICIPANT_TABLE } from '../lib/supabaseB';

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

        // --- Populate Nickname Input ---
        const profile = authService.getStoredProfile();
        const nicknameInput = document.getElementById('lobby-nickname-input') as HTMLInputElement;
        if (profile && nicknameInput) {
            nicknameInput.value = profile.nickname || profile.fullname || profile.username || '';
        }
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
        const nicknameInput = document.getElementById('lobby-nickname-input') as HTMLInputElement;

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
                this.handleJoinRoom(codeInput?.value, nicknameInput?.value);
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

    async handleJoinRoom(code?: string, nicknameInput?: string) {
        const cleanCode = code ? code.trim() : "";
        if (!cleanCode || cleanCode.length !== 6) {
            alert("Please enter a valid 6-digit room code.");
            return;
        }

        const nickname = nicknameInput ? nicknameInput.trim() : "";
        if (!nickname) {
            alert("Please enter your nickname.");
            return;
        }

        try {
            // 1. Verify Session in Supabase B
            const { data: sessionData, error: sessionError } = await supabaseB
                .from(SESSION_TABLE)
                .select('*')
                .eq('game_pin', cleanCode)
                .single();

            if (sessionError || !sessionData) {
                console.error("Session lookup error:", sessionError);
                alert("Room not found or invalid code.");
                return;
            }

            if (sessionData.status !== 'waiting') {
                alert("This game has already started or finished.");
                return;
            }

            // 2. Register Participant in Supabase B
            const profile = authService.getStoredProfile();

            if (!profile) {
                alert("Please login to join the game.");
                return;
            }

            const userId = profile.id;

            const { error: partError } = await supabaseB
                .from(PARTICIPANT_TABLE)
                .insert({
                    session_id: sessionData.id,
                    nickname: nickname,
                    user_id: userId,
                    joined_at: new Date().toISOString(),
                    score: 0
                });

            if (partError) {
                console.error("Participant registration error:", partError);
                alert("Failed to join session. Name might be taken or connection error.");
                return;
            }

            // 3. Join Colyseus Room
            const rooms = await this.client.getAvailableRooms("game_room");
            const targetRoom = rooms.find((r: any) => r.metadata?.roomCode === cleanCode);

            if (targetRoom) {
                const room = await this.client.joinById(targetRoom.roomId, {
                    name: nickname, // Matches GameRoom options
                    sessionId: sessionData.id // Pass session ID
                });

                this.lobbyUI?.classList.add('hidden');

                TransitionManager.transitionTo(() => {
                    Router.navigate('/player/lobby');
                    this.scene.start('PlayerWaitingRoomScene', { room, isHost: false });
                });
            } else {
                alert("Room not found on server (it might be closed).");
            }

        } catch (e) {
            console.error("Join room error", e);
            alert("Error joining room.");
        }
    }
}
