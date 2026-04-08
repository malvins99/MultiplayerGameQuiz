import { Client, Room } from 'colyseus.js';
import { Router } from '../../utils/Router';
import { TransitionManager } from '../../utils/TransitionManager';
import { authService } from '../../services/auth/AuthService';
import { supabaseB, SESSION_TABLE, PARTICIPANT_TABLE } from '../../lib/supabaseB';
import { LobbyUI } from './ui';
import { i18n } from '../../utils/i18n';

export class LobbyManager {
    client!: Client;
    lobbyUI: HTMLElement | null = null;
    private pendingJoinCode: string | null = null;
    private didExit: boolean = false;

    constructor() {}

    async init(data?: { autoJoinCode?: string, didExit?: boolean }) {
        this.pendingJoinCode = null;
        this.didExit = !!data?.didExit;

        if (this.didExit) {
            console.log("🚀 [LobbyManager] User exited deliberately. Auto-join disabled.");
            localStorage.removeItem('pendingJoinRoomCode');
        } else if (data?.autoJoinCode) {
            this.pendingJoinCode = data.autoJoinCode;
            console.log("[LobbyManager] Received auto-join code via arguments:", this.pendingJoinCode);
            localStorage.removeItem('pendingJoinRoomCode');
        } else {
            const stored = localStorage.getItem('pendingJoinRoomCode');
            if (stored) {
                this.pendingJoinCode = stored;
                console.log("[LobbyManager] Received auto-join code via localStorage fallback:", stored);
                localStorage.removeItem('pendingJoinRoomCode');
            }
        }

        this.start();
    }

    private start() {
        this.initializeClient();

        const path = Router.getPath();
        const isRestoreRoute =
            Router.match('/host/:roomCode/lobby') ||
            Router.match('/host/:roomCode/leaderboard') ||
            Router.is('/host/leaderboard') ||
            Router.is('/host/progress') ||
            Router.is('/player/lobby') ||
            Router.is('/player/game') ||
            Router.is('/player/result') ||
            Router.is('/player/leaderboard') ||
            Router.match('/player/:roomCode/leaderboard');

        if (isRestoreRoute && !this.didExit) {
            this.toggleUI('');
            this.handleRouting();
            return;
        }

        this.toggleUI('');
        this.initializeUI();
        this.setupEventListeners();

        if (this.didExit) {
            this.showLobby();
            window.addEventListener('popstate', () => this.handleRouting());
            if (!Router.is('/')) Router.replace('/');
            return;
        }

        if (this.pendingJoinCode) {
            const code = this.pendingJoinCode;
            this.pendingJoinCode = null;
            this.processAutoJoinWithVisuals(code);
            return;
        }

        const autoJoinTriggered = this.initializeAutoJoin();
        if (autoJoinTriggered) return;

        window.addEventListener('popstate', () => this.handleRouting());

        window.addEventListener('lobbyUIReRendered', () => {
            const oldNickname = (document.getElementById('lobby-nickname-input') as HTMLInputElement)?.value;
            const oldCode = (document.getElementById('room-code-input') as HTMLInputElement)?.value;

            this.lobbyUI = document.getElementById('lobby-ui');
            this.setupEventListeners();
            this.populateUserProfile();

            // Re-apply values if they were user-entered, or fallback to profile
            const nicknameInput = document.getElementById('lobby-nickname-input') as HTMLInputElement;
            const codeInput = document.getElementById('room-code-input') as HTMLInputElement;
            
            if (nicknameInput && oldNickname) {
                nicknameInput.value = oldNickname;
            } else if (nicknameInput) {
                const profile = authService.getStoredProfile();
                if (profile) {
                    nicknameInput.value = profile.nickname || profile.fullname || profile.username || '';
                }
            }

            if (codeInput && oldCode) codeInput.value = oldCode;
        });

        this.handleRouting();
    }

