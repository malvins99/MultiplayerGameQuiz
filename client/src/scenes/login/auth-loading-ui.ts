export class AuthLoadingUI {
    static render() {
        let overlay = document.getElementById('auth-loading-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'auth-loading-overlay';
            overlay.className = 'hidden fixed inset-0 z-[9999] flex items-center justify-center';
            overlay.innerHTML = `
                <!-- Background — same palette gradient as login -->
                <div class="absolute inset-0" style="background: linear-gradient(135deg, #4a9150 0%, #72BF78 30%, #A0D683 60%, #72BF78 100%);"></div>
                <div class="absolute inset-0 pixel-bg-pattern opacity-[0.04]"></div>

                <!-- Decorative orbs -->
                <div class="absolute top-1/4 -left-32 w-96 h-96 rounded-full opacity-30 animate-pulse" style="background: radial-gradient(circle, #D3EE98 0%, transparent 70%);"></div>
                <div class="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full opacity-20 animate-pulse" style="background: radial-gradient(circle, #FEFF9F 0%, transparent 70%); animation-delay: 1s;"></div>

                <!-- Fireflies -->
                <div class="firefly !bg-[#FEFF9F] !shadow-[0_0_15px_rgba(254,255,159,0.9)]" style="top: 20%; left: 10%; animation-delay: 0s; animation-duration: 7s;"></div>
                <div class="firefly !bg-white !shadow-[0_0_15px_rgba(255,255,255,0.8)]" style="top: 60%; left: 85%; animation-delay: 1s; animation-duration: 5s;"></div>
                <div class="firefly !bg-[#D3EE98] !shadow-[0_0_15px_rgba(211,238,152,0.9)]" style="top: 40%; left: 50%; animation-delay: 2s; animation-duration: 6s;"></div>
                <div class="firefly !bg-[#FEFF9F] !shadow-[0_0_15px_rgba(254,255,159,0.9)]" style="top: 80%; left: 30%; animation-delay: 0.5s; animation-duration: 8s;"></div>

                <!-- Loading Content -->
                <div class="relative z-10 flex flex-col items-center gap-8">
                    <!-- Spinner -->
                    <div class="auth-loading-spinner">
                        <div class="spinner-ring"></div>
                        <div class="spinner-ring spinner-ring-2"></div>
                        <div class="spinner-ring spinner-ring-3"></div>
                        <span class="material-symbols-outlined spinner-icon">shield_person</span>
                    </div>
                    <!-- Text -->
                    <div class="text-center space-y-3">
                        <p id="auth-loading-text" class="text-white font-['Retro_Gaming'] text-sm tracking-wider animate-pulse drop-shadow-[1px_1px_0_rgba(0,0,0,0.3)]">
                        Completing login...</p>
                        <p class="text-white/60 font-['Retro_Gaming'] text-[8px] tracking-widest uppercase">Please wait</p>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
        }
    }
}
