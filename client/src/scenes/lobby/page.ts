import Phaser from 'phaser';
import { Client, Room } from 'colyseus.js';
import { Router } from '../../utils/Router';
import { TransitionManager } from '../../utils/TransitionManager';
import { authService } from '../../services/auth/AuthService';
import { supabaseB, SESSION_TABLE, PARTICIPANT_TABLE } from '../../lib/supabaseB';
import { LobbyUI } from './ui';

export class LobbyScene extends Phaser.Scene {
    client!: Client;

    // UI Elements
    lobbyUI: HTMLElement | null = null;

    constructor() {
        super('LobbyScene');
    }

    private pendingJoinCode: string | null = null;
    private didExit: boolean = false;

    init(data?: { autoJoinCode?: string, didExit?: boolean }) {
        // Reset state on init
        this.pendingJoinCode = null;
        this.didExit = !!data?.didExit;

        if (this.didExit) {
            console.log("🚀 [LobbyScene] User exited deliberately. Auto-join disabled.");
            // Ensure storage is clear
            localStorage.removeItem('pendingJoinRoomCode');
            return;
        }

        if (data?.autoJoinCode) {
            this.pendingJoinCode = data.autoJoinCode;
            console.log("[LobbyScene] Received auto-join code via Scene Data:", this.pendingJoinCode);
            // IMPORTANT: Clear storage to prevent "zombie" auto-joins when returning to lobby later
            localStorage.removeItem('pendingJoinRoomCode');
        } else {
            // Fallback: Check local storage directly if scene data missing
            const stored = localStorage.getItem('pendingJoinRoomCode');
            if (stored) {
                this.pendingJoinCode = stored;
                console.log("[LobbyScene] Received auto-join code via localStorage fallback:", stored);
                // Consume it
                localStorage.removeItem('pendingJoinRoomCode');
            }
        }
    }

    create() {
        this.initializeClient();

        // ⚡ EARLY ROUTE CHECK: Redirect restore routes BEFORE showing any UI
        // This prevents the HomePage from flashing on refresh
        const path = Router.getPath();
        const isRestoreRoute =
            Router.match('/host/:roomCode/lobby') ||
            Router.match('/host/:roomCode/leaderboard') ||
            Router.is('/host/leaderboard') ||
            Router.is('/host/progress') ||
            Router.is('/player/lobby') ||
            Router.is('/player/game') ||
            Router.match('/player/:roomCode/leaderboard');

        if (isRestoreRoute && !this.didExit) {
            // Sembunyikan SEMUA UI sebelum apapun tampil
            this.toggleUI('');
            this.handleRouting();
            return;
        }

        // 1. Initialize UI (Hidden)
        this.toggleUI('');
        this.initializeUI();
        this.setupEventListeners();

        // Safety Check: If we just exited via button, STOP here and show lobby.
        if (this.didExit) {
            this.showLobby();
            window.addEventListener('popstate', () => this.handleRouting());
            // Force URL clean if needed
            if (!Router.is('/')) Router.replace('/');
            return;
        }

        // 2. Explicit Scene Data Check (Highest Priority)
        // This handles cases where data is passed directly via scene.start
        if (this.pendingJoinCode) {
            const code = this.pendingJoinCode;
            this.pendingJoinCode = null; // Clear local var
            console.log("🚀 [LobbyScene] Executing pending join (Scene Data Priority):", code);
            this.processAutoJoinWithVisuals(code);
            return;
        }

        // 3. Process Auto-Join (Storage / URL / Regex)
        const autoJoinTriggered = this.initializeAutoJoin();

        if (autoJoinTriggered) {
            console.log("🚀 [LobbyScene] Auto-join sequence initiated. Pausing normal routing.");
            return;
        }

        // 3. Normal Routing Flow (if no auto-join)
        window.addEventListener('popstate', () => this.handleRouting());
        this.handleRouting();
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
        LobbyUI.render();
        this.lobbyUI = document.getElementById('lobby-ui');
        this.populateUserProfile();

        const profile = authService.getStoredProfile();
        const nicknameInput = document.getElementById('lobby-nickname-input') as HTMLInputElement;
        if (profile && nicknameInput) {
            nicknameInput.value = profile.nickname || profile.fullname || profile.username || '';
        }

        // Reset Join Button state
        const joinBtn = document.getElementById('join-room-btn') as HTMLButtonElement;
        if (joinBtn) {
            joinBtn.innerHTML = `Join`;
            joinBtn.disabled = false;
            joinBtn.classList.remove('opacity-80', 'cursor-not-allowed');
            joinBtn.classList.add('active:translate-y-1', 'active:border-b-0', 'hover:brightness-110');
        }
    }

