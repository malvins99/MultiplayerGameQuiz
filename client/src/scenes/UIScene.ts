import Phaser from 'phaser';

export class UIScene extends Phaser.Scene {
    scoreContainer!: Phaser.GameObjects.Container;
    scoreText!: Phaser.GameObjects.Text;
    timerText!: Phaser.GameObjects.Text;
    currentScore: number = 0;

    constructor() {
        super({ key: 'UIScene', active: false });
    }

    zigmaLogo!: Phaser.GameObjects.Image;
    gameForSmartLogo!: Phaser.GameObjects.Image;

    create() {
        const screenWidth = this.scale.width;

        // --- Logos ---
        // Zigma Logo (Top Left)
        this.zigmaLogo = this.add.image(20, 20, 'logo_zigma'); // Placeholder key, will load in preload or use DOM
        // Since we are using DOM elements for logos in HostProgress, let's try DOM here too for consistency if possible, 
        // BUT GameScene/UIScene is canvas based. We should load images in GameScene/preload or use DOM elements overlaid.
        // Given HostProgress used <img> tags in a div, that's easier. But UIScene is a Phaser Scene.
        // Let's use DOM elements appended to body like in HostProgressScene for better resolution independence on top of canvas?
        // OR load them as Phaser keys. 
        // User requested "GameForSmart" logo.
        // Let's stick to DOM elements for UI overlay to match HostProgress style if we want high res without managing texture memory for large logos.

        // Actually, let's use the same approach as HostProgressScene: HTML Overlay
        this.createLogos();

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

    createLogos() {
        // Remove existing if any (in case of restart/scene switch)
        const oldContainer = document.getElementById('player-ui-logos');
        if (oldContainer) oldContainer.remove();

        const logoContainer = document.createElement('div');
        logoContainer.id = 'player-ui-logos';
        logoContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1000; /* Ensure on top of canvas */
        `;

        logoContainer.innerHTML = `
            <!-- Zigma Logo: Top Left -->
            <img src="/logo/Zigma.webp" alt="Zigma Logo" style="
                position: absolute;
                top: 10px;
                left: 20px;
                width: 180px; 
                height: auto;
                filter: drop-shadow(2px 2px 2px rgba(0,0,0,0.5));
            " />

            <!-- GameForSmart Logo: Top Right -->
            <img src="/logo/gameforsmart.webp" alt="GameForSmart Logo" style="
                position: absolute;
                top: 10px;
                right: 20px;
                width: 220px; 
                height: auto;
                filter: drop-shadow(2px 2px 2px rgba(0,0,0,0.5));
            " />
        `;

        document.body.appendChild(logoContainer);

        // Cleanup on shutdown
        this.events.once('shutdown', () => {
            if (logoContainer && logoContainer.parentNode) {
                logoContainer.parentNode.removeChild(logoContainer);
            }
        });
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
