import Phaser from 'phaser';

export class UIScene extends Phaser.Scene {
    scoreContainer!: Phaser.GameObjects.Container;
    scoreText!: Phaser.GameObjects.Text;
    timerText!: Phaser.GameObjects.Text;
    currentScore: number = 0;
    private scoreBoxGraphics!: Phaser.GameObjects.Graphics;
    private timerMinutes: number = 5;

    constructor() {
        super({ key: 'UIScene', active: false });
    }

    private room!: any;

    init(data: { room: any }) {
        this.room = data.room;
        this.timerMinutes = this.room?.state?.totalTimeMinutes || 5;
    }


    create() {
        const screenWidth = this.scale.width;

        // Create Container
        this.scoreContainer = this.add.container(screenWidth / 2, 45);
        this.scoreContainer.setScrollFactor(0);
        this.scoreContainer.setDepth(100);

        // Background Graphics
        this.scoreBoxGraphics = this.add.graphics();
        this.scoreContainer.add(this.scoreBoxGraphics);

        // Score Text
        this.scoreText = this.add.text(0, 0, '0', {
            fontFamily: '"Retro Gaming", monospace',
            fontSize: '18px',
            color: '#4a3d2e',
            align: 'center'
        });
        this.scoreText.setOrigin(0.5, 0.5);
        this.scoreContainer.add(this.scoreText);

        // Timer Text
        this.timerText = this.add.text(0, 45, `${String(this.timerMinutes).padStart(2, '0')}:00`, {
            fontFamily: '"Retro Gaming", monospace',
            fontSize: '24px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center'
        });
        this.timerText.setOrigin(0.5, 0.5);
        this.scoreContainer.add(this.timerText);


        // --- Handle Resize ---
        this.scale.on('resize', () => this.handleResize(), this);
        this.handleResize();
    }


    handleResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const isMobile = width < 950 && width > height;
        
        // Update viewport to match game size
        this.cameras.main.setViewport(0, 0, width, height);
        
        if (this.scoreContainer) {
            // 1. Position & Scale (Always 1.0 for sharpness)
            const yPos = isMobile ? 28 : 45;
            this.scoreContainer.setPosition(Math.round(width / 2), yPos);
            this.scoreContainer.setScale(1); 

            // 2. Clear and Redraw Graphics (Sharp integers)
            this.scoreBoxGraphics.clear();
            
            const boxWidth = isMobile ? 80 : 120;
            const boxHeight = isMobile ? 28 : 40;
            const cornerRadius = isMobile ? 6 : 10;
            const shadowOffset = isMobile ? 2 : 4;
            
            const fillColor = 0xefe4ca;
            const borderColor = 0x4a3d2e;
            const shadowColor = 0x000000;

            // Shadow
            this.scoreBoxGraphics.fillStyle(shadowColor, 0.4);
            this.scoreBoxGraphics.fillRoundedRect(
                Math.round(-boxWidth / 2 + shadowOffset), 
                Math.round(-boxHeight / 2 + shadowOffset), 
                boxWidth, boxHeight, cornerRadius
            );

            // Main Box
            this.scoreBoxGraphics.fillStyle(fillColor, 1);
            this.scoreBoxGraphics.fillRoundedRect(
                Math.round(-boxWidth / 2), 
                Math.round(-boxHeight / 2), 
                boxWidth, boxHeight, cornerRadius
            );

            // Border
            this.scoreBoxGraphics.lineStyle(isMobile ? 2 : 4, borderColor, 1);
            this.scoreBoxGraphics.strokeRoundedRect(
                Math.round(-boxWidth / 2), 
                Math.round(-boxHeight / 2), 
                boxWidth, boxHeight, cornerRadius
            );

            // 3. Update Text Sizes & Positions
            const scoreSize = isMobile ? '13px' : '18px';
            const timerSize = isMobile ? '18px' : '24px';
            const timerY = isMobile ? 32 : 45;

            this.scoreText.setFontSize(scoreSize);
            this.timerText.setFontSize(timerSize);
            this.timerText.setY(timerY);
            this.timerText.setStroke('#000000', isMobile ? 2 : 3);
        }
    }

    updateScore(newScore: number) {
        if (newScore === this.currentScore) return;

        const oldScore = this.currentScore;
        this.currentScore = newScore; // Update leading currentScore
        const roundedScore = Math.round(newScore);
        const roundedOldScore = Math.round(oldScore);
        const roundedDiff = roundedScore - roundedOldScore;

        // --- Float Up + Fade Out Animation for Old Score ---
        if (roundedDiff !== 0) {
            const floatText = this.add.text(
                0,
                0,
                `+${roundedDiff}`,
                {
                    fontFamily: '"Retro Gaming", monospace',
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
        }

        // --- Shake Animation for New Score ---
        this.scoreText.setText(roundedScore.toString());

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
                this.timerText.setColor('#ffffff');
            }
        }
    }
}
