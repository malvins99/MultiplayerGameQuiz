import Phaser from 'phaser';
import { Client, Room } from 'colyseus.js';
import { Router } from '../utils/Router';
import { getQuizzes, getCategories, Quiz } from '../data/QuizData';

export class LobbyScene extends Phaser.Scene {
    client!: Client;

    // Quiz Selection State
    quizzes: Quiz[] = [];
    filteredQuizzes: Quiz[] = [];
    currentPage: number = 1;
    itemsPerPage: number = 6;
    favorites: Set<string> = new Set();

    // Filters
    searchQuery: string = '';
    selectedCategory: string = '';
    showFavoritesOnly: boolean = false;

    // Settings State
    selectedQuiz: Quiz | null = null;
    settingsDifficulty: string = 'mudah';
    settingsTimer: number = 300;
    settingsQuestionCount: number = 5;

    // UI Elements
    lobbyUI: HTMLElement | null = null;
    createRoomUI: HTMLElement | null = null; // Legacy, kept just in case but we use new UI
    quizSelectionUI: HTMLElement | null = null;
    quizSettingsUI: HTMLElement | null = null;

    constructor() {
        super('LobbyScene');
    }

    create() {
        this.initializeClient();
        this.initializeUI();
        this.setupEventListeners();
        this.loadFavorites();

        // Initial data load
        this.quizzes = getQuizzes();
        this.applyFilters(); // Load initial grid

        // Check routing on load
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
        this.lobbyUI = document.getElementById('lobby-ui');
        this.createRoomUI = document.getElementById('create-room-ui');
        this.quizSelectionUI = document.getElementById('quiz-selection-ui');
        this.quizSettingsUI = document.getElementById('quiz-settings-ui');

        // Populate Categories
        const catSelect = document.getElementById('quiz-category-select') as HTMLSelectElement;
        if (catSelect) {
            const categories = getCategories();
            categories.forEach(cat => {
                const opt = document.createElement('option');
                opt.value = cat;
                opt.innerText = cat;
                catSelect.appendChild(opt);
            });
        }
    }

