
/**
 * Global Transition Manager
 * Handles the "Iris Wipe" effect for smooth page transitions.
 */

export const TransitionManager = {
    /**
     * Executes a page transition:
     * 1. Closes the Iris (Black screen)
     * 2. Waits for animation
     * 3. Executes the callback (change page/scene)
     * 4. Opens the Iris (Reveal new page)
     * @param callback Function to run while screen is black (e.g. changing UI)
     */
    /**
     * Closes the Iris (Black screen) and executes callback.
     * Does NOT open automatically.
     */
    close(callback: () => void) {
        const overlay = document.getElementById('transition-overlay');
        if (!overlay) {
            callback();
            return;
        }

        // If already active and iris is closed, just run callback immediately
        if (overlay.classList.contains('overlay-active') && overlay.classList.contains('iris-close')) {
            callback();
            return;
        }

        // Reset
        overlay.classList.remove('iris-open');
        overlay.classList.add('overlay-active'); // Visible
        overlay.classList.add('iris-close');     // Start Closing

        // Wait for close animation
        setTimeout(() => {
            try {
                callback();
            } catch (e) {
                console.error(e);
            }
            // Stays black/closed here.
        }, 650);
    },

    /**
     * Ensures the iris is closed and active without triggering closing animations if already active.
     */
    ensureClosed() {
        const overlay = document.getElementById('transition-overlay');
        if (!overlay) return;

        overlay.classList.add('overlay-active');
        overlay.classList.add('iris-close');
        overlay.classList.remove('iris-open');
    },

    /**
     * Sets or updates the countdown text on the black overlay.
     */
    setCountdownText(text: string) {
        const overlay = document.getElementById('transition-overlay');
        if (!overlay) return;

        let el = document.getElementById('transition-countdown');
        if (!text) {
            if (el) el.remove();
            return;
        }

        if (!el) {
            el = document.createElement('div');
            el.id = 'transition-countdown';
            el.style.position = 'fixed';
            el.style.inset = '0';
            el.style.display = 'flex';
            el.style.flexDirection = 'column';
            el.style.alignItems = 'center';
            el.style.justifyContent = 'center';
            el.style.background = '#000'; // Full black backdrop
            el.style.zIndex = '10001';
            el.style.pointerEvents = 'none';

            // Add Bounce Animation Style
            const styleId = 'tm-countdown-styles';
            if (!document.getElementById(styleId)) {
                const style = document.createElement('style');
                style.id = styleId;
                style.innerHTML = `
                    @keyframes tm-bounce {
                        0%, 100% { transform: translateY(-5%); animation-timing-function: cubic-bezier(0.8, 0, 1, 1); }
                        50% { transform: translateY(0); animation-timing-function: cubic-bezier(0, 0, 0.2, 1); }
                    }
                    .tm-animate-bounce { animation: tm-bounce 1s infinite; }
                `;
                document.head.appendChild(style);
            }

            // Main Text Container
            const container = document.createElement('div');
            container.classList.add('tm-animate-bounce');
            el.appendChild(container);

            const textContent = document.createElement('div');
            textContent.id = 'transition-countdown-text';
            textContent.style.fontFamily = "'Retro Gaming', monospace";
            textContent.style.fontSize = '240px'; // Increased from 120px to 240px
            textContent.style.color = '#00ff88'; // Matched to player
            textContent.style.filter = 'drop-shadow(0 0 30px rgba(0, 255, 136, 0.6))';
            textContent.style.transition = 'transform 0.1s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            container.appendChild(textContent);

            overlay.appendChild(el);
        }

        const textEl = document.getElementById('transition-countdown-text');
        if (!textEl) return;

        const oldText = textEl.innerText;
        textEl.innerText = text;

        if (text.length > 5) {
            textEl.style.fontSize = '120px'; // Increased from 60px
        } else {
            textEl.style.fontSize = '240px'; // Increased from 120px
        }

        // Color Logic
        if (text === 'GO!' || text === '0') {
            textEl.style.color = '#fff';
            textEl.style.filter = 'drop-shadow(0 0 50px #fff)';
        } else {
            textEl.style.color = '#00ff88';
            textEl.style.filter = 'drop-shadow(0 0 30px rgba(0, 255, 136, 0.6))';
        }

        // Pulse animation ONLY if it's a number (for countdown)
        const isNumber = !isNaN(parseInt(text)) && text.length <= 2;
        if (oldText !== text && isNumber) {
            textEl.style.transform = 'scale(1.4)';
            setTimeout(() => {
                if (textEl) textEl.style.transform = 'scale(1)';
            }, 100);
        }
    },

    /**
     * Opens the Iris (Reveals content).
     */
    open() {
        const overlay = document.getElementById('transition-overlay');
        if (!overlay) return;

        overlay.classList.remove('iris-close');
        overlay.classList.add('iris-open');

        // Cleanup
        setTimeout(() => {
            overlay.classList.remove('iris-open');
            overlay.classList.remove('overlay-active');
            // Remove any countdown or waiting text
            const countEl = document.getElementById('transition-countdown');
            if (countEl) countEl.remove();
            const waitEl = document.getElementById('transition-waiting');
            if (waitEl) waitEl.remove();
        }, 800);
    },

    /**
     * Legacy: Kept for compatibility but we move to server-side countdown
     */
    runGameStartSequence(callback: () => void) {
        this.ensureClosed();
        this.setCountdownText('READY?');
        setTimeout(() => {
            this.open();
            callback();
        }, 1500);
    },

    // Legacy auto-transition support (keep existing API if not used manually)
    transitionTo(callback: () => void) {
        this.close(() => {
            callback();
            setTimeout(() => {
                this.open();
            }, 600);
        });
    },

    // Helper to just open if manually called
    customOpen() {
        const overlay = document.getElementById('transition-overlay');
        if (overlay) {
            overlay.classList.remove('overlay-active');
            overlay.classList.remove('iris-close');
        }
    },

    /**
     * Shows a professional loading/waiting state with a spinner.
     */
    showWaiting(text: string) {
        const overlay = document.getElementById('transition-overlay');
        if (!overlay) return;

        // Ensure countdown/text is cleared
        const countEl = document.getElementById('transition-countdown');
        if (countEl) countEl.remove();

        let el = document.getElementById('transition-waiting');
        if (!text) {
            if (el) el.remove();
            return;
        }

        if (!el) {
            el = document.createElement('div');
            el.id = 'transition-waiting';
            el.style.position = 'absolute';
            el.style.top = '50%';
            el.style.left = '50%';
            el.style.transform = 'translate(-50%, -50%)';
            el.style.display = 'flex';
            el.style.flexDirection = 'column';
            el.style.alignItems = 'center';
            el.style.justifyContent = 'center';
            el.style.zIndex = '10001';
            el.style.pointerEvents = 'none';
            overlay.appendChild(el);
        }

        el.innerHTML = `
            <style>
                .tm-spinner {
                    width: 60px;
                    height: 60px;
                    border: 5px solid rgba(0, 255, 85, 0.1);
                    border-top-color: #00ff55;
                    border-radius: 50%;
                    animation: tm-spin 1s linear infinite;
                    margin-bottom: 24px;
                    filter: drop-shadow(0 0 10px rgba(0, 255, 85, 0.5));
                }
                @keyframes tm-spin {
                    to { transform: rotate(360deg); }
                }
                .tm-waiting-text {
                    font-family: "Retro Gaming", monospace;
                    font-size: 20px;
                    color: #00ff55;
                    text-align: center;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    text-shadow: 0 0 15px rgba(0, 255, 85, 0.4);
                    white-space: nowrap;
                }
            </style>
            <div class="tm-spinner"></div>
            <div class="tm-waiting-text">${text}</div>
        `;
    },

    /**
     * Specialized scene transition for Phaser scenes
     */
    sceneTo(scene: Phaser.Scene, key: string, data?: any) {
        this.close(() => {
            scene.scene.start(key, data);
            // Re-open after switch
            setTimeout(() => {
                this.open();
            }, 600);
        });
    }
};
