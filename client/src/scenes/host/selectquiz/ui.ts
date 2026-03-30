import { i18n } from '../../../utils/i18n';
import { GlobalBackground } from '../../../ui/shared/GlobalBackground';

export class QuizSelectionUI {
    static render() {
        let quizSelectionUI = document.getElementById('quiz-selection-ui');
        if (!quizSelectionUI) {
            quizSelectionUI = document.createElement('div');
            quizSelectionUI.id = 'quiz-selection-ui';
            quizSelectionUI.className = 'hidden fixed top-0 left-0 w-full h-screen z-20 overflow-x-hidden overflow-y-auto font-display flex flex-col';
            quizSelectionUI.innerHTML = `
                ${GlobalBackground.getHTML('selectquiz')}

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
                                    placeholder="${i18n.t('select_quiz.search_placeholder')}" type="text" />
                                    <button id="search-trigger-btn" class="absolute right-4 text-[#6CC452] hover:scale-110 transition-transform cursor-pointer p-1">
                                        <span class="material-symbols-outlined font-bold">search</span>
                                    </button>
                                </div>
                                <!-- Middle: Custom Dropdown -->
                                <div class="relative min-w-[200px] shrink-0 border-t md:border-t-0 border-[#6CC452]/10 md:border-l md:border-[#6CC452]/20 z-50">
                                    <button id="custom-cat-trigger" class="w-full h-10 md:h-12 flex items-center justify-between pl-4 pr-3 text-[#478D47] text-xs md:text-lg font-bold uppercase cursor-pointer font-['Retro_Gaming'] tracking-tight hover:bg-[#F1F8E9] transition-all focus:outline-none group rounded-xl ${i18n.getLanguage() === 'ar' ? 'flex-row-reverse' : ''}">
                                        <span id="custom-cat-selected" class="truncate ${i18n.getLanguage() === 'ar' ? 'ml-2' : 'mr-2'}">${i18n.t('select_quiz.all')}</span>
                                        <span id="custom-cat-arrow" class="material-symbols-outlined text-sm md:text-lg text-[#6CC452] transition-transform duration-300 group-hover:rotate-180">expand_more</span>
                                    </button>
                                    <div id="custom-cat-menu" class="hidden absolute top-[calc(100%+8px)] left-0 w-full bg-white border-2 border-[#6CC452] rounded-xl shadow-2xl origin-top transform transition-all duration-200 scale-95 opacity-0 flex flex-col p-1 max-h-[50vh] md:max-h-[60vh] overflow-y-auto custom-scrollbar z-50">
                                    </div>
                                    <select id="quiz-category-select" class="hidden"></select>
                                </div>
                                <!-- Right: Icons -->
                                <div class="flex items-center gap-2 pl-2 border-t md:border-t-0 border-[#6CC452]/10 md:border-l md:border-[#6CC452]/20 py-2 md:py-0 justify-end px-2">
                                    <button id="quiz-filter-fav-btn" class="flex items-center justify-center transition-all group p-1" title="${i18n.t('select_quiz.favorites_tooltip')}">
                                        <span class="material-symbols-outlined text-[#94A3B8] hover:scale-125 transition-transform text-2xl font-bold">favorite</span>
                                    </button>
                                    <button id="quiz-filter-my-btn" class="w-10 h-10 rounded-xl bg-[#F1F8E9] border-2 border-[#6CC452]/20 hover:border-[#6CC452] hover:bg-white flex items-center justify-center transition-all group" title="${i18n.t('select_quiz.my_quiz_tooltip')}">
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
                                <span class="text-base font-bold uppercase">${i18n.t('select_quiz.prev')}</span>
                            </button>
                            <div id="pagination-numbers" class="flex items-center gap-2"></div>
                            <button id="next-page-btn" class="px-3 py-1.5 bg-[#6CC452] rounded-xl border border-b-4 border-[#478D47] hover:brightness-110 text-white flex items-center gap-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed active:border-b-0 active:translate-y-1 cursor-pointer">
                                <span class="text-base font-bold uppercase">${i18n.t('select_quiz.next')}</span>
                                <span class="material-symbols-outlined text-base">chevron_right</span>
                            </button>
                        </div>
                    </div>
                </main>
            `;
            document.body.appendChild(quizSelectionUI);

            // Start Character Spawner
            GlobalBackground.startCharacterSpawner('selectquiz');

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

            // Handle language change event
            window.addEventListener('languageChanged', () => {
                if (quizSelectionUI) {
                    const isHidden = quizSelectionUI.classList.contains('hidden');
                    quizSelectionUI.remove();
                    QuizSelectionUI.render();
                    const newUI = document.getElementById('quiz-selection-ui');
                    if (newUI && !isHidden) newUI.classList.remove('hidden');
                    window.dispatchEvent(new CustomEvent('selectQuizUIReRendered'));
                }
            });
        }
    }

}