    private initializeClient() {
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

    private initializeUI() {
        LobbyUI.render();
        this.lobbyUI = document.getElementById('lobby-ui');
        this.populateUserProfile();

        const profile = authService.getStoredProfile();
        const nicknameInput = document.getElementById('lobby-nickname-input') as HTMLInputElement;
        if (profile && nicknameInput) {
            nicknameInput.value = profile.nickname || profile.fullname || profile.username || '';
        }

        const joinBtn = document.getElementById('join-room-btn') as HTMLButtonElement;
        if (joinBtn) {
            joinBtn.innerHTML = i18n.t('lobby.join_card.btn');
            joinBtn.disabled = false;
            joinBtn.classList.remove('opacity-80', 'cursor-not-allowed');
            joinBtn.classList.add('active:translate-y-1', 'active:border-b-0', 'hover:brightness-110');
        }
    }

    private initializeAutoJoin(): boolean {
        if (this.pendingJoinCode) {
            const code = this.pendingJoinCode;
            this.pendingJoinCode = null;
            this.processAutoJoinWithVisuals(code);
            return true;
        }

        const joinMatch = Router.match('/join/:roomCode');
        if (joinMatch && joinMatch.roomCode) {
            this.processAutoJoinWithVisuals(joinMatch.roomCode);
            return true;
        }

        const rawPath = window.location.pathname;
        const manualMatch = rawPath.match(/^\/join\/([a-zA-Z0-9]+)\/?$/);
        if (manualMatch && manualMatch[1]) {
            this.processAutoJoinWithVisuals(manualMatch[1]);
            return true;
        }

        const urlParams = new URLSearchParams(window.location.search);
        const queryCode = urlParams.get('room');
        if (queryCode) {
            const url = new URL(window.location.href);
            url.searchParams.delete('room');
            window.history.replaceState({}, '', url);
            this.processAutoJoinWithVisuals(queryCode);
            return true;
        }

        return false;
    }

    private processAutoJoinWithVisuals(code: string) {
        this.showJoinLoading(i18n.t('lobby.join_errors.joining_msg').replace('{code}', code));
        const profile = authService.getStoredProfile();

        if (!profile) {
            localStorage.setItem('pendingJoinRoomCode', code);
            setTimeout(() => {
                this.hideJoinLoading();
                window.location.href = '/login';
            }, 500);
            return;
        }

        const joinName = profile.nickname || profile.fullname || profile.username || profile.email?.split('@')[0] || 'Player';
        const codeInput = document.getElementById('room-code-input') as HTMLInputElement;
        const nicknameInput = document.getElementById('lobby-nickname-input') as HTMLInputElement;
        
        if (codeInput) codeInput.value = code;
        if (nicknameInput) nicknameInput.value = joinName;

        setTimeout(() => {
            this.handleJoinRoom(code, joinName).then(() => {
                this.hideJoinLoading();
            }).catch(err => {
                this.hideJoinLoading();
                this.showLobby();
                this.showJoinError(i18n.t('lobby.join_errors.autojoin_failed') + (err.message || "Unknown error"));
            });
        }, 1000);
    }

    private populateUserProfile() {
        const profile = authService.getStoredProfile();
        const nameEl = document.getElementById('lobby-user-name');
        const avatarEl = document.getElementById('lobby-user-avatar') as HTMLImageElement;
        const avatarFallback = document.getElementById('lobby-user-avatar-fallback');

        if (profile) {
            if (nameEl) nameEl.innerText = profile.nickname || profile.fullname || profile.username || profile.email || 'Guest';
            if (avatarEl && profile.avatar_url) {
                let avatarUrl = profile.avatar_url;
                if (avatarUrl.includes('googleusercontent.com')) {
                    avatarUrl = avatarUrl.replace(/=s\d+(-c)?/, '=s384-c');
                }
                avatarEl.src = avatarUrl;
                avatarEl.classList.remove('hidden');
                if (avatarFallback) avatarFallback.classList.add('hidden');
                avatarEl.onerror = () => {
                    avatarEl.classList.add('hidden');
                    if (avatarFallback) avatarFallback.classList.remove('hidden');
                };
            }
        }
    }

    private showJoinLoading(msg: string) {
        const overlay = document.getElementById('auth-loading-overlay');
        const text = document.getElementById('auth-loading-text');
        this.toggleUI('');
        if (text) text.innerText = msg;
        if (overlay) overlay.classList.remove('hidden');
    }

    private hideJoinLoading() {
        const overlay = document.getElementById('auth-loading-overlay');
        if (overlay) overlay.classList.add('hidden');
    }

    private setupEventListeners() {
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

            document.addEventListener('click', (e) => {
                if (!lobbyMenuDropdown.classList.contains('hidden')) {
                    if (!lobbyMenuDropdown.contains(e.target as Node) && !lobbyMenuBtn.contains(e.target as Node)) {
                        lobbyMenuDropdown.classList.remove('scale-100', 'opacity-100');
                        lobbyMenuDropdown.classList.add('scale-95', 'opacity-0');
                        setTimeout(() => lobbyMenuDropdown.classList.add('hidden'), 200);
                        
                        // Close lang options when closing the main dropdown
                        const langOptions = document.getElementById('lobby-lang-options');
                        const langArrow = document.getElementById('lobby-lang-arrow');
                        if (langOptions) langOptions.classList.add('hidden');
                        if (langArrow) langArrow.style.transform = 'rotate(0deg)';
                    }
                }
            });

            const langToggleBtn = document.getElementById('lobby-lang-toggle-btn');
            const langOptions = document.getElementById('lobby-lang-options');
            const langArrow = document.getElementById('lobby-lang-arrow');

            if (langToggleBtn && langOptions) {
                langToggleBtn.onclick = (e) => {
                    e.stopPropagation();
                    const isHidden = langOptions.classList.contains('hidden');
                    if (isHidden) {
                        langOptions.classList.remove('hidden');
                        if (langArrow) langArrow.style.transform = 'rotate(180deg)';
                    } else {
                        langOptions.classList.add('hidden');
                        if (langArrow) langArrow.style.transform = 'rotate(0deg)';
                    }
                };
            }

            document.querySelectorAll('.lobby-lang-btn').forEach(btn => {
                (btn as HTMLButtonElement).onclick = () => {
                    const lang = (btn as HTMLElement).dataset.lang as 'en' | 'id' | 'ar';
                    console.log("Language selected:", lang);
                    
                    if (lang) {
                        i18n.setLanguage(lang);
                    }
                };
            });

            const soundContainer = document.getElementById('lobby-sound-container');
            if (soundContainer) {
                let soundEnabled = localStorage.getItem('globalSoundEnabled') === 'true';
                const sBtn = document.getElementById('lobby-sound-btn');
                const sKnob = document.getElementById('lobby-sound-knob');
                
                if (soundEnabled) {
                    if (sBtn) { sBtn.classList.remove('bg-white'); sBtn.classList.add('bg-[#478D47]'); }
                    if (sKnob) sKnob.classList.add('translate-x-5');
                }

                soundContainer.onclick = (e) => {
                    e.stopPropagation();
                    soundEnabled = !soundEnabled;
                    localStorage.setItem('globalSoundEnabled', String(soundEnabled));
                    if (soundEnabled) {
                        if (sBtn) { sBtn.classList.remove('bg-white'); sBtn.classList.add('bg-[#478D47]'); }
                        if (sKnob) sKnob.classList.add('translate-x-5');
                    } else {
                        if (sBtn) { sBtn.classList.remove('bg-[#478D47]'); sBtn.classList.add('bg-white'); }
                        if (sKnob) sKnob.classList.remove('translate-x-5');
                    }
                };
            }
        }

        const logoutModal = document.getElementById('logout-modal');
        const logoutModalBackdrop = document.getElementById('logout-modal-backdrop');
        const logoutModalName = document.getElementById('logout-modal-name');
        const logoutCancelBtn = document.getElementById('logout-cancel-btn');
        const logoutConfirmBtn = document.getElementById('logout-confirm-btn');

        const showLogoutModal = () => {
            if (lobbyMenuDropdown) {
                lobbyMenuDropdown.classList.remove('scale-100', 'opacity-100');
                lobbyMenuDropdown.classList.add('scale-95', 'opacity-0');
                setTimeout(() => lobbyMenuDropdown.classList.add('hidden'), 200);
            }
            const profile = authService.getStoredProfile();
            if (logoutModalName && profile) {
                logoutModalName.innerText = profile.nickname || profile.fullname || profile.username || profile.email || 'User';
            }
            if (logoutModal) logoutModal.classList.remove('hidden');
        };

        const hideLogoutModal = () => { if (logoutModal) logoutModal.classList.add('hidden'); };

        if (lobbyLogoutBtn) lobbyLogoutBtn.onclick = () => showLogoutModal();
        if (logoutCancelBtn) logoutCancelBtn.onclick = () => hideLogoutModal();
        if (logoutModalBackdrop) logoutModalBackdrop.onclick = () => hideLogoutModal();

        if (logoutConfirmBtn) {
            logoutConfirmBtn.onclick = async () => {
                hideLogoutModal();
                await authService.signOut();
                TransitionManager.transitionTo(() => {
                    this.toggleUI('');
                    window.location.href = '/login';
                });
            };
        }

        const createRoomBtn = document.getElementById('create-room-btn');
        const joinBtn = document.getElementById('join-room-btn');
        const codeInput = document.getElementById('room-code-input') as HTMLInputElement;

        if (createRoomBtn) {
            createRoomBtn.onclick = () => {
                TransitionManager.transitionTo(() => {
                    this.toggleUI('');
                    this.startManager('SelectQuizManager', { client: this.client });
                });
            };
        }

        if (joinBtn) {
            joinBtn.onclick = () => {
                this.handleJoinRoom(codeInput?.value);
            };
        }
    }

