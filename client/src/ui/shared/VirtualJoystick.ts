import Phaser from 'phaser';

export class VirtualJoystick extends Phaser.GameObjects.Container {
    private base: Phaser.GameObjects.Graphics;
    private thumb: Phaser.GameObjects.Graphics;
    private pointerId: number | null = null;
    private stickX: number = 0;
    private stickY: number = 0;
    private radius: number = 50;

    public cursors: { up: boolean; down: boolean; left: boolean; right: boolean } = {
        up: false,
        down: false,
        left: false,
        right: false
    };

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y);

        // --- Base Square ---
        this.base = scene.add.graphics();
        this.base.fillStyle(0x222222, 0.5); // Darker background
        this.base.fillRoundedRect(-this.radius, -this.radius, this.radius * 2, this.radius * 2, 10);
        this.base.lineStyle(4, 0x000000, 0.8);
        this.base.strokeRoundedRect(-this.radius, -this.radius, this.radius * 2, this.radius * 2, 10);
        this.add(this.base);

        // --- Thumb Square ---
        this.thumb = scene.add.graphics();
        this.thumb.fillStyle(0x555555, 0.8); // Lighter thumb
        this.thumb.fillRoundedRect(-25, -25, 50, 50, 8);
        this.thumb.lineStyle(2, 0x000000, 1);
        this.thumb.strokeRoundedRect(-25, -25, 50, 50, 8);
        this.add(this.thumb);

        // --- Interaction ---
        this.setInteractive(new Phaser.Geom.Rectangle(-this.radius, -this.radius, this.radius * 2, this.radius * 2), Phaser.Geom.Rectangle.Contains);

        // Use scene input to track pointer globally once dragging starts
        scene.input.on('pointerdown', this.onPointerDown, this);
        scene.input.on('pointermove', this.onPointerMove, this);
        scene.input.on('pointerup', this.onPointerUp, this);

        // Add self to scene
        scene.add.existing(this);
        this.setScrollFactor(0); // Fix to camera
        this.setDepth(100); // Ensure on top
    }

    private onPointerDown(pointer: Phaser.Input.Pointer) {
        // Only activate if touching near the joystick base
        if (this.pointerId === null) {
            const dist = Phaser.Math.Distance.Between(this.x, this.y, pointer.x, pointer.y);
            if (dist < this.radius * 2) {
                this.pointerId = pointer.id;
                this.updateStick(pointer.x, pointer.y);
            }
        }
    }

    private onPointerMove(pointer: Phaser.Input.Pointer) {
        if (this.pointerId === pointer.id) {
            this.updateStick(pointer.x, pointer.y);
        }
    }

    private onPointerUp(pointer: Phaser.Input.Pointer) {
        if (this.pointerId === pointer.id) {
            this.pointerId = null;
            this.resetStick();
        }
    }

    private updateStick(x: number, y: number) {
        const dx = x - this.x;
        const dy = y - this.y;
        const angle = Math.atan2(dy, dx);
        const dist = Math.min(Phaser.Math.Distance.Between(0, 0, dx, dy), this.radius);

        this.stickX = Math.cos(angle) * dist;
        this.stickY = Math.sin(angle) * dist;

        this.thumb.setPosition(this.stickX, this.stickY);
        this.updateCursors();
    }

    private resetStick() {
        this.stickX = 0;
        this.stickY = 0;
        this.thumb.setPosition(0, 0);
        this.updateCursors();
    }

    private updateCursors() {
        // Reset
        this.cursors.up = false;
        this.cursors.down = false;
        this.cursors.left = false;
        this.cursors.right = false;

        // Deadzone (20% of radius)
        const threshold = this.radius * 0.2;

        if (this.stickY < -threshold) this.cursors.up = true;
        if (this.stickY > threshold) this.cursors.down = true;
        if (this.stickX < -threshold) this.cursors.left = true;
        if (this.stickX > threshold) this.cursors.right = true;
    }

    public getCursorKeys() {
        return {
            up: { isDown: this.cursors.up },
            down: { isDown: this.cursors.down },
            left: { isDown: this.cursors.left },
            right: { isDown: this.cursors.right }
        };
    }
}
