import Phaser from 'phaser';
import { Client } from 'colyseus.js';
import { Router } from '../../../utils/Router';
import { Quiz, fetchQuizzesPaginated, fetchCategoriesWithRaw, toggleFavoriteInSupabase, fetchUserFavorites } from '../../../data/QuizData';
import { TransitionManager } from '../../../utils/TransitionManager';
import { authService } from '../../../services/auth/AuthService';

export class SelectQuizScene extends Phaser.Scene {
    client!: Client;

    // Quiz Selection State (Server-Side Pagination)
    pageQuizzes: Quiz[] = []; // quizzes for current page only
    currentPage: number = 1;
    itemsPerPage: number = 9;
    totalPages: number = 1;
    totalCount: number = 0;
    favorites: Set<string> = new Set();
    rawCategoryMap: Map<string, string> = new Map(); // display label -> raw DB value

    // Filters
    searchQuery: string = '';
    selectedCategory: string = '';
    showFavoritesOnly: boolean = false;
    showMyQuizzesOnly: boolean = false;

    // UI Element
    quizSelectionUI: HTMLElement | null = null;
    isLoading: boolean = false;
    tooltip: HTMLElement | null = null;

    constructor() {
        super('SelectQuizScene');
    }

    init(data: { client: Client }) {
        this.client = data.client;
    }

    create() {
        this.quizSelectionUI = document.getElementById('quiz-selection-ui');

        // Hide UI initially to prevent flash
        this.hideAllUI();

        // Extra safety: Force hide lobby-ui immediately
        const lobbyUI = document.getElementById('lobby-ui');
        if (lobbyUI) lobbyUI.classList.add('hidden');

        this.createTooltip();
        this.setupEventListeners();
        // this.loadFavorites(); // REMOVED

        // Show UI
        this.showQuizSelection();

        // URL
        Router.navigate('/host/select-quiz');

        // Listen for browser back
        window.addEventListener('popstate', this.handlePopState);

        // Load quiz data from Supabase (async)
        this.loadQuizData();
    }

