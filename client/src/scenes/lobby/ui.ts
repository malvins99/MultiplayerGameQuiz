import { i18n } from '../../utils/i18n';

export class LobbyUI {
    static render() {
        let lobbyUI = document.getElementById('lobby-ui');
        if (!lobbyUI) {
            lobbyUI = document.createElement('div');
            lobbyUI.id = 'lobby-ui';
            lobbyUI.className = 'fixed inset-0 z-10 hidden';
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

                <!-- Scrollable Content Layer -->
                <div class="absolute inset-0 overflow-y-auto flex flex-col no-scrollbar">
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
                            <span id="lobby-user-name" class="text-[#478D47] font-bold text-sm md:text-lg font-['Retro_Gaming'] tracking-tight truncate max-w-[100px] md:max-w-[150px]">${i18n.t('lobby.guest')}</span>
                        </div>

                        <div class="relative">
                            <button id="lobby-menu-btn" class="w-10 h-10 md:w-11 md:h-11 bg-white border-2 border-[#6CC452] rounded-xl flex items-center justify-center hover:bg-[#F1F8E9] transition-all">
                                <span class="material-symbols-outlined text-[#6CC452] text-xl">menu</span>
                            </button>
                            <div id="lobby-menu-dropdown" class="hidden absolute top-[calc(100%+8px)] right-0 w-48 bg-white border-2 border-[#6CC452] rounded-xl shadow-2xl overflow-hidden transform transition-all duration-200 origin-top-right scale-95 opacity-0 flex flex-col p-1 z-[60]">
                                <button id="lobby-lang-toggle-btn" class="w-full text-left px-4 py-2.5 text-[10px] font-['Retro_Gaming'] text-[#6CC452] border-b border-[#6CC452]/10 mb-1 uppercase tracking-widest flex items-center justify-between hover:bg-[#F1F8E9] transition-colors rounded-lg group">
                                    <div class="flex items-center gap-2">
                                        <span class="material-symbols-outlined text-[16px] group-hover:rotate-12 transition-transform">language</span>
                                        <span>${i18n.t('lobby.menu.language')}</span>
                                    </div>
                                    <span id="lobby-lang-arrow" class="material-symbols-outlined text-[14px] transition-transform">expand_more</span>
                                </button>
                                <div id="lobby-lang-options" class="hidden flex flex-col transition-all duration-300 overflow-hidden">
                                    <button class="lobby-lang-btn w-full text-left px-4 py-2.5 text-[11px] font-['Retro_Gaming'] ${i18n.getLanguage() === 'id' ? 'bg-[#F1F8E9] border-l-4 border-[#6CC452]' : ''} hover:bg-[#F1F8E9] rounded-lg transition-colors text-[#478D47] flex items-center justify-between group/item overflow-hidden" data-lang="id">
                                        <div class="flex items-center gap-2 ml-1 min-w-0">
                                            <span class="truncate">Bahasa Indonesia</span>
                                        </div>
                                        <span class="text-[9px] opacity-30 font-bold group-hover/item:opacity-100 transition-opacity shrink-0 ml-2">ID</span>
                                    </button>
                                    <button class="lobby-lang-btn w-full text-left px-4 py-2.5 text-[11px] font-['Retro_Gaming'] ${i18n.getLanguage() === 'en' ? 'bg-[#F1F8E9] border-l-4 border-[#6CC452]' : ''} hover:bg-[#F1F8E9] rounded-lg transition-colors text-[#478D47] flex items-center justify-between group/item overflow-hidden" data-lang="en">
                                        <div class="flex items-center gap-2 ml-1 min-w-0">
                                            <span class="truncate">English</span>
                                        </div>
                                        <span class="text-[9px] opacity-30 font-bold group-hover/item:opacity-100 transition-opacity shrink-0 ml-2">EN</span>
                                    </button>
                                    <button class="lobby-lang-btn w-full text-left px-4 py-2.5 text-[11px] font-['Retro_Gaming'] hover:bg-[#F1F8E9] rounded-lg transition-colors text-[#478D47] flex items-center justify-between group/item overflow-hidden border-b border-[#6CC452]/10 mb-1" data-lang="ar">
                                        <div class="flex items-center gap-2 ml-1 min-w-0">
                                            <span class="font-sans text-xs truncate">العربية</span>
                                        </div>
                                        <span class="text-[9px] opacity-30 font-bold group-hover/item:opacity-100 transition-opacity uppercase shrink-0 ml-2">AR</span>
                                    </button>
                                </div>
                                <div id="lobby-sound-container" class="w-full text-left px-4 py-2.5 text-[10px] font-['Retro_Gaming'] text-[#6CC452] border-b border-[#6CC452]/10 mb-1 uppercase tracking-widest flex items-center justify-between hover:bg-[#F1F8E9] transition-colors rounded-lg group cursor-pointer">
                                    <div class="flex items-center gap-2">
                                        <span class="material-symbols-outlined text-[16px] group-hover:rotate-12 transition-transform">music_note</span>
                                        <span>${i18n.t('quiz_setting.music')}</span>
                                    </div>
                                    <button id="lobby-sound-btn" class="w-10 h-6 bg-white border border-[#6CC452]/20 rounded-full relative transition-colors duration-300 shadow-inner shrink-0 pointer-events-none">
                                        <div id="lobby-sound-knob" class="absolute top-[1px] left-[2px] w-5 h-5 bg-[#6CC452] rounded-full shadow-md transform transition-transform duration-300"></div>
                                    </button>
                                </div>
                                <button id="lobby-menu-logout-btn" class="w-full text-left px-4 py-3 text-sm font-['Retro_Gaming'] hover:bg-red-50 rounded-lg transition-colors text-red-500 uppercase tracking-tight flex items-center gap-3">
                                    <span class="material-symbols-outlined text-sm">logout</span> ${i18n.t('lobby.menu.logout')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Main Content (Logo + Cards) -->
                <div class="relative z-10 flex-1 flex flex-col items-center justify-start pt-0 px-4 md:justify-center md:-mt-52 pb-6">
                    <!-- Mega Central Logo -->
                    <div class="mb-2 md:-mb-6 md:-mt-14 z-10">
                        <img src="/logo/Zigma-logo-fix.webp" alt="Zigma Logo" class="h-24 md:h-[280px] w-auto object-contain" draggable="false" />
                    </div>

                    <!-- Action Cards Container (Uber Tight Spacing) -->
                    <div class="flex flex-col md:flex-row gap-3 md:gap-5 w-full max-w-4xl justify-center items-stretch z-20">
                        <div class="group flex-1 max-w-[320px] mx-auto md:mx-0 w-full bg-white border-4 border-[#6CC452] border-b-[10px] border-b-[#478D47] rounded-[24px] md:rounded-[28px] p-4 md:p-5 flex flex-col items-center text-center hover:bg-[#F1F8E9] transition-all duration-300 shadow-2xl">
                            <div class="w-12 h-12 md:w-14 md:h-14 bg-[#F1F8E9] border-2 border-[#478D47] rounded-2xl flex items-center justify-center mb-3 group-hover:rotate-12 transition-transform">
                                <span class="material-symbols-outlined text-[#478D47] text-2xl md:text-3xl" style="font-variation-settings: 'FILL' 1;">flag</span>
                            </div>
                            <h2 class="text-lg md:text-xl text-[#478D47] mb-1 uppercase tracking-wider">${i18n.t('lobby.host_card.title')}</h2>
                            <p class="text-[#478D47] text-[10px] md:text-xs leading-relaxed mb-4 max-w-[200px]">${i18n.t('lobby.host_card.desc')}</p>
                            <button id="create-room-btn" class="mt-auto w-full py-2.5 bg-[#92C140] text-white font-bold font-['Retro_Gaming'] text-base rounded-xl border-b-4 border-[#478D47] hover:brightness-110 active:border-b-0 active:translate-y-1 transition-all shadow-lg cursor-pointer">
                                ${i18n.t('lobby.host_card.btn')}
                            </button>
                        </div>
                        <div class="group flex-1 max-w-[320px] mx-auto md:mx-0 w-full bg-white border-4 border-[#6CC452] border-b-[10px] border-b-[#478D47] rounded-[24px] md:rounded-[28px] p-4 md:p-5 flex flex-col items-center text-center hover:bg-[#F1F8E9] transition-all duration-300 shadow-2xl">
                            <div class="w-12 h-12 md:w-14 md:h-14 bg-[#F1F8E9] border-2 border-[#478D47] rounded-2xl flex items-center justify-center mb-3 group-hover:-rotate-12 transition-transform">
                                <span class="material-symbols-outlined text-[#478D47] text-2xl md:text-3xl" style="font-variation-settings: 'FILL' 1;">group</span>
                            </div>
                            <h2 class="text-lg md:text-xl text-[#478D47] mb-1 uppercase tracking-wider">${i18n.t('lobby.join_card.title')}</h2>
                            <p class="text-[#478D47] text-[10px] md:text-xs leading-relaxed mb-3 max-w-[240px]">${i18n.t('lobby.join_card.desc')}</p>
                            <!-- Code Input Group -->
                            <div class="w-full space-y-2 mt-auto">
                                <div>
                                    <input id="lobby-nickname-input" class="w-full h-10 bg-[#F1F8E9] border-2 border-[#6CC452]/30 rounded-xl focus:border-[#6CC452] focus:ring-4 focus:ring-[#6CC452]/20 text-center text-base text-[#478D47] uppercase placeholder:text-[#6CC452]/30 font-['Retro_Gaming'] transition-all" placeholder="${i18n.t('lobby.join_card.placeholders.nickname')}" type="text" maxlength="12" />
                                    <p id="nickname-error" class="hidden text-red-500 text-[8px] font-['Retro_Gaming'] mt-1 flex items-center gap-1.5 justify-center"><span class="material-symbols-outlined text-[10px]" style="font-variation-settings: 'FILL' 1;">error</span><span></span></p>
                                </div>
                                <div>
                                    <input id="room-code-input" class="w-full h-10 bg-[#F1F8E9] border-2 border-[#6CC452]/30 rounded-xl focus:border-[#6CC452] focus:ring-4 focus:ring-[#6CC452]/20 text-center text-lg tracking-[0.3em] text-[#478D47] uppercase placeholder:text-[#6CC452]/30 font-['Retro_Gaming'] transition-all" placeholder="${i18n.t('lobby.join_card.placeholders.code')}" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="6" oninput="this.value = this.value.replace(/[^0-9]/g, '')" />
                                    <p id="roomcode-error" class="hidden text-red-500 text-[8px] font-['Retro_Gaming'] mt-1 flex items-center gap-1.5 justify-center"><span class="material-symbols-outlined text-[10px]" style="font-variation-settings: 'FILL' 1;">error</span><span></span></p>
                                </div>
                                <button id="join-room-btn" class="w-full py-2.5 bg-[#92C140] text-white font-bold font-['Retro_Gaming'] text-base rounded-xl border-b-4 border-[#478D47] hover:brightness-110 active:border-b-0 active:translate-y-1 transition-all shadow-lg cursor-pointer">
                                    ${i18n.t('lobby.join_card.btn')}
                                </button>
                                <p id="join-error" class="hidden text-red-500 text-[8px] font-['Retro_Gaming'] mt-0.5 flex items-center gap-1.5 justify-center"><span class="material-symbols-outlined text-[10px]" style="font-variation-settings: 'FILL' 1;">error</span><span></span></p>
                            </div>
                        </div>

                    </div>
                    </div>
                </div>

                <!-- Fullscreen Button -->
                <button id="lobby-fullscreen-btn" class="fixed bottom-4 right-4 z-[100] w-12 h-12 md:w-14 md:h-14 bg-white border-2 border-[#6CC452] rounded-full flex items-center justify-center hover:bg-[#F1F8E9] shadow-lg transition-transform hover:scale-110 active:scale-95 cursor-pointer">
                    <span id="lobby-fullscreen-icon" class="material-symbols-outlined text-[#478D47] text-2xl md:text-3xl">fullscreen</span>
                </button>

                <!-- Logout Modal -->
                <div id="logout-modal" class="hidden fixed inset-0 z-[100] flex items-center justify-center px-4">
                    <div id="logout-modal-backdrop" class="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
                    <div class="relative z-10 bg-white border-4 border-[#6CC452] border-b-[10px] border-b-[#478D47] rounded-[32px] p-8 max-w-sm w-full text-center overflow-hidden shadow-2xl">
                        <div class="absolute inset-0 opacity-[0.03] pointer-events-none" style="background-image: radial-gradient(#2d5a30 1px, transparent 1px); background-size: 16px 16px;"></div>
                        
                        <div class="relative z-10 flex flex-col items-center">
                            <div class="w-16 h-16 bg-[#F1F8E9] border-2 border-[#478D47] rounded-2xl flex items-center justify-center mb-4">
                                <span class="material-symbols-outlined text-[#478D47] text-3xl" style="font-variation-settings: 'FILL' 1;">logout</span>
                            </div>
                            <h3 class="text-[#478D47] font-['Retro_Gaming'] text-lg uppercase tracking-wider mb-1">${i18n.t('lobby.logout_modal.title')}</h3>
                            <p id="logout-modal-name" class="text-[#6CC452] font-['Retro_Gaming'] text-[11px] mb-2 uppercase font-bold"></p>
                            <p class="text-[#478D47]/70 font-['Retro_Gaming'] text-[10px] mb-8 leading-relaxed">${i18n.t('lobby.logout_modal.desc')}</p>
                            <div class="flex gap-4 w-full">
                                <button id="logout-cancel-btn" class="flex-1 py-3 bg-[#F1F8E9] text-[#478D47] font-['Retro_Gaming'] text-xs uppercase rounded-xl border-b-4 border-[#6CC452]/50 hover:bg-[#E8F5E9] active:border-b-0 active:translate-y-1 transition-all cursor-pointer">${i18n.t('lobby.logout_modal.cancel')}</button>
                                <button id="logout-confirm-btn" class="flex-1 py-3 bg-[#FF5C5C] text-white font-['Retro_Gaming'] text-xs uppercase rounded-xl border-b-4 border-[#C0392B] hover:brightness-110 active:border-b-0 active:translate-y-1 transition-all cursor-pointer shadow-lg">${i18n.t('lobby.logout_modal.confirm')}</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(lobbyUI);

            // Start Character Spawner
            LobbyUI.startCharacterSpawner();

            // Fullscreen Logic
            const fsBtn = document.getElementById('lobby-fullscreen-btn');
            if (fsBtn) {
                fsBtn.addEventListener('click', () => {
                    if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
                        const docEl = document.documentElement as any;
                        if (docEl.requestFullscreen) docEl.requestFullscreen();
                        else if (docEl.webkitRequestFullscreen) docEl.webkitRequestFullscreen();
                        else if (docEl.msRequestFullscreen) docEl.msRequestFullscreen();
                    } else {
                        const doc = document as any;
                        if (doc.exitFullscreen) doc.exitFullscreen();
                        else if (doc.webkitExitFullscreen) doc.webkitExitFullscreen();
                        else if (doc.msExitFullscreen) doc.msExitFullscreen();
                    }
                });
            }

            if (!LobbyUI.fsListenerAdded) {
                LobbyUI.fsListenerAdded = true;
                const updateFsIcon = () => {
                    const fsIcon = document.getElementById('lobby-fullscreen-icon');
                    if (fsIcon) {
                        if (document.fullscreenElement || (document as any).webkitFullscreenElement) {
                            fsIcon.textContent = 'fullscreen_exit';
                        } else {
                            fsIcon.textContent = 'fullscreen';
                        }
                    }
                };
                document.addEventListener('fullscreenchange', updateFsIcon);
                document.addEventListener('webkitfullscreenchange', updateFsIcon);
            }

            // Handle language change event
            window.addEventListener('languageChanged', () => {
                if (lobbyUI) {
                    const isHidden = lobbyUI.classList.contains('hidden');
                    lobbyUI.remove();
                    LobbyUI.render();
                    const newUI = document.getElementById('lobby-ui');
                    if (newUI && !isHidden) newUI.classList.remove('hidden');
                    
                    // Re-setup listeners in LobbyManager
                    window.dispatchEvent(new CustomEvent('lobbyUIReRendered'));
                }
            });
        }
    }

    private static spawnerInterval: any = null;
    private static fsListenerAdded: boolean = false;
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
