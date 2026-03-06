export class LobbyUI {
    static render() {
        let lobbyUI = document.getElementById('lobby-ui');
        if (!lobbyUI) {
            lobbyUI = document.createElement('div');
            lobbyUI.id = 'lobby-ui';
            lobbyUI.className = 'fantasy-bg fixed inset-0 z-10 overflow-y-auto flex flex-col hidden';
            lobbyUI.innerHTML = `
                <!-- Ambient Effects Layer -->
                <div class="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                    <!-- Base Pattern -->
                    <div class="absolute inset-0 pixel-bg-pattern opacity-[0.05]"></div>

                    <!-- Fog layers -->
                    <div class="absolute w-[200%] h-full top-0 left-[-50%] mystical-fog opacity-40"></div>

                    <!-- Bottom Silhouette (Forest/Terrain) -->
                    <div class="absolute bottom-0 w-full h-[320px] forest-silhouette opacity-70"></div>

                    <!-- Floating Particles / Fireflies -->
                    <div class="firefly" style="top: 25%; left: 15%; animation-delay: 0s;"></div>
                    <div class="firefly" style="top: 60%; left: 85%; animation-delay: 1.5s;"></div>
                    <div class="firefly" style="top: 40%; left: 50%; animation-delay: 3s;"></div>
                    <div class="firefly" style="top: 80%; left: 30%; animation-delay: 4.5s;"></div>

                    <div class="magic-particle" style="top: 70%; left: 20%; animation-delay: 0.5s;"></div>
                    <div class="magic-particle" style="top: 30%; left: 75%; animation-delay: 2.5s;"></div>
                    <div class="magic-particle" style="top: 85%; left: 60%; animation-delay: 4s;"></div>
                </div>

                <!-- Top Navigation -->
                <div class="relative z-50 flex items-start justify-between p-4 md:p-6 w-full">
                    <div class="select-none flex items-start">
                        <img src="/logo/gameforsmart-logo-fix.webp" alt="Partner Logo"
                            class="h-12 md:h-[130px] w-auto object-contain mt-1 md:-mt-5 -ms-2" draggable="false" />
                    </div>

                    <!-- User Profile & Menu -->
                    <div class="flex items-start gap-3">
                        <div id="lobby-user-profile"
                            class="flex items-center gap-3 bg-white/5 border border-white/10 rounded-full pl-1.5 pr-4 py-1.5 backdrop-blur-md shadow-xl">
                            <div class="w-8 h-8 md:w-9 md:h-9 rounded-full bg-secondary/20 border border-secondary/30 overflow-hidden flex items-center justify-center shrink-0">
                                <img id="lobby-user-avatar" src="" alt="Avatar" class="w-full h-full object-cover hidden" />
                                <span id="lobby-user-avatar-fallback" class="material-symbols-outlined text-secondary text-base md:text-lg">person</span>
                            </div>
                            <span id="lobby-user-name" class="text-white font-bold text-sm md:text-lg font-['Retro_Gaming'] tracking-tight truncate max-w-[100px] md:max-w-[150px]">Guest</span>
                        </div>

                        <div class="relative">
                            <button id="lobby-menu-btn" class="w-10 h-10 md:w-11 md:h-11 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 hover:border-white/30 transition-all backdrop-blur-md">
                                <span class="material-symbols-outlined text-white/70 text-xl">menu</span>
                            </button>
                            <div id="lobby-menu-dropdown" class="hidden absolute top-[calc(100%+8px)] right-0 w-48 bg-[#1a1a20]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden transform transition-all duration-200 origin-top-right scale-95 opacity-0 flex flex-col p-1 z-[60]">
                                <button id="lobby-menu-logout-btn" class="w-full text-left px-4 py-3 text-lg font-['Retro_Gaming'] hover:bg-white/5 rounded-lg transition-colors text-white/70 uppercase tracking-tight flex items-center gap-3">
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
                        <!-- Host Game Card -->
                        <div class="group flex-1 max-w-[380px] mx-auto md:mx-0 w-full bg-white/5 backdrop-blur-lg border border-white/10 rounded-[24px] md:rounded-[30px] p-4 md:p-6 flex flex-col items-center text-center hover:bg-[#0f3d29]/40 hover:border-[#1F7D53]/60 transition-all duration-300 shadow-2xl">
                            <div class="w-14 h-14 md:w-16 md:h-16 bg-[#1F7D53]/30 rounded-2xl flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform">
                                <span class="material-symbols-outlined text-[#00ff55] text-3xl md:text-4xl" style="font-variation-settings: 'FILL' 1;">flag</span>
                            </div>
                            <h2 class="text-xl md:text-2xl text-white mb-2 uppercase tracking-wider">HOST</h2>
                            <p class="text-white/60 text-xs md:text-sm leading-relaxed mb-6 max-w-[220px]">create your game world and invite survivors</p>
                            <button id="create-room-btn" class="mt-auto w-full py-3 bg-[#4C5C2D] text-white font-bold font-['Retro_Gaming'] text-lg rounded-xl border-b-4 border-[#4C5C2D] hover:brightness-110 active:border-b-0 active:translate-y-1 transition-all shadow-lg cursor-pointer">
                                Create World
                            </button>
                        </div>

                        <!-- Join Game Card -->
                        <div class="group flex-1 max-w-[380px] mx-auto md:mx-0 w-full bg-white/5 backdrop-blur-lg border border-white/10 rounded-[24px] md:rounded-[30px] p-4 md:p-6 flex flex-col items-center text-center hover:bg-[#0f3d29]/40 hover:border-[#1F7D53]/60 transition-all duration-300 shadow-2xl">
                            <div class="w-14 h-14 md:w-16 md:h-16 bg-[#1F7D53]/30 rounded-2xl flex items-center justify-center mb-4 group-hover:-rotate-12 transition-transform">
                                <span class="material-symbols-outlined text-[#00ff55] text-3xl md:text-4xl" style="font-variation-settings: 'FILL' 1;">group</span>
                            </div>
                            <h2 class="text-xl md:text-2xl text-white mb-2 uppercase tracking-wider">JOIN</h2>
                            <p class="text-white/60 text-xs md:text-sm leading-relaxed mb-4 max-w-[260px]">enter code to join world</p>

                            <!-- Code Input Group -->
                            <div class="w-full space-y-3 mt-auto">
                                <div>
                                    <input id="lobby-nickname-input" class="w-full h-11 bg-black/40 border border-white/10 rounded-xl focus:border-[#1F7D53] focus:ring-0 text-center text-lg text-white uppercase placeholder:text-white/10 font-['Retro_Gaming'] transition-all" placeholder="NICKNAME" type="text" maxlength="12" />
                                    <p id="nickname-error" class="hidden text-red-400 text-[9px] font-['Retro_Gaming'] mt-1.5 flex items-center gap-1.5 justify-center"><span class="material-symbols-outlined text-[11px]" style="font-variation-settings: 'FILL' 1;">error</span><span></span></p>
                                </div>
                                <div>
                                    <input id="room-code-input" class="w-full h-11 bg-black/40 border border-white/10 rounded-xl focus:border-[#1F7D53] focus:ring-0 text-center text-xl tracking-[0.3em] text-white uppercase placeholder:text-white/10 font-['Retro_Gaming'] transition-all" placeholder="CODE" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="6" oninput="this.value = this.value.replace(/[^0-9]/g, '')" />
                                    <p id="roomcode-error" class="hidden text-red-400 text-[9px] font-['Retro_Gaming'] mt-1.5 flex items-center gap-1.5 justify-center"><span class="material-symbols-outlined text-[11px]" style="font-variation-settings: 'FILL' 1;">error</span><span></span></p>
                                </div>
                                <button id="join-room-btn" class="w-full py-3 bg-[#4C5C2D] text-white font-bold font-['Retro_Gaming'] text-lg rounded-xl border-b-4 border-[#4C5C2D] hover:brightness-110 active:border-b-0 active:translate-y-1 transition-all shadow-lg cursor-pointer">
                                    Join
                                </button>
                                <p id="join-error" class="hidden text-red-400 text-[9px] font-['Retro_Gaming'] mt-1 flex items-center gap-1.5 justify-center"><span class="material-symbols-outlined text-[11px]" style="font-variation-settings: 'FILL' 1;">error</span><span></span></p>
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
        }
    }
}