    async loadQuizData() {
        this.isLoading = true;
        this.showLoadingState();

        try {
            // Fetch categories and user favorites in parallel
            const profile = authService.getStoredProfile();
            const promises: any[] = [
                fetchCategoriesWithRaw()
            ];

            if (profile) {
                promises.push(fetchUserFavorites(profile.id));
            }

            const results = await Promise.all(promises);
            const categoryPairs = results[0] as { raw: string; display: string }[];
            const userFavorites = profile ? results[1] : [];

            this.favorites = new Set(userFavorites);

            // Build raw category map (display -> raw) for server-side filter
            this.rawCategoryMap.clear();
            categoryPairs.forEach(c => this.rawCategoryMap.set(c.display, c.raw));

            // Populate category dropdown with display labels
            this.populateCategories(categoryPairs.map(c => c.display));

            // Fetch first page of quizzes from server
            await this.fetchPage();
        } catch (err) {
            console.error('Failed to load quiz data:', err);
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Fetch quizzes for the current page from the server (offset pagination).
     */
    async fetchPage() {
        this.isLoading = true;
        this.showLoadingState();

        try {
            const profile = authService.getStoredProfile();

            // Reverse-map the displayed category back to raw DB value
            let rawCategory: string | undefined;
            if (this.selectedCategory) {
                rawCategory = this.rawCategoryMap.get(this.selectedCategory) || undefined;
            }

            const result = await fetchQuizzesPaginated({
                page: this.currentPage,
                limit: this.itemsPerPage,
                search: this.searchQuery || undefined,
                category: rawCategory,
                favoriteIds: this.showFavoritesOnly ? Array.from(this.favorites) : undefined,
                creatorId: this.showMyQuizzesOnly && profile ? profile.id : undefined,
            });

            this.pageQuizzes = result.quizzes;
            this.totalPages = result.totalPages;
            this.totalCount = result.totalCount;
            this.currentPage = result.currentPage;

            this.renderQuizGrid();
        } catch (err) {
            console.error('Failed to fetch page:', err);
        } finally {
            this.isLoading = false;
        }
    }

    showLoadingState() {
        const grid = document.getElementById('quiz-grid');
        if (grid) {
            grid.innerHTML = `
                <div class="col-span-full flex flex-col items-center justify-center py-16 gap-4">
                    <div class="w-10 h-10 border-4 border-[#1C4D8D]/30 border-t-[#4988C4] rounded-full animate-spin"></div>
                    <p class="text-white/50 font-['Retro_Gaming'] text-lg">Loading quizzes...</p>
                </div>
            `;
        }
    }

    handlePopState = () => {
        this.goBackToLobby();
    };

    populateCategories(categories: string[]) {
        const catSelect = document.getElementById('quiz-category-select') as HTMLSelectElement;
        const customMenu = document.getElementById('custom-cat-menu');

        // Clear existing options to avoid duplicates
        if (catSelect) catSelect.innerHTML = '';
        if (customMenu) customMenu.innerHTML = '';

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
        btn.className = "w-full text-left px-4 py-3 text-lg font-['Retro_Gaming'] hover:bg-white/10 hover:text-[#4988C4] rounded-lg transition-colors text-white/70 uppercase tracking-tight flex items-center justify-between group";
        btn.innerHTML = `<span>${label}</span>`;
        btn.dataset.value = value;

        btn.onclick = () => {
            this.handleCategoryChange(value, label);
        };
        return btn;
    }

    handleCategoryChange(value: string, label: string) {
        this.selectedCategory = value;
        this.currentPage = 1;

        const selectedText = document.getElementById('custom-cat-selected');
        if (selectedText) selectedText.innerText = label;

        this.toggleCustomDropdown(false);

        const nativeSelect = document.getElementById('quiz-category-select') as HTMLSelectElement;
        if (nativeSelect) nativeSelect.value = value;

        const menu = document.getElementById('custom-cat-menu');
        if (menu) {
            const btns = menu.querySelectorAll('button');
            btns.forEach(b => {
                b.classList.remove('text-[#4988C4]', 'bg-white/5');
                b.classList.add('text-white/70');
                if (b.dataset.value === value) {
                    b.classList.add('text-[#4988C4]', 'bg-white/5');
                    b.classList.remove('text-white/70');
                }
            });
        }

        this.applyFilters();
    }

    setupEventListeners() {
        // --- CUSTOM DROPDOWN TOGGLE ---
        this.setupDropdown('custom-cat-trigger', 'custom-cat-menu', 'custom-cat-arrow', (val, label) => {
            this.handleCategoryChange(val, label);
        });

        // Click Outside to Close Category Dropdown
        this._outsideClickHandler = (e: MouseEvent) => {
            const dropdowns = [
                { menu: 'custom-cat-menu', trigger: 'custom-cat-trigger', arrow: 'custom-cat-arrow' }
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

        // --- QUIZ SELECTION UI ---
        const searchInput = document.getElementById('quiz-search-input') as HTMLInputElement;
        const searchBtn = document.getElementById('search-trigger-btn');
        const favBtn = document.getElementById('quiz-filter-fav-btn');
        const prevBtn = document.getElementById('prev-page-btn');
        const nextBtn = document.getElementById('next-page-btn');
        const quizBackBtn = document.getElementById('quiz-back-btn');

        if (searchInput) {
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
                // Exclusivity: Turn off My Quizzes if Fav is On
                if (this.showFavoritesOnly) this.showMyQuizzesOnly = false;

                this.updateFilterUI();
                this.currentPage = 1;
                this.applyFilters();
            };
        }

        const myQuizBtn = document.getElementById('quiz-filter-my-btn');
        if (myQuizBtn) {
            myQuizBtn.onclick = () => {
                const profile = authService.getStoredProfile();
                if (!profile) {
                    alert('Silakan login untuk melihat quiz buatan Anda.');
                    return;
                }

                this.showMyQuizzesOnly = !this.showMyQuizzesOnly;
                // Exclusivity: Turn off Fav if My Quiz is On
                if (this.showMyQuizzesOnly) this.showFavoritesOnly = false;

                this.updateFilterUI();
                this.currentPage = 1;
                this.applyFilters();
            };
        }

        if (prevBtn) {
            prevBtn.onclick = () => {
                if (this.currentPage > 1) {
                    this.currentPage--;
                    this.fetchPage();
                }
            };
        }

        if (nextBtn) {
            nextBtn.onclick = () => {
                if (this.currentPage < this.totalPages) {
                    this.currentPage++;
                    this.fetchPage();
                }
            };
        }

        if (quizBackBtn) {
            quizBackBtn.onclick = () => {
                TransitionManager.transitionTo(() => {
                    this.goBackToLobby();
                });
            };
        }
    }

    updateFilterUI() {
        // Toggle Fav Icon Style
        const favBtn = document.getElementById('quiz-filter-fav-btn');
        const favIcon = favBtn?.querySelector('span');
        if (favIcon) {
            // Usually text-white/40 is default. Active is text-red-500.
            // But let's check your original classes. 
            // Original: text-white/40 group-hover:text-red-500 (hover removed previously)
            // Active: text-red-500

            if (this.showFavoritesOnly) {
                favIcon.classList.remove('text-white/40');
                favIcon.classList.add('text-red-500');
            } else {
                favIcon.classList.remove('text-red-500');
                favIcon.classList.add('text-white/40');
            }
        }

        // Toggle My Quiz Icon Style
        const myQuizBtn = document.getElementById('quiz-filter-my-btn');
        const myIcon = myQuizBtn?.querySelector('span');
        if (myIcon) {
            if (this.showMyQuizzesOnly) {
                myIcon.classList.remove('text-white/40');
                myIcon.classList.add('text-[#4988C4]');
            } else {
                myIcon.classList.add('text-white/40');
                myIcon.classList.remove('text-[#4988C4]');
            }
        }

    }

    private _outsideClickHandler: ((e: MouseEvent) => void) | null = null;

    // --- DROPDOWN HELPERS ---

    setupDropdown(triggerId: string, menuId: string, arrowId?: string, onSelect?: (val: string, label: string) => void) {
        const trigger = document.getElementById(triggerId);
        if (trigger) {
            trigger.onclick = (e) => {
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

    toggleCustomDropdown(show: boolean) {
        this.toggleDropdownElement('custom-cat-menu', 'custom-cat-arrow', show);
    }

    // --- DATA & LOGIC ---

    // loadFavorites removed as it is now handled in loadQuizData

    async toggleFavorite(quizId: string) {
        const profile = authService.getStoredProfile();
        if (!profile) {
            alert("Silakan login untuk menyimpan favorit.");
            return;
        }

        const userId = profile.id;

        // Optimistic UI Update
        if (this.favorites.has(quizId)) {
            this.favorites.delete(quizId);
        } else {
            this.favorites.add(quizId);
        }

        // Re-render immediately
        this.renderQuizGrid();

        // Sync with Supabase
        await toggleFavoriteInSupabase(quizId, userId);
    }

    resetFilters() {
        this.searchQuery = '';
        this.selectedCategory = '';
        this.showFavoritesOnly = false;
        this.showMyQuizzesOnly = false;
        this.currentPage = 1;

        const searchInput = document.getElementById('quiz-search-input') as HTMLInputElement;
        if (searchInput) searchInput.value = '';

        this.updateFilterUI();
        this.handleCategoryChange('', 'ALL');
    }

    applyFilters() {
        // Reset to page 1 when filters change, then fetch from server
        this.currentPage = 1;
        this.fetchPage();
    }

    renderQuizGrid() {
        const grid = document.getElementById('quiz-grid');
        const pageNumbers = document.getElementById('pagination-numbers');
        const prevBtn = document.getElementById('prev-page-btn') as HTMLButtonElement;
        const nextBtn = document.getElementById('next-page-btn') as HTMLButtonElement;

        if (!grid) return;

        grid.innerHTML = '';

        // Server-side pagination: pageQuizzes already contains only current page data
        const totalPages = this.totalPages;
        const pageItems = this.pageQuizzes;

        if (pageItems.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full flex flex-col items-center justify-center py-16 text-center">
                    <div class="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
                        <span class="material-symbols-outlined text-3xl text-white/20">search_off</span>
                    </div>
                    <p class="text-white/70 font-['Retro_Gaming'] text-lg uppercase mb-2 tracking-widest">
                        Quiz Tidak Ditemukan
                    </p>
                    
                    <button id="reset-filters-btn" class="px-6 py-3 bg-[#1C4D8D]/10 border border-[#4988C4]/30 text-[#4988C4] hover:bg-[#1C4D8D] hover:text-white font-['Retro_Gaming'] text-lg uppercase rounded-lg transition-all flex items-center gap-2">
                        <span class="material-symbols-outlined text-sm">refresh</span>
                        Reset Filter
                    </button>
                </div>
            `;

            const btn = document.getElementById('reset-filters-btn');
            if (btn) btn.onclick = () => this.resetFilters();
        }

        // Render Cards
        pageItems.forEach(quiz => {
            const isFav = this.favorites.has(quiz.id);
            const card = document.createElement('div');

            let badgeColor = 'bg-[#BDE8F5] text-[#0F2854] border border-[#4988C4]';

            card.className = "group bg-surface-dark border border-white/5 p-5 md:p-6 rounded-3xl hover:border-[#1C4D8D] hover:bg-[#1C4D8D]/30 transition-all duration-200 cursor-pointer relative overflow-hidden flex flex-col min-h-[140px] md:min-h-[160px] w-full min-w-0";

            card.innerHTML = `
                <!-- Background Gradient -->
                <div class="absolute inset-0 bg-gradient-to-br from-[#1C4D8D]/0 to-[#1C4D8D]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                <div class="relative z-10 flex justify-between items-start shrink-0 gap-2 mb-2">
                    <!-- Pixel Font Badge - Adjusted text size for mobile -->
                    <span class="px-2 py-1.5 md:px-3 md:py-2 ${badgeColor} text-sm md:text-base font-bold rounded-lg uppercase tracking-wider font-['Retro_Gaming'] leading-none truncate max-w-[70%]">${quiz.category}</span>
                    
                    <button class="fav-btn w-10 h-10 shrink-0 rounded-full bg-black/20 hover:bg-[#1C4D8D]/30 flex items-center justify-center transition-all relative z-20" data-id="${quiz.id}">
                        <span class="material-symbols-outlined text-[18px] md:text-[20px] ${isFav ? 'text-red-500 fill-current' : 'text-white/20 fill-current'} transition-colors">favorite</span>
                    </button>
                </div>
                
                <!-- Title - Flow dynamically with flex-grow -->
                <div class="relative z-10 font-bold text-white mt-auto pt-6 group-hover:text-[#BDE8F5] transition-colors leading-[1.8] font-['Retro_Gaming'] tracking-tight text-sm sm:text-base break-words whitespace-normal w-full flex-grow">
                    <span class="quiz-title-tooltip-trigger line-clamp-2 w-full" title="${quiz.title}">${quiz.title}</span>
                </div>
            `;

            // Tooltip Logic
            const titleEl = card.querySelector('.quiz-title-tooltip-trigger');
            if (titleEl) {
                titleEl.addEventListener('mouseenter', () => {
                    this.showTooltip(quiz.title);
                });
                titleEl.addEventListener('mousemove', (e: any) => {
                    this.moveTooltip(e);
                });
                titleEl.addEventListener('mouseleave', () => {
                    this.hideTooltip();
                });
            }

            // Card Click -> QuizSettingScene
            card.onclick = (e) => {
                if (!(e.target as HTMLElement).closest('.fav-btn')) {
                    TransitionManager.transitionTo(() => {
                        this.hideUI();
                        this.cleanup();
                        // Simpan ID ke localStorage agar URL tetap bersih (/host/settings) tapi refresh tetap jalan
                        localStorage.setItem('tempSettingsQuizId', quiz.id);
                        // Navigate ke URL bersih
                        Router.navigate('/host/settings');
                        this.scene.start('QuizSettingScene', { quiz, client: this.client });
                    });
                }
            };

            // Favorite Click
            const favBtnEl = card.querySelector('.fav-btn');
            favBtnEl?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleFavorite(quiz.id);
            });

            grid.appendChild(card);
        });

        // Update Pagination UI
        if (pageNumbers) {
            const tp = totalPages || 1;
            const digits = String(tp).length;
            const inputWidth = (digits * 0.75) + 1.2;
            pageNumbers.innerHTML = `
                <div class="flex items-center gap-1 bg-[#1C4D8D] rounded-lg px-2 py-1">
                    <input
                        id="page-input"
                        type="text"
                        inputmode="numeric"
                        autocomplete="off"
                        maxlength="${digits}"
                        value="${this.currentPage}"
                        class="h-7 text-center p-2 bg-black/30 text-[#BDE8F5] font-bold text-lg rounded border border-[#4988C4]/50 focus:outline-none focus:border-white focus:bg-black/50 transition-colors"
                        style="width: ${inputWidth}em; -moz-appearance: textfield; appearance: textfield;"
                    />
                    <span class="text-white font-bold text-lg">/ ${tp}</span>
                </div>
            `;

            const pageInput = document.getElementById('page-input') as HTMLInputElement;
            if (pageInput) {
                const navigateToPage = () => {
                    let val = parseInt(pageInput.value);
                    if (isNaN(val) || val < 1) {
                        val = 1;
                    } else if (val > tp) {
                        val = tp;
                    }
                    this.currentPage = val;
                    this.fetchPage();
                };

                pageInput.addEventListener('input', () => {
                    pageInput.value = pageInput.value.replace(/[^0-9]/g, '');
                    const num = parseInt(pageInput.value);
                    if (!isNaN(num) && num > tp) {
                        pageInput.value = String(tp);
                    }
                });

                pageInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        pageInput.blur();
                        navigateToPage();
                    }
                });

                pageInput.addEventListener('blur', () => {
                    navigateToPage();
                });

                pageInput.addEventListener('focus', () => {
                    pageInput.select();
                });
            }
        }

        if (prevBtn) prevBtn.disabled = this.currentPage === 1;
        if (nextBtn) nextBtn.disabled = this.currentPage === totalPages || totalPages === 0;
    }

    // --- TOOLTIP ---
    createTooltip() {
        // Check if exists
        let t = document.getElementById('custom-quiz-tooltip');
        if (!t) {
            t = document.createElement('div');
            t.id = 'custom-quiz-tooltip';
            t.className = "fixed pointer-events-none z-[100] px-4 py-3 bg-[#1a1a20] border-2 border-[#1C4D8D] text-white text-sm font-bold font-['Retro_Gaming'] rounded-lg shadow-[0_0_15px_rgba(28,77,141,0.4)] opacity-0 transition-opacity duration-200 max-w-xs break-words hidden leading-relaxed tracking-wide";
            document.body.appendChild(t);
        }
        this.tooltip = t;
    }

    showTooltip(text: string) {
        if (!this.tooltip) return;
        this.tooltip.innerText = text;
        this.tooltip.classList.remove('hidden');
        // Force reflow
        void this.tooltip.offsetWidth;
        this.tooltip.classList.remove('opacity-0');
    }

    moveTooltip(e: MouseEvent) {
        if (!this.tooltip) return;

        // Calculate position - default to bottom-right of cursor
        let x = e.clientX + 20;
        let y = e.clientY + 20;

        // Boundary check (simple) - if too close to right edge, flip to left
        if (x + this.tooltip.offsetWidth > window.innerWidth) {
            x = e.clientX - this.tooltip.offsetWidth - 20;
        }

        // If too close to bottom, flip to top
        if (y + this.tooltip.offsetHeight > window.innerHeight) {
            y = e.clientY - this.tooltip.offsetHeight - 20;
        }

        this.tooltip.style.left = `${x}px`;
        this.tooltip.style.top = `${y}px`;
    }

    hideTooltip() {
        if (!this.tooltip) return;
        this.tooltip.classList.add('opacity-0');
        setTimeout(() => {
            if (this.tooltip && this.tooltip.classList.contains('opacity-0')) {
                this.tooltip.classList.add('hidden');
            }
        }, 200);
    }

    // --- NAVIGATION ---

    hideAllUI() {
        const uiIds = ['lobby-ui', 'create-room-ui', 'quiz-settings-ui'];
        uiIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add('hidden');
        });
        if (this.quizSelectionUI) this.quizSelectionUI.classList.add('hidden');
    }

    showQuizSelection() {
        if (this.quizSelectionUI) {
            this.quizSelectionUI.classList.remove('hidden');
        }
    }

    hideUI() {
        if (this.quizSelectionUI) {
            this.quizSelectionUI.classList.add('hidden');
        }
    }

    goBackToLobby() {
        this.cleanup();
        this.hideUI();
        Router.navigate('/');
        this.scene.start('LobbyScene');
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