    initializeAutoJoin(): boolean {
        // A. Check Pending Code from Scene Data or LocalStorage (via init)
        if (this.pendingJoinCode) {
            const code = this.pendingJoinCode;
            this.pendingJoinCode = null; // consume
            console.log("🚀 [LobbyScene] Auto-join source: PENDING DATA/STORAGE ->", code);
            this.processAutoJoinWithVisuals(code);
            return true;
        }

        // B. Check Router Match for /join/:code
        const joinMatch = Router.match('/join/:roomCode');
        if (joinMatch && joinMatch.roomCode) {
            console.log("🚀 [LobbyScene] Auto-join source: ROUTER MATCH ->", joinMatch.roomCode);
            this.processAutoJoinWithVisuals(joinMatch.roomCode);
            return true;
        }

        // C. Check Manual Regex (Fallback)
        const rawPath = window.location.pathname;
        const manualMatch = rawPath.match(/^\/join\/([a-zA-Z0-9]+)\/?$/);
        if (manualMatch && manualMatch[1]) {
            console.log("🚀 [LobbyScene] Auto-join source: MANUAL REGEX ->", manualMatch[1]);
            this.processAutoJoinWithVisuals(manualMatch[1]);
            return true;
        }

        // D. Check Query Param ?room=CODE
        const urlParams = new URLSearchParams(window.location.search);
        const queryCode = urlParams.get('room');
        if (queryCode) {
            console.log("🚀 [LobbyScene] Auto-join source: QUERY PARAM ->", queryCode);
            // Clean URL
            const url = new URL(window.location.href);
            url.searchParams.delete('room');
            window.history.replaceState({}, '', url);

            this.processAutoJoinWithVisuals(queryCode);
            return true;
        }

        return false;
    }

    processAutoJoinWithVisuals(code: string) {
        this.showJoinLoading(`Joining Room ${code}...`);

        // Check Auth
        const profile = authService.getStoredProfile();

        if (!profile) {
            console.log("⚠️ [LobbyScene] Auto-join paused. User not logged in.");
            localStorage.setItem('pendingJoinRoomCode', code);

            // Redirect to Login
            setTimeout(() => {
                this.hideJoinLoading();
                Router.navigate('/login');
                this.scene.start('LoginScene');
            }, 500);
            return;
        }

        // Robust name extraction
        const joinName = profile.nickname || profile.fullname || profile.username || profile.email?.split('@')[0] || 'Player';

        console.log("✅ [LobbyScene] Authenticated. Attempting join as:", joinName);
        console.log("✅ [LobbyScene] Room Code:", code);

        // Pre-fill inputs just in case we fall back to lobby
        const codeInput = document.getElementById('room-code-input') as HTMLInputElement;
        const nicknameInput = document.getElementById('lobby-nickname-input') as HTMLInputElement;
        if (codeInput) codeInput.value = code;
        if (nicknameInput) nicknameInput.value = joinName;

        // Execute Join
        setTimeout(() => {
            this.handleJoinRoom(code, joinName)
                .then(() => {
                    this.hideJoinLoading();
                    // If successful, handleJoinRoom navigates away.
                    // If it stays here (e.g. error caught inside), we might need to hide loading.
                })
                .catch(err => {
                    console.error("Auto-join failed:", err);
                    this.hideJoinLoading();
                    this.showLobby();
                    this.showJoinError("Auto-join failed: " + (err.message || "Unknown error"));
                });
        }, 1000);
    }