    private async startGameEngine(startScene: string, sceneData?: any) {
        // --- PROFESSIONAL RECONNECTION HANDLING ---
        // Handle reconnection BEFORE starting Phaser to ensure room is ready
        if (sceneData?.isRestore && !sceneData.room && sceneData.client) {
            const token = localStorage.getItem('currentReconnectionToken');
            if (token) {
                try {
                    console.log(`[LobbyManager] 🔄 Pre-loading session for ${startScene}...`);
                    sceneData.room = await sceneData.client.reconnect(token);
                    console.log(`[LobbyManager] ✅ Session restored for ${startScene}!`);
                    localStorage.setItem('currentReconnectionToken', sceneData.room.reconnectionToken);
                } catch (e) {
                    console.error(`[LobbyManager] ❌ Pre-loading session failed:`, e);
                    
                    // FALLBACK: Try fresh join if we have the roomId and it's a host scene
                    const roomId = localStorage.getItem('currentRoomId');
                    const isHostScene = startScene.toLowerCase().includes('host') || startScene.toLowerCase().includes('spectator');
                    
                    if (roomId && isHostScene) {
                        try {
                            console.log(`[LobbyManager] 🔄 Re-joining as Host for ${startScene}...`);
                            const opts = JSON.parse(localStorage.getItem('lastGameOptions') || '{}');
                            sceneData.room = await sceneData.client.joinById(roomId, { ...opts, isHost: true });
                            console.log(`[LobbyManager] ✅ Re-joined successfully!`);
                            localStorage.setItem('currentReconnectionToken', sceneData.room.reconnectionToken);
                        } catch (err2) {
                            console.error(`[LobbyManager] ❌ Re-join failed:`, err2);
                        }
                    }
                }
            }
        }

        import('../../game').then((engine) => {
            engine.initializeGame(startScene, sceneData);
        }).catch(err => {
            console.error("Failed to load game engine:", err);
            window.location.href = '/';
        });
    }

