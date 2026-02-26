
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
            el.style.position = 'absolute';
            el.style.inset = '0';
            el.style.display = 'flex';
            el.style.alignItems = 'center';
            el.style.justifyContent = 'center';
            el.style.fontFamily = '"Retro Gaming", monospace';
            el.style.fontSize = '180px';
            el.style.color = '#00ff55';
            el.style.zIndex = '10001';
            el.style.textShadow = '0 0 30px rgba(0, 255, 85, 0.5)';
            el.style.transition = 'transform 0.1s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            el.style.pointerEvents = 'none';
            overlay.appendChild(el);
        }

        const oldText = el.innerText;
        el.innerText = text;

        // Auto-scale font size if text is long
        if (text.length > 5) {
            el.style.fontSize = '40px';
        } else {
            el.style.fontSize = '180px';
        }

        if (text === 'GO!' || text === '10') {
            el.style.color = text === 'GO!' ? '#fff' : '#00ff55';
        }

        // Pulse animation ONLY if it's a number (for countdown)
        const isNumber = !isNaN(parseInt(text)) && text.length <= 2;
        if (oldText !== text && isNumber) {
            el.style.transform = 'scale(1.3)';
            setTimeout(() => {
                if (el) el.style.transform = 'scale(1)';
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
