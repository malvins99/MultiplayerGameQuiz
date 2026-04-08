import { i18n } from '../../utils/i18n';

export class LoginUI {
    static render() {
        let loginUI = document.getElementById('login-ui');
        if (!loginUI) {
            loginUI = document.createElement('div');
            loginUI.id = 'login-ui';
            loginUI.className = 'hidden fixed top-0 left-0 w-full h-full z-30 overflow-hidden';
            const isRTL = i18n.getLanguage() === 'ar';
            loginUI.innerHTML = `
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
                <div id="walking-characters-container" class="absolute inset-0 z-0 overflow-hidden pointer-events-none"></div>

                <!-- LOGO TOP LEFT (Zigma) — Desktop only -->
                <img src="/logo/Zigma-logo-fix.webp" alt="Zigma Logo" style="top: -20px; left: -10px;" class="absolute w-64 z-50 pointer-events-none object-contain login-desktop-only" />

                <!-- LOGO TOP RIGHT (GFS) — Desktop only -->
                <img src="/logo/gameforsmart-logo-fix.webp" alt="Game For Smart Logo" style="top: -25px; right: 10px;" class="absolute w-80 z-50 pointer-events-none object-contain login-desktop-only" />

                <!-- MOBILE LOGO (Zigma only, centered at top) — Mobile only -->
                <div class="login-mobile-only w-full justify-center pt-5 relative z-50 pointer-events-none">
                    <img src="/logo/Zigma-logo-fix.webp" alt="Zigma Mobile Logo" class="w-52 object-contain" />
                </div>

                <!-- Main Content -->
                <div class="relative z-10 flex h-full w-full items-start md:items-center justify-center px-4 md:px-8 pt-8 md:pt-0">
                    <div class="w-full max-w-md md:max-w-xl -mt-10 md:mt-0">

                        <!-- Login Card — solid #D3EE98 background -->
                        <div class="flex flex-col relative rounded-3xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.15)] bg-white">
                            <!-- Scanline Overlay (Pixel effect) -->
                            <div class="absolute inset-0 pointer-events-none opacity-[0.03]" style="background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06)); background-size: 100% 2px, 3px 100%;"></div>

                            <!-- Header — solid #72BF78 -->
                            <div class="p-6 flex items-center justify-center shrink-0 relative border-b border-gray-100 bg-white">
                                <h1 class="text-3xl font-extrabold text-[#46A881] uppercase tracking-[0.2em] font-['Retro_Gaming'] leading-relaxed drop-shadow-sm">
                                    ${i18n.t('login.title')}
                                </h1>
                            </div>

                            <!-- Form -->
                            <form id="login-form" class="p-6 space-y-4">
                                <!-- General Error Message -->
                                <div id="login-error" class="hidden bg-red-500/10 border border-red-500/40 text-red-700 text-[9px] font-['Retro_Gaming'] px-4 py-3 rounded-xl flex items-center gap-2">
                                    <span class="material-symbols-outlined text-sm shrink-0" style="font-variation-settings: 'FILL' 1;">error</span>
                                    <span id="login-error-text"></span>
                                </div>

                                <!-- Google Login Button — darkened yellow background -->
                                <button type="button" id="google-login-btn" class="w-full h-12 border-2 border-gray-200 rounded-2xl flex items-center justify-center px-4 font-bold hover:bg-gray-50 active:scale-[0.98] transition-all group relative z-10 gap-3 bg-white text-gray-700">
                                    <!-- Google Icon -->
                                    <svg class="w-5 h-5 transition-transform" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    <span class="font-['Retro_Gaming'] tracking-wide">${i18n.t('login.google_signin')}</span>
                                </button>

                                <!-- Divider -->
                                <div class="flex items-center gap-4">
                                    <div class="flex-1 border-t border-gray-100"></div>
                                    <span class="text-[#46A881]/60 text-[10px] uppercase font-bold tracking-widest font-['Retro_Gaming']">${i18n.t('login.or')}</span>
                                    <div class="flex-1 border-t border-gray-100"></div>
                                </div>

                                <!-- Email/Username Input -->
                                <div class="space-y-1 relative ${isRTL ? 'text-right' : ''}" dir="${isRTL ? 'rtl' : 'ltr'}">
                                    <label class="flex items-center gap-2 text-[#46A881] text-[10px] font-bold uppercase tracking-widest font-['Retro_Gaming'] ${isRTL ? 'flex-row-reverse' : ''}">
                                        <span class="material-symbols-outlined text-sm text-[#46A881]">person</span> ${i18n.t('login.email_username')}
                                    </label>
                                    <div class="relative w-full">
                                        <input id="login-email" type="text" placeholder="${i18n.t('login.placeholders.email')}" autocomplete="off" class="w-full h-12 border border-gray-200 rounded-2xl ${isRTL ? 'pl-12 pr-4' : 'px-4'} font-['Retro_Gaming'] text-base transition-all focus:ring-4 focus:ring-[#46A881]/20 focus:border-[#46A881] group bg-[#FBFBFB] text-gray-800" />
                                        <div class="absolute ${isRTL ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2">
                                            <span class="material-symbols-outlined text-[#46A881] hover:text-[#388567] transition-colors cursor-pointer">mail</span>
                                        </div>
                                    </div>
                                    <p id="email-error" class="hidden text-red-600 text-[9px] font-['Retro_Gaming'] mt-1 flex items-center gap-1.5 ${isRTL ? 'flex-row-reverse' : ''}"><span class="material-symbols-outlined text-[11px]" style="font-variation-settings: 'FILL' 1;">error</span><span></span></p>
                                </div>

                                <!-- Password Input -->
                                <div class="space-y-1 relative ${isRTL ? 'text-right' : ''}" dir="${isRTL ? 'rtl' : 'ltr'}">
                                    <label class="flex items-center gap-2 text-[#46A881] text-[10px] font-bold uppercase tracking-widest font-['Retro_Gaming'] ${isRTL ? 'flex-row-reverse' : ''}">
                                        <span class="material-symbols-outlined text-sm text-[#46A881]">lock</span> ${i18n.t('login.password')}
                                    </label>
                                    <div class="relative w-full">
                                        <input id="login-password" type="password" placeholder="${i18n.t('login.placeholders.password')}" class="w-full h-12 border border-gray-200 rounded-2xl ${isRTL ? 'pl-12 pr-4' : 'px-4'} font-['Retro_Gaming'] text-base transition-all focus:ring-4 focus:ring-[#46A881]/20 focus:border-[#46A881] group bg-[#FBFBFB] text-gray-800" />
                                        <button type="button" id="password-toggle" class="absolute ${isRTL ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 text-[#46A881] hover:text-[#388567] transition-colors">
                                            <span class="material-symbols-outlined">visibility_off</span>
                                        </button>
                                    </div>
                                    <p id="password-error" class="hidden text-red-600 text-[9px] font-['Retro_Gaming'] mt-1 flex items-center gap-1.5 ${isRTL ? 'flex-row-reverse' : ''}"><span class="material-symbols-outlined text-[11px]" style="font-variation-settings: 'FILL' 1;">error</span><span></span></p>
                                </div>

                                <!-- Login Button — matched with HomePage -->
                                <button type="submit" id="login-btn" class="pixel-text-outline w-full h-14 flex items-center justify-center text-white font-['Retro_Gaming'] font-extrabold uppercase text-lg rounded-2xl bg-[#336B23] border-b-4 border-[#1F4514] shadow-lg hover:brightness-110 active:border-b-0 active:translate-y-1 transition-all cursor-pointer gap-3">
                                    <span class="material-symbols-outlined text-2xl">login</span>
                                    ${i18n.t('login.login_btn')}
                                </button>

                                <!-- Register Link -->
                                <div class="text-center pt-3 flex flex-col items-center justify-center mt-2">
                                    <div class="inline-flex items-center justify-center gap-2 whitespace-nowrap text-[11px] w-full font-bold ${i18n.getLanguage() === 'ar' ? 'flex-row-reverse' : ''}">
                                        <span class="text-[#46A881]/60 font-['Retro_Gaming'] tracking-widest">${i18n.t('login.dont_have_account')}</span>
                                        <a href="https://gameforsmart2026.vercel.app/auth/register" id="register-link" class="text-[#46A881] hover:text-[#388567] transition-all font-['Retro_Gaming'] font-black">${i18n.t('login.register')}</a>
                                    </div>
                                </div>
                            </form>
                        </div>

                    </div>
                </div>
            `;
            document.body.appendChild(loginUI);

            // Start Character Spawner
            LoginUI.startCharacterSpawner();

            // Handle language change event
            window.addEventListener('languageChanged', () => {
                // Clear existing UI and re-render
                if (loginUI) {
                    const isHidden = loginUI.classList.contains('hidden');
                    loginUI.remove();
                    LoginUI.render();
                    const newUI = document.getElementById('login-ui');
                    if (newUI && !isHidden) newUI.classList.remove('hidden');
                    
                    // Re-read login manager to re-setup listeners (managed by LoginManager)
                    window.dispatchEvent(new CustomEvent('loginUIReRendered'));
                }
            });
        } else {
            // If already exists, we might need to update the innerHTML if it's a re-render
            // but for simplicity, we handles it via removal and re-render above.
        }
    }

    private static spawnerInterval: any = null;
    private static startCharacterSpawner() {
        if (this.spawnerInterval) return;

        const container = document.getElementById('walking-characters-container');
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
