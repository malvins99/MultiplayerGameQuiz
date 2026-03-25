import { Client } from 'colyseus.js';
import { Router } from '../../../utils/Router';
import { Quiz, fetchQuizById } from '../../../data/QuizData';
import { TransitionManager } from '../../../utils/TransitionManager';
import { supabaseB, SESSION_TABLE, PARTICIPANT_TABLE } from '../../../lib/supabaseB';
import { authService } from '../../../services/auth/AuthService';
import { i18n } from '../../../utils/i18n';

export class QuizSettingManager {
    client!: Client;
    selectedQuiz: Quiz | null = null;
    settingsDifficulty: string = 'mudah';
    settingsTimer: number = 300;
    settingsQuestionCount: number = 5;
    soundEnabled: boolean = false;
    quizSettingsUI: HTMLElement | null = null;
    private _outsideClickHandler: ((e: MouseEvent) => void) | null = null;

    constructor() {}

    async init(data?: { quiz?: Quiz; client?: Client }) {
        this.selectedQuiz = data?.quiz || null;
        if (data?.client) this.client = data.client;
        
        await this.start();
    }

    private async start() {
        this.quizSettingsUI = document.getElementById('quiz-settings-ui');

        if (!this.selectedQuiz) {
            const quizId = localStorage.getItem('tempSettingsQuizId');
            if (quizId) {
                console.log("Restoring quiz state for ID:", quizId);
                const quiz = await fetchQuizById(quizId);
                if (quiz) {
                    this.selectedQuiz = quiz;
                } else {
                    console.error("Failed to fetch quiz");
                    this.goBackToQuizSelection();
                    return;
                }
            } else {
                console.warn("No quiz ID found, redirecting.");
                this.goBackToQuizSelection();
                return;
            }
        }

        this.showSettingsUI();
        this.setupEventListeners();

        const titleEl = document.getElementById('settings-quiz-title');
        const titleExpandBtn = document.getElementById('settings-title-expand-btn');
        const titleExpandIcon = document.getElementById('settings-title-expand-icon');

        if (titleEl && this.selectedQuiz) {
            titleEl.innerText = this.selectedQuiz.title;

            requestAnimationFrame(() => {
                if (titleEl.scrollHeight > titleEl.clientHeight) {
                    if (titleExpandBtn) {
                        titleExpandBtn.classList.remove('hidden');
                        titleExpandBtn.onclick = () => {
                            const isExpanded = !titleEl.classList.contains('line-clamp-2');
                            if (isExpanded) {
                                titleEl.classList.add('line-clamp-2');
                                titleExpandIcon?.classList.remove('rotate-180');
                            } else {
                                titleEl.classList.remove('line-clamp-2');
                                titleExpandIcon?.classList.add('rotate-180');
                            }
                        };
                    }
                }
            });
        }

        window.addEventListener('popstate', this.handlePopState);

        window.addEventListener('quizSettingsUIReRendered', () => {
            this.quizSettingsUI = document.getElementById('quiz-settings-ui');
            this.setupEventListeners();
            
            const titleEl = document.getElementById('settings-quiz-title');
            const titleExpandBtn = document.getElementById('settings-title-expand-btn');
            const titleExpandIcon = document.getElementById('settings-title-expand-icon');

            if (titleEl && this.selectedQuiz) {
                titleEl.innerText = this.selectedQuiz.title;

                requestAnimationFrame(() => {
                    if (titleEl.scrollHeight > titleEl.clientHeight) {
                        if (titleExpandBtn) {
                            titleExpandBtn.classList.remove('hidden');
                            titleExpandBtn.onclick = () => {
                                const isExpanded = !titleEl.classList.contains('line-clamp-2');
                                if (isExpanded) {
                                    titleEl.classList.add('line-clamp-2');
                                    titleExpandIcon?.classList.remove('rotate-180');
                                } else {
                                    titleEl.classList.remove('line-clamp-2');
                                    titleExpandIcon?.classList.add('rotate-180');
                                }
                            };
                        }
                    }
                });
            }

            const diffMap: any = { 'mudah': 'quiz_setting.diff_easy', 'sedang': 'quiz_setting.diff_medium', 'sulit': 'quiz_setting.diff_hard' };
            const qSpan = document.getElementById('settings-question-selected');
            if (qSpan) qSpan.innerText = i18n.t(`quiz_setting.q_${this.settingsQuestionCount}`);
            
            const mSpan = document.getElementById('settings-timer-selected');
            if (mSpan) mSpan.innerText = i18n.t(`quiz_setting.m_${this.settingsTimer / 60}`);
            
            const diffSpan = document.getElementById('settings-difficulty-selected');
            if (diffSpan) diffSpan.innerText = i18n.t(diffMap[this.settingsDifficulty] || 'quiz_setting.diff_easy');
            
            const btn = document.getElementById('sound-toggle-btn');
            const knob = document.getElementById('sound-toggle-knob');
            if (this.soundEnabled) {
                if (btn) { btn.classList.remove('bg-white'); btn.classList.add('bg-[#478D47]'); }
                if (knob) knob.classList.add('translate-x-5');
            }

            document.querySelectorAll('.diff-opt').forEach(o => {
                if ((o as HTMLElement).dataset.value === this.settingsDifficulty) o.classList.add('bg-[#F1F8E9]');
            });
            document.querySelectorAll('.timer-opt').forEach(o => {
                if (parseInt((o as HTMLElement).dataset.value || '0') === this.settingsTimer) o.classList.add('bg-[#F1F8E9]');
            });
            document.querySelectorAll('.question-opt').forEach(o => {
                if (parseInt((o as HTMLElement).dataset.value || '0') === this.settingsQuestionCount) o.classList.add('bg-[#F1F8E9]');
            });
        });
    }

