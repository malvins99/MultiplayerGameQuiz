import Phaser from 'phaser';

export class WASDIndicator extends Phaser.GameObjects.Container {
    private keys: { [key: string]: Phaser.GameObjects.Container } = {};
    private keyCodes = {
        'W': Phaser.Input.Keyboard.KeyCodes.W,
        'A': Phaser.Input.Keyboard.KeyCodes.A,
        'S': Phaser.Input.Keyboard.KeyCodes.S,
        'D': Phaser.Input.Keyboard.KeyCodes.D
    };

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y);

        const spacing = 70; // Increased spacing
        this.createKey('W', 0, -spacing);
        this.createKey('A', -spacing, 0);
        this.createKey('S', 0, 0);
        this.createKey('D', spacing, 0);

        scene.add.existing(this);
        this.setScrollFactor(0);
        this.setDepth(100);

        // Listen for input
        scene.input.keyboard!.on('keydown', this.onKeyDown, this);
        scene.input.keyboard!.on('keyup', this.onKeyUp, this);
    }

    private createKey(label: string, x: number, y: number) {
        const keyContainer = this.scene.add.container(x, y);
        const size = 60; // Increased size

        // Background Box
        const bg = this.scene.add.rectangle(0, 0, size, size, 0x222222, 0.6); // Darker, more opaque
        bg.setStrokeStyle(4, 0x000000); // Thicker border

        // Text
        const text = this.scene.add.text(0, 0, label, {
            fontSize: '24px', // Larger font
            fontFamily: '"Press Start 2P", monospace',
            color: '#ffffff'
        }).setOrigin(0.5);

        keyContainer.add([bg, text]);
        this.add(keyContainer);
        this.keys[label] = keyContainer;
    }

    private onKeyDown(event: KeyboardEvent) {
        const key = event.key.toUpperCase();
        if (this.keys[key]) {
            this.highlightKey(key, true);
        }
    }

    private onKeyUp(event: KeyboardEvent) {
        const key = event.key.toUpperCase();
        if (this.keys[key]) {
            this.highlightKey(key, false);
        }
    }

    private highlightKey(keyLabel: string, isActive: boolean) {
        const container = this.keys[keyLabel];
        const bg = container.list[0] as Phaser.GameObjects.Rectangle;

        if (isActive) {
            bg.setFillStyle(0x666666, 0.8); // Highlight color
        } else {
            bg.setFillStyle(0x222222, 0.6); // Default color
        }
    }
}
