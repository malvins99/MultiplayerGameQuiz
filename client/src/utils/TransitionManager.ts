
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
            // Remove any countdown text
            const countEl = document.getElementById('transition-countdown');
            if (countEl) countEl.remove();
        }, 800);
    },

    /**
     * Runs a countdown on the black overlay, then opens.
     */
    runGameStartSequence(callback: () => void) {
        const overlay = document.getElementById('transition-overlay');
        if (!overlay) {
            this.customOpen(); // Fallback
            return;
        }

        // Ensure we are closed and active
        overlay.classList.add('overlay-active');
        overlay.classList.add('iris-close'); // Ensure closed state

        // Create Countdown Element
        let count = 3; // 3 Seconds is snappier than 5, but user asked for 5?
        // User asked: "countdown sampai 5" -> So 5.
        count = 5;

        let el = document.getElementById('transition-countdown');
        if (!el) {
            el = document.createElement('div');
            el.id = 'transition-countdown';
            el.style.position = 'absolute';
            el.style.top = '50%';
            el.style.left = '50%';
            el.style.transform = 'translate(-50%, -50%)';
            el.style.fontFamily = '"Press Start 2P", monospace';
            el.style.fontSize = '80px';
            el.style.color = '#00ff55';
            el.style.zIndex = '10001';
            overlay.appendChild(el);
        }

        el.innerText = String(count);

        const interval = setInterval(() => {
            count--;
            if (count > 0) {
                if (el) el.innerText = String(count);
                // Simple pulse?
                if (el) {
                    el.style.transform = 'translate(-50%, -50%) scale(1.5)';
                    setTimeout(() => { if (el) el.style.transform = 'translate(-50%, -50%) scale(1)'; }, 100);
                }
            } else {
                clearInterval(interval);
                if (el) {
                    el.innerText = 'GO!';
                    el.style.color = '#fff';
                }
                setTimeout(() => {
                    this.open();
                    callback(); // Signal game to start input
                }, 500);
            }
        }, 1000);
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
    }
};
