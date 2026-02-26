import Phaser from 'phaser';
import { Client, Room } from 'colyseus.js';
import { Router } from '../utils/Router';
import { Quiz } from '../data/QuizData';
import { TransitionManager } from '../utils/TransitionManager';
import { supabaseB, SESSION_TABLE, PARTICIPANT_TABLE } from '../lib/supabaseB';
import { authService } from '../services/AuthService';
import { RoomService } from '../services/RoomService';

export class QuizSettingScene extends Phaser.Scene {
    client!: Client;

    // Settings State
    selectedQuiz: Quiz | null = null;
    settingsDifficulty: string = 'mudah';
    settingsTimer: number = 300;
    settingsQuestionCount: number = 5;
    soundEnabled: boolean = false;

    // UI Element
    quizSettingsUI: HTMLElement | null = null;

    constructor() {
        super('QuizSettingScene');
    }

    init(data: { quiz: Quiz; client: Client }) {
        this.selectedQuiz = data.quiz;
        this.client = data.client;
    }

    create() {
        this.quizSettingsUI = document.getElementById('quiz-settings-ui');

        // Show settings UI
        this.showSettingsUI();

        // Setup event listeners
        this.setupEventListeners();

        // Set the quiz title
        const titleEl = document.getElementById('settings-quiz-title');
        if (titleEl && this.selectedQuiz) {
            titleEl.innerText = this.selectedQuiz.title;
        }

        // Update URL
        Router.navigate('/host/quiz-setting');

        // Listen for browser back
        window.addEventListener('popstate', this.handlePopState);
    }

    handlePopState = () => {
        this.goBackToQuizSelection();
    };