    private async startManager(managerName: string, data?: any) {
        // --- PRE-RECONNECTION FOR MANAGERS ---
        if (data?.isRestore && !data.room && data.client) {
            const token = localStorage.getItem('currentReconnectionToken');
            if (token) {
                try {
                    console.log(`[LobbyManager] 🔄 Pre-loading session for ${managerName}...`);
                    data.room = await data.client.reconnect(token);
                    console.log(`[LobbyManager] ✅ Session restored for ${managerName}!`);
                    localStorage.setItem('currentReconnectionToken', data.room.reconnectionToken);
                } catch (e) {
                    console.error(`[LobbyManager] ❌ Pre-loading session failed for ${managerName}:`, e);

                    // FALLBACK: Try fresh join for host managers
                    const roomId = localStorage.getItem('currentRoomId');
                    if (roomId && managerName.toLowerCase().includes('host')) {
                        try {
                            console.log(`[LobbyManager] 🔄 Re-joining as Host for ${managerName}...`);
                            const opts = JSON.parse(localStorage.getItem('lastGameOptions') || '{}');
                            data.room = await data.client.joinById(roomId, { ...opts, isHost: true });
                            console.log(`[LobbyManager] ✅ Re-joined successfully!`);
                            localStorage.setItem('currentReconnectionToken', data.room.reconnectionToken);
                        } catch (err2) {
                            console.error(`[LobbyManager] ❌ Re-join failed:`, err2);
                        }
                    }
                }
            }
        }

        if (managerName === 'SelectQuizManager') {
            import('../host/selectquiz/page').then(m => {
                const manager = new m.SelectQuizManager();
                manager.init(data || { client: this.client });
            });
        } else if (managerName === 'QuizSettingManager') {
            import('../host/quizsetting/page').then(m => {
                const manager = new m.QuizSettingManager();
                manager.init(data || { client: this.client });
            });
        } else if (managerName === 'HostLeaderboardManager') {
            import('../host/leaderboard/page').then(m => {
                const manager = new m.HostLeaderboardManager();
                // We use start() for Leaderboard, not init() like others because it was named start().
                manager.start(data || { client: this.client });
            });
        } else if (managerName === 'PlayerWaitingRoomManager') {
            import('../player/waitingroom/page').then(m => {
                const manager = new m.PlayerWaitingRoomManager();
                manager.init(data || { client: this.client });
            });
        } else if (managerName === 'PlayerLeaderboardManager') {
            import('../player/leaderboard/page').then(m => {
                const manager = new m.PlayerLeaderboardManager();
                manager.start(data || { client: this.client });
            });
        } else if (managerName === 'ResultManager') {
            import('../player/results/page').then(m => {
                const manager = new m.ResultManager();
                manager.start(data || { client: this.client });
            });
        }
    }

