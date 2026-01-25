
import Phaser from 'phaser';
import { Room } from 'colyseus.js';
import { QuizPopup } from '../ui/QuizPopup';
import { QUESTIONS } from '../dummyQuestions';

export class GameScene extends Phaser.Scene {
    room!: Room;
    playerEntities: { [sessionId: string]: Phaser.GameObjects.Arc } = {};
    enemyEntities: { [id: string]: Phaser.GameObjects.Sprite } = {};
    cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    currentPlayer!: Phaser.GameObjects.Arc;
    map!: Phaser.Tilemaps.Tilemap;

    quizPopup!: QuizPopup;
    activeEnemyId: string | null = null;
    activeQuestionId: number | null = null;
    cooldownEnemies: Set<string> = new Set();
    isZooming: boolean = false;

    constructor() {
        super('GameScene');
    }

    init(data: { room: Room }) {
        this.room = data.room;
    }

    preload() {
        // Determine map based on difficulty from room state
        const difficulty = this.room.state.difficulty;
        let mapKey = 'map_easy';
        let mapFile = 'map_baru1.tmj';

        if (difficulty === 'sedang') {
            mapKey = 'map_medium';
            mapFile = 'map_baru2.tmj';
        } else if (difficulty === 'sulit') {
            mapKey = 'map_hard';
            mapFile = 'map_baru3.tmj';
        }

        this.load.tilemapTiledJSON(mapKey, `/assets/${mapFile}`);
        this.load.image('tiles', '/assets/spr_tileset_sunnysideworld_16px.png');
        this.load.spritesheet('character', '/assets/base_walk_strip8.png', { frameWidth: 96, frameHeight: 64 });

        // Load Enemy Assets
        this.load.spritesheet('skeleton_idle', '/assets/skeleton_idle.png', { frameWidth: 96, frameHeight: 64 });
        this.load.spritesheet('skeleton_death', '/assets/skeleton_death.png', { frameWidth: 96, frameHeight: 64 });
        this.load.spritesheet('goblin_idle', '/assets/goblin_idle.png', { frameWidth: 96, frameHeight: 64 });
        this.load.spritesheet('goblin_death', '/assets/goblin_death.png', { frameWidth: 96, frameHeight: 64 });
    }

