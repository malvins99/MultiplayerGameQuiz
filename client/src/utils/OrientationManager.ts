
export enum OrientationType {
    LANDSCAPE = 'landscape',
    PORTRAIT = 'portrait',
    NONE = 'none'
}

export class OrientationManager {
    private static overlay: HTMLDivElement | null = null;
    private static currentRequirement: OrientationType = OrientationType.NONE;
    private static customTitle: string | null = null;
    private static customDescription: string | null = null;

    static init() {
        if (this.overlay) return;

        this.overlay = document.createElement('div');
        this.overlay.id = 'global-orientation-overlay';
        this.overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(18, 18, 22, 0.95); z-index: 999999; display: none;
            flex-direction: column; justify-content: center; align-items: center;
            color: white; font-family: 'Retro Gaming', monospace; text-align: center;
            padding: 20px; backdrop-filter: blur(8px); pointer-events: auto;
        `;
        document.body.appendChild(this.overlay);

        window.addEventListener('resize', () => this.check());
        window.addEventListener('orientationchange', () => this.check());
    }

    static requireLandscape(title?: string, description?: string) {
        this.init();
        this.currentRequirement = OrientationType.LANDSCAPE;
        this.customTitle = title || null;
        this.customDescription = description || null;
        this.updateOverlayContent();
        this.check();
    }

    static requirePortrait(title?: string, description?: string) {
        this.init();
        this.currentRequirement = OrientationType.PORTRAIT;
        this.customTitle = title || null;
        this.customDescription = description || null;
        this.updateOverlayContent();
        this.check();
    }

    static disable() {
        this.currentRequirement = OrientationType.NONE;
        if (this.overlay) {
            this.overlay.style.display = 'none';
        }
    }

    private static check() {
        if (this.currentRequirement === OrientationType.NONE) return;

        const isMobile = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (!isMobile) {
            if (this.overlay) this.overlay.style.display = 'none';
            return;
        }

        const isPortrait = window.innerHeight > window.innerWidth;
        
        let shouldShow = false;
        if (this.currentRequirement === OrientationType.LANDSCAPE && isPortrait) {
            shouldShow = true;
        } else if (this.currentRequirement === OrientationType.PORTRAIT && !isPortrait) {
            shouldShow = true;
        }

        if (this.overlay) {
            this.overlay.style.display = shouldShow ? 'flex' : 'none';
        }
    }

    private static updateOverlayContent() {
        if (!this.overlay) return;

        const isLandscapeReq = this.currentRequirement === OrientationType.LANDSCAPE;
        const title = this.customTitle || (isLandscapeReq ? 'MODE LANDSCAPE DIPERLUKAN' : 'MODE PORTRAIT DIPERLUKAN');
        const description = this.customDescription || (isLandscapeReq 
            ? 'Putar layar HP Anda secara mendatar untuk dapat mengontrol karakter dengan leluasa serta melihat map dengan luas.'
            : 'Putar layar HP Anda kembali ke mode portrait untuk melihat hasil pertandingan dan leaderboard dengan lebih baik.');
        const icon = 'screen_rotation';
        const buttonText = 'PUTAR SEKARANG';

        this.overlay.innerHTML = `
            <div style="background: rgba(0,0,0,0.85); padding: 40px; border-radius: 20px; border: 2px solid #72BF78; display: flex; flex-direction: column; align-items: center; max-width: 90vw;">
                <span class="material-symbols-outlined" style="font-size: 80px; margin-bottom: 20px; color: #72BF78; animation: rotateDevice 2s infinite ease-in-out;">${icon}</span>
                <h2 style="font-size: 26px; margin-bottom: 15px; color: #72BF78; text-transform: uppercase;">${title}</h2>
                <p style="font-size: 14px; color: #eee; line-height: 1.6; max-width: 300px; font-family: sans-serif;">${description}</p>
                <div style="margin-top: 25px; padding: 10px 20px; background: #72BF78; color: #000; border-radius: 6px; font-weight: 800; font-size: 14px;">${buttonText}</div>
            </div>
            <style>
                @keyframes rotateDevice {
                    0% { transform: rotate(0deg); }
                    50% { transform: rotate(${isLandscapeReq ? '90deg' : '-90deg'}); }
                    100% { transform: rotate(0deg); }
                }
            </style>
        `;
    }
}
