export class GameOverlayUI {
    static render() {
        let uiLayer = document.getElementById('ui-layer');
        if (!uiLayer) {
            uiLayer = document.createElement('div');
            uiLayer.id = 'ui-layer';
            uiLayer.className = 'hidden';
            uiLayer.innerHTML = `
                <!-- LOGO TOP LEFT -->
                <img src="/logo/Zigma-logo-fix.webp" class="absolute top-1 left-1 md:top-2 md:left-2 w-24 md:w-48 lg:w-64 z-20 pointer-events-none object-contain" />

                <!-- LOGO TOP RIGHT -->
                <img src="/logo/gameforsmart-logo-fix.webp" class="absolute top-1 right-1 md:top-2 md:right-2 w-32 md:w-56 lg:w-80 z-20 pointer-events-none object-contain" />

                <!-- Analog Joystick (Mobile Control) -->
                <div id="analog-container" class="fixed bottom-6 left-6 z-[999] opacity-90 xl:hidden pointer-events-auto">
                    <div id="joystick-base" class="relative w-20 h-20 rounded-[16px] border-4 border-[#444] bg-black/50 backdrop-blur-sm touch-none">
                        <div id="joystick-stick" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-[12px] bg-[#646464e6] border-4 border-[#888] transition-transform duration-100 ease-out"></div>
                    </div>
                </div>

                <!-- Attack Button (Mobile Control) -->
                <div id="attack-container" class="fixed bottom-8 right-8 md:bottom-10 md:right-10 z-[999] opacity-90 xl:hidden pointer-events-auto">
                    <div id="attack-button" class="relative w-20 h-20 rounded-[16px] border-4 border-[#444] bg-black/50 backdrop-blur-sm active:scale-95 transition-transform duration-75 touch-none flex items-center justify-center">
                        <div class="w-12 h-12 rounded-[14px] bg-[#88888880] border-4 border-[#aaa] flex items-center justify-center">
                             <!-- Pure SVG Pixel Art Sword -->
                             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" class="w-8 h-8 pointer-events-none drop-shadow-md" shape-rendering="crispEdges">
                                <!-- Blade edge -->
                                <rect x="10" y="2" width="2" height="2" fill="#e2e8f0"/>
                                <rect x="8" y="4" width="2" height="2" fill="#e2e8f0"/>
                                <rect x="6" y="6" width="2" height="2" fill="#e2e8f0"/>
                                <rect x="4" y="8" width="2" height="2" fill="#e2e8f0"/>
                                <!-- Blade core -->
                                <rect x="12" y="2" width="2" height="2" fill="#94a3b8"/>
                                <rect x="10" y="4" width="2" height="2" fill="#94a3b8"/>
                                <rect x="8" y="6" width="2" height="2" fill="#94a3b8"/>
                                <rect x="6" y="8" width="2" height="2" fill="#94a3b8"/>
                                <!-- Crossguard -->
                                <rect x="3" y="7" width="2" height="2" fill="#fbbf24"/>
                                <rect x="5" y="9" width="3" height="3" fill="#f59e0b"/>
                                <rect x="7" y="11" width="2" height="2" fill="#fbbf24"/>
                                <!-- Pommel & Hilt -->
                                <rect x="3" y="11" width="2" height="2" fill="#78350f"/>
                                <rect x="1" y="13" width="2" height="2" fill="#b45309"/>
                             </svg>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(uiLayer);
        }
    }
}