    populateUserProfile() {
        const profile = authService.getStoredProfile();
        const nameEl = document.getElementById('lobby-user-name');
        const avatarEl = document.getElementById('lobby-user-avatar') as HTMLImageElement;
        const avatarFallback = document.getElementById('lobby-user-avatar-fallback');

        if (profile) {
            if (nameEl) {
                nameEl.innerText = profile.nickname || profile.fullname || profile.username || profile.email || 'Guest';
            }
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

    // --- LOADING HELPERS ---
    showJoinLoading(msg: string) {
        const overlay = document.getElementById('auth-loading-overlay');
        const text = document.getElementById('auth-loading-text');

        this.toggleUI('');

        if (text) text.innerText = msg;
        if (overlay) overlay.classList.remove('hidden');
    }

    hideJoinLoading() {
        const overlay = document.getElementById('auth-loading-overlay');
        if (overlay) overlay.classList.add('hidden');
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

        if (lobbyLogoutBtn) lobbyLogoutBtn.onclick = () => showLogoutModal();
        if (logoutCancelBtn) logoutCancelBtn.onclick = () => hideLogoutModal();
        if (logoutModalBackdrop) logoutModalBackdrop.onclick = () => hideLogoutModal();

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
        console.log("[LobbyScene] Routing check:", Router.getPath());

        const hidelobby = () => {
            const lobbyUI = document.getElementById('lobby-ui');
            if (lobbyUI) lobbyUI.classList.add('hidden');
        };

        // ── /host/select-quiz ────────────────────────────────
        if (Router.is('/host/select-quiz')) {
            hidelobby();
            this.scene.start('SelectQuizScene', { client: this.client });
            return;
        }

        // ── /host/settings/:quizId ───────────────────────────
        const settingsMatch = Router.match('/host/settings/:quizId');
        if (settingsMatch) {
            hidelobby();
            this.scene.start('QuizSettingScene', { client: this.client, quizId: settingsMatch.quizId });
            return;
        }
        if (Router.is('/host/settings')) {
            hidelobby();
            this.scene.start('QuizSettingScene', { client: this.client });
            return;
        }

        // ── /host/progress ───────────────────────────────────
        if (Router.is('/host/progress')) {
            console.log("[LobbyScene] Host Progress refresh detected.");
            hidelobby();
            this.scene.start('HostProgressScene', { client: this.client, isRestore: true });
            return;
        }

        // ── /host/:roomCode/lobby ───────────────────────────────
        const hostLobbyMatch = Router.match('/host/:roomCode/lobby');
        if (hostLobbyMatch) {
            console.log("[LobbyScene] Host Lobby refresh detected.", hostLobbyMatch.roomCode);
            hidelobby();
            this.scene.start('HostWaitingRoomScene', { client: this.client, isRestore: true });
            return;
        }

        // ── /host/:roomCode/leaderboard OR /host/leaderboard ───────────
        const hostLbMatch = Router.match('/host/:roomCode/leaderboard');
        if (hostLbMatch || Router.is('/host/leaderboard')) {
            const roomCode = hostLbMatch ? hostLbMatch.roomCode : undefined;
            console.log("[LobbyScene] Host Leaderboard restore, roomCode:", roomCode);
            hidelobby();
            this.scene.start('HostLeaderboardScene', { client: this.client, isRestore: true, roomCode });
            return;
        }

        // ── /player/lobby ────────────────────────────────────
        if (Router.is('/player/lobby')) {
            console.log("[LobbyScene] Player Waiting Room refresh detected.");
            hidelobby();
            this.scene.start('PlayerWaitingRoomScene', { client: this.client, isRestore: true });
            return;
        }

        // ── /game ─────────────────────────────────────────────
        if (Router.is('/game')) {
            console.log("[LobbyScene] Game Scene refresh detected.");
            hidelobby();
            this.scene.start('GameScene', { client: this.client, isRestore: true });
            return;
        }

        // ── /player/result ───────────────────────────────────
        if (Router.is('/player/result')) {
            console.log("[LobbyScene] Result Scene refresh detected.");
            hidelobby();
            this.scene.start('ResultScene', { client: this.client, isRestore: true });
            return;
        }

        // ── Explicit Auto-Join (from Scene Data or pending localStorage) ──
        if (this.pendingJoinCode) {
            const code = this.pendingJoinCode;
            this.pendingJoinCode = null;

            console.log("[LobbyScene] Processing explicit auto-join:", code);
            this.processAutoJoinWithVisuals(code);
            return;
        }

        // ── /join/:roomCode (QR Scan) ────────────────────────
        const joinMatch = Router.match('/join/:roomCode');
        if (joinMatch) {
            console.log("[LobbyScene] Auto-join route detected:", joinMatch.roomCode);
            this.processAutoJoinWithVisuals(joinMatch.roomCode);
            return;
        }

        // ── / (lobby utama) ──────────────────────────────────
        // Only show lobby if explicit root OR empty path
        if (Router.is('/') || Router.getPath() === '') {
            // Last ditch check for localStorage
            const pendingCode = localStorage.getItem('pendingJoinRoomCode');
            if (pendingCode) {
                console.log("[LobbyScene] Found pending join code, restoring join flow:", pendingCode);
                // process without removing yet, let initialized logic handle visuals
                this.initializeAutoJoin();
                return;
            }
            this.showLobby();
            return;
        }

        // ── Fallback ─────────────────────────────────────────
        console.warn("[LobbyScene] Unknown path, fallback to lobby:", Router.getPath());
        this.showLobby();
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

        if (id) {
            const target = document.getElementById(id);
            if (target) target.classList.remove('hidden');
        }
    }

    // --- ACTIONS ---

    async handleJoinRoom(code?: string, nicknameInput?: string) {
        // Clear previous errors
        this.clearJoinErrors();

        const cleanCode = code ? code.trim() : "";
        const nickname = nicknameInput ? nicknameInput.trim() : "";

        let hasError = false;

        if (!cleanCode || cleanCode.length !== 6) {
            this.showJoinFieldError('roomcode', 'Enter a valid 6-digit code');
            hasError = true;
        }

        if (!nickname) {
            this.showJoinFieldError('nickname', 'Required');
            hasError = true;
        }

        if (hasError) return;

        const joinBtn = document.getElementById('join-room-btn') as HTMLButtonElement;
        const setBtnLoading = (loading: boolean) => {
            if (!joinBtn) return;
            if (loading) {
                joinBtn.innerHTML = `<span class="material-symbols-outlined animate-spin text-xl font-bold">refresh</span> JOINING...`;
                joinBtn.disabled = true;
                joinBtn.classList.add('opacity-80', 'cursor-not-allowed');
                joinBtn.classList.remove('active:translate-y-1', 'active:border-b-0', 'hover:brightness-110');
            } else {
                joinBtn.innerHTML = `Join`;
                joinBtn.disabled = false;
                joinBtn.classList.remove('opacity-80', 'cursor-not-allowed');
                joinBtn.classList.add('active:translate-y-1', 'active:border-b-0', 'hover:brightness-110');
            }
        };

        try {
            setBtnLoading(true);
            // 1. Verify Session in Supabase B
            const { data: sessionData, error: sessionError } = await supabaseB
                .from(SESSION_TABLE)
                .select('*')
                .eq('game_pin', cleanCode)
                .single();

            if (sessionError || !sessionData) {
                console.error("Session lookup error:", sessionError);
                this.showJoinFieldError('roomcode', 'Room not found');
                setBtnLoading(false);
                return;
            }

            if (sessionData.status !== 'waiting') {
                this.showJoinError('Game already started or finished');
                setBtnLoading(false);
                return;
            }

            // 2. Register Participant in Supabase B
            const profile = authService.getStoredProfile();

            if (!profile) {
                this.showJoinError('Please login first');
                return;
            }

            const userId = profile.id;

            // Cek apakah sudah pernah join (untuk rejoin case)
            // Check by user_id OR by nickname (karena constraint unik di DB = session_id + nickname)
            const { data: existingByUserId } = await supabaseB
                .from(PARTICIPANT_TABLE)
                .select('id')
                .eq('session_id', sessionData.id)
                .eq('user_id', userId)
                .maybeSingle();

            const { data: existingByNickname } = await supabaseB
                .from(PARTICIPANT_TABLE)
                .select('id')
                .eq('session_id', sessionData.id)
                .ilike('nickname', nickname)
                .maybeSingle();

            const existingParticipant = existingByUserId || existingByNickname;

            if (!existingParticipant) {
                // Belum pernah join → INSERT baru
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
                    // Handle 23505 (unique constraint violation) gracefully — participant already exists
                    if (partError.code === '23505') {
                        console.warn("Participant already exists (conflict), proceeding to join...");
                    } else {
                        console.error("Participant registration error:", partError);
                        this.showJoinError('Failed to join, try again');
                        return;
                    }
                }
            } else {
                // Sudah pernah join → update nickname + joined_at (rejoin)
                await supabaseB
                    .from(PARTICIPANT_TABLE)
                    .update({ nickname: nickname, user_id: userId, joined_at: new Date().toISOString() })
                    .eq('id', existingParticipant.id);
            }

            // 3. Join Colyseus Room
            const rooms = await this.client.getAvailableRooms("game_room");
            const targetRoom = rooms.find((r: any) => r.metadata?.roomCode === cleanCode);

            if (targetRoom) {
                const room = await this.client.joinById(targetRoom.roomId, {
                    name: nickname,
                    userId: userId, // Pass Supabase Profile ID
                    sessionId: sessionData.id
                });

                // Simpan session untuk restore setelah refresh (Colyseus v0.15)
                localStorage.setItem('currentRoomId', room.id);
                localStorage.setItem('currentSessionId', room.sessionId);
                localStorage.setItem('currentReconnectionToken', room.reconnectionToken);
                localStorage.setItem('supabaseSessionId', sessionData.id);

                this.lobbyUI?.classList.add('hidden');

                TransitionManager.transitionTo(() => {
                    Router.navigate('/player/lobby');
                    this.scene.start('PlayerWaitingRoomScene', { room, isHost: false });
                });
            } else {
                this.showJoinFieldError('roomcode', 'Room closed or not found');
                setBtnLoading(false);
            }

        } catch (e) {
            console.error("Join room error", e);
            setBtnLoading(false);
            this.showJoinError('Connection error, try again');
        }
    }

    // --- JOIN INLINE ERROR HELPERS ---

    showJoinFieldError(field: 'nickname' | 'roomcode', message: string) {
        const inputId = field === 'nickname' ? 'lobby-nickname-input' : 'room-code-input';
        const errorId = `${field}-error`;

        const input = document.getElementById(inputId) as HTMLInputElement;
        const errorEl = document.getElementById(errorId);

        if (input) {
            input.classList.add('!border-red-500');
        }
        if (errorEl) {
            const textSpan = errorEl.querySelector('span:last-child');
            if (textSpan) textSpan.textContent = message;
            errorEl.classList.remove('hidden');
        }
    }

    showJoinError(message: string) {
        const errorEl = document.getElementById('join-error');
        if (errorEl) {
            const textSpan = errorEl.querySelector('span:last-child');
            if (textSpan) textSpan.textContent = message;
            errorEl.classList.remove('hidden');
        }
    }

    clearJoinErrors() {
        ['nickname', 'roomcode', 'join'].forEach(id => {
            const errorEl = document.getElementById(`${id}-error`);
            if (errorEl) errorEl.classList.add('hidden');
        });

        const nicknameInput = document.getElementById('lobby-nickname-input') as HTMLInputElement;
        const codeInput = document.getElementById('room-code-input') as HTMLInputElement;
        if (nicknameInput) nicknameInput.classList.remove('!border-red-500');
        if (codeInput) codeInput.classList.remove('!border-red-500');
    }
}

//ikan//