import { i18n } from '../../../utils/i18n';
import { GlobalBackground } from '../../../ui/shared/GlobalBackground';

export class QuizSettingsUI {
    static render() {
        let quizSettingsUI = document.getElementById('quiz-settings-ui');
        if (!quizSettingsUI) {
            quizSettingsUI = document.createElement('div');
            quizSettingsUI.id = 'quiz-settings-ui';
            quizSettingsUI.className = 'fixed inset-0 z-10 overflow-x-hidden overflow-y-auto flex flex-col hidden';
            quizSettingsUI.innerHTML = `
                ${GlobalBackground.getHTML('quizsettings')}

                <!-- LOGO TOP LEFT (Zigma) — Desktop only -->
                <img id="settings-zigma-logo" src="/logo/Zigma-logo-fix.webp" style="top: -20px; left: -10px;" class="absolute w-64 z-50 object-contain cursor-pointer login-desktop-only" />

                <!-- LOGO TOP RIGHT (Game For Smart) — Desktop only -->
                <img src="/logo/gameforsmart-logo-fix.webp" style="top: -35px; right: -15px;" class="absolute w-80 z-20 object-contain pointer-events-none login-desktop-only" />

                <!-- MOBILE LOGO (Zigma only, centered at top) — Mobile only -->
                <div class="login-mobile-only w-full justify-center pt-5 relative z-50 pointer-events-none">
                    <img id="settings-zigma-logo-mobile" src="/logo/Zigma-logo-fix.webp" class="w-52 object-contain cursor-pointer pointer-events-auto" />
                </div>

                <!-- Main Content (Centered like Login) -->
                <div class="relative z-10 flex h-full w-full items-start md:items-center justify-center px-4 md:px-8 pt-6 md:pt-0 overflow-hidden">
                    <div class="w-full max-w-xl md:max-w-2xl -mt-5 md:mt-0">
                        
                        <!-- Container: Keep original Solid Style -->
                        <div class="w-full bg-white border-4 border-[#6CC452] border-b-[12px] border-b-[#478D47] shadow-2xl flex flex-col relative rounded-3xl overflow-hidden">

                            <!-- Header: rounded-t-3xl -->
                            <div class="bg-[#F1F8E9] p-4 md:p-5 flex items-center justify-center shrink-0 relative border-b-2 border-[#6CC452]/10">
                                <h2 id="settings-quiz-title" class="text-center text-lg md:text-2xl font-bold text-[#478D47] uppercase tracking-widest font-['Retro_Gaming'] leading-snug break-words line-clamp-2">
                                    Quiz Title
                                </h2>
                            </div>

                            <!-- Content Area (Tighter for mobile) -->
                            <div class="p-4 md:p-6 space-y-4 md:space-y-6 overflow-visible">
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 md:gap-y-6 relative z-30">
                                    <!-- Question Count -->
                                    <div class="space-y-1 md:space-y-2 relative z-[60]">
                                        <label class="flex items-center gap-2 text-[#478D47] text-[9px] md:text-[10px] font-bold uppercase tracking-widest font-['Retro_Gaming']">
                                            <span class="material-symbols-outlined text-sm">numbers</span> ${i18n.t('quiz_setting.question_count')}
                                        </label>
                                        <div class="relative w-full">
                                            <button id="settings-question-trigger" class="w-full h-10 md:h-12 bg-[#F1F8E9] border-2 border-[#6CC452]/30 border-b-4 border-[#478D47]/30 rounded-xl flex items-center justify-between px-4 text-[#478D47] font-bold hover:border-[#6CC452] transition-all group active:border-b-0 active:translate-y-0.5">
                                                <span id="settings-question-selected" class="font-['Space_Grotesk'] tracking-wide">${i18n.t('quiz_setting.q_5')}</span>
                                                <span id="settings-question-arrow" class="material-symbols-outlined text-[#6CC452]/50 transition-transform duration-300 group-hover:text-[#6CC452]">expand_more</span>
                                            </button>
                                            <div id="settings-question-menu" class="hidden absolute top-[calc(100%+4px)] left-0 w-full bg-white border-2 border-[#6CC452] rounded-xl shadow-2xl overflow-hidden transform transition-all duration-200 origin-top z-[60] flex flex-col p-1">
                                                <button class="question-opt w-full text-left px-4 py-2 hover:bg-[#F1F8E9] hover:text-[#478D47] rounded-lg transition-colors text-xs font-bold font-['Space_Grotesk'] text-[#478D47]" data-value="5" data-label="${i18n.t('quiz_setting.q_5')}">${i18n.t('quiz_setting.q_5')}</button>
                                                <button class="question-opt w-full text-left px-4 py-2 hover:bg-[#F1F8E9] hover:text-[#478D47] rounded-lg transition-colors text-xs font-bold font-['Space_Grotesk'] text-[#478D47]" data-value="10" data-label="${i18n.t('quiz_setting.q_10')}">${i18n.t('quiz_setting.q_10')}</button>
                                                <button class="question-opt w-full text-left px-4 py-2 hover:bg-[#F1F8E9] hover:text-[#478D47] rounded-lg transition-colors text-xs font-bold font-['Space_Grotesk'] text-[#478D47]" data-value="15" data-label="${i18n.t('quiz_setting.q_15')}">${i18n.t('quiz_setting.q_15')}</button>
                                                <button class="question-opt w-full text-left px-4 py-2 hover:bg-[#F1F8E9] hover:text-[#478D47] rounded-lg transition-colors text-xs font-bold font-['Space_Grotesk'] text-[#478D47]" data-value="20" data-label="${i18n.t('quiz_setting.q_20')}">${i18n.t('quiz_setting.q_20')}</button>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Timer -->
                                    <div class="space-y-1 md:space-y-2 relative z-[50]">
                                        <label class="flex items-center gap-2 text-[#478D47] text-[9px] md:text-[10px] font-bold uppercase tracking-widest font-['Retro_Gaming']">
                                            <span class="material-symbols-outlined text-sm">timer</span> ${i18n.t('quiz_setting.timer')}
                                        </label>
                                        <div class="relative w-full">
                                            <button id="settings-timer-trigger" class="w-full h-10 md:h-12 bg-[#F1F8E9] border-2 border-[#6CC452]/30 border-b-4 border-[#478D47]/30 rounded-xl flex items-center justify-between px-4 text-[#478D47] font-bold hover:border-[#6CC452] transition-all group active:border-b-0 active:translate-y-0.5">
                                                <span id="settings-timer-selected" class="font-['Space_Grotesk'] tracking-wide">${i18n.t('quiz_setting.m_5')}</span>
                                                <span id="settings-timer-arrow" class="material-symbols-outlined text-[#6CC452]/50 transition-transform duration-300 group-hover:text-[#6CC452]">expand_more</span>
                                            </button>
                                            <div id="settings-timer-menu" class="hidden absolute top-[calc(100%+4px)] left-0 w-full bg-white border-2 border-[#6CC452] rounded-xl shadow-2xl overflow-hidden transform transition-all duration-200 origin-top z-[60] flex flex-col p-1">
                                                <button class="timer-opt w-full text-left px-4 py-2 hover:bg-[#F1F8E9] hover:text-[#478D47] rounded-lg transition-colors text-xs font-bold font-['Space_Grotesk'] text-[#478D47]" data-value="300" data-label="${i18n.t('quiz_setting.m_5')}">${i18n.t('quiz_setting.m_5')}</button>
                                                <button class="timer-opt w-full text-left px-4 py-2 hover:bg-[#F1F8E9] hover:text-[#478D47] rounded-lg transition-colors text-xs font-bold font-['Space_Grotesk'] text-[#478D47]" data-value="600" data-label="${i18n.t('quiz_setting.m_10')}">${i18n.t('quiz_setting.m_10')}</button>
                                                <button class="timer-opt w-full text-left px-4 py-2 hover:bg-[#F1F8E9] hover:text-[#478D47] rounded-lg transition-colors text-xs font-bold font-['Space_Grotesk'] text-[#478D47]" data-value="900" data-label="${i18n.t('quiz_setting.m_15')}">${i18n.t('quiz_setting.m_15')}</button>
                                                <button class="timer-opt w-full text-left px-4 py-2 hover:bg-[#F1F8E9] hover:text-[#478D47] rounded-lg transition-colors text-xs font-bold font-['Space_Grotesk'] text-[#478D47]" data-value="1200" data-label="${i18n.t('quiz_setting.m_20')}">${i18n.t('quiz_setting.m_20')}</button>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Difficulty -->
                                    <div class="space-y-1 md:space-y-2 relative z-[40]">
                                        <label class="flex items-center gap-2 text-[#478D47] text-[9px] md:text-[10px] font-bold uppercase tracking-widest font-['Retro_Gaming']">
                                            <span class="material-symbols-outlined text-sm">hotel_class</span> ${i18n.t('quiz_setting.difficulty')}
                                        </label>
                                        <div class="relative w-full">
                                            <button id="settings-difficulty-trigger" class="w-full h-10 md:h-12 bg-[#F1F8E9] border-2 border-[#6CC452]/30 border-b-4 border-[#478D47]/30 rounded-xl flex items-center justify-between px-4 text-[#478D47] font-bold hover:border-[#6CC452] transition-all group active:border-b-0 active:translate-y-0.5">
                                                <span id="settings-difficulty-selected" class="font-['Space_Grotesk'] tracking-wide">${i18n.t('quiz_setting.diff_easy')}</span>
                                                <span id="settings-difficulty-arrow" class="material-symbols-outlined text-[#6CC452]/50 transition-transform duration-300 group-hover:text-[#6CC452]">expand_more</span>
                                            </button>
                                            <div id="settings-difficulty-menu" class="hidden absolute top-[calc(100%+4px)] left-0 w-full bg-white border-2 border-[#6CC452] rounded-xl shadow-2xl overflow-hidden transform transition-all duration-200 origin-top z-[60] flex flex-col p-1">
                                                <button class="diff-opt w-full text-left px-4 py-2 hover:bg-[#F1F8E9] hover:text-[#478D47] rounded-lg transition-colors text-xs font-bold font-['Space_Grotesk'] text-[#478D47]" data-value="mudah" data-label="${i18n.t('quiz_setting.diff_easy')}">${i18n.t('quiz_setting.diff_easy')}</button>
                                                <button class="diff-opt w-full text-left px-4 py-2 hover:bg-[#F1F8E9] hover:text-[#478D47] rounded-lg transition-colors text-xs font-bold font-['Space_Grotesk'] text-[#478D47]" data-value="sedang" data-label="${i18n.t('quiz_setting.diff_medium')}">${i18n.t('quiz_setting.diff_medium')}</button>
                                                <button class="diff-opt w-full text-left px-4 py-2 hover:bg-[#F1F8E9] hover:text-[#478D47] rounded-lg transition-colors text-xs font-bold font-['Space_Grotesk'] text-[#478D47]" data-value="sulit" data-label="${i18n.t('quiz_setting.diff_hard')}">${i18n.t('quiz_setting.diff_hard')}</button>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Music Toggle -->
                                    <div class="space-y-1 md:space-y-2 relative z-[30]">
                                        <label class="flex items-center gap-2 text-[#478D47] text-[9px] md:text-[10px] font-bold uppercase tracking-widest font-['Retro_Gaming']">
                                            <span class="material-symbols-outlined text-sm">music_note</span> ${i18n.t('quiz_setting.music')}
                                        </label>
                                        <div id="sound-toggle-container" class="w-full h-10 md:h-12 flex items-center bg-[#F1F8E9] border-2 border-[#6CC452]/30 border-b-4 border-[#478D47]/30 rounded-xl px-4 justify-between group hover:border-[#6CC452] transition-all cursor-pointer">
                                            <span class="text-[#478D47] text-xs font-bold font-['Space_Grotesk'] tracking-wide">${i18n.t('quiz_setting.music')}</span>
                                            <button id="sound-toggle-btn" class="w-10 h-6 bg-white border border-[#6CC452]/20 rounded-full relative transition-colors duration-300 cursor-pointer shadow-inner shrink-0 pointer-events-none">
                                                <div id="sound-toggle-knob" class="absolute top-[1px] left-[2px] w-5 h-5 bg-[#6CC452] rounded-full shadow-md transform transition-transform duration-300"></div>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Footer -->
                            <div class="p-4 md:p-5 bg-[#F1F8E9] flex justify-center mt-auto border-t-2 border-[#6CC452]/10">
                                <button id="settings-continue-btn" class="w-full md:w-auto px-12 h-12 md:h-14 bg-[#92C140] text-white font-bold text-base md:text-lg uppercase rounded-xl border-b-4 border-[#478D47] hover:brightness-110 active:border-b-0 active:translate-y-1 transition-all font-['Retro_Gaming'] flex items-center justify-center gap-3 shadow-lg">
                                    ${i18n.t('quiz_setting.create')}
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(quizSettingsUI);

            // Start Character Spawner
            GlobalBackground.startCharacterSpawner('quizsettings');
            // Handle language change event
            window.addEventListener('languageChanged', () => {
                if (quizSettingsUI) {
                    const isHidden = quizSettingsUI.classList.contains('hidden');
                    quizSettingsUI.remove();
                    QuizSettingsUI.render();
                    const newUI = document.getElementById('quiz-settings-ui');
                    if (newUI && !isHidden) newUI.classList.remove('hidden');
                    window.dispatchEvent(new CustomEvent('quizSettingsUIReRendered'));
                }
            });
        }
    }

}

