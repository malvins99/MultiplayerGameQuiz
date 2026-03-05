export class HTMLControlAdapter {
    private cursors = {
        up: false,
        down: false,
        left: false,
        right: false
    };

    private joystickVector = { x: 0, y: 0 };
    private isJoystickActive = false;

    // Joystick Config
    private base: HTMLElement | null = null;
    private stick: HTMLElement | null = null;
    private maxRadius = 40; // Max stick travel distance

    constructor() {
        this.initWASD();
        this.initJoystick();
        this.initKeyboardSync();
    }

    // --- WASD Logic ---
    private initWASD() {
        const buttons = document.querySelectorAll('.dpad-btn');
        buttons.forEach(btn => {
            const key = btn.getAttribute('data-key');
            if (!key) return;

            // Touch/Mouse Down
            const startHandler = (e: Event) => {
                e.preventDefault(); // Prevent text selection/zoom
                this.setCursorState(key, true);
                btn.classList.add('active');
            };

            // Touch/Mouse Up
            const endHandler = (e: Event) => {
                e.preventDefault();
                this.setCursorState(key, false);
                btn.classList.remove('active');
            };

            btn.addEventListener('mousedown', startHandler);
            btn.addEventListener('touchstart', startHandler);

            btn.addEventListener('mouseup', endHandler);
            btn.addEventListener('mouseleave', endHandler);
            btn.addEventListener('touchend', endHandler);
        });
    }

    private initKeyboardSync() {
        // Light up keys when pressing physical keyboard
        window.addEventListener('keydown', (e) => {
            const key = e.key.toUpperCase();
            const btn = document.querySelector(`.dpad-btn[data-key="${key}"]`);
            if (btn) btn.classList.add('active');
        });

        window.addEventListener('keyup', (e) => {
            const key = e.key.toUpperCase();
            const btn = document.querySelector(`.dpad-btn[data-key="${key}"]`);
            if (btn) btn.classList.remove('active');
        });
    }

    private setCursorState(key: string, isActive: boolean) {
        switch (key) {
            case 'W': this.cursors.up = isActive; break;
            case 'A': this.cursors.left = isActive; break;
            case 'S': this.cursors.down = isActive; break;
            case 'D': this.cursors.right = isActive; break;
        }
    }

    // --- Joystick Logic ---
    private initJoystick() {
        this.base = document.getElementById('joystick-base');
        this.stick = document.getElementById('joystick-stick');

        if (!this.base || !this.stick) return;

        // Using Touch Events for Mobile primarily
        this.base.addEventListener('touchstart', (e) => this.handleJoystickStart(e), { passive: false });
        this.base.addEventListener('touchmove', (e) => this.handleJoystickMove(e), { passive: false });
        this.base.addEventListener('touchend', (e) => this.handleJoystickEnd(e));

        // Mouse fallback for testing
        this.base.addEventListener('mousedown', (e) => this.handleJoystickStart(e));
        window.addEventListener('mousemove', (e) => this.handleJoystickMove(e));
        window.addEventListener('mouseup', (e) => this.handleJoystickEnd(e));
    }

    private handleJoystickStart(e: TouchEvent | MouseEvent) {
        e.preventDefault();
        this.isJoystickActive = true;
        // Remove transition for instant follow
        if (this.stick) this.stick.style.transition = 'none';
        this.updateJoystickPosition(e);
    }

    private handleJoystickMove(e: TouchEvent | MouseEvent) {
        if (!this.isJoystickActive) return;
        e.preventDefault();
        this.updateJoystickPosition(e);
    }

    private handleJoystickEnd(e: TouchEvent | MouseEvent) {
        if (!this.isJoystickActive) return;
        this.isJoystickActive = false;

        // Reset vector
        this.joystickVector = { x: 0, y: 0 };

        // Reset Visuals
        if (this.stick) {
            this.stick.style.transition = 'transform 0.1s';
            this.stick.style.transform = 'translate(-50%, -50%) translate(0px, 0px)';
        }

        // Reset cursors from joystick
        this.cursors.up = false;
        this.cursors.down = false;
        this.cursors.left = false;
        this.cursors.right = false;
    }

    private updateJoystickPosition(e: TouchEvent | MouseEvent) {
        if (!this.base || !this.stick) return;

        let clientX, clientY;
        if (e instanceof TouchEvent) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        const rect = this.base.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const dx = clientX - centerX;
        const dy = clientY - centerY;
        const distance = Math.min(Math.hypot(dx, dy), this.maxRadius);
        const angle = Math.atan2(dy, dx);

        const moveX = Math.cos(angle) * distance;
        const moveY = Math.sin(angle) * distance;

        // Move stick visual
        this.stick.style.transform = `translate(-50%, -50%) translate(${moveX}px, ${moveY}px)`;

        // Normalize vector (-1 to 1)
        this.joystickVector = {
            x: moveX / this.maxRadius,
            y: moveY / this.maxRadius
        };

        // Map to cursors (threshold 0.5)
        this.cursors.right = this.joystickVector.x > 0.3;
        this.cursors.left = this.joystickVector.x < -0.3;
        this.cursors.down = this.joystickVector.y > 0.3;
        this.cursors.up = this.joystickVector.y < -0.3;
    }

    public getNav() {
        return this.cursors;
    }

    public getJoystickVector() {
        return this.joystickVector;
    }
}
