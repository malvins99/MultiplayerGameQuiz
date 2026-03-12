export class LobbyUI {
    static render() {
        let lobbyUI = document.getElementById('lobby-ui');
        if (!lobbyUI) {
            lobbyUI = document.createElement('div');
            lobbyUI.id = 'lobby-ui';
            lobbyUI.className = 'fixed inset-0 z-10 overflow-y-auto flex flex-col hidden';
            lobbyUI.innerHTML = `
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
                <div id="lobby-walking-characters-container" class="absolute inset-0 z-0 overflow-hidden pointer-events-none"></div>

                <!-- Top Navigation -->
                <div class="relative z-50 flex items-start justify-between p-4 md:p-6 w-full">
                    <div class="select-none flex items-start">
                        <img src="/logo/gameforsmart-logo-fix.webp" alt="Partner Logo"
                            class="h-12 md:h-[130px] w-auto object-contain mt-1 md:-mt-5 -ms-2" draggable="false" />
                    </div>

                    <!-- User Profile & Menu -->
                    <div class="flex items-start gap-3">
                        <div id="lobby-user-profile"
                            class="flex items-center gap-3 bg-white border-2 border-[#6CC452] rounded-full pl-1.5 pr-4 py-1.5 shadow-xl">
                            <div class="w-8 h-8 md:w-9 md:h-9 rounded-full bg-[#6CC452] border border-[#6CC452] overflow-hidden flex items-center justify-center shrink-0">
                                <img id="lobby-user-avatar" src="" alt="Avatar" class="w-full h-full object-cover hidden" />
                                <span id="lobby-user-avatar-fallback" class="material-symbols-outlined text-white text-base md:text-lg">person</span>
                            </div>
                            <span id="lobby-user-name" class="text-[#478D47] font-bold text-sm md:text-lg font-['Retro_Gaming'] tracking-tight truncate max-w-[100px] md:max-w-[150px]">Guest</span>
                        </div>

                        <div class="relative">
                            <button id="lobby-menu-btn" class="w-10 h-10 md:w-11 md:h-11 bg-white border-2 border-[#6CC452] rounded-xl flex items-center justify-center hover:bg-[#F1F8E9] transition-all">
                                <span class="material-symbols-outlined text-[#6CC452] text-xl">menu</span>
                            </button>
                            <div id="lobby-menu-dropdown" class="hidden absolute top-[calc(100%+8px)] right-0 w-48 bg-white border-2 border-[#6CC452] rounded-xl shadow-2xl overflow-hidden transform transition-all duration-200 origin-top-right scale-95 opacity-0 flex flex-col p-1 z-[60]">
                                <button id="lobby-menu-logout-btn" class="w-full text-left px-4 py-3 text-sm font-['Retro_Gaming'] hover:bg-[#F1F8E9] rounded-lg transition-colors text-[#6CC452] uppercase tracking-tight flex items-center gap-3">
                                    <span class="material-symbols-outlined text-sm">logout</span> Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Main Content (Logo + Cards) -->
                <div class="relative z-10 flex-1 flex flex-col items-center justify-start pt-0 px-4 md:justify-center md:-mt-48 pb-6">
                    <!-- Mega Central Logo -->
                    <div class="mb-2 md:-mb-10 md:-mt-24 transform hover:scale-105 transition-transform duration-500 z-10">
                        <img src="/logo/Zigma-logo-fix.webp" alt="Zigma Logo" class="h-24 md:h-[360px] w-auto object-contain" draggable="false" />
                    </div>

                    <!-- Action Cards Container (Uber Tight Spacing) -->
                    <div class="flex flex-col md:flex-row gap-3 md:gap-6 w-full max-w-5xl justify-center items-stretch z-20">
                        <div class="group flex-1 max-w-[380px] mx-auto md:mx-0 w-full bg-white border-4 border-[#6CC452] border-b-[12px] border-b-[#478D47] rounded-[24px] md:rounded-[30px] p-4 md:p-6 flex flex-col items-center text-center hover:bg-[#F1F8E9] transition-all duration-300 shadow-2xl">
                            <div class="w-14 h-14 md:w-16 md:h-16 bg-[#F1F8E9] border-2 border-[#478D47] rounded-2xl flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform">
                                <span class="material-symbols-outlined text-[#478D47] text-3xl md:text-4xl" style="font-variation-settings: 'FILL' 1;">flag</span>
                            </div>
                            <h2 class="text-xl md:text-2xl text-[#478D47] mb-2 uppercase tracking-wider">HOST</h2>
                            <p class="text-[#478D47] text-xs md:text-sm leading-relaxed mb-6 max-w-[220px]">create your game world and invite survivors</p>
                            <button id="create-room-btn" class="mt-auto w-full py-3 bg-[#6CC452] text-white font-bold font-['Retro_Gaming'] text-lg rounded-xl border-b-4 border-[#478D47] hover:brightness-110 active:border-b-0 active:translate-y-1 transition-all shadow-lg cursor-pointer">
                                Create World
                            </button>
                        </div>

                        <div class="group flex-1 max-w-[380px] mx-auto md:mx-0 w-full bg-white border-4 border-[#6CC452] border-b-[12px] border-b-[#478D47] rounded-[24px] md:rounded-[30px] p-4 md:p-6 flex flex-col items-center text-center hover:bg-[#F1F8E9] transition-all duration-300 shadow-2xl">
                            <div class="w-14 h-14 md:w-16 md:h-16 bg-[#F1F8E9] border-2 border-[#478D47] rounded-2xl flex items-center justify-center mb-4 group-hover:-rotate-12 transition-transform">
                                <span class="material-symbols-outlined text-[#478D47] text-3xl md:text-4xl" style="font-variation-settings: 'FILL' 1;">group</span>
                            </div>
                            <h2 class="text-xl md:text-2xl text-[#478D47] mb-2 uppercase tracking-wider">JOIN</h2>
                            <p class="text-[#478D47] text-xs md:text-sm leading-relaxed mb-4 max-w-[260px]">enter code to join world</p>

                            <!-- Code Input Group -->
                            <div class="w-full space-y-3 mt-auto">
                                <div>
                                    <input id="lobby-nickname-input" class="w-full h-11 bg-[#F1F8E9] border-2 border-[#6CC452]/30 rounded-xl focus:border-[#6CC452] focus:ring-4 focus:ring-[#6CC452]/20 text-center text-lg text-[#478D47] uppercase placeholder:text-[#6CC452]/30 font-['Retro_Gaming'] transition-all" placeholder="NICKNAME" type="text" maxlength="12" />
                                    <p id="nickname-error" class="hidden text-red-500 text-[9px] font-['Retro_Gaming'] mt-1.5 flex items-center gap-1.5 justify-center"><span class="material-symbols-outlined text-[11px]" style="font-variation-settings: 'FILL' 1;">error</span><span></span></p>
                                </div>
                                <div>
                                    <input id="room-code-input" class="w-full h-11 bg-[#F1F8E9] border-2 border-[#6CC452]/30 rounded-xl focus:border-[#6CC452] focus:ring-4 focus:ring-[#6CC452]/20 text-center text-xl tracking-[0.3em] text-[#478D47] uppercase placeholder:text-[#6CC452]/30 font-['Retro_Gaming'] transition-all" placeholder="CODE" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="6" oninput="this.value = this.value.replace(/[^0-9]/g, '')" />
                                    <p id="roomcode-error" class="hidden text-red-500 text-[9px] font-['Retro_Gaming'] mt-1.5 flex items-center gap-1.5 justify-center"><span class="material-symbols-outlined text-[11px]" style="font-variation-settings: 'FILL' 1;">error</span><span></span></p>
                                </div>
                                <button id="join-room-btn" class="w-full py-3 bg-[#6CC452] text-white font-bold font-['Retro_Gaming'] text-lg rounded-xl border-b-4 border-[#478D47] hover:brightness-110 active:border-b-0 active:translate-y-1 transition-all shadow-lg cursor-pointer">
                                    Join
                                </button>
                                <p id="join-error" class="hidden text-red-500 text-[9px] font-['Retro_Gaming'] mt-1 flex items-center gap-1.5 justify-center"><span class="material-symbols-outlined text-[11px]" style="font-variation-settings: 'FILL' 1;">error</span><span></span></p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Logout Modal -->
                <div id="logout-modal" class="hidden fixed inset-0 z-[100] flex items-center justify-center px-4">
                    <div id="logout-modal-backdrop" class="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
                    <div class="relative z-10 bg-[#18230F] border-4 border-red-500/50 rounded-3xl shadow-[0_0_40px_rgba(239,68,68,0.15)] p-8 max-w-sm w-full text-center overflow-hidden">
                        <div class="absolute inset-0 pixel-bg-pattern opacity-[0.05] pointer-events-none"></div>
                        
                        <div class="relative z-10">
                            <span class="material-symbols-outlined text-red-500 text-5xl mb-4 drop-shadow-[0_0_15px_rgba(239,68,68,0.6)]" style="font-variation-settings: 'FILL' 1;">logout</span>
                            <h3 class="text-white font-['Retro_Gaming'] text-base uppercase tracking-wider mb-2 drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">Logout</h3>
                            <p class="text-white/50 font-['Retro_Gaming'] text-[9px] mb-8 leading-relaxed">Are you sure you want<br>to log out?</p>
                            <div class="flex gap-4">
                                <button id="logout-cancel-btn" class="flex-1 py-3 bg-white/10 text-white font-['Retro_Gaming'] text-[10px] uppercase rounded-xl border-b-4 border-white/20 hover:bg-white/20 active:border-b-0 active:translate-y-1 transition-all cursor-pointer">Cancel</button>
                                <button id="logout-confirm-btn" class="flex-1 py-3 bg-red-500 text-white font-['Retro_Gaming'] text-[10px] uppercase rounded-xl border-b-4 border-red-700 hover:brightness-110 active:border-b-0 active:translate-y-1 transition-all cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.3)]">Logout</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(lobbyUI);

            // Start Character Spawner
            LobbyUI.startCharacterSpawner();
        }
    }

    private static spawnerInterval: any = null;
    private static startCharacterSpawner() {
        if (this.spawnerInterval) return;

        const container = document.getElementById('lobby-walking-characters-container');
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
