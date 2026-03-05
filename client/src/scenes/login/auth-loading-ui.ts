export class AuthLoadingUI {
    static render() {
        let overlay = document.getElementById('auth-loading-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'auth-loading-overlay';
            overlay.className = 'hidden fixed inset-0 z-[9999] fantasy-bg flex items-center justify-center';
            overlay.innerHTML = `
                <!-- Background Effects -->
                <div class="absolute inset-0 pointer-events-none"
                style="background: radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%);"></div>
                <div class="absolute inset-0 pointer-events-none mystical-fog"></div>

                <!-- Fireflies -->
                <div class="firefly" style="top: 20%; left: 10%; animation-delay: 0s; animation-duration: 7s;"></div>
                <div class="firefly" style="top: 60%; left: 85%; animation-delay: 1s; animation-duration: 5s;"></div>
                <div class="firefly" style="top: 40%; left: 50%; animation-delay: 2s; animation-duration: 6s;"></div>
                <div class="firefly" style="top: 80%; left: 30%; animation-delay: 0.5s; animation-duration: 8s;"></div>

                <!-- Glowing Orbs -->
                <div
                class="absolute top-1/4 -left-32 w-96 h-96 bg-primary/15 rounded-full blur-[120px] pointer-events-none animate-pulse">
                </div>
                <div
                class="absolute bottom-1/4 -right-32 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none animate-pulse"
                style="animation-delay: 1s;"></div>

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
                    <p id="auth-loading-text" class="text-secondary font-['Retro_Gaming'] text-sm tracking-wider animate-pulse">
                    Completing login...</p>
                    <p class="text-white/30 font-['Retro_Gaming'] text-[8px] tracking-widest uppercase">Please wait</p>
                </div>
                </div>
            `;
            document.body.appendChild(overlay);
        }
    }
}