    private handleRouting() {
        const hidelobby = () => {
            const lobbyUI = document.getElementById('lobby-ui');
            if (lobbyUI) lobbyUI.classList.add('hidden');
        };

        if (Router.is('/host/select-quiz')) {
            hidelobby();
            this.startManager('SelectQuizManager', { client: this.client });
            return;
        }

        const settingsMatch = Router.match('/host/settings/:quizId');
        if (settingsMatch) {
            hidelobby();
            this.startManager('QuizSettingManager', { client: this.client, quizId: settingsMatch.quizId });
            return;
        }
        
        if (Router.is('/host/settings')) {
            hidelobby();
            this.startManager('QuizSettingManager', { client: this.client });
            return;
        }

        if (Router.is('/host/progress')) {
            hidelobby();
            this.startGameEngine('HostProgressScene', { client: this.client, isRestore: true });
            return;
        }

        const hostLobbyMatch = Router.match('/host/:roomCode/lobby');
        if (hostLobbyMatch) {
            hidelobby();
            this.startGameEngine('HostWaitingRoomScene', { client: this.client, isRestore: true });
            return;
        }

        const hostLbMatch = Router.match('/host/:roomCode/leaderboard');
        if (hostLbMatch || Router.is('/host/leaderboard')) {
            const roomCode = hostLbMatch ? hostLbMatch.roomCode : undefined;
            hidelobby();
            this.startManager('HostLeaderboardManager', { client: this.client, isRestore: true, roomCode });
            return;
        }

        if (Router.is('/player/lobby')) {
            hidelobby();
            this.startManager('PlayerWaitingRoomManager', { client: this.client, isRestore: true });
            return;
        }

        if (Router.is('/game')) {
            hidelobby();
            this.startGameEngine('GameScene', { client: this.client, isRestore: true });
            return;
        }

        if (Router.is('/player/result')) {
            hidelobby();
            this.startManager('ResultManager', { client: this.client, isRestore: true });
            return;
        }

        const playerLbMatch = Router.match('/player/:roomCode/leaderboard');
        if (playerLbMatch || Router.is('/player/leaderboard')) {
            hidelobby();
            this.startManager('PlayerLeaderboardManager', { client: this.client, isRestore: true });
            return;
        }

        if (this.pendingJoinCode) {
            const code = this.pendingJoinCode;
            this.pendingJoinCode = null;
            this.processAutoJoinWithVisuals(code);
            return;
        }

        const joinMatch = Router.match('/join/:roomCode');
        if (joinMatch) {
            this.processAutoJoinWithVisuals(joinMatch.roomCode);
            return;
        }

        if (Router.is('/') || Router.getPath() === '') {
            const pendingCode = localStorage.getItem('pendingJoinRoomCode');
            if (pendingCode) {
                this.initializeAutoJoin();
                return;
            }
            this.showLobby();
            return;
        }

        if (Router.getPath().startsWith('/login')) {
            return;
        }

        console.warn("[LobbyManager] Unknown path, fallback to lobby:", Router.getPath());
        this.showLobby();
    }

