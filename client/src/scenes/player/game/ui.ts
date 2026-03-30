export class GameOverlayUI {
    static render() {
        let uiLayer = document.getElementById('ui-layer');
        if (!uiLayer) {
            uiLayer = document.createElement('div');
            uiLayer.id = 'ui-layer';
            uiLayer.className = 'hidden';
            uiLayer.innerHTML = `
                <!-- LOGO TOP LEFT -->
                <img src="/logo/Zigma-logo-fix.webp" class="absolute top-2 left-2 md:top-4 md:left-4 w-24 md:w-48 lg:w-64 z-20 pointer-events-none object-contain" />

                <!-- LOGO TOP RIGHT -->
                <img src="/logo/gameforsmart-logo-fix.webp" class="absolute top-2 right-2 md:top-4 md:right-4 w-32 md:w-56 lg:w-80 z-20 pointer-events-none object-contain" />

                <!-- Analog Joystick (Mobile Control) -->
                <div id="analog-container" class="fixed bottom-6 left-6 z-[999] opacity-90 xl:hidden pointer-events-auto">
                    <div id="joystick-base" class="relative w-20 h-20 rounded-[16px] border-4 border-[#444] bg-black/50 backdrop-blur-sm touch-none">
                        <div id="joystick-stick" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-[12px] bg-[#646464e6] border-4 border-[#888] transition-transform duration-100 ease-out"></div>
                    </div>
                </div>
            `;
            document.body.appendChild(uiLayer);
        }
    }
}
