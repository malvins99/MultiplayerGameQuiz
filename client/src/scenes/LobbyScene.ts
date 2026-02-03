import Phaser from 'phaser';
import { Client, Room } from 'colyseus.js';
import { Router } from '../utils/Router';
import { getQuizzes, getCategories, Quiz } from '../data/QuizData';
import { TransitionManager } from '../utils/TransitionManager'; // Import TransitionManager

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
        this.createRoomUI = document.getElementById('create-room-ui');
        this.quizSelectionUI = document.getElementById('quiz-selection-ui');
        this.quizSettingsUI = document.getElementById('quiz-settings-ui');

        // Populate Categories (Custom & Native Fallback)
        const categories = getCategories();
        const catSelect = document.getElementById('quiz-category-select') as HTMLSelectElement; // Native hidden
        const customMenu = document.getElementById('custom-cat-menu'); // Custom container

        // 1. Populate Native (Hidden)
        if (catSelect) {
            categories.forEach(cat => {
                const opt = document.createElement('option');
                opt.value = cat;
                opt.innerText = cat;
                catSelect.appendChild(opt);
            });
        }

        // 2. Populate Custom Menu
        if (customMenu) {
            // "ALL" Option
            const allBtn = this.createCustomOption('ALL', '');
            customMenu.appendChild(allBtn);

            categories.forEach(cat => {
                const btn = this.createCustomOption(cat, cat);
                customMenu.appendChild(btn);
            });
        }
    }

    createCustomOption(label: string, value: string): HTMLElement {
        const btn = document.createElement('button');
        btn.className = "w-full text-left px-4 py-3 text-xs font-['Press_Start_2P'] hover:bg-white/10 hover:text-primary rounded-lg transition-colors text-white/70 uppercase tracking-tight flex items-center justify-between group";
        btn.innerHTML = `<span>${label}</span>`;
        btn.dataset.value = value;

        btn.onclick = () => {
            this.handleCategoryChange(value, label);
        };
        return btn;
    }

    handleCategoryChange(value: string, label: string) {
        // Update Logic State
        this.selectedCategory = value;
        this.currentPage = 1;

        // Update UI Text
        const selectedText = document.getElementById('custom-cat-selected');
        if (selectedText) selectedText.innerText = label;

        // Close Menu
        this.toggleCustomDropdown(false);

        // Update Hidden Native Select (just in case)
        const nativeSelect = document.getElementById('quiz-category-select') as HTMLSelectElement;
        if (nativeSelect) nativeSelect.value = value;

        // Visual Feedback on Active Item
        const menu = document.getElementById('custom-cat-menu');
        if (menu) {
            const btns = menu.querySelectorAll('button');
            btns.forEach(b => {
                b.classList.remove('text-primary', 'bg-white/5');
                b.classList.add('text-white/70');
                if (b.dataset.value === value) {
                    b.classList.add('text-primary', 'bg-white/5');
                    b.classList.remove('text-white/70');
                }
            });
        }

        this.applyFilters();
    }


    setupEventListeners() {
        // --- CUSTOM DROPDOWN TOGGLE (Generic) ---
        this.setupDropdown('custom-cat-trigger', 'custom-cat-menu', 'custom-cat-arrow', (val, label) => {
            this.handleCategoryChange(val, label);
        });

        // --- QUIZ SETTINGS DROPDOWNS ---

        // Timer Dropdown
        this.setupDropdown('settings-timer-trigger', 'settings-timer-menu', 'settings-timer-arrow');
        const timerOptions = document.querySelectorAll('.timer-opt');
        timerOptions.forEach(opt => {
            opt.addEventListener('click', (e) => {
                const target = e.currentTarget as HTMLElement;
                const val = parseInt(target.dataset.value || '300');
                const label = target.dataset.label || '5 Menit';

                this.settingsTimer = val;

                // Update UI
                const display = document.getElementById('settings-timer-selected');
                if (display) display.innerText = label;

                // Highlight active
                timerOptions.forEach(o => o.classList.remove('text-primary', 'bg-white/5'));
                target.classList.add('text-primary', 'bg-white/5');

                // Close menu
                this.closeDropdown('settings-timer-menu', 'settings-timer-arrow');
            });
        });

        // Question Count Dropdown
        this.setupDropdown('settings-question-trigger', 'settings-question-menu', 'settings-question-arrow');
        const questionOptions = document.querySelectorAll('.question-opt');
        questionOptions.forEach(opt => {
            opt.addEventListener('click', (e) => {
                const target = e.currentTarget as HTMLElement;
                const val = parseInt(target.dataset.value || '5');
                const label = target.dataset.label || '5 Soal';

                this.settingsQuestionCount = val;

                // Update UI
                const display = document.getElementById('settings-question-selected');
                if (display) display.innerText = label;

                // Highlight active
                questionOptions.forEach(o => o.classList.remove('text-primary', 'bg-white/5'));
                target.classList.add('text-primary', 'bg-white/5');

                // Close menu
                this.closeDropdown('settings-question-menu', 'settings-question-arrow');
            });
        });

        // Click Outside to Close All Dropdowns
        document.addEventListener('click', (e) => {
            const dropdowns = [
                { menu: 'custom-cat-menu', trigger: 'custom-cat-trigger', arrow: 'custom-cat-arrow' },
                { menu: 'settings-timer-menu', trigger: 'settings-timer-trigger', arrow: 'settings-timer-arrow' },
                { menu: 'settings-question-menu', trigger: 'settings-question-trigger', arrow: 'settings-question-arrow' }
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
        });


        // --- LOBBY UI ---
        const createRoomBtn = document.getElementById('create-room-btn');
        const joinBtn = document.getElementById('join-room-btn');
        const codeInput = document.getElementById('room-code-input') as HTMLInputElement;

        if (createRoomBtn) {
            createRoomBtn.onclick = () => {
                TransitionManager.transitionTo(() => {
                    Router.navigate('/create');
                    this.showQuizSelection();
                });
            };
        }

        if (joinBtn) {
            joinBtn.onclick = () => {
                this.handleJoinRoom(codeInput?.value);
            };
        }

        // --- QUIZ SELECTION UI ---
        const searchInput = document.getElementById('quiz-search-input') as HTMLInputElement;
        const searchBtn = document.getElementById('search-trigger-btn');
        const favBtn = document.getElementById('quiz-filter-fav-btn');
        const prevBtn = document.getElementById('prev-page-btn');
        const nextBtn = document.getElementById('next-page-btn');
        const quizBackBtn = document.getElementById('quiz-back-btn');

        if (searchInput) {
            // Remove 'input' event (Real-time). Use 'keydown' for Enter.
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.searchQuery = (e.target as HTMLInputElement).value;
                    this.currentPage = 1;
                    this.applyFilters();
                }
            });
        }

        if (searchBtn) {
            searchBtn.onclick = () => {
                const val = searchInput ? searchInput.value : '';
                this.searchQuery = val;
                this.currentPage = 1;
                this.applyFilters();
            }
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
                TransitionManager.transitionTo(() => {
                    Router.navigate('/');
                    this.showLobby();
                });
            };
        }

        // --- QUIZ SETTINGS UI ---
        const settingsBackBtn = document.getElementById('settings-back-btn');
        const settingsContinueBtn = document.getElementById('settings-continue-btn');
        const diffBtns = document.querySelectorAll('.settings-diff-btn');

        if (settingsBackBtn) {
            settingsBackBtn.onclick = () => {
                TransitionManager.transitionTo(() => {
                    this.showQuizSelection(); // Go back to selection, don't change URL
                });
            };
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
            settingsContinueBtn.onclick = () => {
                TransitionManager.transitionTo(() => {
                    this.createRoom();
                });
            };
        }
    }

    // Helper for Dropdowns
    setupDropdown(triggerId: string, menuId: string, arrowId?: string, onSelect?: (val: string, label: string) => void) {
        const trigger = document.getElementById(triggerId);
        if (trigger) {
            trigger.onclick = (e) => {
                e.stopPropagation();

                const menu = document.getElementById(menuId);
                const arrow = arrowId ? document.getElementById(arrowId) : null;
                const isHidden = menu?.classList.contains('hidden');

                // Close others? For now, we rely on click-outside to close others or just toggle this one.
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

    // OLD METHOD, replaced by toggleDropdownElement but kept for existing calls if any
    toggleCustomDropdown(show: boolean) {
        this.toggleDropdownElement('custom-cat-menu', 'custom-cat-arrow', show);
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

            // Determine styling based on category - UNIFIED GREEN THEME for badge text/border, mostly neutral for sleek look
            // User requested: "jagan gunakan style seperti itu... gunakan saja font pixel... sesuaikan warna"
            // We'll use the Primary Green (#00ff55) as the accent for everything to look professional.
            let badgeColor = 'bg-primary/10 text-primary border border-primary/20';

            // "Maju ke depan" (Scale Up) - REMOVED per user request (Round 3) "hanya hover warna saja"
            // Simple border color change, no layout shift.
            card.className = "group bg-surface-dark border border-white/5 p-6 rounded-3xl hover:border-primary hover:bg-white/5 transition-colors duration-200 cursor-pointer relative overflow-hidden";

            card.innerHTML = `
                <!-- Background Gradient (Subtle Green on Hover) -->
                <div class="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                <div class="relative z-10 flex justify-between items-start mb-6">
                    <!-- Pixel Font Badge -->
                    <span class="px-3 py-2 ${badgeColor} text-[10px] font-bold rounded-lg uppercase tracking-wider font-['Press_Start_2P'] leading-none">${quiz.category}</span>
                    
                    <button class="fav-btn w-10 h-10 rounded-full bg-black/20 hover:bg-primary/20 flex items-center justify-center transition-all relative z-20" data-id="${quiz.id}">
                        <span class="material-symbols-outlined text-[20px] ${isFav ? 'text-red-500 fill-current' : 'text-white/20 fill-current group-hover:text-red-400'} transition-colors">favorite</span>
                    </button>
                </div>
                
                <h3 class="relative z-10 text-lg font-bold text-white mb-6 group-hover:text-primary transition-colors leading-relaxed h-14 line-clamp-2">${quiz.title}</h3>
                
                <div class="relative z-10 flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
                    <div class="flex items-center gap-2 text-white/40 group-hover:text-primary/80 transition-colors text-xs font-bold uppercase tracking-wide font-['Press_Start_2P']">
                        <span class="material-symbols-outlined text-sm">quiz</span>
                        <span>${quiz.questionCount} Qs</span>
                    </div>
                    <div class="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center -mr-2 group-hover:bg-primary group-hover:text-black transition-all duration-300">
                        <span class="material-symbols-outlined text-sm">arrow_forward</span>
                    </div>
                </div>
            `;

            // Card Click -> Settings
            card.onclick = (e) => {
                if (!(e.target as HTMLElement).closest('.fav-btn')) {
                    TransitionManager.transitionTo(() => {
                        this.openSettings(quiz);
                    });
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

            // Wrap scene start in transition (if not already managed by onclick wrapper)
            // But since handleJoinRoom is async called from onclick...
            // We should wrap the specific UI switch part.
            // Let's modify the onclick handler for joinBtn instead of here to be consistent.

            TransitionManager.transitionTo(() => {
                this.scene.start('WaitingRoomScene', { room, isHost: false });
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
