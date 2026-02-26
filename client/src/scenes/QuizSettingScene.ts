import Phaser from 'phaser';
import { Client, Room } from 'colyseus.js';
import { Router } from '../utils/Router';
import { Quiz } from '../data/QuizData';
import { TransitionManager } from '../utils/TransitionManager';
import { RoomService } from '../services/RoomService'; // Gunakan Service

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
    private _outsideClickHandler: ((e: MouseEvent) => void) | null = null;

    constructor() {
        super('QuizSettingScene');
    }

    init(data: { quiz: Quiz; client: Client }) {
        this.selectedQuiz = data.quiz;
        this.client = data.client;
    }

    create() {
        this.quizSettingsUI = document.getElementById('quiz-settings-ui');

        this.showSettingsUI();
        this.setupEventListeners();

        const titleEl = document.getElementById('settings-quiz-title');
        if (titleEl && this.selectedQuiz) {
            titleEl.innerText = this.selectedQuiz.title;
        }

        Router.navigate('/host/quiz-setting');
        window.addEventListener('popstate', this.handlePopState);
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
        this.setupDropdown('settings-difficulty-trigger', 'settings-difficulty-menu', 'settings-difficulty-arrow', 'diff-opt', (val) => {
            this.settingsDifficulty = val;
            const display = document.getElementById('settings-difficulty-selected');
            if (display) display.innerText = val.charAt(0).toUpperCase() + val.slice(1);
        });

        this.setupDropdown('settings-timer-trigger', 'settings-timer-menu', 'settings-timer-arrow', 'timer-opt', (val) => {
            this.settingsTimer = parseInt(val);
        });

        this.setupDropdown('settings-question-trigger', 'settings-question-menu', 'settings-question-arrow', 'question-opt', (val) => {
            this.settingsQuestionCount = parseInt(val);
        });

        // Sound Toggle
        const soundContainer = document.getElementById('sound-toggle-container');
        if (soundContainer) {
            soundContainer.onclick = () => {
                this.soundEnabled = !this.soundEnabled;
                const toggle = document.getElementById('sound-toggle-btn');
                const knob = document.getElementById('sound-toggle-knob');
                
                if (this.soundEnabled) {
                    toggle?.classList.replace('bg-white/10', 'bg-[#34c759]');
                    knob?.classList.add('translate-x-6');
                } else {
                    toggle?.classList.replace('bg-[#34c759]', 'bg-white/10');
                    knob?.classList.remove('translate-x-6');
                }
            };
        }

        // --- BUTTONS ---
        const backBtn = document.getElementById('settings-back-btn');
        if (backBtn) backBtn.onclick = () => {
            TransitionManager.transitionTo(() => this.goBackToQuizSelection());
        };

        const continueBtn = document.getElementById('settings-continue-btn');
        if (continueBtn) continueBtn.onclick = () => {
            TransitionManager.close(() => this.createRoom());
        };

        // Click Outside Handler
        this._outsideClickHandler = (e: MouseEvent) => {
            const menus = ['settings-timer-menu', 'settings-question-menu', 'settings-difficulty-menu'];
            menus.forEach(m => {
                const el = document.getElementById(m);
                if (el && !el.contains(e.target as Node)) this.closeDropdown(m);
            });
        };
        document.addEventListener('click', this._outsideClickHandler);
    }

    // --- LOGIKA PEMBUATAN ROOM (CLEAN VERSION) ---

    async createRoom() {
        if (!this.selectedQuiz) return;

        try {
            // Gunakan RoomService untuk menghandle sinkronisasi Supabase & Colyseus secara internal
            const { room, options } = await RoomService.createRoom(this.client, {
                difficulty: this.settingsDifficulty,
                questionCount: this.settingsQuestionCount,
                timer: this.settingsTimer,
                quiz: this.selectedQuiz
            });

            // Simpan state untuk fitur Restart
            this.registry.set('lastGameOptions', options);
            this.registry.set('lastSelectedQuiz', this.selectedQuiz);

            this.hideSettingsUI();
            this.cleanup();
            
            Router.navigate('/host/lobby');
            this.scene.start('HostWaitingRoomScene', { room, isHost: true });

            setTimeout(() => TransitionManager.open(), 600);

        } catch (e) {
            console.error("Gagal membuat room:", e);
            alert("Terjadi kesalahan saat membuat sesi game.");
            TransitionManager.open();
        }
    }

    // --- HELPERS ---

    setupDropdown(triggerId: string, menuId: string, arrowId: string, optClass: string, onSelect: (val: string) => void) {
        const trigger = document.getElementById(triggerId);
        if (!trigger) return;

        trigger.onclick = (e) => {
            e.stopPropagation();
            const menu = document.getElementById(menuId);
            const isHidden = menu?.classList.contains('hidden');
            this.toggleDropdownElement(menuId, arrowId, !!isHidden);
        };

        document.querySelectorAll(`.${optClass}`).forEach(opt => {
            (opt as HTMLElement).onclick = (e) => {
                const val = (e.currentTarget as HTMLElement).dataset.value || '';
                onSelect(val);
                this.closeDropdown(menuId, arrowId);
            };
        });
    }

    toggleDropdownElement(menuId: string, arrowId: string, show: boolean) {
        const menu = document.getElementById(menuId);
        const arrow = document.getElementById(arrowId);
        if (!menu) return;

        if (show) {
            menu.classList.remove('hidden');
            arrow?.classList.add('rotate-180');
        } else {
            menu.classList.add('hidden');
            arrow?.classList.remove('rotate-180');
        }
    }

    closeDropdown(menuId: string, arrowId?: string) {
        this.toggleDropdownElement(menuId, arrowId || '', false);
    }

    goBackToQuizSelection() {
        this.cleanup();
        this.hideSettingsUI();
        this.scene.start('SelectQuizScene', { client: this.client });
    }

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