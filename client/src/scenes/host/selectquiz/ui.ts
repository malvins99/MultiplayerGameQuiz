export class QuizSelectionUI {
    static render() {
        let quizSelectionUI = document.getElementById('quiz-selection-ui');
        if (!quizSelectionUI) {
            quizSelectionUI = document.createElement('div');
            quizSelectionUI.id = 'quiz-selection-ui';
            quizSelectionUI.className = 'hidden fixed top-0 left-0 w-full h-screen z-20 overflow-x-hidden overflow-y-auto font-display flex flex-col';
            quizSelectionUI.innerHTML = `
                <!-- Full-Screen Background — palette gradient -->
                <div class="absolute inset-0" style="background: linear-gradient(180deg, #6CC452 0%, #478D47 100%);"></div>

                <!-- Pixel-art Background Decorations -->
                <div class="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                    <!-- Subtle pixel grid pattern -->
                    <div class="absolute inset-0 opacity-[0.06]" style="background-image: radial-gradient(#2d5a30 1px, transparent 1px); background-size: 24px 24px;"></div>

                    <!-- Diverse Pixel Clouds (Varying sizes, colors, speeds) -->
                    
                    <!-- L1: Back Layer (Small/Medium, Slow) -->
                    <div class="absolute top-[10%] opacity-20 animate-[drift_80s_linear_infinite]" style="transform: scale(1.0); left: -10%;">
                        <div class="relative w-10 h-3 bg-white">
                            <div class="absolute -top-1 left-2 w-3 h-1 bg-white"></div>
                        </div>
                    </div>
                    <div class="absolute top-[45%] opacity-15 animate-[drift_95s_linear_infinite_reverse]" style="transform: scale(0.8); left: 80%;">
                        <div class="relative w-12 h-4 bg-[#D3EE98]">
                            <div class="absolute -top-2 left-3 w-4 h-2 bg-[#D3EE98]"></div>
                        </div>
                    </div>
                    <div class="absolute top-[15%] opacity-15 animate-[drift_110s_linear_infinite]" style="transform: scale(1.2); left: 40%;">
                        <div class="relative w-14 h-4 bg-white">
                            <div class="absolute -top-2 left-4 w-5 h-2 bg-white"></div>
                        </div>
                    </div>

                    <!-- L2: Mid Layer (Medium) -->
                    <div class="absolute top-[25%] opacity-40 animate-[drift_45s_linear_infinite]" style="transform: scale(1.8); left: 15%;">
                        <div class="relative w-16 h-5 bg-[#D3EE98]">
                            <div class="absolute -top-3 left-4 w-6 h-3 bg-[#D3EE98]"></div>
                            <div class="absolute -top-5 left-8 w-4 h-5 bg-[#D3EE98]"></div>
                        </div>
                    </div>
                    <div class="absolute top-[65%] opacity-35 animate-[drift_55s_linear_infinite_reverse]" style="transform: scale(1.5); left: 60%;">
                        <div class="relative w-14 h-4 bg-white">
                            <div class="absolute -top-2 left-4 w-5 h-2 bg-white"></div>
                            <div class="absolute -top-4 left-7 w-3 h-4 bg-white"></div>
                        </div>
                    </div>
                    <div class="absolute top-[5%] opacity-25 animate-[drift_70s_linear_infinite]" style="transform: scale(1.7); left: 75%;">
                        <div class="relative w-16 h-5 bg-[#D3EE98]">
                            <div class="absolute -top-3 left-5 w-6 h-3 bg-[#D3EE98]"></div>
                        </div>
                    </div>

                    <!-- L3: Front Layer (Large, Faster) -->
                    <div class="absolute top-[40%] opacity-30 animate-[drift_35s_linear_infinite]" style="transform: scale(2.5); left: -20%;">
                        <div class="relative w-12 h-4 bg-[#FEFF9F]">
                            <div class="absolute -top-2 left-2 w-4 h-2 bg-[#FEFF9F]"></div>
                            <div class="absolute -top-4 left-5 w-4 h-4 bg-[#FEFF9F]"></div>
                        </div>
                    </div>
                    <div class="absolute top-[75%] opacity-25 animate-[drift_40s_linear_infinite_reverse]" style="transform: scale(2.2); left: 40%;">
                        <div class="relative w-18 h-6 bg-white">
                            <div class="absolute -top-3 left-5 w-7 h-3 bg-white"></div>
                            <div class="absolute -top-6 left-10 w-5 h-6 bg-white"></div>
                        </div>
                    </div>
                    <div class="absolute top-[50%] opacity-20 animate-[drift_30s_linear_infinite]" style="transform: scale(3.0); left: 10%;">
                        <div class="relative w-14 h-4 bg-[#FEFF9F]">
                            <div class="absolute -top-2 left-4 w-5 h-2 bg-[#FEFF9F]"></div>
                        </div>
                    </div>

                    <!-- Floating Particles -->
                    <div class="firefly !bg-[#FEFF9F] !shadow-[0_0_15px_rgba(254,255,159,0.9)]" style="top: 25%; left: 15%; animation-delay: 0s;"></div>
                    <div class="firefly !bg-white !shadow-[0_0_15px_rgba(255,255,255,0.8)]" style="top: 65%; left: 80%; animation-delay: 1.5s;"></div>
                    <div class="firefly !bg-[#D3EE98] !shadow-[0_0_15px_rgba(211,238,152,0.9)]" style="top: 45%; left: 45%; animation-delay: 3s;"></div>
                    <div class="firefly !bg-[#FEFF9F] !shadow-[0_0_15px_rgba(254,255,159,0.9)]" style="top: 85%; left: 20%; animation-delay: 4.5s;"></div>
                    <div class="firefly !bg-white !shadow-[0_0_15px_rgba(255,255,255,0.8)]" style="top: 15%; left: 70%; animation-delay: 6s;"></div>
                </div>

                <!-- Walking Characters Container -->
                <div id="selectquiz-walking-characters-container" class="fixed inset-0 z-0 overflow-hidden pointer-events-none"></div>

                <!-- Top Navigation -->
                <nav class="relative z-50 p-4 md:p-6 flex justify-between items-start shrink-0">
                    <div class="flex items-start gap-4">
                        <img id="select-quiz-zigma-logo" src="/logo/Zigma-logo-fix.webp"
                        class="absolute w-24 md:w-56 z-20 object-contain -top-2 -left-4 md:-top-[25px] md:-left-[35px] cursor-pointer" />
                    </div>

                    <img src="/logo/gameforsmart-logo-fix.webp"
                        class="absolute w-32 md:w-64 z-20 pointer-events-none object-contain -top-3 -right-1 md:-top-[35px] md:-right-[10px]" />
                </nav>

                <!-- Main Content -->
                <main class="relative z-10 w-full flex-1 flex flex-col overflow-y-auto custom-scrollbar no-scrollbar px-4 pb-8 items-center">
                    <div class="w-full max-w-5xl flex flex-col h-full shrink-0 items-center">
                        <!-- Unified Search & Filter Bar (Solid Style) -->
                        <div class="w-full mb-3 shrink-0 relative z-50 mt-3 md:mt-5">
                            <div class="flex flex-col md:flex-row items-stretch md:items-center bg-white border-4 border-[#6CC452] border-b-[6px] border-b-[#478D47] rounded-2xl p-1.5 gap-2 shadow-2xl">
                                <!-- Search Section -->
                                <div class="relative flex-grow flex items-center">
                                    <input id="quiz-search-input"
                                    class="w-full h-10 md:h-12 pl-4 pr-12 bg-[#F1F8E9] border-none focus:ring-4 focus:ring-[#6CC452]/20 text-[#478D47] placeholder:text-[#6CC452]/40 font-medium text-base md:text-xl font-['Retro_Gaming'] tracking-tight rounded-xl"
                                    placeholder="SEARCH QUIZ..." type="text" />
                                    <button id="search-trigger-btn" class="absolute right-4 text-[#6CC452] hover:scale-110 transition-transform cursor-pointer p-1">
                                        <span class="material-symbols-outlined font-bold">search</span>
                                    </button>
                                </div>
                                <!-- Middle: Custom Dropdown -->
                                <div class="relative min-w-[200px] shrink-0 border-t md:border-t-0 border-[#6CC452]/10 md:border-l md:border-[#6CC452]/20 z-50">
                                    <button id="custom-cat-trigger" class="w-full h-10 md:h-12 flex items-center justify-between pl-4 pr-3 text-[#478D47] text-xs md:text-lg font-bold uppercase cursor-pointer font-['Retro_Gaming'] tracking-tight hover:bg-[#F1F8E9] transition-all focus:outline-none group rounded-xl">
                                        <span id="custom-cat-selected" class="truncate mr-2">ALL</span>
                                        <span id="custom-cat-arrow" class="material-symbols-outlined text-sm md:text-lg text-[#6CC452] transition-transform duration-300 group-hover:rotate-180">expand_more</span>
                                    </button>
                                    <div id="custom-cat-menu" class="hidden absolute top-[calc(100%+8px)] left-0 w-full bg-white border-2 border-[#6CC452] rounded-xl shadow-2xl origin-top transform transition-all duration-200 scale-95 opacity-0 flex flex-col p-1 max-h-[50vh] md:max-h-[60vh] overflow-y-auto custom-scrollbar z-50">
                                    </div>
                                    <select id="quiz-category-select" class="hidden"></select>
                                </div>
                                <!-- Right: Icons -->
                                <div class="flex items-center gap-2 pl-2 border-t md:border-t-0 border-[#6CC452]/10 md:border-l md:border-[#6CC452]/20 py-2 md:py-0 justify-end px-2">
                                    <button id="quiz-filter-fav-btn" class="flex items-center justify-center transition-all group p-1" title="Favorites">
                                        <span class="material-symbols-outlined text-[#94A3B8] hover:scale-125 transition-transform text-2xl font-bold">favorite</span>
                                    </button>
                                    <button id="quiz-filter-my-btn" class="w-10 h-10 rounded-xl bg-[#F1F8E9] border-2 border-[#6CC452]/20 hover:border-[#6CC452] hover:bg-white flex items-center justify-center transition-all group" title="My Quiz">
                                        <span class="material-symbols-outlined text-[#6CC452]/40 group-hover:text-[#6CC452] text-lg">person</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Quiz Grid -->
                        <div id="quiz-grid" class="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                            <!-- Cards injected via JS -->
                        </div>

                        <!-- Pagination -->
                        <div class="pt-4 pb-2 flex justify-center items-center gap-4 shrink-0 w-full mt-auto">
                            <button id="prev-page-btn" class="px-3 py-1.5 bg-[#6CC452] rounded-xl border border-b-4 border-[#478D47] hover:brightness-110 text-white flex items-center gap-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed active:border-b-0 active:translate-y-1 cursor-pointer">
                                <span class="material-symbols-outlined text-base">chevron_left</span>
                                <span class="text-base font-bold uppercase">Prev</span>
                            </button>
                            <div id="pagination-numbers" class="flex items-center gap-2"></div>
                            <button id="next-page-btn" class="px-3 py-1.5 bg-[#6CC452] rounded-xl border border-b-4 border-[#478D47] hover:brightness-110 text-white flex items-center gap-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed active:border-b-0 active:translate-y-1 cursor-pointer">
                                <span class="text-base font-bold uppercase">Next</span>
                                <span class="material-symbols-outlined text-base">chevron_right</span>
                            </button>
                        </div>
                    </div>
                </main>
            `;
            document.body.appendChild(quizSelectionUI);

            // Start Character Spawner
            QuizSelectionUI.startCharacterSpawner();

            // Add custom scrollbar and heart animation styling
            if (!document.getElementById('select-quiz-refinements')) {
                const style = document.createElement('style');
                style.id = 'select-quiz-refinements';
                style.innerHTML = `
                    .custom-scrollbar::-webkit-scrollbar {
                        width: 8px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background-color: #5BB043;
                        border-radius: 20px;
                        border: 2px solid white;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                        background-color: #478D47;
                    }
                    .heart-water-fill {
                        animation: heartWaterFill 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards !important;
                        font-variation-settings: 'FILL' 1 !important;
                    }
                    @keyframes heartWaterFill {
                        0% { 
                            clip-path: inset(100% 0 0 0);
                        }
                        100% { 
                            clip-path: inset(0 0 0 0);
                        }
                    }
                    .heart-red { color: #EF4444 !important; }
                    .heart-idle { color: #94A3B8 !important; }
                `;
                document.head.appendChild(style);
            }
        }
    }

    private static spawnerInterval: any = null;
    private static startCharacterSpawner() {
        if (this.spawnerInterval) return;

        const container = document.getElementById('selectquiz-walking-characters-container');
        if (!container) return;

        // Initial spawn check
        this.checkAndSpawn(container);

        this.spawnerInterval = setInterval(() => {
            this.checkAndSpawn(container);
        }, 5000); // Check every 5s
    }

    private static checkAndSpawn(container: HTMLElement) {
        const activeChars = container.querySelectorAll('.walking-char').length;
        if (activeChars >= 3) return;

        // Higher chance if fewer chars
        const chance = activeChars === 0 ? 0.8 : 0.4;

        if (Math.random() < chance) {
            this.spawnCharacter(container);
        }
    }

    private static spawnCharacter(container: HTMLElement) {
        const char = document.createElement('div');
        char.className = 'walking-char';

        const fromRight = Math.random() > 0.5;
        const speed = 20 + Math.random() * 10; // 20-30s across screen

        if (fromRight) {
            char.style.animation = `base-walk-cycle 0.8s steps(8) infinite, walk-across-left ${speed}s linear forwards`;
            char.style.transform = 'scale(-1, 1)'; // Maintain 1.5:1 while flipping
        } else {
            char.style.animation = `base-walk-cycle 0.8s steps(8) infinite, walk-across-right ${speed}s linear forwards`;
            char.style.transform = 'scale(1, 1)';
        }

        container.appendChild(char);

        // Cleanup
        setTimeout(() => {
            if (char.parentElement) char.remove();
        }, speed * 1000 + 500);
    }
}



