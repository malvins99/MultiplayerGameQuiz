export class QuizSettingsUI {
    static render() {
        let quizSettingsUI = document.getElementById('quiz-settings-ui');
        if (!quizSettingsUI) {
            quizSettingsUI = document.createElement('div');
            quizSettingsUI.id = 'quiz-settings-ui';
            quizSettingsUI.className = 'fixed inset-0 z-10 overflow-x-hidden overflow-y-auto flex flex-col hidden';
            quizSettingsUI.innerHTML = `
                <!-- Full-Screen Background — palette gradient -->
                <div class="absolute inset-0" style="background: linear-gradient(180deg, #6CC452 0%, #478D47 100%);"></div>

                <!-- Pixel-art Background Decorations -->
                <div class="absolute inset-0 z-0 pointer-events-none overflow-hidden">
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
                <div id="quizsettings-walking-characters-container" class="absolute inset-0 z-0 overflow-hidden pointer-events-none"></div>

                <!-- LOGO TOP LEFT (Zigma) — Desktop only -->
                <img id="settings-zigma-logo" src="/logo/Zigma-logo-fix.webp" style="top: -20px; left: -10px;" class="absolute w-64 z-50 object-contain cursor-pointer login-desktop-only" />

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
                                            <span class="material-symbols-outlined text-sm">numbers</span> Jumlah Soal
                                        </label>
                                        <div class="relative w-full">
                                            <button id="settings-question-trigger" class="w-full h-10 md:h-12 bg-[#F1F8E9] border-2 border-[#6CC452]/30 border-b-4 border-[#478D47]/30 rounded-xl flex items-center justify-between px-4 text-[#478D47] font-bold hover:border-[#6CC452] transition-all group active:border-b-0 active:translate-y-0.5">
                                                <span id="settings-question-selected" class="font-['Space_Grotesk'] tracking-wide">5 Soal</span>
                                                <span id="settings-question-arrow" class="material-symbols-outlined text-[#6CC452]/50 transition-transform duration-300 group-hover:text-[#6CC452]">expand_more</span>
                                            </button>
                                            <div id="settings-question-menu" class="hidden absolute top-[calc(100%+4px)] left-0 w-full bg-white border-2 border-[#6CC452] rounded-xl shadow-2xl overflow-hidden transform transition-all duration-200 origin-top z-[60] flex flex-col p-1">
                                                <button class="question-opt w-full text-left px-4 py-2 hover:bg-[#F1F8E9] hover:text-[#478D47] rounded-lg transition-colors text-xs font-bold font-['Space_Grotesk'] text-[#478D47]" data-value="5" data-label="5 Soal">5 Soal</button>
                                                <button class="question-opt w-full text-left px-4 py-2 hover:bg-[#F1F8E9] hover:text-[#478D47] rounded-lg transition-colors text-xs font-bold font-['Space_Grotesk'] text-[#478D47]" data-value="10" data-label="10 Soal">10 Soal</button>
                                                <button class="question-opt w-full text-left px-4 py-2 hover:bg-[#F1F8E9] hover:text-[#478D47] rounded-lg transition-colors text-xs font-bold font-['Space_Grotesk'] text-[#478D47]" data-value="15" data-label="15 Soal">15 Soal</button>
                                                <button class="question-opt w-full text-left px-4 py-2 hover:bg-[#F1F8E9] hover:text-[#478D47] rounded-lg transition-colors text-xs font-bold font-['Space_Grotesk'] text-[#478D47]" data-value="20" data-label="20 Soal">20 Soal</button>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Timer -->
                                    <div class="space-y-1 md:space-y-2 relative z-[50]">
                                        <label class="flex items-center gap-2 text-[#478D47] text-[9px] md:text-[10px] font-bold uppercase tracking-widest font-['Retro_Gaming']">
                                            <span class="material-symbols-outlined text-sm">timer</span> Waktu
                                        </label>
                                        <div class="relative w-full">
                                            <button id="settings-timer-trigger" class="w-full h-10 md:h-12 bg-[#F1F8E9] border-2 border-[#6CC452]/30 border-b-4 border-[#478D47]/30 rounded-xl flex items-center justify-between px-4 text-[#478D47] font-bold hover:border-[#6CC452] transition-all group active:border-b-0 active:translate-y-0.5">
                                                <span id="settings-timer-selected" class="font-['Space_Grotesk'] tracking-wide">5 Menit</span>
                                                <span id="settings-timer-arrow" class="material-symbols-outlined text-[#6CC452]/50 transition-transform duration-300 group-hover:text-[#6CC452]">expand_more</span>
                                            </button>
                                            <div id="settings-timer-menu" class="hidden absolute top-[calc(100%+4px)] left-0 w-full bg-white border-2 border-[#6CC452] rounded-xl shadow-2xl overflow-hidden transform transition-all duration-200 origin-top z-[60] flex flex-col p-1">
                                                <button class="timer-opt w-full text-left px-4 py-2 hover:bg-[#F1F8E9] hover:text-[#478D47] rounded-lg transition-colors text-xs font-bold font-['Space_Grotesk'] text-[#478D47]" data-value="300" data-label="5 Menit">5 Menit</button>
                                                <button class="timer-opt w-full text-left px-4 py-2 hover:bg-[#F1F8E9] hover:text-[#478D47] rounded-lg transition-colors text-xs font-bold font-['Space_Grotesk'] text-[#478D47]" data-value="600" data-label="10 Menit">10 Menit</button>
                                                <button class="timer-opt w-full text-left px-4 py-2 hover:bg-[#F1F8E9] hover:text-[#478D47] rounded-lg transition-colors text-xs font-bold font-['Space_Grotesk'] text-[#478D47]" data-value="900" data-label="15 Menit">15 Menit</button>
                                                <button class="timer-opt w-full text-left px-4 py-2 hover:bg-[#F1F8E9] hover:text-[#478D47] rounded-lg transition-colors text-xs font-bold font-['Space_Grotesk'] text-[#478D47]" data-value="1200" data-label="20 Menit">20 Menit</button>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Difficulty -->
                                    <div class="space-y-1 md:space-y-2 relative z-[40]">
                                        <label class="flex items-center gap-2 text-[#478D47] text-[9px] md:text-[10px] font-bold uppercase tracking-widest font-['Retro_Gaming']">
                                            <span class="material-symbols-outlined text-sm">hotel_class</span> Kesulitan
                                        </label>
                                        <div class="relative w-full">
                                            <button id="settings-difficulty-trigger" class="w-full h-10 md:h-12 bg-[#F1F8E9] border-2 border-[#6CC452]/30 border-b-4 border-[#478D47]/30 rounded-xl flex items-center justify-between px-4 text-[#478D47] font-bold hover:border-[#6CC452] transition-all group active:border-b-0 active:translate-y-0.5">
                                                <span id="settings-difficulty-selected" class="font-['Space_Grotesk'] tracking-wide">Mudah</span>
                                                <span id="settings-difficulty-arrow" class="material-symbols-outlined text-[#6CC452]/50 transition-transform duration-300 group-hover:text-[#6CC452]">expand_more</span>
                                            </button>
                                            <div id="settings-difficulty-menu" class="hidden absolute top-[calc(100%+4px)] left-0 w-full bg-white border-2 border-[#6CC452] rounded-xl shadow-2xl overflow-hidden transform transition-all duration-200 origin-top z-[60] flex flex-col p-1">
                                                <button class="diff-opt w-full text-left px-4 py-2 hover:bg-[#F1F8E9] hover:text-[#478D47] rounded-lg transition-colors text-xs font-bold font-['Space_Grotesk'] text-[#478D47]" data-value="mudah" data-label="Mudah">Mudah</button>
                                                <button class="diff-opt w-full text-left px-4 py-2 hover:bg-[#F1F8E9] hover:text-[#478D47] rounded-lg transition-colors text-xs font-bold font-['Space_Grotesk'] text-[#478D47]" data-value="sedang" data-label="Sedang">Sedang</button>
                                                <button class="diff-opt w-full text-left px-4 py-2 hover:bg-[#F1F8E9] hover:text-[#478D47] rounded-lg transition-colors text-xs font-bold font-['Space_Grotesk'] text-[#478D47]" data-value="sulit" data-label="Sulit">Sulit</button>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Music Toggle -->
                                    <div class="space-y-1 md:space-y-2 relative z-[30]">
                                        <label class="flex items-center gap-2 text-[#478D47] text-[9px] md:text-[10px] font-bold uppercase tracking-widest font-['Retro_Gaming']">
                                            <span class="material-symbols-outlined text-sm">music_note</span> Music
                                        </label>
                                        <div id="sound-toggle-container" class="w-full h-10 md:h-12 flex items-center bg-[#F1F8E9] border-2 border-[#6CC452]/30 border-b-4 border-[#478D47]/30 rounded-xl px-4 justify-between group hover:border-[#6CC452] transition-all cursor-pointer">
                                            <span class="text-[#478D47] text-xs font-bold font-['Space_Grotesk'] tracking-wide">Music</span>
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
                                    CREATE
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(quizSettingsUI);

            // Start Character Spawner
            QuizSettingsUI.startCharacterSpawner();
        }
    }

    private static spawnerInterval: any = null;
    private static startCharacterSpawner() {
        if (this.spawnerInterval) return;

        const container = document.getElementById('quizsettings-walking-characters-container');
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

