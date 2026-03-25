import { Client } from 'colyseus.js';
import { Router } from '../../../utils/Router';
import { Quiz, fetchQuizzesPaginated, fetchCategoriesWithRaw, toggleFavoriteInSupabase, fetchUserFavorites } from '../../../data/QuizData';
import { TransitionManager } from '../../../utils/TransitionManager';
import { authService } from '../../../services/auth/AuthService';
import { i18n } from '../../../utils/i18n';

export class SelectQuizManager {
    client!: Client;
    pageQuizzes: Quiz[] = [];
    currentPage: number = 1;
    itemsPerPage: number = 9;
    totalPages: number = 1;
    totalCount: number = -1;
    favorites: Set<string> = new Set();
    rawCategoryMap: Map<string, string> = new Map();

    searchQuery: string = '';
    selectedCategory: string = '';
    showFavoritesOnly: boolean = false;
    showMyQuizzesOnly: boolean = false;

    quizSelectionUI: HTMLElement | null = null;
    isLoading: boolean = false;
    tooltip: HTMLElement | null = null;
    lastFavoritedId: string | null = null;
    
    private searchTimeout: any = null;
    private _outsideClickHandler: ((e: MouseEvent) => void) | null = null;

    constructor() {}

    init(data: { client: Client }) {
        this.client = data.client;
        this.start();
    }

    private start() {
        this.quizSelectionUI = document.getElementById('quiz-selection-ui');
        this.hideAllUI();

        const lobbyUI = document.getElementById('lobby-ui');
        if (lobbyUI) lobbyUI.classList.add('hidden');

        this.createTooltip();
        this.setupEventListeners();

        window.addEventListener('selectQuizUIReRendered', async () => {
            this.quizSelectionUI = document.getElementById('quiz-selection-ui');
            const oldSearch = this.searchQuery;
            
            this.setupEventListeners();
            
            const searchInput = document.getElementById('quiz-search-input') as HTMLInputElement;
            if (searchInput) searchInput.value = oldSearch;
            
            this.updateFilterUI();
            
            await this.loadQuizData();
            
            const menu = document.getElementById('custom-cat-menu');
            if (menu && this.selectedCategory) {
                const btns = menu.querySelectorAll('button');
                btns.forEach(b => {
                    b.classList.add('text-[#478D47]');
                    b.classList.remove('bg-[#F1F8E9]', 'font-bold');
                    if (b.dataset.value === this.selectedCategory) {
                        b.classList.add('bg-[#F1F8E9]', 'font-bold');
                    }
                });
            }
        });

        this.showQuizSelection();

        Router.navigate('/host/select-quiz');
        window.addEventListener('popstate', this.handlePopState);

        this.loadQuizData();
    }

    async loadQuizData() {
        this.isLoading = true;
        this.showLoadingState();

        try {
            const profile = authService.getStoredProfile();
            const promises: any[] = [fetchCategoriesWithRaw()];
            if (profile) promises.push(fetchUserFavorites(profile.id));

            const results = await Promise.all(promises);
            const categoryPairs = results[0] as { raw: string; display: string }[];
            const userFavorites = profile ? results[1] : [];

            this.favorites = new Set(userFavorites);

            const oldSelectedRaw = this.selectedCategory ? this.rawCategoryMap.get(this.selectedCategory) : null;

            this.rawCategoryMap.clear();
            categoryPairs.forEach(c => this.rawCategoryMap.set(c.display, c.raw));
            this.populateCategories(categoryPairs.map(c => c.display));

            if (oldSelectedRaw) {
                let found = false;
                for (const [display, raw] of this.rawCategoryMap.entries()) {
                    if (raw === oldSelectedRaw) {
                        this.selectedCategory = display;
                        found = true;
                        break;
                    }
                }
                if (!found) this.selectedCategory = '';
            } else {
                this.selectedCategory = '';
            }

            const selectedText = document.getElementById('custom-cat-selected');
            if (selectedText) {
                selectedText.innerText = this.selectedCategory || i18n.t('select_quiz.all');
            }

            await this.fetchPage();
        } catch (err) {
            console.error('Failed to load quiz data:', err);
        } finally {
            this.isLoading = false;
        }
    }