    showSettingsUI() {
        // Hide all other UIs
        const uiIds = ['lobby-ui', 'quiz-selection-ui', 'create-room-ui'];
        uiIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add('hidden');
        });

        // Show quiz settings UI
        if (this.quizSettingsUI) {
            this.quizSettingsUI.classList.remove('hidden');
        }
    }

    hideSettingsUI() {
        if (this.quizSettingsUI) {
            this.quizSettingsUI.classList.add('hidden');
        }
    }

    setupEventListeners() {
        // --- DROPDOWN SETUP ---

        // Difficulty Dropdown
        this.setupDropdown('settings-difficulty-trigger', 'settings-difficulty-menu', 'settings-difficulty-arrow');
        const diffOptions = document.querySelectorAll('.diff-opt');
        diffOptions.forEach(opt => {
            // Clone and replace to remove old listeners
            const newOpt = opt.cloneNode(true) as HTMLElement;
            opt.parentNode?.replaceChild(newOpt, opt);

            newOpt.addEventListener('click', (e) => {
                const target = e.currentTarget as HTMLElement;
                const val = target.dataset.value || 'mudah';
                const label = target.dataset.label || 'Mudah';

                this.settingsDifficulty = val;

                // Update UI
                const display = document.getElementById('settings-difficulty-selected');
                if (display) display.innerText = label;

                // Highlight active
                document.querySelectorAll('.diff-opt').forEach(o => o.classList.remove('text-primary', 'bg-white/5'));
                target.classList.add('text-primary', 'bg-white/5');

                // Close menu
                this.closeDropdown('settings-difficulty-menu', 'settings-difficulty-arrow');
            });
        });

        // Timer Dropdown
        this.setupDropdown('settings-timer-trigger', 'settings-timer-menu', 'settings-timer-arrow');
        const timerOptions = document.querySelectorAll('.timer-opt');
        timerOptions.forEach(opt => {
            const newOpt = opt.cloneNode(true) as HTMLElement;
            opt.parentNode?.replaceChild(newOpt, opt);

            newOpt.addEventListener('click', (e) => {
                const target = e.currentTarget as HTMLElement;
                const val = parseInt(target.dataset.value || '300');
                const label = target.dataset.label || '5 Menit';

                this.settingsTimer = val;

                const display = document.getElementById('settings-timer-selected');
                if (display) display.innerText = label;

                timerOptions.forEach(o => o.classList.remove('text-primary', 'bg-white/5'));
                target.classList.add('text-primary', 'bg-white/5');

                this.closeDropdown('settings-timer-menu', 'settings-timer-arrow');
            });
        });

        // Question Count Dropdown
        this.setupDropdown('settings-question-trigger', 'settings-question-menu', 'settings-question-arrow');
        const questionOptions = document.querySelectorAll('.question-opt');
        questionOptions.forEach(opt => {
            const newOpt = opt.cloneNode(true) as HTMLElement;
            opt.parentNode?.replaceChild(newOpt, opt);

            newOpt.addEventListener('click', (e) => {
                const target = e.currentTarget as HTMLElement;
                const val = parseInt(target.dataset.value || '5');
                const label = target.dataset.label || '5 Soal';

                this.settingsQuestionCount = val;

                const display = document.getElementById('settings-question-selected');
                if (display) display.innerText = label;

                questionOptions.forEach(o => o.classList.remove('text-primary', 'bg-white/5'));
                target.classList.add('text-primary', 'bg-white/5');

                this.closeDropdown('settings-question-menu', 'settings-question-arrow');
            });
        });

        // Sound Toggle
        const soundContainer = document.getElementById('sound-toggle-container');

        if (soundContainer) {
            // Clone to remove old listeners
            const newContainer = soundContainer.cloneNode(true) as HTMLElement;
            soundContainer.parentNode?.replaceChild(newContainer, soundContainer);

            // Re-select inner elements from the new container
            const newToggle = newContainer.querySelector('#sound-toggle-btn') as HTMLElement;
            const newKnob = newContainer.querySelector('#sound-toggle-knob') as HTMLElement;

            newContainer.onclick = () => {
                this.soundEnabled = !this.soundEnabled;

                if (this.soundEnabled) {
                    if (newToggle) {
                        newToggle.classList.remove('bg-white/10');
                        newToggle.classList.add('bg-[#34c759]');
                    }
                    if (newKnob) newKnob.classList.add('translate-x-6');
                } else {
                    if (newToggle) {
                        newToggle.classList.remove('bg-[#34c759]');
                        newToggle.classList.add('bg-white/10');
                    }
                    if (newKnob) newKnob.classList.remove('translate-x-6');
                }

                console.log("Sound Enabled:", this.soundEnabled);
            };
        }

        // Click Outside to Close All Dropdowns
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

        // --- BACK BUTTON ---
        const settingsBackBtn = document.getElementById('settings-back-btn');
        if (settingsBackBtn) {
            // Clone to remove old listeners
            const newBackBtn = settingsBackBtn.cloneNode(true) as HTMLElement;
            settingsBackBtn.parentNode?.replaceChild(newBackBtn, settingsBackBtn);

            newBackBtn.onclick = () => {
                TransitionManager.transitionTo(() => {
                    this.goBackToQuizSelection();
                });
            };
        }

        // --- BUAT ROOM BUTTON ---
        const settingsContinueBtn = document.getElementById('settings-continue-btn');
        if (settingsContinueBtn) {
            // Clone to remove old listeners
            const newContinueBtn = settingsContinueBtn.cloneNode(true) as HTMLElement;
            settingsContinueBtn.parentNode?.replaceChild(newContinueBtn, settingsContinueBtn);

            newContinueBtn.onclick = () => {
                // Use close() to ensure screen stays black during async room creation.
                // Replaces transitionTo() which would auto-open prematurely.
                TransitionManager.close(() => {
                    this.createRoom();
                });
            };
        }
    }

    private _outsideClickHandler: ((e: MouseEvent) => void) | null = null;

    // --- DROPDOWN HELPERS ---

    setupDropdown(triggerId: string, menuId: string, arrowId?: string) {
        const trigger = document.getElementById(triggerId);
        if (trigger) {
            // Clone to remove old listeners
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
            setTimeout(() => {
                menu.classList.add('hidden');
            }, 200);
        }
    }

    closeDropdown(menuId: string, arrowId?: string) {
        this.toggleDropdownElement(menuId, arrowId, false);
    }

    // --- NAVIGATION ---

    goBackToQuizSelection() {
        this.cleanup();
        this.hideSettingsUI();
        this.scene.start('SelectQuizScene', { client: this.client });
    }

    // --- ROOM CREATION ---

    async createRoom() {
        if (!this.selectedQuiz) return;

        try {
            const { room, options } = await RoomService.createRoom(this.client, {
                difficulty: this.settingsDifficulty,
                questionCount: this.settingsQuestionCount,
                timer: this.settingsTimer,
                quiz: this.selectedQuiz
            });

            // Save settings for Restart functionality
            this.registry.set('lastGameOptions', options);
            this.registry.set('lastSelectedQuiz', this.selectedQuiz); // Save quiz too

            // Hide all overlays
            this.hideSettingsUI();

            // Navigate to Waiting Room
            this.cleanup();
            Router.navigate('/host/lobby');
            this.scene.start('HostWaitingRoomScene', { room, isHost: true });

            // Manually open the iris after the new scene is kicked off.
            setTimeout(() => {
                TransitionManager.open();
            }, 600);

        } catch (e) {
            console.error("Create room error", e);
            alert("Error creating room. Check console.");
            // If error, we might be stuck on black screen, so force open
            TransitionManager.open();
        }
    }

    // --- CLEANUP ---

    cleanup() {
        window.removeEventListener('popstate', this.handlePopState);
        if (this._outsideClickHandler) {
            document.removeEventListener('click', this._outsideClickHandler);
            this._outsideClickHandler = null;
        }
    }

    shutdown() {
        this.cleanup();
    }
}