    setupEventListeners() {
        // --- LOBBY UI ---
        const createRoomBtn = document.getElementById('create-room-btn');
        const joinBtn = document.getElementById('join-room-btn');
        const codeInput = document.getElementById('room-code-input') as HTMLInputElement;

        if (createRoomBtn) {
            createRoomBtn.onclick = () => {
                Router.navigate('/create');
                this.showQuizSelection();
            };
        }

        if (joinBtn) {
            joinBtn.onclick = () => this.handleJoinRoom(codeInput?.value);
        }

        // --- QUIZ SELECTION UI ---
        const searchInput = document.getElementById('quiz-search-input') as HTMLInputElement;
        const catSelect = document.getElementById('quiz-category-select') as HTMLSelectElement;
        const favBtn = document.getElementById('quiz-filter-fav-btn');
        const prevBtn = document.getElementById('prev-page-btn');
        const nextBtn = document.getElementById('next-page-btn');
        const quizBackBtn = document.getElementById('quiz-back-btn');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => { // Real-time search preferred over Enter only
                this.searchQuery = (e.target as HTMLInputElement).value;
                this.currentPage = 1;
                this.applyFilters();
            });
        }

        if (catSelect) {
            catSelect.addEventListener('change', (e) => {
                this.selectedCategory = (e.target as HTMLSelectElement).value;
                this.currentPage = 1;
                this.applyFilters();
            });
        }

        if (favBtn) {
            favBtn.onclick = () => {
                this.showFavoritesOnly = !this.showFavoritesOnly;
                favBtn.querySelector('span')?.classList.toggle('text-red-500', this.showFavoritesOnly);
                this.currentPage = 1;
                this.applyFilters();
            };
        }

        if (prevBtn) {
            prevBtn.onclick = () => {
                if (this.currentPage > 1) {
                    this.currentPage--;
                    this.renderQuizGrid();
                }
            };
        }

        if (nextBtn) {
            nextBtn.onclick = () => {
                const totalPages = Math.ceil(this.filteredQuizzes.length / this.itemsPerPage);
                if (this.currentPage < totalPages) {
                    this.currentPage++;
                    this.renderQuizGrid();
                }
            };
        }

        if (quizBackBtn) {
            quizBackBtn.onclick = () => {
                Router.navigate('/');
                this.showLobby();
            };
        }

        // --- QUIZ SETTINGS UI ---
        const settingsBackBtn = document.getElementById('settings-back-btn');
        const settingsContinueBtn = document.getElementById('settings-continue-btn');
        const timerSelect = document.getElementById('settings-timer') as HTMLSelectElement;
        const questionCountSelect = document.getElementById('settings-question-count') as HTMLSelectElement;
        const diffBtns = document.querySelectorAll('.settings-diff-btn');

        if (settingsBackBtn) {
            settingsBackBtn.onclick = () => {
                this.showQuizSelection(); // Go back to selection, don't change URL
            };
        }

        if (timerSelect) {
            timerSelect.addEventListener('change', (e) => {
                this.settingsTimer = parseInt((e.target as HTMLSelectElement).value);
            });
        }

        if (questionCountSelect) {
            questionCountSelect.addEventListener('change', (e) => {
                this.settingsQuestionCount = parseInt((e.target as HTMLSelectElement).value);
            });
        }

        diffBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Style update
                diffBtns.forEach(b => {
                    b.classList.remove('border-primary', 'border-secondary', 'border-accent');
                    b.classList.add('border-white/10');
                });
                const diff = (btn as HTMLElement).dataset.diff || 'mudah';
                this.settingsDifficulty = diff;

                const color = diff === 'mudah' ? 'border-primary' : diff === 'sedang' ? 'border-secondary' : 'border-accent';
                btn.classList.remove('border-white/10');
                btn.classList.add(color);
            });
        });

        if (settingsContinueBtn) {
            settingsContinueBtn.onclick = () => this.createRoom();
        }
    }

    // --- DATA & LOGIC ---

    loadFavorites() {
        const stored = localStorage.getItem('quiz_favorites');
        if (stored) {
            this.favorites = new Set(JSON.parse(stored));
        }
    }

    toggleFavorite(quizId: string) {
        if (this.favorites.has(quizId)) {
            this.favorites.delete(quizId);
        } else {
            this.favorites.add(quizId);
        }
        localStorage.setItem('quiz_favorites', JSON.stringify(Array.from(this.favorites)));

        // Re-render to update icon state
        this.renderQuizGrid();
    }

    applyFilters() {
        this.filteredQuizzes = this.quizzes.filter(q => {
            const matchesSearch = q.title.toLowerCase().includes(this.searchQuery.toLowerCase());
            const matchesCategory = this.selectedCategory ? q.category === this.selectedCategory : true;
            const matchesFav = this.showFavoritesOnly ? this.favorites.has(q.id) : true;
            return matchesSearch && matchesCategory && matchesFav;
        });

        this.renderQuizGrid();
    }

    renderQuizGrid() {
        const grid = document.getElementById('quiz-grid');
        const pageNumbers = document.getElementById('pagination-numbers');
        const prevBtn = document.getElementById('prev-page-btn') as HTMLButtonElement;
        const nextBtn = document.getElementById('next-page-btn') as HTMLButtonElement;

        if (!grid) return;

        grid.innerHTML = '';

        // Pagination Logic
        const totalPages = Math.ceil(this.filteredQuizzes.length / this.itemsPerPage);
        if (this.currentPage > totalPages) this.currentPage = Math.max(1, totalPages);

        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        const pageItems = this.filteredQuizzes.slice(start, end);

        // Render Cards
        pageItems.forEach(quiz => {
            const isFav = this.favorites.has(quiz.id);
            const card = document.createElement('div');

            // Determine styling based on category
            let badgeColor = 'bg-primary/10 text-primary';
            if (quiz.category === 'Matematika') badgeColor = 'bg-indigo-900/40 text-indigo-400 border border-indigo-500/30';
            else if (quiz.category === 'Teknologi') badgeColor = 'bg-emerald-900/40 text-emerald-400 border border-emerald-500/30';
            else if (quiz.category === 'Sains') badgeColor = 'bg-amber-900/40 text-amber-400 border border-amber-500/30';
            else badgeColor = 'bg-rose-900/40 text-rose-400 border border-rose-500/30';

            card.className = "group bg-surface-dark border-2 border-white/5 p-5 rounded-xl hover:border-white/20 transition-all duration-300 card-hover cursor-pointer relative";
            card.innerHTML = `
                <div class="flex justify-between items-start mb-4">
                    <span class="px-3 py-1 ${badgeColor} text-[10px] font-bold rounded-full uppercase tracking-wider">${quiz.category}</span>
                    <button class="fav-btn text-white/20 hover:text-red-500 transition-colors relative z-10" data-id="${quiz.id}">
                        <span class="material-symbols-outlined ${isFav ? 'text-red-500' : ''}">favorite</span>
                    </button>
                </div>
                <h3 class="text-lg font-bold text-white mb-6 group-hover:text-primary transition-colors line-clamp-2 h-14">${quiz.title}</h3>
                <div class="flex items-center justify-between pt-4 border-t border-white/5">
                    <div class="flex items-center gap-1.5 text-white/40 text-xs font-bold uppercase">
                        <span class="material-symbols-outlined text-sm">quiz</span>
                        <span>${quiz.questionCount} Quest</span>
                    </div>
                    <div class="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-black transition-all">
                        <span class="material-symbols-outlined text-sm">arrow_forward</span>
                    </div>
                </div>
            `;

            // Card Click -> Settings
            card.onclick = (e) => {
                if (!(e.target as HTMLElement).closest('.fav-btn')) {
                    this.openSettings(quiz);
                }
            };

            // Favorite Click
            const favBtn = card.querySelector('.fav-btn');
            favBtn?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleFavorite(quiz.id);
            });

            grid.appendChild(card);
        });

        // Update Pagination UI
        if (pageNumbers) {
            pageNumbers.innerHTML = `<span class="px-4 py-2 bg-primary text-black font-bold rounded-lg text-sm">${this.currentPage} / ${totalPages || 1}</span>`;
        }

        if (prevBtn) prevBtn.disabled = this.currentPage === 1;
        if (nextBtn) nextBtn.disabled = this.currentPage === totalPages || totalPages === 0;
    }

    openSettings(quiz: Quiz) {
        this.selectedQuiz = quiz;

        const titleEl = document.getElementById('settings-quiz-title');
        const descEl = document.getElementById('settings-quiz-desc');

        if (titleEl) titleEl.innerText = quiz.title;
        if (descEl) descEl.innerText = quiz.description;

        // Reset difficulty buttons
        const diffBtns = document.querySelectorAll('.settings-diff-btn');
        if (diffBtns.length > 0) (diffBtns[0] as HTMLElement).click();

        this.showSettings();
    }

    // --- NAVIGATION ---

    handleRouting() {
        const path = Router.getPath();

        if (path === '/' || path === '') {
            this.showLobby();
        } else if (path === '/create') {
            this.showQuizSelection();
        } else {
            Router.replace('/');
            this.showLobby();
        }
    }

    showLobby() {
        this.toggleUI('lobby-ui');
    }

    showQuizSelection() {
        this.toggleUI('quiz-selection-ui');
        this.renderQuizGrid(); // Ensure grid is rendered
    }

    showSettings() {
        this.toggleUI('quiz-settings-ui');
    }

    toggleUI(id: string) {
        [this.lobbyUI, this.quizSelectionUI, this.quizSettingsUI, this.createRoomUI].forEach(el => {
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
            this.scene.start('WaitingRoomScene', { room, isHost: false });
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

            // Hide all overlays
            this.toggleUI(''); // Hides everything since '' matches nothing

            // Navigate to Waiting Room
            Router.navigate('/waiting');
            this.scene.start('WaitingRoomScene', { room, isHost: true });
        } catch (e) {
            console.error("Create room error", e);
            alert("Error creating room. Check console.");
        }
    }
}