    async fetchPage() {
        this.isLoading = true;
        this.showLoadingState();

        try {
            const profile = authService.getStoredProfile();
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
            let skeletonCount = this.itemsPerPage;
            if (this.totalCount !== undefined && this.totalCount !== -1) {
                const remaining = this.totalCount - (this.currentPage - 1) * this.itemsPerPage;
                skeletonCount = Math.max(1, Math.min(this.itemsPerPage, remaining));
            }
            let skeletons = '';
            for (let i = 0; i < skeletonCount; i++) {
                skeletons += `
                    <div class="bg-white border-4 border-[#6CC452] border-b-[6px] border-b-[#478D47] p-2 md:p-3 rounded-2xl relative overflow-hidden flex flex-col min-h-[90px] md:min-h-[100px] w-full min-w-0 animate-pulse">
                        <div class="flex justify-between items-start shrink-0 gap-2 mb-3">
                            <div class="w-16 h-5 bg-gray-200 rounded shadow-sm"></div>
                            <div class="w-6 h-6 shrink-0 rounded-full bg-gray-100"></div>
                        </div>
                        <div class="space-y-1.5">
                            <div class="w-full h-3 bg-gray-200 rounded"></div>
                            <div class="w-[85%] h-3 bg-gray-100 rounded"></div>
                        </div>
                    </div>
                `;
            }
            grid.innerHTML = skeletons;
        }
    }

    handlePopState = () => {
        this.goBackToLobby();
    };

    populateCategories(categories: string[]) {
        const catSelect = document.getElementById('quiz-category-select') as HTMLSelectElement;
        const customMenu = document.getElementById('custom-cat-menu');

        if (catSelect) catSelect.innerHTML = '';
        if (customMenu) customMenu.innerHTML = '';

        if (catSelect) {
            categories.forEach(cat => {
                const opt = document.createElement('option');
                opt.value = cat;
                opt.innerText = cat;
                catSelect.appendChild(opt);
            });
        }

        if (customMenu) {
            const allBtn = this.createCustomOption(i18n.t('select_quiz.all'), '');
            customMenu.appendChild(allBtn);

            categories.forEach(cat => {
                const btn = this.createCustomOption(cat, cat);
                customMenu.appendChild(btn);
            });
        }
    }