    private showLobby() {
        this.toggleUI('lobby-ui');
    }

    private toggleUI(id: string) {
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

    private async handleJoinRoom(code?: string, nicknameInput?: string) {
        this.clearJoinErrors();

        const cleanCode = code ? code.trim() : "";
        
        // Use provided nickname (autoJoin) OR fetch from stored profile
        let nickname = (nicknameInput || "").trim();
        if (!nickname) {
            const profile = authService.getStoredProfile();
            nickname = profile?.nickname || profile?.fullname || profile?.username || profile?.email?.split('@')[0] || 'Player';
        }

        let hasError = false;

        if (!cleanCode || cleanCode.length !== 6) {
            this.showJoinFieldError('roomcode', i18n.t('lobby.join_errors.invalid_code'));
            hasError = true;
        }
        if (hasError) return;

        const joinBtn = document.getElementById('join-room-btn') as HTMLButtonElement;
        const setBtnLoading = (loading: boolean) => {
            if (!joinBtn) return;
            if (loading) {
                joinBtn.innerHTML = `<span class="material-symbols-outlined animate-spin text-xl font-bold">refresh</span> ${i18n.t('lobby.join_card.joining_btn')}`;
                joinBtn.disabled = true;
                joinBtn.classList.add('opacity-80', 'cursor-not-allowed');
                joinBtn.classList.remove('active:translate-y-1', 'active:border-b-0', 'hover:brightness-110');
            } else {
                joinBtn.innerHTML = i18n.t('lobby.join_card.btn');
                joinBtn.disabled = false;
                joinBtn.classList.remove('opacity-80', 'cursor-not-allowed');
                joinBtn.classList.add('active:translate-y-1', 'active:border-b-0', 'hover:brightness-110');
            }
        };

        try {
            setBtnLoading(true);
            const { data: sessionData, error: sessionError } = await supabaseB
                .from(SESSION_TABLE)
                .select('*')
                .eq('game_pin', cleanCode)
                .single();

            if (sessionError || !sessionData) {
                this.showJoinFieldError('roomcode', i18n.t('lobby.join_errors.room_not_found'));
                setBtnLoading(false);
                return;
            }

            if (sessionData.status !== 'waiting') {
                this.showJoinError(i18n.t('lobby.join_errors.game_started'));
                setBtnLoading(false);
                return;
            }

            const profile = authService.getStoredProfile();
            if (!profile) {
                this.showJoinError(i18n.t('lobby.join_errors.login_first'));
                return;
            }

            const userId = profile.id;
            const { data: existingByUserId } = await supabaseB.from(PARTICIPANT_TABLE).select('id').eq('session_id', sessionData.id).eq('user_id', userId).maybeSingle();
            const { data: existingByNickname } = await supabaseB.from(PARTICIPANT_TABLE).select('id').eq('session_id', sessionData.id).ilike('nickname', nickname).maybeSingle();
            const existingParticipant = existingByUserId || existingByNickname;

            if (!existingParticipant) {
                const { error: partError } = await supabaseB.from(PARTICIPANT_TABLE).insert({
                    session_id: sessionData.id,
                    nickname: nickname,
                    user_id: userId,
                    joined_at: new Date().toISOString(),
                    score: 0,
                    char: 'none'
                });

                if (partError && partError.code !== '23505') {
                    this.showJoinError(i18n.t('lobby.join_errors.join_failed'));
                    return;
                }
            } else {
                await supabaseB.from(PARTICIPANT_TABLE).update({ nickname: nickname, user_id: userId, joined_at: new Date().toISOString() }).eq('id', existingParticipant.id);
            }

            const rooms = await this.client.getAvailableRooms("game_room");
            const targetRoom = rooms.find((r: any) => r.metadata?.roomCode === cleanCode);

            if (targetRoom) {
                const room = await this.client.joinById(targetRoom.roomId, {
                    name: nickname,
                    userId: userId,
                    avatarUrl: profile.avatar_url,
                    sessionId: sessionData.id
                });

                localStorage.setItem('currentRoomId', room.id);
                localStorage.setItem('currentSessionId', room.sessionId);
                localStorage.setItem('currentReconnectionToken', room.reconnectionToken);
                localStorage.setItem('supabaseSessionId', sessionData.id);

                this.lobbyUI?.classList.add('hidden');

                TransitionManager.transitionTo(() => {
                    Router.navigate('/player/lobby');
                    this.startManager('PlayerWaitingRoomManager', { room, isHost: false });
                });
            } else {
                this.showJoinFieldError('roomcode', i18n.t('lobby.join_errors.room_closed'));
                setBtnLoading(false);
            }
        } catch (e) {
            setBtnLoading(false);
            this.showJoinError(i18n.t('lobby.join_errors.conn_error'));
        }
    }

    private showJoinFieldError(field: 'nickname' | 'roomcode', message: string) {
        const inputId = field === 'nickname' ? 'lobby-nickname-input' : 'room-code-input';
        const errorId = `${field}-error`;
        const input = document.getElementById(inputId) as HTMLInputElement;
        const errorEl = document.getElementById(errorId);

        if (input) input.classList.add('!border-red-500');
        if (errorEl) {
            const textSpan = errorEl.querySelector('span:last-child');
            if (textSpan) textSpan.textContent = message;
            errorEl.classList.remove('hidden');
        }
    }

    private showJoinError(message: string) {
        const errorEl = document.getElementById('join-error');
        if (errorEl) {
            const textSpan = errorEl.querySelector('span:last-child');
            if (textSpan) textSpan.textContent = message;
            errorEl.classList.remove('hidden');
        }
    }

    private clearJoinErrors() {
        ['roomcode', 'join'].forEach(id => {
            const errorEl = document.getElementById(`${id}-error`);
            if (errorEl) errorEl.classList.add('hidden');
        });
        const codeInput = document.getElementById('room-code-input') as HTMLInputElement;
        if (codeInput) codeInput.classList.remove('!border-red-500');
    }
}