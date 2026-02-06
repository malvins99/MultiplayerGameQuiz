import Phaser from 'phaser';

export class ClickToMoveSystem {
    private scene: Phaser.Scene;
    private isMoving: boolean = false;
    private targetPosition: Phaser.Math.Vector2 | null = null;
    private pathPoints: Phaser.Math.Vector2[] = [];
    private dotSprites: Phaser.GameObjects.Image[] = [];
    private selectorContainer: Phaser.GameObjects.Container | null = null;
    private snappedEnemyId: string | null = null;

    private lastClickTime: number = 0;
    private readonly DOUBLE_CLICK_DELAY = 300; // ms
    private readonly MOVEMENT_SPEED = 200;
    private readonly DOT_SPACING = 30;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.setupInput();
    }

    private setupInput() {
        this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            const now = Date.now();
            if (now - this.lastClickTime < this.DOUBLE_CLICK_DELAY) {
                // Double click detected
                this.handleDoubleClick(pointer);
            }
            this.lastClickTime = now;
        });
    }

    private handleDoubleClick(pointer: Phaser.Input.Pointer) {
        const worldX = pointer.worldX;
        const worldY = pointer.worldY;

        // 1. Check for nearby enemy (Snapping)
        const enemies = (this.scene as any).enemyEntities || {}; // Access safely
        let snappedEnemy: Phaser.GameObjects.Sprite | null = null;
        let snapId: string | null = null;

        // Reset previous snap
        this.snappedEnemyId = null;

        for (const id in enemies) {
            const enemy = enemies[id];
            if (enemy && enemy.active && enemy.visible) {
                const dist = Phaser.Math.Distance.Between(worldX, worldY, enemy.x, enemy.y);
                if (dist < 60) { // Snap radius
                    snappedEnemy = enemy;
                    snapId = id;
                    break;
                }
            }
        }

        let targetX = worldX;
        let targetY = worldY;

        if (snappedEnemy) {
            targetX = snappedEnemy.x;
            targetY = snappedEnemy.y;
            this.snappedEnemyId = snapId;
        }

        // 2. Start Movement Logic
        this.startMovement(targetX, targetY);
    }

    private startMovement(targetX: number, targetY: number) {
        this.cancelMovement(); // Clear old path

        // Current player pos
        const player = (this.scene as any).currentPlayer;
        if (!player) return;

        this.targetPosition = new Phaser.Math.Vector2(targetX, targetY);
        const startPos = new Phaser.Math.Vector2(player.x, player.y);

        // Simple straight line path (interpolated for dots)
        // In future: Replace with A* pathfinding using barrier collision
        const dist = startPos.distance(this.targetPosition);
        const steps = Math.floor(dist / this.DOT_SPACING);

        this.pathPoints = [];

        // Generate points for dots
        for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            const px = Phaser.Math.Linear(startPos.x, targetX, t);
            const py = Phaser.Math.Linear(startPos.y, targetY, t);
            this.pathPoints.push(new Phaser.Math.Vector2(px, py));
        }

        // Always add final target point for movement logic
        this.pathPoints.push(this.targetPosition);

        // Visuals
        this.createVisuals(targetX, targetY);
        this.isMoving = true;
    }

    private createVisuals(targetX: number, targetY: number) {
        // 1. Selector Box (Animated corners)
        this.selectorContainer = this.scene.add.container(targetX, targetY);
        this.selectorContainer.setDepth(190); // Below player/indicators

        const tl = this.scene.add.image(-12, -12, 'selectbox_tl');
        const tr = this.scene.add.image(12, -12, 'selectbox_tr');
        const bl = this.scene.add.image(-12, 12, 'selectbox_bl');
        const br = this.scene.add.image(12, 12, 'selectbox_br');

        this.selectorContainer.add([tl, tr, bl, br]);

        // Pulse Animation
        this.scene.tweens.add({
            targets: this.selectorContainer,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // 2. Dot Trail
        // We only show dots for the interpolated points, not the final destination (which has selector)
        // pathPoints includes final destination, so iterate up to length-1 for dots
        for (let i = 0; i < this.pathPoints.length - 1; i++) {
            const pt = this.pathPoints[i];
            const dot = this.scene.add.image(pt.x, pt.y, 'select_dots');
            dot.setDepth(5); // Ground level
            this.dotSprites.push(dot);
        }
    }

    private finishMovement() {
        this.isMoving = false;

        // Clear visuals
        if (this.selectorContainer) {
            this.selectorContainer.destroy();
            this.selectorContainer = null;
        }

        this.dotSprites.forEach(dot => dot.destroy());
        this.dotSprites = [];

        // Check for snapped enemy interaction
        if (this.snappedEnemyId) {
            // Trigger interaction logic (e.g. start quiz)
            // Ideally we emit an event or call a method on GameScene
            (this.scene as any).handleEnemyInteraction(this.snappedEnemyId);
        }

        // Reset animation to idle
        const player = (this.scene as any).currentPlayer;
        if (player) {
            const base = player.getData('baseSprite') as Phaser.GameObjects.Sprite;
            const hair = player.getData('hairSprite') as Phaser.GameObjects.Sprite;

            if (base) base.play('idle', true);
            if (hair && hair.visible) {
                const currentKey = hair.anims.currentAnim?.key || '';
                const baseKey = currentKey.split('_')[0];
                if (baseKey) hair.play(baseKey + '_idle', true);
            }
        }
    }

    public update(delta: number) {
        if (!this.isMoving || !this.targetPosition) return;

        const player = (this.scene as any).currentPlayer;
        if (!player) return;

        // Move towards next point in path (which is just the target in straight line, 
        // but structured this way for future A* compatibility)
        const target = this.targetPosition;
        const dist = Phaser.Math.Distance.Between(player.x, player.y, target.x, target.y);

        if (dist < 5) {
            // Reached destination
            this.finishMovement();
            return;
        }

        // Movement Logic
        const dx = target.x - player.x;
        const dy = target.y - player.y;
        const angle = Math.atan2(dy, dx);

        const speed = this.MOVEMENT_SPEED * (delta / 1000);
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;

        player.x += vx;
        player.y += vy;

        // Animation
        // Animation
        const base = player.getData('baseSprite') as Phaser.GameObjects.Sprite;
        const hair = player.getData('hairSprite') as Phaser.GameObjects.Sprite;

        if (base) {
            base.play('walk', true);
            base.setFlipX(vx < 0);
        }
        if (hair) {
            // Determine hair key based on current texture or data
            // Assuming hair sprite has a key like "bowlhair_idle", we want to switch to "_walk" or "_idle"
            // Best way: check if it has a texture key to derive from, OR just play based on known key if possible.
            // Simplified: If hair is visible, try to play matching walk anim.
            if (hair.visible) {
                const currentKey = hair.anims.currentAnim?.key || '';
                const baseKey = currentKey.split('_')[0]; // e.g. "bowlhair"
                if (baseKey && baseKey !== 'walk' && baseKey !== 'idle') {
                    hair.play(baseKey + '_walk', true);
                }
                hair.setFlipX(vx < 0);
            }
        }

        // --- Updates for visual syncing ---
        // (Handled by Scene update loop usually, but good to trigger events or updates here if needed)

        // Remove dots that have been passed
        // Simple check: if dot is "behind" or very close to player
        for (let i = this.dotSprites.length - 1; i >= 0; i--) {
            const dot = this.dotSprites[i];
            const dotDist = Phaser.Math.Distance.Between(player.x, player.y, dot.x, dot.y);
            if (dotDist < 15) { // Threshold to "eat" the dot
                dot.destroy();
                this.dotSprites.splice(i, 1);
            }
        }
    }

    public cancelMovement() {
        if (!this.isMoving) return;

        this.isMoving = false;
        this.targetPosition = null;
        this.pathPoints = [];
        this.snappedEnemyId = null;

        // Clear visuals
        if (this.selectorContainer) {
            this.selectorContainer.destroy();
            this.selectorContainer = null;
        }

        this.dotSprites.forEach(dot => dot.destroy());
        this.dotSprites = [];

        // Reset player to idle if they were moving via click
        const player = (this.scene as any).currentPlayer;
        if (player) {
            const base = player.getData('baseSprite') as Phaser.GameObjects.Sprite;
            const hair = player.getData('hairSprite') as Phaser.GameObjects.Sprite;

            if (base) base.play('idle', true);
            if (hair && hair.visible) {
                const currentKey = hair.anims.currentAnim?.key || '';
                const baseKey = currentKey.split('_')[0];
                if (baseKey) hair.play(baseKey + '_idle', true);
            }
        }
    }

    public isMovingByClick(): boolean {
        return this.isMoving;
    }

    public getVelocity(): { x: number, y: number } | null {
        if (!this.isMoving || !this.targetPosition) return null;
        // Return normalized vector for server sync if needed
        // ... implementation if needed for server reconciliation
        return null;
    }

    public destroy() {
        this.cancelMovement();
        // Remove listeners if needed
    }
}