    createCustomOption(label: string, value: string): HTMLElement {
        const btn = document.createElement('button');
        btn.className = "w-full text-left px-3 py-2 md:px-4 md:py-3 text-xs md:text-lg font-['Retro_Gaming'] hover:bg-[#F1F8E9] hover:text-[#478D47] rounded-lg transition-colors text-[#478D47] uppercase tracking-tight flex items-center justify-between group mt-1";
        btn.innerHTML = `<span>${label}</span>`;
        btn.dataset.value = value;
        btn.onclick = () => this.handleCategoryChange(value, label);
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
                b.classList.add('text-[#478D47]');
                b.classList.remove('bg-[#F1F8E9]', 'font-bold');
                if (b.dataset.value === value) {
                    b.classList.add('bg-[#F1F8E9]', 'font-bold');
                }
            });
        }
        this.applyFilters();
    }

    setupEventListeners() {
        const zigmaLogo = document.getElementById('select-quiz-zigma-logo');
        if (zigmaLogo) {
            zigmaLogo.onclick = () => {
                const overlay = document.getElementById('auth-loading-overlay');
                const text = document.getElementById('auth-loading-text');
                if (overlay) {
                    overlay.classList.remove('hidden');
                    if (text) text.innerText = i18n.t('select_quiz.going_back');
                }

                TransitionManager.close(() => {
                    this.cleanup();
                    this.hideUI();
                    Router.navigate('/');
                    this.startManager('LobbyManager');
                    
                    setTimeout(() => {
                        TransitionManager.open();
                        setTimeout(() => { if (overlay) overlay.classList.add('hidden'); }, 100);
                    }, 500);
                });
            };
        }

        this.setupDropdown('custom-cat-trigger', 'custom-cat-menu', 'custom-cat-arrow', (val, label) => {
            this.handleCategoryChange(val, label);
        });

        if (this._outsideClickHandler) {
            document.removeEventListener('click', this._outsideClickHandler);
        }
        
        this._outsideClickHandler = (e: MouseEvent) => {
            const dropdowns = [{ menu: 'custom-cat-menu', trigger: 'custom-cat-trigger', arrow: 'custom-cat-arrow' }];
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

        const searchInput = document.getElementById('quiz-search-input') as HTMLInputElement;
        if (searchInput) {
            // Replaced keydown logic with debounced input hook for perfect execution
            searchInput.addEventListener('input', (e) => {
                if (this.searchTimeout) clearTimeout(this.searchTimeout);
                this.searchTimeout = setTimeout(() => {
                    this.searchQuery = (e.target as HTMLInputElement).value;
                    this.currentPage = 1;
                    this.applyFilters();
                }, 300);
            });
        }

        const favBtn = document.getElementById('quiz-filter-fav-btn');
        if (favBtn) {
            favBtn.onclick = () => {
                this.showFavoritesOnly = !this.showFavoritesOnly;
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
                    alert(i18n.t('select_quiz.login_required_my_quiz'));
                    return;
                }
                this.showMyQuizzesOnly = !this.showMyQuizzesOnly;
                if (this.showMyQuizzesOnly) this.showFavoritesOnly = false;
                this.updateFilterUI();
                this.currentPage = 1;
                this.applyFilters();
            };
        }

        const prevBtn = document.getElementById('prev-page-btn');
        if (prevBtn) {
            prevBtn.onclick = () => {
                if (this.currentPage > 1) {
                    this.currentPage--;
                    this.fetchPage();
                }
            };
        }

        const nextBtn = document.getElementById('next-page-btn');
        if (nextBtn) {
            nextBtn.onclick = () => {
                if (this.currentPage < this.totalPages) {
                    this.currentPage++;
                    this.fetchPage();
                }
            };
        }

        const quizBackBtn = document.getElementById('quiz-back-btn');
        if (quizBackBtn) {
            quizBackBtn.onclick = () => {
                TransitionManager.transitionTo(() => this.goBackToLobby());
            };
        }
    }

    updateFilterUI() {
        const favBtn = document.getElementById('quiz-filter-fav-btn');
        const favIcon = favBtn?.querySelector('span');
        if (favIcon) {
            if (this.showFavoritesOnly) {
                favIcon.classList.remove('text-[#94A3B8]');
                favIcon.classList.add('text-red-500', 'fill-current', 'heart-water-fill');
            } else {
                favIcon.classList.remove('text-red-500', 'fill-current', 'heart-water-fill');
                favIcon.classList.add('text-[#94A3B8]');
            }
        }

        const myQuizBtn = document.getElementById('quiz-filter-my-btn');
        const myIcon = myQuizBtn?.querySelector('span');
        if (myQuizBtn && myIcon) {
            if (this.showMyQuizzesOnly) {
                myQuizBtn.classList.add('bg-[#6CC452]/10', 'border-[#6CC452]');
                myIcon.classList.remove('text-[#6CC452]/40');
                myIcon.classList.add('text-[#478D47]');
            } else {
                myQuizBtn.classList.remove('bg-[#6CC452]/10', 'border-[#6CC452]');
                myIcon.classList.remove('text-[#478D47]');
                myIcon.classList.add('text-[#6CC452]/40');
            }
        }
    }

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
            setTimeout(() => menu.classList.add('hidden'), 200);
        }
    }

    closeDropdown(menuId: string, arrowId?: string) {
        this.toggleDropdownElement(menuId, arrowId, false);
    }

    toggleCustomDropdown(show: boolean) {
        this.toggleDropdownElement('custom-cat-menu', 'custom-cat-arrow', show);
    }

    async toggleFavorite(quizId: string) {
        const profile = authService.getStoredProfile();
        if (!profile) {
            alert(i18n.t('select_quiz.login_required_favorite'));
            return;
        }

        const userId = profile.id;
        if (this.favorites.has(quizId)) {
            this.favorites.delete(quizId);
            this.lastFavoritedId = null;
        } else {
            this.favorites.add(quizId);
            this.lastFavoritedId = quizId;
        }

        this.renderQuizGrid();
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
        this.handleCategoryChange('', i18n.t('select_quiz.all'));
    }

    applyFilters() {
        this.currentPage = 1;
        this.totalCount = -1;
        this.fetchPage();
    }

    renderQuizGrid() {
        const grid = document.getElementById('quiz-grid');
        const pageNumbers = document.getElementById('pagination-numbers');
        const prevBtn = document.getElementById('prev-page-btn') as HTMLButtonElement;
        const nextBtn = document.getElementById('next-page-btn') as HTMLButtonElement;

        if (!grid) return;
        grid.innerHTML = '';

        const totalPages = this.totalPages;
        const pageItems = this.pageQuizzes;

        if (pageItems.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full flex flex-col items-center justify-center py-16 text-center">
                    <div class="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
                        <span class="material-symbols-outlined text-3xl text-white/20">search_off</span>
                    </div>
                    <p class="text-white/70 font-['Retro_Gaming'] text-lg uppercase mb-2 tracking-widest">
                        ${i18n.t('select_quiz.no_quiz_found')}
                    </p>
                    <button id="reset-filters-btn" class="px-6 py-3 bg-[#1F7D53]/10 border border-[#1F7D53]/30 text-[#1F7D53] hover:bg-[#1F7D53] hover:text-white font-['Retro_Gaming'] text-lg uppercase rounded-lg transition-all flex items-center gap-2">
                        <span class="material-symbols-outlined text-sm">refresh</span> ${i18n.t('select_quiz.reset_filter')}
                    </button>
                </div>
            `;
            const btn = document.getElementById('reset-filters-btn');
            if (btn) btn.onclick = () => this.resetFilters();
        }

        pageItems.forEach(quiz => {
            const isFav = this.favorites.has(quiz.id);
            const card = document.createElement('div');
            let badgeColor = 'bg-[#6CC452] text-white border-2 border-[#478D47]';

            card.className = "group bg-white border-4 border-[#6CC452] border-b-[6px] border-b-[#478D47] p-2 md:p-3 rounded-2xl hover:bg-[#F1F8E9] transition-all duration-200 cursor-pointer relative overflow-hidden flex flex-col min-h-[90px] md:min-h-[100px] w-full min-w-0";
            card.innerHTML = `
                <div class="absolute inset-0 bg-gradient-to-br from-[#4C5C2D]/0 to-[#1F7D53]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div class="relative z-10 flex justify-between items-start shrink-0 gap-2 mb-1.5">
                    <span class="px-1.5 py-0.5 md:px-2 md:py-1 ${badgeColor} text-[9px] md:text-[10px] font-bold rounded uppercase tracking-wider font-['Retro_Gaming'] leading-none truncate max-w-[70%]">${quiz.category}</span>
                    <button class="fav-btn p-1 flex items-center justify-center transition-all relative z-20 group/fav" data-id="${quiz.id}">
                        <span class="material-symbols-outlined text-[20px] md:text-[22px] ${isFav ? 'text-red-500 fill-current' : 'text-[#94A3B8]'} ${quiz.id === this.lastFavoritedId ? 'heart-water-fill' : ''} transition-all group-hover/fav:scale-110">favorite</span>
                    </button>
                </div>
                <div class="relative z-10 font-bold text-[#478D47] -mt-2 group-hover:text-[#6CC452] transition-colors leading-[1.4] font-['Retro_Gaming'] tracking-tight text-sm sm:text-base break-words whitespace-normal w-full">
                    <span class="quiz-title-tooltip-trigger line-clamp-2 w-full">${quiz.title}</span>
                </div>
            `;

            const titleEl = card.querySelector('.quiz-title-tooltip-trigger');
            if (titleEl) {
                titleEl.addEventListener('mouseenter', () => this.showTooltip(quiz.title));
                titleEl.addEventListener('mousemove', (e: any) => this.moveTooltip(e));
                titleEl.addEventListener('mouseleave', () => this.hideTooltip());
            }

            card.onclick = (e) => {
                if (!(e.target as HTMLElement).closest('.fav-btn')) {
                    TransitionManager.transitionTo(() => {
                        this.hideUI();
                        this.cleanup();
                        localStorage.setItem('tempSettingsQuizId', quiz.id);
                        Router.navigate('/host/settings');
                        this.startManager('QuizSettingManager', { quiz, client: this.client });
                    });
                }
            };

            const favBtnEl = card.querySelector('.fav-btn');
            favBtnEl?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleFavorite(quiz.id);
            });

            grid.appendChild(card);
        });

        if (pageNumbers) {
            const tp = totalPages || 1;
            const digits = String(tp).length;
            const inputWidth = (digits * 0.75) + 1.2;
            pageNumbers.innerHTML = `
                <div class="flex items-center gap-1">
                    <input id="page-input" type="text" inputmode="numeric" autocomplete="off" maxlength="${digits}" value="${this.currentPage}" class="h-7 text-center p-0 bg-transparent text-[#4B5563] font-bold text-xl rounded-none border-none focus:outline-none focus:ring-0 transition-colors" style="width: ${inputWidth}em; -moz-appearance: textfield; appearance: textfield;" />
                    <span class="text-white font-bold text-xl">/ ${tp}</span>
                </div>
            `;

            const pageInput = document.getElementById('page-input') as HTMLInputElement;
            if (pageInput) {
                const navigateToPage = () => {
                    let val = parseInt(pageInput.value);
                    if (isNaN(val) || val < 1) val = 1;
                    else if (val > tp) val = tp;
                    this.currentPage = val;
                    this.fetchPage();
                };
                pageInput.addEventListener('input', () => {
                    pageInput.value = pageInput.value.replace(/[^0-9]/g, '');
                    const num = parseInt(pageInput.value);
                    if (!isNaN(num) && num > tp) pageInput.value = String(tp);
                });
                pageInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') { e.preventDefault(); pageInput.blur(); navigateToPage(); }
                });
                pageInput.addEventListener('blur', navigateToPage);
                pageInput.addEventListener('focus', () => pageInput.select());
            }
        }

        if (prevBtn) prevBtn.disabled = this.currentPage === 1;
        if (nextBtn) nextBtn.disabled = this.currentPage === totalPages || totalPages === 0;
        if (this.quizSelectionUI) this.quizSelectionUI.scrollTo({ top: 0, behavior: 'smooth' });
    }

    createTooltip() {
        let t = document.getElementById('custom-quiz-tooltip');
        if (!t) {
            t = document.createElement('div');
            t.id = 'custom-quiz-tooltip';
            t.className = "fixed pointer-events-none z-[100] px-4 py-3 bg-white border-2 border-[#478D47] text-[#478D47] text-sm font-bold font-['Retro_Gaming'] rounded-lg shadow-2xl opacity-0 transition-opacity duration-200 max-w-xs break-words hidden leading-relaxed tracking-wide";
            document.body.appendChild(t);
        }
        this.tooltip = t;
    }

    showTooltip(text: string) {
        if (!this.tooltip) return;
        this.tooltip.innerText = text;
        this.tooltip.classList.remove('hidden');
        void this.tooltip.offsetWidth;
        this.tooltip.classList.remove('opacity-0');
    }

    moveTooltip(e: MouseEvent) {
        if (!this.tooltip) return;
        let x = e.clientX + 20;
        let y = e.clientY + 20;
        if (x + this.tooltip.offsetWidth > window.innerWidth) x = e.clientX - this.tooltip.offsetWidth - 20;
        if (y + this.tooltip.offsetHeight > window.innerHeight) y = e.clientY - this.tooltip.offsetHeight - 20;
        this.tooltip.style.left = `${x}px`;
        this.tooltip.style.top = `${y}px`;
    }

    hideTooltip() {
        if (!this.tooltip) return;
        this.tooltip.classList.add('opacity-0');
        setTimeout(() => { if (this.tooltip && this.tooltip.classList.contains('opacity-0')) this.tooltip.classList.add('hidden'); }, 200);
    }

    hideAllUI() {
        const uiIds = ['lobby-ui', 'create-room-ui', 'quiz-settings-ui'];
        uiIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add('hidden');
        });
        if (this.quizSelectionUI) this.quizSelectionUI.classList.add('hidden');
    }

    showQuizSelection() {
        if (this.quizSelectionUI) this.quizSelectionUI.classList.remove('hidden');
    }

    hideUI() {
        if (this.quizSelectionUI) this.quizSelectionUI.classList.add('hidden');
    }

    goBackToLobby() {
        this.cleanup();
        this.hideUI();
        Router.navigate('/');
        this.startManager('LobbyManager');
    }

    cleanup() {
        window.removeEventListener('popstate', this.handlePopState);
        if (this._outsideClickHandler) {
            document.removeEventListener('click', this._outsideClickHandler);
            this._outsideClickHandler = null;
        }
        if (this.searchTimeout) clearTimeout(this.searchTimeout);
    }

    private startManager(managerName: string, data?: any) {
        if (managerName === 'QuizSettingManager') {
            import('../quizsetting/page').then(m => {
                const manager = new m.QuizSettingManager();
                manager.init(data);
            });
        } else if (managerName === 'LobbyManager') {
            import('../../lobby/page').then(m => {
                const manager = new m.LobbyManager();
                manager.init(data);
            });
        }
    }
}


