export class GameOverlayUI {
    static render() {
        let uiLayer = document.getElementById('ui-layer');
        if (!uiLayer) {
            uiLayer = document.createElement('div');
            uiLayer.id = 'ui-layer';
            uiLayer.className = 'hidden';
            uiLayer.innerHTML = `
                <!-- LOGO TOP LEFT -->
                <img src="/logo/Zigma-new-logo.webp" style="top: -30px; left: -40px;"
                class="absolute w-64 z-20 pointer-events-none object-contain" />

                <!-- LOGO TOP RIGHT -->
                <img src="/logo/gameforsmart-new-logo.webp" style="top: -45px; right: -15px;"
                class="absolute w-80 z-20 pointer-events-none object-contain" />

                <!-- Analog Joystick (Mobile Control) -->
                <div id="analog-container">
                <div id="joystick-base">
                    <div id="joystick-stick"></div>
                </div>
                </div>
            `;
            document.body.appendChild(uiLayer);
        }
    }
}
