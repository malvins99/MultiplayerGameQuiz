export class LoginUI {
    static render() {
        let loginUI = document.getElementById('login-ui');
        if (!loginUI) {
            loginUI = document.createElement('div');
            loginUI.id = 'login-ui';
            loginUI.className = 'hidden fixed top-0 left-0 w-full h-screen z-30 overflow-y-auto md:overflow-hidden fantasy-bg';
            loginUI.innerHTML = `
                <!-- LOGO TOP LEFT (Zigma) — Desktop only -->
                <img src="/logo/Zigma-new-logo.webp" style="top: -30px; left: -40px;" class="absolute w-64 z-50 pointer-events-none object-contain login-desktop-only" />

                <!-- LOGO TOP RIGHT (GFS) — Desktop only -->
                <img src="/logo/gameforsmart-new-logo.webp" style="top: -45px; right: -15px;" class="absolute w-80 z-50 pointer-events-none object-contain login-desktop-only" />

                <!-- MOBILE LOGO (Zigma only, centered at top) — Mobile only -->
                <div class="login-mobile-only w-full justify-center pt-5 relative z-50 pointer-events-none">
                    <img src="/logo/Zigma-new-logo.webp" class="w-40 object-contain" />
                </div>

                <!-- Fantasy Forest Gradient Overlay -->
                <div class="absolute inset-0 pointer-events-none" style="background: radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%);"></div>

                <!-- Mystical Fog Layer -->
                <div class="absolute inset-0 pointer-events-none mystical-fog"></div>
                <div class="absolute inset-0 pointer-events-none mystical-fog" style="animation-delay: 5s; animation-direction: reverse;"></div>

                <!-- Magic Firefly Particles -->
                <div class="firefly" style="top: 20%; left: 10%; animation-delay: 0s; animation-duration: 7s;"></div>
                <div class="firefly" style="top: 60%; left: 15%; animation-delay: 1s; animation-duration: 5s;"></div>
                <div class="firefly" style="top: 30%; left: 85%; animation-delay: 2s; animation-duration: 6s;"></div>
                <div class="firefly" style="top: 70%; left: 80%; animation-delay: 0.5s; animation-duration: 8s;"></div>
                <div class="firefly" style="top: 45%; left: 5%; animation-delay: 3s; animation-duration: 6s;"></div>
                <div class="firefly" style="top: 15%; left: 70%; animation-delay: 1.5s; animation-duration: 7s;"></div>
                <div class="firefly" style="top: 80%; left: 25%; animation-delay: 2.5s; animation-duration: 5s;"></div>
                <div class="firefly" style="top: 50%; left: 90%; animation-delay: 4s; animation-duration: 6s;"></div>
                <div class="firefly" style="top: 85%; left: 60%; animation-delay: 0.8s; animation-duration: 7s;"></div>
                <div class="firefly" style="top: 25%; left: 40%; animation-delay: 3.5s; animation-duration: 5s;"></div>

                <!-- Additional Magic Particles -->
                <div class="magic-particle" style="top: 35%; left: 8%; animation-delay: 0s;"></div>
                <div class="magic-particle" style="top: 55%; left: 92%; animation-delay: 2s;"></div>
                <div class="magic-particle" style="top: 75%; left: 12%; animation-delay: 4s;"></div>
                <div class="magic-particle" style="top: 20%; left: 88%; animation-delay: 1s;"></div>
                <div class="magic-particle" style="top: 65%; left: 6%; animation-delay: 3s;"></div>
                <div class="magic-particle" style="top: 40%; left: 95%; animation-delay: 5s;"></div>

                <!-- Scanlines Effect (subtle) -->
                <div class="absolute inset-0 pointer-events-none opacity-30" style="background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,212,255,0.02) 2px, rgba(0,212,255,0.02) 4px);"></div>

                <!-- Glowing Orbs (Blue) -->
                <div class="absolute top-1/4 -left-32 w-96 h-96 bg-secondary/15 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
                <div class="absolute bottom-1/4 -right-32 w-96 h-96 bg-secondary/10 rounded-full blur-[120px] pointer-events-none animate-pulse" style="animation-delay: 1s;"></div>
                <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[150px] pointer-events-none animate-pulse" style="animation-delay: 2s;"></div>

                <!-- Bottom Forest Silhouette -->
                <div class="absolute bottom-0 left-0 right-0 h-32 pointer-events-none forest-silhouette opacity-50"></div>

                <!-- Main Content -->
                <div class="relative z-10 flex min-h-screen md:h-screen w-full items-start md:items-center justify-center px-4 pt-4 pb-8 md:p-4">
                    <div class="w-full max-w-md">

                        <!-- Login Card -->
                        <div class="bg-surface-dark/90 backdrop-blur-sm border-4 border-secondary/30 rounded-3xl shadow-[0_0_60px_rgba(0,212,255,0.15)] overflow-hidden">

                            <!-- Header -->
                            <div class="bg-black/40 p-6 border-b-4 border-secondary/20 text-center relative">
                                <!-- Pixel Art Decoration -->
                                <div class="absolute top-2 left-2 w-3 h-3 bg-secondary/40"></div>
                                <div class="absolute top-2 right-2 w-3 h-3 bg-secondary/40"></div>
                                <div class="absolute top-5 left-5 w-2 h-2 bg-secondary/20"></div>
                                <div class="absolute top-5 right-5 w-2 h-2 bg-secondary/20"></div>

                                <!-- Logo/Title -->
                                <div class="flex flex-col items-center">
                                    <h1 class="text-3xl font-bold text-secondary font-['Retro_Gaming'] tracking-wider drop-shadow-[3px_3px_0_rgba(0,0,0,1)]">LOGIN</h1>
                                </div>
                            </div>

                            <!-- Form -->
                            <form id="login-form" class="p-6 space-y-5">
                                <!-- Error Message -->
                                <div id="login-error" class="hidden bg-red-500/20 border-2 border-red-500/50 text-red-400 text-[10px] font-['Retro_Gaming'] p-3 rounded-xl text-center"></div>

                                <!-- Google Login (At the TOP) -->
                                <button type="button" id="google-login-btn" class="w-full h-14 bg-white/5 hover:bg-white/10 border-4 border-white/10 hover:border-white/30 text-white font-['Retro_Gaming'] text-lg uppercase transition-all rounded-xl flex items-center justify-center gap-3 group">
                                    <svg class="w-6 h-6 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    LOGIN WITH GOOGLE
                                </button>

                                <!-- Divider -->
                                <div class="flex items-center gap-4">
                                    <div class="flex-1 h-1 bg-white/10 rounded"></div>
                                    <span class="text-white/30 text-[10px] font-['Retro_Gaming'] uppercase">or</span>
                                    <div class="flex-1 h-1 bg-white/10 rounded"></div>
                                </div>

                                <!-- Email/Username Input -->
                                <div class="space-y-2">
                                    <label class="flex items-center gap-2 text-white/80 text-[12px] font-bold uppercase tracking-widest font-['Retro_Gaming']">
                                        <span class="material-symbols-outlined text-sm text-secondary">person</span> EMAIL / USERNAME
                                    </label>
                                    <div class="relative group">
                                        <input id="login-email" type="text" placeholder="player@game.com" class="w-full h-14 bg-black/60 border-4 border-white/10 focus:border-secondary focus:ring-0 px-4 text-white font-['Retro_Gaming'] text-lg placeholder:text-white/20 transition-all rounded-xl group-hover:border-white/20" />
                                        <div class="absolute right-4 top-1/2 -translate-y-1/2">
                                            <span class="material-symbols-outlined text-white/20 group-focus-within:text-secondary transition-colors">mail</span>
                                        </div>
                                    </div>
                                </div>

                                <!-- Password Input -->
                                <div class="space-y-2">
                                    <label class="flex items-center gap-2 text-white/80 text-[12px] font-bold uppercase tracking-widest font-['Retro_Gaming']">
                                        <span class="material-symbols-outlined text-sm text-secondary">lock</span> PASSWORD
                                    </label>
                                    <div class="relative group">
                                        <input id="login-password" type="password" placeholder="••••••••" class="w-full h-14 bg-black/60 border-4 border-white/10 focus:border-secondary focus:ring-0 px-4 pr-12 text-white font-['Retro_Gaming'] text-lg placeholder:text-white/20 transition-all rounded-xl group-hover:border-white/20" />
                                        <button type="button" id="password-toggle" class="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-secondary transition-colors">
                                            <span class="material-symbols-outlined">visibility_off</span>
                                        </button>
                                    </div>
                                </div>

                                <!-- Login Button -->
                                <button type="submit" id="login-btn" class="w-full h-16 bg-secondary text-black font-bold text-xl uppercase font-['Retro_Gaming'] border-4 border-black pixel-btn-blue active:translate-y-1 transition-all btn-sweep hover:shadow-[0_0_30px_rgba(0,212,255,0.4)] rounded-xl flex items-center justify-center gap-3">
                                    <span class="material-symbols-outlined text-2xl">login</span>
                                    LOGIN
                                </button>

                                <!-- Register Link -->
                                <div class="text-center pt-4 border-t-2 border-white/5 flex flex-col items-center justify-center">
                                    <a href="https://gameforsmart2026.vercel.app/auth/register" id="register-link" class="inline-flex items-center justify-center gap-1 transition-colors group whitespace-nowrap text-sm w-full">
                                        <span class="text-white/40">DON'T HAVE AN ACCOUNT?</span>
                                        <span class="text-secondary group-hover:text-white group-hover:underline">REGISTER NOW</span>
                                        <span class="material-symbols-outlined text-sm text-secondary group-hover:text-white group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                    </a>
                                </div>
                            </form>

                            <!-- Footer Decoration -->
                            <div class="h-2 bg-gradient-to-r from-transparent via-secondary/30 to-transparent"></div>
                        </div>

                    </div>
                </div>
            `;
            document.body.appendChild(loginUI);
        }
    }
}