    create() {
        // --- Map Rendering ---
        const difficulty = this.room.state.difficulty;
        const mapKey = difficulty === 'sedang' ? 'map_medium' : difficulty === 'sulit' ? 'map_hard' : 'map_easy';

        this.map = this.make.tilemap({ key: mapKey });

        const tileset = this.map.addTilesetImage('spr_tileset_sunnysideworld_16px', 'tiles');

        if (tileset) {
            this.map.layers.forEach(layer => {
                this.map.createLayer(layer.name, tileset, 0, 0);
            });
        } else {
            console.error("Could not load tileset!");
            const tilesetFallback = this.map.addTilesetImage('spr_tileset_sunnysideworld_16px.png', 'tiles');
            if (tilesetFallback) {
                this.map.layers.forEach(layer => {
                    this.map.createLayer(layer.name, tilesetFallback, 0, 0);
                });
            }
        }

        // --- Animations ---
        this.anims.create({
            key: 'walk',
            frames: this.anims.generateFrameNumbers('character', { start: 0, end: 7 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'idle',
            frames: [{ key: 'character', frame: 0 }],
            frameRate: 10
        });

        // Enemy Animations
        this.anims.create({
            key: 'skeleton_idle',
            frames: this.anims.generateFrameNumbers('skeleton_idle', { start: 0, end: 5 }),
            frameRate: 8,
            repeat: -1
        });
        this.anims.create({
            key: 'skeleton_death',
            frames: this.anims.generateFrameNumbers('skeleton_death', { start: 0, end: 9 }),
            frameRate: 8,
            repeat: 0
        });

        // Goblin Animations
        this.anims.create({
            key: 'goblin_idle',
            frames: this.anims.generateFrameNumbers('goblin_idle', { start: 0, end: 5 }),
            frameRate: 8,
            repeat: -1
        });
        this.anims.create({
            key: 'goblin_death',
            frames: this.anims.generateFrameNumbers('goblin_death', { start: 0, end: 8 }),
            frameRate: 8,
            repeat: 0
        });

        // --- Inputs ---
        this.cursors = this.input.keyboard!.createCursorKeys();

        // --- Player Sync ---
        this.room.state.players.onAdd((player: any, sessionId: string) => {
            const entity = this.add.sprite(player.x, player.y, 'character');
            entity.setOrigin(0.5, 0.5);
            this.playerEntities[sessionId] = entity as any;

            if (sessionId === this.room.sessionId) {
                this.currentPlayer = entity as any;
                this.cameras.main.startFollow(this.currentPlayer);
                this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
                this.cameras.main.setZoom(2);
            }

            player.onChange(() => {
                if (sessionId !== this.room.sessionId) {
                    const dx = player.x - entity.x;
                    entity.x = player.x;
                    entity.y = player.y;

                    if (dx !== 0 || Math.abs(dx) > 0.1) {
                        entity.anims.play('walk', true);
                        entity.setFlipX(dx < 0);
                    }
                }
            });
        });

        this.room.state.players.onRemove((player: any, sessionId: string) => {
            const entity = this.playerEntities[sessionId];
            if (entity) entity.destroy();
            delete this.playerEntities[sessionId];
        });

        // --- Enemy Sync ---
        this.room.state.enemies.onAdd((enemy: any, index: number) => {
            if (enemy.ownerId !== this.room.sessionId) return; // Private visibility

            const type = enemy.type || 'skeleton';
            const animKey = type + '_idle';

            const enemySprite = this.physics.add.sprite(enemy.x, enemy.y, type + '_idle');
            enemySprite.play(animKey);
            enemySprite.setOrigin(0.5, 0.5);

            this.enemyEntities[index] = enemySprite as any;

            enemy.onChange(() => {
                if (!enemy.isAlive) {
                    console.log(`Enemy ${index} died. Playing death animation.`);
                    // Play death animation then destroy
                    enemySprite.play(type + '_death');
                    enemySprite.once('animationcomplete', () => {
                        enemySprite.destroy();
                    });
                }
            });
        });

        // --- Quiz System ---
        this.quizPopup = new QuizPopup(this, (answerIndex: number) => {
            this.handleAnswer(answerIndex);
        });
    }

    handleAnswer(answerIndex: number) {
        console.log(`handleAnswer called with index: ${answerIndex}, activeQuestionId: ${this.activeQuestionId}`);
        // Mark enemy as locally processed to prevent immediate re-trigger
        if (this.activeEnemyId) {
            this.cooldownEnemies.add(this.activeEnemyId);
        }

        // Use QUESTIONS array directly
        const questions = QUESTIONS;
        const currentQ = questions.find((q: any) => q.id === this.activeQuestionId);

        if (currentQ) {
            const isCorrect = currentQ.correctAnswer === answerIndex;
            console.log(`Checking answer. Question: ${currentQ.question}, CorrectIdx: ${currentQ.correctAnswer}, UserIdx: ${answerIndex}, isCorrect: ${isCorrect}`);

            if (isCorrect) {
                console.log("Sending correctAnswer to server");
                this.room.send("correctAnswer", {
                    questionId: this.activeQuestionId,
                    enemyIndex: this.activeEnemyId
                });
            } else {
                console.log("Sending wrongAnswer (and correctAnswer to kill) to server");
                this.room.send("wrongAnswer", { questionId: this.activeQuestionId });
                // Also kill enemy on wrong answer per user request
                this.room.send("correctAnswer", {
                    questionId: this.activeQuestionId,
                    enemyIndex: this.activeEnemyId
                });
            }
        } else {
            console.error(`Question Data not found for ID: ${this.activeQuestionId}`);
        }

        this.activeQuestionId = null;
        this.activeEnemyId = null;

        // Reset Camera
        this.resetCamera();
    }

    startCombatCamera(targetX: number, targetY: number) {
        if (this.isZooming) return;
        this.isZooming = true;

        // Stop following player
        this.cameras.main.stopFollow();

        // Pan to enemy and zoom in
        this.cameras.main.pan(targetX, targetY, 800, 'Power2');
        this.cameras.main.zoomTo(3.5, 1000, 'Power2');
    }

    resetCamera() {
        if (!this.isZooming) return;
        this.isZooming = false;

        // Zoom back out
        this.cameras.main.zoomTo(2.0, 800, 'Power2'); // Base zoom is 2.0

        // Immediately start following player with smooth lerp (no blink)
        if (this.currentPlayer) {
            this.cameras.main.startFollow(this.currentPlayer, true, 0.1, 0.1);
        }
    }

    update(time: number, delta: number) {
        if (!this.currentPlayer) return;

        // Block movement if quiz is open
        if (this.quizPopup.isVisible()) {
            return;
        }

        // --- Interaction Check ---
        let hitEnemy = false;

        Object.keys(this.enemyEntities).forEach(key => {
            const enemySprite = this.enemyEntities[key];
            if (enemySprite && enemySprite.active && enemySprite.visible) {
                const dist = Phaser.Math.Distance.Between(this.currentPlayer.x, this.currentPlayer.y, enemySprite.x, enemySprite.y);
                if (dist < 50) {
                    const enemyState = this.room.state.enemies[key as any];
                    if (enemyState && enemyState.isAlive && !this.cooldownEnemies.has(key)) {
                        this.activeEnemyId = key;
                        this.activeQuestionId = enemyState.questionId;

                        const questions = QUESTIONS;
                        const qData = questions.find((q: any) => q.id === this.activeQuestionId);

                        if (qData) {
                            // Derive name from type
                            const name = (enemyState.type || 'ENEMY').toUpperCase();
                            this.quizPopup.show(qData, name);

                            // Start Combat Camera
                            this.startCombatCamera(enemySprite.x, enemySprite.y);

                            hitEnemy = true;
                        }
                    }
                }
            }
        });

        if (hitEnemy) return;

        // Simple movement logic
        const speed = 200;
        const velocity = { x: 0, y: 0 };

        if (this.cursors.left.isDown || this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A).isDown) velocity.x -= 1;
        if (this.cursors.right.isDown || this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D).isDown) velocity.x += 1;
        if (this.cursors.up.isDown || this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W).isDown) velocity.y -= 1;
        if (this.cursors.down.isDown || this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S).isDown) velocity.y += 1;

        if (velocity.x !== 0 || velocity.y !== 0) {
            const length = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
            velocity.x /= length;
            velocity.y /= length;

            this.currentPlayer.x += velocity.x * speed * (delta / 1000);
            this.currentPlayer.y += velocity.y * speed * (delta / 1000);

            const sprite = this.currentPlayer as unknown as Phaser.GameObjects.Sprite;
            if (sprite.anims) {
                sprite.anims.play('walk', true);
                if (velocity.x < 0) sprite.setFlipX(true);
                else if (velocity.x > 0) sprite.setFlipX(false);
            }

            this.room.send("movePlayer", { x: this.currentPlayer.x, y: this.currentPlayer.y });
        } else {
            const sprite = this.currentPlayer as unknown as Phaser.GameObjects.Sprite;
            if (sprite.anims) {
                sprite.anims.play('idle', true);
            }
        }
    }
}
