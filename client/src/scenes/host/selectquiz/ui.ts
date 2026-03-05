export class QuizSelectionUI {
    static render() {
        let quizSelectionUI = document.getElementById('quiz-selection-ui');
        if (!quizSelectionUI) {
            quizSelectionUI = document.createElement('div');
            quizSelectionUI.id = 'quiz-selection-ui';
            quizSelectionUI.className = 'bg-background-dark hidden fixed top-0 left-0 w-full h-screen z-20 overflow-y-auto font-display';
            quizSelectionUI.innerHTML = `
                <div class="fixed inset-0 pointer-events-none overflow-hidden pixel-bg-pattern opacity-15"></div>

                <!-- Navbar/Header (Redesigned) -->
                <nav class="relative z-10 p-6 flex justify-between items-start shrink-0">
                <!-- Left: Back Button & Logo -->
                <div class="flex items-start gap-4">
                    <!-- Back button removed visually -->
                    <!-- LOGO ZIGMA -->
                    <img src="/logo/Zigma-new-logo.webp" style="top: -30px; left: -40px;"
                    class="absolute w-64 z-20 pointer-events-none object-contain" />
                </div>

                <!-- Right: LOGO GFS -->
                <img src="/logo/gameforsmart-new-logo.webp" style="top: -45px; right: -15px;"
                    class="absolute w-80 z-20 pointer-events-none object-contain" />
                </nav>

                <!-- Main Content -->
                <main class="relative z-10 max-w-5xl mx-auto px-4 min-h-[calc(100vh-100px)] flex flex-col pb-8">

                <!-- Unified Search & Filter Bar (Reference Image Style) -->
                <div class="w-full mb-6 shrink-0 relative z-50 mt-8">
                    <!-- Container with Neon Border -->
                    <div
                    class="flex flex-col md:flex-row items-stretch md:items-center bg-black/60 border-2 border-[#1C4D8D]/40 rounded-2xl p-2 gap-2 shadow-[0_0_15px_rgba(28,77,141,0.15)] backdrop-blur-sm">

                    <!-- Search Section (Grow) -->
                    <div class="relative flex-grow flex items-center">
                        <input id="quiz-search-input"
                        class="w-full h-12 pl-4 pr-12 bg-transparent border-none focus:ring-0 text-white placeholder:text-white/30 font-medium text-xl font-['Retro_Gaming'] tracking-tight"
                        placeholder="SEARCH QUIZ..." type="text" />

                        <!-- Search Icon (Right side of input) -->
                        <button id="search-trigger-btn"
                        class="absolute right-4 text-[#4988C4] hover:text-white transition-colors cursor-pointer p-1">
                        <span class="material-symbols-outlined font-bold">search</span>
                        </button>

                        <!-- Vertical Divider -->
                        <div class="absolute right-0 top-2 bottom-2 w-0.5 bg-white/10 hidden md:block"></div>
                    </div>

                    <!-- Middle: Custom Dropdown -->
                    <div
                        class="relative min-w-[200px] shrink-0 border-t md:border-t-0 border-white/10 md:border-l md:border-white/10 z-50">
                        <!-- Trigger Button -->
                        <button id="custom-cat-trigger"
                        class="w-full h-12 flex items-center justify-between pl-4 pr-3 text-white text-lg font-bold uppercase cursor-pointer font-['Retro_Gaming'] tracking-tight hover:text-[#4988C4] transition-colors focus:outline-none group">
                        <span id="custom-cat-selected" class="truncate mr-2">ALL</span>
                        <span id="custom-cat-arrow"
                            class="material-symbols-outlined text-lg text-[#4988C4] transition-transform duration-300 group-hover:scale-110">expand_more</span>
                        </button>

                        <!-- Custom Dropdown Menu (Hidden by default) -->
                        <div id="custom-cat-menu"
                        class="hidden absolute top-[calc(100%+8px)] left-0 w-full bg-[#1a1a20] border-2 border-[#1C4D8D]/40 rounded-xl shadow-[0_0_30px_rgba(28,77,141,0.25)] overflow-hidden origin-top transform transition-all duration-200 scale-95 opacity-0 flex flex-col p-1">
                        <!-- Options injected via JS -->
                        </div>

                        <!-- Hidden Native Select (For Logic Compatibility) -->
                        <select id="quiz-category-select" class="hidden"></select>
                    </div>

                    <!-- Right: Icons (Fav & Profile) -->
                    <div
                        class="flex items-center gap-2 pl-2 border-t md:border-t-0 border-white/10 md:border-l md:border-white/10 py-2 md:py-0 justify-end px-2">
                        <!-- Favorites Toggle -->
                        <button id="quiz-filter-fav-btn"
                        class="w-10 h-10 rounded-xl border border-white/10 hover:border-[#1C4D8D] hover:bg-[#1C4D8D]/20 flex items-center justify-center transition-all group"
                        title="Favorites">
                        <span
                            class="material-symbols-outlined text-white/40 group-hover:text-red-500 fill-current text-lg">favorite</span>
                        </button>

                        <!-- My Quiz / Profile Icon -->
                        <button id="quiz-filter-my-btn"
                        class="w-10 h-10 rounded-xl border border-white/10 hover:border-[#4988C4] hover:bg-[#1C4D8D]/20 flex items-center justify-center transition-all group"
                        title="My Quiz">
                        <span class="material-symbols-outlined text-white/40 group-hover:text-[#4988C4] text-lg">person</span>
                        </button>
                    </div>

                    </div>
                </div>

                <!-- Quiz Grid -->
                <div id="quiz-grid"
                    class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto custom-scrollbar pr-2 pb-20">
                    <!-- Cards injected via JS -->
                </div>

                <!-- Pagination -->
                <div class=" pt-4 flex justify-center items-center gap-4 shrink-0 border-t-2 border-white/5 -mt-14">
                    <button id="prev-page-btn"
                    class="px-4 py-2 bg-black/40 border-2 border-white/10 hover:border-white/40 text-white/60 hover:text-white flex items-center gap-2 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                    <span class="material-symbols-outlined text-lg">chevron_left</span>
                    <span class="text-lg font-bold uppercase">Prev</span>
                    </button>

                    <div id="pagination-numbers" class="flex items-center gap-2">
                    <!-- Page numbers injected -->
                    </div>

                    <button id="next-page-btn"
                    class="px-4 py-2 bg-black/40 border-2 border-white/10 hover:border-white/40 text-white/60 hover:text-white flex items-center gap-2 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                    <span class="text-lg font-bold uppercase">Next</span>
                    <span class="material-symbols-outlined text-lg">chevron_right</span>
                    </button>
                </div>
                </main>
            `;
            document.body.appendChild(quizSelectionUI);
        }
    }
}