    handlePopState = () => {
        this.goBackToQuizSelection();
    };

    showSettingsUI() {
        const uiIds = ['lobby-ui', 'quiz-selection-ui', 'create-room-ui'];
        uiIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add('hidden');
        });

        if (this.quizSettingsUI) this.quizSettingsUI.classList.remove('hidden');
    }

    hideSettingsUI() {
        if (this.quizSettingsUI) this.quizSettingsUI.classList.add('hidden');
    }

    setupEventListeners() {
        const zigmaLogos = ['settings-zigma-logo', 'settings-zigma-logo-mobile'];
        zigmaLogos.forEach(id => {
            const logo = document.getElementById(id);
            if (logo) {
                logo.onclick = () => {
                    const overlay = document.getElementById('auth-loading-overlay');
                    const text = document.getElementById('auth-loading-text');
                    if (overlay) {
                        overlay.classList.remove('hidden');
                        if (text) text.innerText = i18n.t('quiz_setting.going_back');
                    }

                    TransitionManager.close(() => {
                        this.cleanup();
                        this.hideSettingsUI();
                        Router.navigate('/host/select-quiz');
                        this.startManager('SelectQuizManager');
                        
                        setTimeout(() => {
                            TransitionManager.open();
                            setTimeout(() => { if (overlay) overlay.classList.add('hidden'); }, 100);
                        }, 500);
                    });
                };
            }
        });

        this.setupDropdown('settings-difficulty-trigger', 'settings-difficulty-menu', 'settings-difficulty-arrow');
        const diffOptions = document.querySelectorAll('.diff-opt');
        diffOptions.forEach(opt => {
            const newOpt = opt.cloneNode(true) as HTMLElement;
            opt.parentNode?.replaceChild(newOpt, opt);
            newOpt.addEventListener('click', (e) => {
                const target = e.currentTarget as HTMLElement;
                const val = target.dataset.value || 'mudah';
                const label = target.dataset.label || i18n.t('quiz_setting.diff_easy');
                this.settingsDifficulty = val;

                const display = document.getElementById('settings-difficulty-selected');
                if (display) display.innerText = label;

                document.querySelectorAll('.diff-opt').forEach(o => o.classList.remove('bg-[#F1F8E9]'));
                target.classList.add('bg-[#F1F8E9]');

                this.closeDropdown('settings-difficulty-menu', 'settings-difficulty-arrow');
            });
        });

        this.setupDropdown('settings-timer-trigger', 'settings-timer-menu', 'settings-timer-arrow');
        const timerOptions = document.querySelectorAll('.timer-opt');
        timerOptions.forEach(opt => {
            const newOpt = opt.cloneNode(true) as HTMLElement;
            opt.parentNode?.replaceChild(newOpt, opt);
            newOpt.addEventListener('click', (e) => {
                const target = e.currentTarget as HTMLElement;
                const val = parseInt(target.dataset.value || '300');
                const label = target.dataset.label || i18n.t('quiz_setting.m_5');
                this.settingsTimer = val;

                const display = document.getElementById('settings-timer-selected');
                if (display) display.innerText = label;

                document.querySelectorAll('.timer-opt').forEach(o => o.classList.remove('bg-[#F1F8E9]'));
                target.classList.add('bg-[#F1F8E9]');

                this.closeDropdown('settings-timer-menu', 'settings-timer-arrow');
            });
        });

        this.setupDropdown('settings-question-trigger', 'settings-question-menu', 'settings-question-arrow');
        const questionOptions = document.querySelectorAll('.question-opt');
        questionOptions.forEach(opt => {
            const newOpt = opt.cloneNode(true) as HTMLElement;
            opt.parentNode?.replaceChild(newOpt, opt);
            newOpt.addEventListener('click', (e) => {
                const target = e.currentTarget as HTMLElement;
                const val = parseInt(target.dataset.value || '5');
                const label = target.dataset.label || i18n.t('quiz_setting.q_5');
                this.settingsQuestionCount = val;

                const display = document.getElementById('settings-question-selected');
                if (display) display.innerText = label;

                document.querySelectorAll('.question-opt').forEach(o => o.classList.remove('bg-[#F1F8E9]'));
                target.classList.add('bg-[#F1F8E9]');

                this.closeDropdown('settings-question-menu', 'settings-question-arrow');
            });
        });

        const soundContainer = document.getElementById('sound-toggle-container');
        if (soundContainer) {
            const newContainer = soundContainer.cloneNode(true) as HTMLElement;
            soundContainer.parentNode?.replaceChild(newContainer, soundContainer);
            const newToggle = newContainer.querySelector('#sound-toggle-btn') as HTMLElement;
            const newKnob = newContainer.querySelector('#sound-toggle-knob') as HTMLElement;

            newContainer.onclick = () => {
                this.soundEnabled = !this.soundEnabled;
                if (this.soundEnabled) {
                    if (newToggle) { newToggle.classList.remove('bg-white'); newToggle.classList.add('bg-[#478D47]'); }
                    if (newKnob) newKnob.classList.add('translate-x-5');
                } else {
                    if (newToggle) { newToggle.classList.remove('bg-[#478D47]'); newToggle.classList.add('bg-white'); }
                    if (newKnob) newKnob.classList.remove('translate-x-5');
                }
            };
        }

        if (this._outsideClickHandler) {
            document.removeEventListener('click', this._outsideClickHandler);
        }

        this._outsideClickHandler = (e: MouseEvent) => {
            const dropdowns = [
                { menu: 'settings-timer-menu', trigger: 'settings-timer-trigger', arrow: 'settings-timer-arrow' },
                { menu: 'settings-question-menu', trigger: 'settings-question-trigger', arrow: 'settings-question-arrow' },
                { menu: 'settings-difficulty-menu', trigger: 'settings-difficulty-trigger', arrow: 'settings-difficulty-arrow' }
            ];
            dropdowns.forEach(d => {
                const menu = document.getElementById(d.menu);
                const trigger = document.getElementById(d.trigger);
                if (menu && !menu.classList.contains('hidden')) {
                    if (!menu.contains(e.target as Node) && !trigger?.contains(e.target as Node)) {
                        this.closeDropdown(d.menu, d.arrow);
                    }
                }
            });
        };
        document.addEventListener('click', this._outsideClickHandler);

        const settingsBackBtn = document.getElementById('settings-back-btn');
        if (settingsBackBtn) {
            const newBackBtn = settingsBackBtn.cloneNode(true) as HTMLElement;
            settingsBackBtn.parentNode?.replaceChild(newBackBtn, settingsBackBtn);
            newBackBtn.onclick = () => {
                TransitionManager.transitionTo(() => this.goBackToQuizSelection());
            };
        }

        const settingsContinueBtn = document.getElementById('settings-continue-btn') as HTMLButtonElement;
        if (settingsContinueBtn) {
            settingsContinueBtn.innerHTML = i18n.t('quiz_setting.create');
            settingsContinueBtn.disabled = false;
            settingsContinueBtn.classList.remove('opacity-80', 'cursor-not-allowed');
            settingsContinueBtn.classList.add('active:translate-y-1', 'active:border-b-0', 'hover:brightness-110');

            const newContinueBtn = settingsContinueBtn.cloneNode(true) as HTMLButtonElement;
            settingsContinueBtn.parentNode?.replaceChild(newContinueBtn, settingsContinueBtn);
            newContinueBtn.onclick = () => {
                newContinueBtn.innerHTML = `<span class="material-symbols-outlined animate-spin text-xl font-bold">refresh</span> ${i18n.t('quiz_setting.creating')}`;
                newContinueBtn.disabled = true;
                newContinueBtn.classList.add('opacity-80', 'cursor-not-allowed');
                newContinueBtn.classList.remove('active:translate-y-1', 'active:border-b-0', 'hover:brightness-110');
                this.createRoom(newContinueBtn);
            };
        }
    }

    setupDropdown(triggerId: string, menuId: string, arrowId?: string) {
        const trigger = document.getElementById(triggerId);
        if (trigger) {
            const newTrigger = trigger.cloneNode(true) as HTMLElement;
            trigger.parentNode?.replaceChild(newTrigger, trigger);
            newTrigger.onclick = (e) => {
                e.stopPropagation();
                const menu = document.getElementById(menuId);
                const isHidden = menu?.classList.contains('hidden');
                this.toggleDropdownElement(menuId, arrowId, !!isHidden);
            };
        }
    }

    toggleDropdownElement(menuId: string, arrowId: string | undefined | null, show: boolean) {
        const menu = document.getElementById(menuId);
        const arrow = arrowId ? document.getElementById(arrowId) : null;
        if (!menu) return;

        if (show) {
            menu.classList.remove('hidden');
            requestAnimationFrame(() => {
                menu.classList.remove('scale-95', 'opacity-0');
                menu.classList.add('scale-100', 'opacity-100');
            });
            if (arrow) arrow.classList.add('rotate-180');
        } else {
            menu.classList.remove('scale-100', 'opacity-100');
            menu.classList.add('scale-95', 'opacity-0');
            if (arrow) arrow.classList.remove('rotate-180');
            setTimeout(() => menu.classList.add('hidden'), 200);
        }
    }

    closeDropdown(menuId: string, arrowId?: string) {
        this.toggleDropdownElement(menuId, arrowId, false);
    }

    goBackToQuizSelection() {
        this.cleanup();
        this.hideSettingsUI();
        Router.navigate('/host/select-quiz');
        this.startManager('SelectQuizManager');
    }

    async createRoom(btn?: HTMLButtonElement) {
        if (!this.selectedQuiz) return;

        let mapFile = 'map_newest_easy_nomor1.tmj';
        if (this.settingsDifficulty === 'sedang') mapFile = 'map_medium.tmj';
        if (this.settingsDifficulty === 'sulit') mapFile = 'map_hard.tmj';

        const enemyCount = this.settingsQuestionCount === 5 ? 10 : 20;
        const roomCode = this.generateRoomCode();
        const profile = authService.getStoredProfile();
        const hostId = profile ? profile.id : null;

        let questions = [...(this.selectedQuiz.questions || [])];
        questions.sort(() => Math.random() - 0.5);
        questions = questions.slice(0, this.settingsQuestionCount);

        try {
            const { data, error } = await supabaseB.from(SESSION_TABLE).insert({
                game_pin: roomCode,
                quiz_id: this.selectedQuiz.id,
                status: 'waiting',
                question_limit: this.settingsQuestionCount,
                total_time_minutes: this.settingsTimer / 60,
                difficulty: this.settingsDifficulty,
                host_id: hostId,
                created_at: new Date().toISOString(),
                current_questions: questions
            }).select().single();

            if (error) {
                console.error("Supabase Session Error:", error);
                alert(i18n.t('quiz_setting.create_failed'));
                if (btn) {
                    btn.innerHTML = i18n.t('quiz_setting.create');
                    btn.disabled = false;
                    btn.classList.remove('opacity-80', 'cursor-not-allowed');
                    btn.classList.add('active:translate-y-1', 'active:border-b-0', 'hover:brightness-110');
                }
                return;
            }

            if (data && data.id) {
                await supabaseB.from(PARTICIPANT_TABLE).insert({
                    session_id: data.id,
                    nickname: profile?.nickname || profile?.fullname || profile?.username || "Host",
                    user_id: hostId,
                    joined_at: new Date().toISOString(),
                    score: 0
                });
            }

            const options = {
                roomCode: roomCode,
                sessionId: data.id,
                difficulty: this.settingsDifficulty,
                subject: this.selectedQuiz.category.toLowerCase(),
                quizId: this.selectedQuiz.id,
                quizTitle: this.selectedQuiz.title,
                questions: questions,
                map: mapFile,
                questionCount: this.settingsQuestionCount,
                enemyCount: enemyCount,
                timer: this.settingsTimer,
                hostId: hostId,
                quizDetail: {
                    title: this.selectedQuiz.title,
                    category: this.selectedQuiz.category,
                    language: (this.selectedQuiz as any).language || 'id',
                    description: this.selectedQuiz.description,
                    creator_avatar: (this.selectedQuiz as any).creator_avatar || null,
                    creator_username: (this.selectedQuiz as any).creator_username || 'kizuko'
                }
            };

            // Before calling create room, ensure we load client if not passed previously
            if (!this.client) {
                const envServerUrl = import.meta.env.VITE_SERVER_URL;
                let host = envServerUrl;
                if (!host) {
                    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
                    host = window.location.hostname === 'localhost' ? 'ws://localhost:2567' : `${protocol}://${window.location.host}`;
                }
                this.client = new Client(host);
            }

            localStorage.setItem('currentRoomOptions', JSON.stringify(options));
            const room = await this.client.create("game_room", options);

            localStorage.setItem('currentRoomId', room.id);
            localStorage.setItem('currentSessionId', room.sessionId);
            localStorage.setItem('currentReconnectionToken', room.reconnectionToken);
            localStorage.setItem('supabaseSessionId', data.id);
            
            // To pass parameters to Phaser, we should use localStorage or window object, as we are dynamically importing game.ts
            // LocalStorage is safest for now
            localStorage.setItem('lastGameOptions', JSON.stringify(options));
            localStorage.setItem('lastSelectedQuiz', JSON.stringify(this.selectedQuiz));

            TransitionManager.close(() => {
                this.hideSettingsUI();
                this.cleanup();
                Router.navigate(`/host/${roomCode}/lobby`);
                this.startGameEngine('HostWaitingRoomScene', { room, isHost: true });
                setTimeout(() => TransitionManager.open(), 600);
            });

        } catch (e) {
            console.error("Create room error", e);
            alert(i18n.t('quiz_setting.create_error'));
            if (btn) {
                btn.innerHTML = i18n.t('quiz_setting.create');
                btn.disabled = false;
                btn.classList.remove('opacity-80', 'cursor-not-allowed');
                btn.classList.add('active:translate-y-1', 'active:border-b-0', 'hover:brightness-110');
            }
            TransitionManager.open();
        }
    }

    generateRoomCode(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    cleanup() {
        window.removeEventListener('popstate', this.handlePopState);
        if (this._outsideClickHandler) {
            document.removeEventListener('click', this._outsideClickHandler);
            this._outsideClickHandler = null;
        }
    }

    private startManager(managerName: string, data?: any) {
        if (managerName === 'SelectQuizManager') {
            import('../selectquiz/page').then(m => {
                const manager = new m.SelectQuizManager();
                manager.init(data || { client: this.client });
            });
        }
    }

    private startGameEngine(startScene: string, sceneData?: any) {
        import('../../../game').then((engine) => {
            engine.initializeGame(startScene, sceneData);
        }).catch(err => {
            console.error("Failed to load game engine:", err);
            window.location.href = '/';
        });
    }
}
