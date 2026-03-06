export class LoginUI {
    static render() {
        let loginUI = document.getElementById('login-ui');
        if (!loginUI) {
            loginUI = document.createElement('div');
            loginUI.id = 'login-ui';
            loginUI.className = 'hidden fixed top-0 left-0 w-full h-screen z-30 overflow-y-auto md:overflow-hidden fantasy-bg';
            loginUI.innerHTML = `
                <!-- LOGO TOP LEFT (Zigma) — Desktop only -->
                <img src="/logo/Zigma-logo-fix.webp" style="top: -20px; left: -10px;" class="absolute w-64 z-50 pointer-events-none object-contain login-desktop-only" />

                <!-- LOGO TOP RIGHT (GFS) — Desktop only -->
                <img src="/logo/gameforsmart-logo-fix.webp" style="top: -25px; right: 10px;" class="absolute w-80 z-50 pointer-events-none object-contain login-desktop-only" />

                <!-- MOBILE LOGO (Zigma only, centered at top) — Mobile only -->
                <div class="login-mobile-only w-full justify-center pt-5 relative z-50 pointer-events-none">
                    <img src="/logo/Zigma-logo-fix.webp" class="w-40 object-contain" />
                </div>

                <!-- Ambient Effects Layer -->
                <div class="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                    <!-- Base Pattern -->
                    <div class="absolute inset-0 pixel-bg-pattern opacity-[0.05]"></div>

                    <!-- Fog layers -->
                    <div class="absolute w-[200%] h-full top-0 left-[-50%] mystical-fog opacity-40"></div>

                    <!-- Bottom Silhouette (Forest/Terrain) -->
                    <div class="absolute bottom-0 w-full h-[320px] forest-silhouette opacity-70"></div>

                    <!-- Floating Particles / Fireflies (White) -->
                    <div class="firefly !bg-white !shadow-[0_0_15px_rgba(255,255,255,0.8)]" style="top: 25%; left: 15%; animation-delay: 0s;"></div>
                    <div class="firefly !bg-white !shadow-[0_0_15px_rgba(255,255,255,0.8)]" style="top: 60%; left: 85%; animation-delay: 1.5s;"></div>
                    <div class="firefly !bg-white !shadow-[0_0_15px_rgba(255,255,255,0.8)]" style="top: 40%; left: 50%; animation-delay: 3s;"></div>
                    <div class="firefly !bg-white !shadow-[0_0_15px_rgba(255,255,255,0.8)]" style="top: 80%; left: 30%; animation-delay: 4.5s;"></div>

                    <div class="magic-particle" style="top: 70%; left: 20%; animation-delay: 0.5s;"></div>
                    <div class="magic-particle" style="top: 30%; left: 75%; animation-delay: 2.5s;"></div>
                    <div class="magic-particle" style="top: 85%; left: 60%; animation-delay: 4s;"></div>
                </div>

                <!-- Main Content -->
                <div class="relative z-10 flex min-h-screen md:h-screen w-full items-start md:items-center justify-center px-4 pt-4 pb-8 md:p-4">
                    <div class="w-full max-w-md">

                        <!-- Login Card -->
                        <div class="bg-[#18230F] border-2 border-[#255F38]/40 shadow-[0_0_30px_rgba(37,95,56,0.25)] flex flex-col relative rounded-3xl">

                            <!-- Header -->
                            <div class="bg-black/40 p-5 border-b border-white/10 flex items-center justify-center shrink-0 relative rounded-t-[calc(1.5rem-2px)]">
                                <!-- Logo/Title -->
                                <h1 class="text-2xl font-bold text-white uppercase tracking-widest font-['Retro_Gaming'] leading-relaxed drop-shadow-[3px_3px_0_rgba(0,0,0,1)]">
                                    LOGIN
                                </h1>
                            </div>

                            <!-- Form -->
                            <form id="login-form" class="p-6 space-y-5">
                                <!-- General Error Message -->
                                <div id="login-error" class="hidden bg-red-500/10 border border-red-500/30 text-red-400 text-[9px] font-['Retro_Gaming'] px-4 py-3 rounded-xl flex items-center gap-2">
                                    <span class="material-symbols-outlined text-sm shrink-0" style="font-variation-settings: 'FILL' 1;">error</span>
                                    <span id="login-error-text"></span>
                                </div>

                                <!-- Google Login (At the TOP) -->
                                <button type="button" id="google-login-btn" class="w-full h-12 bg-black/40 border-2 border-[#255F38]/30 rounded-xl flex items-center justify-center px-4 text-white font-bold hover:border-[#1F7D53] transition-all group relative z-10 gap-3">
                                    <!-- Google Icon -->
                                    <svg class="w-5 h-5 transition-transform" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    <span class="font-['Space_Grotesk'] tracking-wide">Sign in with Google</span>
                                </button>

                                <!-- Divider -->
                                <div class="flex items-center gap-4">
                                    <div class="flex-1 border-t border-white/5"></div>
                                    <span class="text-white text-[10px] uppercase font-bold tracking-widest font-['Retro_Gaming']">or</span>
                                    <div class="flex-1 border-t border-white/5"></div>
                                </div>

                                <!-- Email/Username Input -->
                                <div class="space-y-2 relative">
                                    <label class="flex items-center gap-2 text-white text-[10px] font-bold uppercase tracking-widest font-['Retro_Gaming']">
                                        <span class="material-symbols-outlined text-sm text-[#1F7D53]">person</span> EMAIL / USERNAME
                                    </label>
                                    <div class="relative w-full">
                                        <input id="login-email" type="text" placeholder="player@game.com" autocomplete="off" class="w-full h-12 bg-[#27391C]/30 border-2 border-[#255F38]/30 rounded-xl px-4 text-white font-['Space_Grotesk'] text-base placeholder:text-white/20 transition-all hover:border-[#1F7D53] focus:border-[#1F7D53] focus:ring-0 group" />
                                        <div class="absolute right-4 top-1/2 -translate-y-1/2">
                                            <span class="material-symbols-outlined text-white group-focus-within:text-[#1F7D53] transition-colors">mail</span>
                                        </div>
                                    </div>
                                    <p id="email-error" class="hidden text-red-400 text-[9px] font-['Retro_Gaming'] mt-1.5 flex items-center gap-1.5"><span class="material-symbols-outlined text-[11px]" style="font-variation-settings: 'FILL' 1;">error</span><span></span></p>
                                </div>

                                <!-- Password Input -->
                                <div class="space-y-2 relative">
                                    <label class="flex items-center gap-2 text-white text-[10px] font-bold uppercase tracking-widest font-['Retro_Gaming']">
                                        <span class="material-symbols-outlined text-sm text-[#1F7D53]">lock</span> PASSWORD
                                    </label>
                                    <div class="relative w-full">
                                        <input id="login-password" type="password" placeholder="••••••••" class="w-full h-12 bg-[#27391C]/30 border-2 border-[#255F38]/30 rounded-xl px-4 pr-12 text-white font-['Space_Grotesk'] text-base placeholder:text-white/20 transition-all hover:border-[#1F7D53] focus:border-[#1F7D53] focus:ring-0 group" />
                                        <button type="button" id="password-toggle" class="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-[#1F7D53] transition-colors">
                                            <span class="material-symbols-outlined">visibility_off</span>
                                        </button>
                                    </div>
                                    <p id="password-error" class="hidden text-red-400 text-[9px] font-['Retro_Gaming'] mt-1.5 flex items-center gap-1.5"><span class="material-symbols-outlined text-[11px]" style="font-variation-settings: 'FILL' 1;">error</span><span></span></p>
                                </div>

                                <!-- Login Button -->
                                <button type="submit" id="login-btn" class="w-full h-[52px] flex items-center justify-center bg-[#609966] text-white font-['Retro_Gaming'] uppercase text-sm rounded-xl border-b-4 border-green-700 hover:brightness-110 active:border-b-0 active:translate-y-1 transition-all shadow-lg cursor-pointer gap-3">
                                    <span class="material-symbols-outlined text-lg">login</span>
                                    LOGIN
                                </button>

                                <!-- Register Link -->
                                <div class="text-center pt-4 flex flex-col items-center justify-center border-t border-white/5 mt-2">
                                    <a href="https://gameforsmart2026.vercel.app/auth/register" id="register-link" class="inline-flex items-center justify-center gap-1 transition-colors group whitespace-nowrap text-sm w-full font-bold">
                                        <span class="text-white/40 group-hover:text-white/70 transition-colors">DON'T HAVE ACCOUNT?</span>
                                        <span class="text-[#1F7D53] group-hover:text-white group-hover:underline transition-all">REGISTER</span>
                                    </a>
                                </div>
                            </form>
                        </div>

                    </div>
                </div>
            `;
            document.body.appendChild(loginUI);
        }
    }
}
