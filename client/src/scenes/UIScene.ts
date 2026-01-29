import Phaser from 'phaser';

export class UIScene extends Phaser.Scene {
    scoreContainer!: Phaser.GameObjects.Container;
    scoreText!: Phaser.GameObjects.Text;
    timerText!: Phaser.GameObjects.Text;
    currentScore: number = 0;

    constructor() {
        super({ key: 'UIScene', active: false });
    }

    create() {
        const screenWidth = this.scale.width;

        // Create Container positioned at Top Center
        this.scoreContainer = this.add.container(screenWidth / 2, 40);
        this.scoreContainer.setScrollFactor(0);
        this.scoreContainer.setDepth(100);

        // --- Score UI Background Box ---
        const boxWidth = 160;
        const boxHeight = 50;
        const cornerRadius = 10;
        const fillColor = 0xefe4ca; // Beige/Tan
        const borderColor = 0x4a3d2e; // Dark Brown
        const shadowColor = 0x000000;
        const shadowOffset = 4;

        const graphics = this.add.graphics();

        // 1. Shadow (Bayangan)
        graphics.fillStyle(shadowColor, 0.4);
        graphics.fillRoundedRect(-boxWidth / 2 + shadowOffset, -boxHeight / 2 + shadowOffset, boxWidth, boxHeight, cornerRadius);

        // 2. Main Box Fill
        graphics.fillStyle(fillColor, 1);
        graphics.fillRoundedRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight, cornerRadius);

        // 3. Border
        graphics.lineStyle(4, borderColor, 1);
        graphics.strokeRoundedRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight, cornerRadius);

        this.scoreContainer.add(graphics);

        // Score Text
        this.scoreText = this.add.text(0, 0, '0', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '24px',
            color: '#4a3d2e',
            align: 'center'
        });
        this.scoreText.setOrigin(0.5, 0.5);
        this.scoreContainer.add(this.scoreText);

        // Timer Text (below score box)
        this.timerText = this.add.text(0, 40, '05:00', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '12px',
            color: '#666666',
            align: 'center'
        });
        this.timerText.setOrigin(0.5, 0.5);
        this.scoreContainer.add(this.timerText);

        // --- Handle Resize ---
        this.scale.on('resize', this.handleResize, this);
    }

    handleResize(gameSize: Phaser.Structs.Size) {
        if (this.scoreContainer) {
            this.scoreContainer.setPosition(gameSize.width / 2, 40);
        }
    }

    updateScore(newScore: number) {
        if (newScore === this.currentScore) return;

        const oldScore = this.currentScore;
        this.currentScore = newScore;
        const scoreDiff = newScore - oldScore;

        // --- Float Up + Fade Out Animation for Old Score ---
        const floatText = this.add.text(
            0,
            0,
            `+${scoreDiff}`,
            {
                fontFamily: '"Press Start 2P", monospace',
                fontSize: '14px',
                color: '#4ade80',
                stroke: '#166534',
                strokeThickness: 2
            }
        );
        floatText.setOrigin(0.5, 0.5);
        this.scoreContainer.add(floatText);

        this.tweens.add({
            targets: floatText,
            y: -40,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => {
                floatText.destroy();
            }
        });

        // --- Shake Animation for New Score ---
        this.scoreText.setText(newScore.toString());

        this.tweens.add({
            targets: this.scoreText,
            x: 3,
            duration: 50,
            yoyo: true,
            repeat: 5,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                this.scoreText.setX(0);
            }
        });

        // Scale pop effect
        this.tweens.add({
            targets: this.scoreText,
            scale: 1.3,
            duration: 100,
            yoyo: true,
            ease: 'Back.easeOut'
        });
    }

    updateTimer(remainingMs: number) {
        const totalSeconds = Math.ceil(remainingMs / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        if (this.timerText) {
            this.timerText.setText(formatted);

            // Color warning when low time
            if (totalSeconds <= 30) {
                this.timerText.setColor('#ff4444');
            } else if (totalSeconds <= 60) {
                this.timerText.setColor('#ffaa00');
            } else {
                this.timerText.setColor('#666666');
            }
        }
    }
}
