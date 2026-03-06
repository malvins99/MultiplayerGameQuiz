export class QuizSettingsUI {
    static render() {
        let quizSettingsUI = document.getElementById('quiz-settings-ui');
        if (!quizSettingsUI) {
            quizSettingsUI = document.createElement('div');
            quizSettingsUI.id = 'quiz-settings-ui';
            quizSettingsUI.className = 'fantasy-bg hidden fixed top-0 left-0 w-full h-screen z-50';
            quizSettingsUI.innerHTML = `
                <!-- Ambient Effects Layer -->
                <div class="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                    <div class="absolute inset-0 pixel-bg-pattern opacity-[0.05]"></div>
                    <div class="absolute w-[200%] h-full top-0 left-[-50%] mystical-fog opacity-40"></div>
                    <div class="absolute bottom-0 w-full h-[320px] forest-silhouette opacity-70"></div>
                    <div class="firefly" style="top: 25%; left: 15%; animation-delay: 0s;"></div>
                    <div class="firefly" style="top: 60%; left: 85%; animation-delay: 1.5s;"></div>
                    <div class="firefly" style="top: 40%; left: 50%; animation-delay: 3s;"></div>
                    <div class="firefly" style="top: 80%; left: 30%; animation-delay: 4.5s;"></div>
                    <div class="magic-particle" style="top: 70%; left: 20%; animation-delay: 0.5s;"></div>
                    <div class="magic-particle" style="top: 30%; left: 75%; animation-delay: 2.5s;"></div>
                    <div class="magic-particle" style="top: 85%; left: 60%; animation-delay: 4s;"></div>
                </div>
                <div class="absolute inset-0 z-0 pointer-events-none"></div>

                <div class="relative z-10 flex h-screen w-full items-center justify-center p-4">
                <!-- Container: Glassmorphism style like HomePage cards -->
                <div
                    class="w-full max-w-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl flex flex-col relative rounded-3xl">

                    <!-- Header: rounded-t-3xl -->
                    <div
                    class="bg-black/20 p-5 flex items-center justify-between shrink-0 relative rounded-t-[calc(1.5rem-2px)]">
                    <!-- Back Button -->
                    <button id="settings-back-btn"
                        class="hidden group">
                        <div
                        class="w-10 h-10 rounded-full border-2 border-white/10 flex items-center justify-center group-hover:border-[#1F7D53] group-hover:bg-[#4C5C2D] group-hover:text-white transition-all">
                        <span class="material-symbols-outlined font-bold">arrow_back</span>
                        </div>
                        <span
                        class="text-xs font-bold uppercase tracking-widest hidden md:block group-hover:text-[#1F7D53] transition-colors">Back</span>
                    </button>

                    <div class="flex-1 flex max-w-full justify-center items-center px-2 md:px-4 relative group">
                        <h2 id="settings-quiz-title"
                            class="text-center text-lg md:text-2xl font-bold text-[#1F7D53] uppercase tracking-widest font-['Retro_Gaming'] leading-snug md:leading-relaxed break-words line-clamp-2 transition-all duration-300">
                            Quiz Title
                        </h2>
                        <button id="settings-title-expand-btn" class="hidden shrink-0 ml-1 md:ml-2 w-8 h-8 rounded-full bg-white  flex items-center justify-center transition-colors text-[#4C5C2D]">
                            <span id="settings-title-expand-icon" class="material-symbols-outlined text-2xl transition-transform duration-300">expand_more</span>
                        </button>
                    </div>
                    <!-- Empty div for spacing balance -->
                    <div class="hidden"></div>
                    </div>

                    <!-- Content Area: Tighter padding (p-6), tighter gap (gap-6) -->
                    <div class="p-6 space-y-6 overflow-visible flex flex-col justify-center">

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 relative z-30">

                        <!-- ROW 1: Difficulty & Timer -->

                        <!-- Question Count -->
                        <div class="space-y-2 relative z-[60]">
                        <label
                            class="flex items-center gap-2 text-white text-[10px] font-bold uppercase tracking-widest font-['Retro_Gaming']">
                            <span class="material-symbols-outlined text-sm text-[#1F7D53]">numbers</span> Jumlah Soal
                        </label>

                        <div class="relative w-full">
                            <button id="settings-question-trigger"
                            class="w-full h-12 bg-black/40 border-2 border-white/10 rounded-xl flex items-center justify-between px-4 text-white font-bold hover:border-[#1F7D53] transition-all group relative z-10">
                            <span id="settings-question-selected" class="font-['Space_Grotesk'] tracking-wide">5 Soal</span>
                            <span id="settings-question-arrow"
                                class="material-symbols-outlined text-white/30 transition-transform duration-300 group-hover:text-[#1F7D53]">expand_more</span>
                            </button>

                            <div id="settings-question-menu"
                            class="hidden absolute top-[calc(100%+8px)] left-0 w-full bg-[#1a1a20]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden transform transition-all duration-200 origin-top z-[70] flex flex-col p-1">
                            <button
                                class="question-opt w-full text-left px-4 py-3 hover:bg-white/10 hover:text-[#1F7D53] rounded-lg transition-colors text-white/70 font-bold font-['Space_Grotesk']"
                                data-value="5" data-label="5 Soal">5 Soal</button>
                            <button
                                class="question-opt w-full text-left px-4 py-3 hover:bg-white/10 hover:text-[#1F7D53] rounded-lg transition-colors text-white/70 font-bold font-['Space_Grotesk']"
                                data-value="10" data-label="10 Soal">10 Soal</button>
                            <button
                                class="question-opt w-full text-left px-4 py-3 hover:bg-white/10 hover:text-[#1F7D53] rounded-lg transition-colors text-white/70 font-bold font-['Space_Grotesk']"
                                data-value="15" data-label="15 Soal">20 Soal</button>
                            </div>
                        </div>
                        </div>

                        <!-- Timer -->
                        <div class="space-y-2 relative z-[50]">
                        <label
                            class="flex items-center gap-2 text-white text-[10px] font-bold uppercase tracking-widest font-['Retro_Gaming']">
                            <span class="material-symbols-outlined text-sm text-[#1F7D53]">timer</span> Waktu
                        </label>

                        <div class="relative w-full">
                            <button id="settings-timer-trigger"
                            class="w-full h-12 bg-black/40 border-2 border-white/10 rounded-xl flex items-center justify-between px-4 text-white font-bold hover:border-[#1F7D53] transition-all group relative z-10">
                            <span id="settings-timer-selected" class="font-['Space_Grotesk'] tracking-wide">5 Menit</span>
                            <span id="settings-timer-arrow"
                                class="material-symbols-outlined text-white/30 transition-transform duration-300 group-hover:text-[#1F7D53]">expand_more</span>
                            </button>

                            <div id="settings-timer-menu"
                            class="hidden absolute top-[calc(100%+8px)] left-0 w-full bg-[#1a1a20]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden transform transition-all duration-200 origin-top z-[60] flex flex-col p-1">
                            <button
                                class="timer-opt w-full text-left px-4 py-3 hover:bg-white/10 hover:text-[#1F7D53] rounded-lg transition-colors text-white/70 font-bold font-['Space_Grotesk']"
                                data-value="300" data-label="5 Menit">5 Menit</button>
                            <button
                                class="timer-opt w-full text-left px-4 py-3 hover:bg-white/10 hover:text-[#1F7D53] rounded-lg transition-colors text-white/70 font-bold font-['Space_Grotesk']"
                                data-value="600" data-label="10 Menit">10 Menit</button>
                            <button
                                class="timer-opt w-full text-left px-4 py-3 hover:bg-white/10 hover:text-[#1F7D53] rounded-lg transition-colors text-white/70 font-bold font-['Space_Grotesk']"
                                data-value="900" data-label="15 Menit">15 Menit</button>
                            <button
                                class="timer-opt w-full text-left px-4 py-3 hover:bg-white/10 hover:text-[#1F7D53] rounded-lg transition-colors text-white/70 font-bold font-['Space_Grotesk']"
                                data-value="1200" data-label="20 Menit">20 Menit</button>
                            <button
                                class="timer-opt w-full text-left px-4 py-3 hover:bg-white/10 hover:text-[#1F7D53] rounded-lg transition-colors text-white/70 font-bold font-['Space_Grotesk']"
                                data-value="1500" data-label="25 Menit">25 Menit</button>
                            <button
                                class="timer-opt w-full text-left px-4 py-3 hover:bg-white/10 hover:text-[#1F7D53] rounded-lg transition-colors text-white/70 font-bold font-['Space_Grotesk']"
                                data-value="1800" data-label="30 Menit">30 Menit</button>
                            </div>
                        </div>
                        </div>

                        <!-- ROW 2: Question & Sound -->

                        <!-- Difficulty -->
                        <div class="space-y-2 relative z-[40]">
                        <label
                            class="flex items-center gap-2 text-white text-[10px] font-bold uppercase tracking-widest font-['Retro_Gaming']">
                            <span class="material-symbols-outlined text-sm text-[#1F7D53]">hotel_class</span> Kesulitan
                        </label>

                        <div class="relative w-full">
                            <button id="settings-difficulty-trigger"
                            class="w-full h-12 bg-black/40 border-2 border-white/10 rounded-xl flex items-center justify-between px-4 text-white font-bold hover:border-[#1F7D53] transition-all group relative z-10">
                            <span id="settings-difficulty-selected" class="font-['Space_Grotesk'] tracking-wide">Mudah</span>
                            <span id="settings-difficulty-arrow"
                                class="material-symbols-outlined text-white/30 transition-transform duration-300 group-hover:text-[#1F7D53]">expand_more</span>
                            </button>

                            <div id="settings-difficulty-menu"
                            class="hidden absolute top-[calc(100%+8px)] left-0 w-full bg-[#1a1a20]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden transform transition-all duration-200 origin-top z-[60] flex flex-col p-1">
                            <button
                                class="diff-opt w-full text-left px-4 py-3 hover:bg-white/10 hover:text-[#1F7D53] rounded-lg transition-colors text-white/70 font-bold font-['Space_Grotesk']"
                                data-value="mudah" data-label="Mudah">Mudah</button>
                            <button
                                class="diff-opt w-full text-left px-4 py-3 hover:bg-white/10 hover:text-[#1F7D53] rounded-lg transition-colors text-white/70 font-bold font-['Space_Grotesk']"
                                data-value="sedang" data-label="Sedang">Sedang</button>
                            <button
                                class="diff-opt w-full text-left px-4 py-3 hover:bg-white/10 hover:text-[#1F7D53] rounded-lg transition-colors text-white/70 font-bold font-['Space_Grotesk']"
                                data-value="sulit" data-label="Sulit">Sulit</button>
                            </div>
                        </div>
                        </div>

                        <!-- Sound Toggle -->
                        <div class="space-y-2 relative z-[30]">
                        <label
                            class="flex items-center gap-2 text-white text-[10px] font-bold uppercase tracking-widest font-['Retro_Gaming']">
                            <span class="material-symbols-outlined text-sm text-[#1F7D53]">music_note</span> Music
                        </label>

                        <div id="sound-toggle-container"
                            class="w-full h-12 flex items-center bg-black/40 border-2 border-white/10 rounded-xl px-4 justify-between group hover:border-[#1F7D53] transition-colors cursor-pointer">
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
                    <div class="p-5 bg-black/20 flex justify-center mt-auto rounded-b-[calc(1.5rem-2px)]">
                    <button id="settings-continue-btn"
                        class="w-full md:w-auto px-12 h-14 bg-[#4C5C2D] text-white font-bold text-lg uppercase rounded-xl border-b-4 border-black/30 hover:border-black/50 hover:brightness-110 active:border-b-0 active:translate-y-1 transition-all font-['Retro_Gaming'] flex items-center justify-center gap-3">
                        CREATE
                    </button>
                    </div>

                </div>
                </div>
            `;
            document.body.appendChild(quizSettingsUI);
        }
    }
}

