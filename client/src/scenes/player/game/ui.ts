export class GameOverlayUI {
    static render() {
        let uiLayer = document.getElementById('ui-layer');
        if (!uiLayer) {
            uiLayer = document.createElement('div');
            uiLayer.id = 'ui-layer';
            uiLayer.className = 'hidden';
            uiLayer.innerHTML = `
                <!-- LOGO TOP LEFT -->
                <img src="/logo/Zigma-logo-fix.webp" class="absolute top-[10px] md:top-[-30px] left-[10px] md:left-[-40px] w-28 md:w-64 z-20 pointer-events-none object-contain" />

                <!-- LOGO TOP RIGHT -->
                <img src="/logo/gameforsmart-logo-fix.webp" class="absolute top-[10px] md:top-[-45px] right-[10px] md:right-[-15px] w-36 md:w-80 z-20 pointer-events-none object-contain" />

                <!-- Analog Joystick (Mobile Control) -->
                <div id="analog-container" class="fixed bottom-10 left-10 z-[999] opacity-80 md:hidden pointer-events-auto">
                    <div id="joystick-base" class="relative w-32 h-32 rounded-full border-4 border-[#72BF78] bg-black/40 backdrop-blur-sm touch-none">
                        <div id="joystick-stick" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-[#72BF78] shadow-[0_0_15px_#72BF78] transition-transform duration-100 ease-out"></div>
                    </div>
                </div>
            `;
            document.body.appendChild(uiLayer);
        }
    }
}
