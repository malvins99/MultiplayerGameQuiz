export class QuizSettingsUI {
    static render() {
        let quizSettingsUI = document.getElementById('quiz-settings-ui');
        if (!quizSettingsUI) {
            quizSettingsUI = document.createElement('div');
            quizSettingsUI.id = 'quiz-settings-ui';
            quizSettingsUI.className = 'bg-background-dark hidden fixed top-0 left-0 w-full h-screen z-50';
            quizSettingsUI.innerHTML = `
                <div class="fixed inset-0 pointer-events-none overflow-hidden pixel-bg-pattern opacity-15"></div>
                <div class="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>

                <div class="relative z-10 flex h-screen w-full items-center justify-center p-4">
                <!-- Container: Removed overflow-hidden to allow dropdowns to pop out. Added explicit rounded corners to children. -->
                <div
                    class="w-full max-w-2xl bg-[#1a1a20] border-2 border-[#1C4D8D]/40 shadow-[0_0_30px_rgba(28,77,141,0.25)] flex flex-col relative rounded-3xl">

                    <!-- Header: rounded-t-3xl -->
                    <div
                    class="bg-black/40 p-5 border-b border-white/10 flex items-center justify-between shrink-0 relative rounded-t-[calc(1.5rem-2px)]">
                    <!-- Back Button -->
                    <button id="settings-back-btn"
                        class="flex items-center gap-3 text-white/50 hover:text-white transition-colors group">
                        <div
                        class="w-10 h-10 rounded-full border-2 border-white/10 flex items-center justify-center group-hover:border-[#4988C4] group-hover:bg-[#1C4D8D] group-hover:text-white transition-all">
                        <span class="material-symbols-outlined font-bold">arrow_back</span>
                        </div>
                        <span
                        class="text-xs font-bold uppercase tracking-widest hidden md:block group-hover:text-[#4988C4] transition-colors">Back</span>
                    </button>

                    <h2 id="settings-quiz-title"
                        class="flex-1 text-center text-xl md:text-2xl font-bold text-[#4988C4] uppercase tracking-widest font-['Retro_Gaming'] leading-relaxed px-4 break-words">
                        Quiz Title
                    </h2>
                    <!-- Empty div for spacing balance -->
                    <div class="w-20 hidden md:block"></div>
                    </div>

                    <!-- Content Area: Tighter padding (p-6), tighter gap (gap-6) -->
                    <div class="p-6 space-y-6 overflow-visible flex flex-col justify-center">

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 relative z-30">

                        <!-- ROW 1: Difficulty & Timer -->

                        <!-- Difficulty -->
                        <div class="space-y-2 relative z-[60]">
                        <label
                            class="flex items-center gap-2 text-white/50 text-[10px] font-bold uppercase tracking-widest font-['Retro_Gaming']">
                            <span class="material-symbols-outlined text-sm text-[#4988C4]">hotel_class</span> Kesulitan
                        </label>

                        <div class="relative w-full">
                            <button id="settings-difficulty-trigger"
                            class="w-full h-12 bg-black/40 border-2 border-white/10 rounded-xl flex items-center justify-between px-4 text-white font-bold hover:border-[#4988C4] transition-all group relative z-10">
                            <span id="settings-difficulty-selected" class="font-['Space_Grotesk'] tracking-wide">Mudah</span>
                            <span id="settings-difficulty-arrow"
                                class="material-symbols-outlined text-white/30 transition-transform duration-300 group-hover:text-[#4988C4]">expand_more</span>
                            </button>

                            <div id="settings-difficulty-menu"
                            class="hidden absolute top-[calc(100%+8px)] left-0 w-full bg-[#1a1a20] border-2 border-[#1C4D8D]/40 rounded-xl shadow-[0_0_30px_rgba(28,77,141,0.25)] overflow-hidden transform transition-all duration-200 origin-top z-[70] flex flex-col p-1">
                            <button
                                class="diff-opt w-full text-left px-4 py-3 hover:bg-white/10 hover:text-[#4988C4] rounded-lg transition-colors text-white/70 font-bold font-['Space_Grotesk']"
                                data-value="mudah" data-label="Mudah">Mudah</button>
                            <button
                                class="diff-opt w-full text-left px-4 py-3 hover:bg-white/10 hover:text-[#4988C4] rounded-lg transition-colors text-white/70 font-bold font-['Space_Grotesk']"
                                data-value="sedang" data-label="Sedang">Sedang</button>
                            <button
                                class="diff-opt w-full text-left px-4 py-3 hover:bg-white/10 hover:text-[#4988C4] rounded-lg transition-colors text-white/70 font-bold font-['Space_Grotesk']"
                                data-value="sulit" data-label="Sulit">Sulit</button>
                            </div>
                        </div>
                        </div>

                        <!-- Timer -->
                        <div class="space-y-2 relative z-[50]">
                        <label
                            class="flex items-center gap-2 text-white/50 text-[10px] font-bold uppercase tracking-widest font-['Retro_Gaming']">
                            <span class="material-symbols-outlined text-sm text-[#4988C4]">timer</span> Waktu
                        </label>

                        <div class="relative w-full">
                            <button id="settings-timer-trigger"
                            class="w-full h-12 bg-black/40 border-2 border-white/10 rounded-xl flex items-center justify-between px-4 text-white font-bold hover:border-[#4988C4] transition-all group relative z-10">
                            <span id="settings-timer-selected" class="font-['Space_Grotesk'] tracking-wide">5 Menit</span>
                            <span id="settings-timer-arrow"
                                class="material-symbols-outlined text-white/30 transition-transform duration-300 group-hover:text-[#4988C4]">expand_more</span>
                            </button>

                            <div id="settings-timer-menu"
                            class="hidden absolute top-[calc(100%+8px)] left-0 w-full bg-[#1a1a20] border-2 border-[#1C4D8D]/40 rounded-xl shadow-[0_0_30px_rgba(28,77,141,0.25)] overflow-hidden transform transition-all duration-200 origin-top z-[60] flex flex-col p-1">
                            <button
                                class="timer-opt w-full text-left px-4 py-3 hover:bg-white/10 hover:text-[#4988C4] rounded-lg transition-colors text-white/70 font-bold font-['Space_Grotesk']"
                                data-value="300" data-label="5 Menit">5 Menit</button>
                            <button
                                class="timer-opt w-full text-left px-4 py-3 hover:bg-white/10 hover:text-[#4988C4] rounded-lg transition-colors text-white/70 font-bold font-['Space_Grotesk']"
                                data-value="600" data-label="10 Menit">10 Menit</button>
                            <button
                                class="timer-opt w-full text-left px-4 py-3 hover:bg-white/10 hover:text-[#4988C4] rounded-lg transition-colors text-white/70 font-bold font-['Space_Grotesk']"
                                data-value="900" data-label="15 Menit">15 Menit</button>
                            <button
                                class="timer-opt w-full text-left px-4 py-3 hover:bg-white/10 hover:text-[#4988C4] rounded-lg transition-colors text-white/70 font-bold font-['Space_Grotesk']"
                                data-value="1200" data-label="20 Menit">20 Menit</button>
                            <button
                                class="timer-opt w-full text-left px-4 py-3 hover:bg-white/10 hover:text-[#4988C4] rounded-lg transition-colors text-white/70 font-bold font-['Space_Grotesk']"
                                data-value="1500" data-label="25 Menit">25 Menit</button>
                            <button
                                class="timer-opt w-full text-left px-4 py-3 hover:bg-white/10 hover:text-[#4988C4] rounded-lg transition-colors text-white/70 font-bold font-['Space_Grotesk']"
                                data-value="1800" data-label="30 Menit">30 Menit</button>
                            </div>
                        </div>
                        </div>

                        <!-- ROW 2: Question & Sound -->

                        <!-- Question Count -->
                        <div class="space-y-2 relative z-[40]">
                        <label
                            class="flex items-center gap-2 text-white/50 text-[10px] font-bold uppercase tracking-widest font-['Retro_Gaming']">
                            <span class="material-symbols-outlined text-sm text-[#4988C4]">numbers</span> Jumlah Soal
                        </label>

                        <div class="relative w-full">
                            <button id="settings-question-trigger"
                            class="w-full h-12 bg-black/40 border-2 border-white/10 rounded-xl flex items-center justify-between px-4 text-white font-bold hover:border-[#4988C4] transition-all group relative z-10">
                            <span id="settings-question-selected" class="font-['Space_Grotesk'] tracking-wide">5 Soal</span>
                            <span id="settings-question-arrow"
                                class="material-symbols-outlined text-white/30 transition-transform duration-300 group-hover:text-[#4988C4]">expand_more</span>
                            </button>

                            <div id="settings-question-menu"
                            class="hidden absolute top-[calc(100%+8px)] left-0 w-full bg-[#1a1a20] border-2 border-[#1C4D8D]/40 rounded-xl shadow-[0_0_30px_rgba(28,77,141,0.25)] overflow-hidden transform transition-all duration-200 origin-top z-[60] flex flex-col p-1">
                            <button
                                class="question-opt w-full text-left px-4 py-3 hover:bg-white/10 hover:text-[#4988C4] rounded-lg transition-colors text-white/70 font-bold font-['Space_Grotesk']"
                                data-value="5" data-label="5 Soal">5 Soal</button>
                            <button
                                class="question-opt w-full text-left px-4 py-3 hover:bg-white/10 hover:text-[#4988C4] rounded-lg transition-colors text-white/70 font-bold font-['Space_Grotesk']"
                                data-value="10" data-label="10 Soal">10 Soal</button>
                            <button
                                class="question-opt w-full text-left px-4 py-3 hover:bg-white/10 hover:text-[#4988C4] rounded-lg transition-colors text-white/70 font-bold font-['Space_Grotesk']"
                                data-value="15" data-label="15 Soal">20 Soal</button>
                            </div>
                        </div>
                        </div>

                        <!-- Sound Toggle -->
                        <div class="space-y-2 relative z-[30]">
                        <label
                            class="flex items-center gap-2 text-white/50 text-[10px] font-bold uppercase tracking-widest font-['Retro_Gaming']">
                            <span class="material-symbols-outlined text-sm text-[#4988C4]">music_note</span> Music
                        </label>

                        <div id="sound-toggle-container"
                            class="w-full h-12 flex items-center bg-black/40 border-2 border-white/10 rounded-xl px-4 justify-between group hover:border-[#4988C4] transition-colors cursor-pointer">
                            <span class="text-white font-bold font-['Space_Grotesk'] tracking-wide">Music</span>

                            <button id="sound-toggle-btn"
                            class="w-12 h-7 bg-white/10 rounded-full relative transition-colors duration-300 cursor-pointer shadow-inner shrink-0 pointer-events-none">
                            <div id="sound-toggle-knob"
                                class="absolute top-[2px] left-[2px] w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300">
                            </div>
                            </button>
                        </div>
                        </div>

                    </div>
                    </div>

                    <!-- Footer: rounded-b-3xl -->
                    <div class="p-5 bg-black/40 border-t border-white/10 flex justify-center mt-auto rounded-b-[calc(1.5rem-2px)]">
                    <button id="settings-continue-btn"
                        class="w-full md:w-auto px-12 h-14 bg-[#1C4D8D] text-white font-bold text-sm uppercase rounded-xl hover:bg-[#1C4D8D]/90 hover:scale-[1.02] active:scale-[0.98] transition-all font-['Retro_Gaming'] flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(28,77,141,0.4)]">
                        BUAT ROOM
                    </button>
                    </div>

                </div>
                </div>
            `;
            document.body.appendChild(quizSettingsUI);
        }
    }
}
