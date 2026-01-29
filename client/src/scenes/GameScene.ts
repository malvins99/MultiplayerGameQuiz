
import Phaser from 'phaser';
import { Room } from 'colyseus.js';
import { QuizPopup } from '../ui/QuizPopup';
import { UIScene } from './UIScene'; // Import UI Scene for types

import { HTMLControlAdapter } from '../ui/HTMLControlAdapter';
import { ClickToMoveSystem } from '../systems/ClickToMoveSystem';
import { QUESTIONS } from '../dummyQuestions';

export class GameScene extends Phaser.Scene {
    room!: Room;
    playerEntities: { [sessionId: string]: Phaser.GameObjects.Sprite } = {};
    enemyEntities: { [id: string]: Phaser.GameObjects.Sprite } = {};
    nameTagContainers: { [sessionId: string]: Phaser.GameObjects.Container } = {};
    cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    currentPlayer!: Phaser.GameObjects.Sprite;
    map!: Phaser.Tilemaps.Tilemap;

    quizPopup!: QuizPopup;
    activeEnemyId: string | null = null;
    activeQuestionId: number | null = null;
    cooldownEnemies: Set<string> = new Set();
    isZooming: boolean = false;
    controls!: HTMLControlAdapter;
    indicatorContainer: Phaser.GameObjects.Container | null = null;
    clickToMove!: ClickToMoveSystem;

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

        // Load Player Indicator
        this.load.image('indicator', '/assets/indicator.png');

        // Load Name Tag Label Assets
        this.load.image('label_left', '/assets/label_left.png');
        this.load.image('label_middle', '/assets/label_middle.png');
        this.load.image('label_right', '/assets/label_right.png');
        this.load.image('label_left', '/assets/label_left.png');
        this.load.image('label_middle', '/assets/label_middle.png');
        this.load.image('label_right', '/assets/label_right.png');

        // Load Tracking Assets
        this.load.image('select_dots', '/assets/select_dots.png');
        this.load.image('selectbox_tl', '/assets/selectbox_tl.png');
        this.load.image('selectbox_tr', '/assets/selectbox_tr.png');
        this.load.image('selectbox_bl', '/assets/selectbox_bl.png');
        this.load.image('selectbox_br', '/assets/selectbox_br.png');
        this.load.image('cancel', '/assets/cancel.png');
    }

    create() {
        // --- UI Scene Launch ---
        this.scene.launch('UIScene');
        this.scene.bringToTop('UIScene');

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
            // Filter: Only show players in MY sub-room
            const myPlayer = this.room.state.players.get(this.room.sessionId);
            if (!myPlayer || player.subRoomId !== myPlayer.subRoomId) return;

            const entity = this.add.sprite(player.x, player.y, 'character');
            entity.setOrigin(0.5, 0.5);
            this.playerEntities[sessionId] = entity as any;

            // Create Name Tag for this player
            this.createNameTag(sessionId, player.name || 'Player', entity.x, entity.y);

            if (sessionId === this.room.sessionId) {
                this.currentPlayer = entity as any;
                this.cameras.main.startFollow(this.currentPlayer);
                this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
                this.cameras.main.setZoom(2);

                // Initial Score Update
                const uiScene = this.scene.get('UIScene') as UIScene;
                if (uiScene) uiScene.updateScore(player.score);
            }

            player.onChange(() => {
                // Re-validate sub-room on change (in case of switch, though handled by lobby mostly)
                if (player.subRoomId !== myPlayer.subRoomId) {
                    // Start hiding logic if they switched OUT
                    if (this.playerEntities[sessionId]) {
                        this.playerEntities[sessionId].destroy();
                        delete this.playerEntities[sessionId];
                    }
                    // Also destroy name tag
                    if (this.nameTagContainers[sessionId]) {
                        this.nameTagContainers[sessionId].destroy();
                        delete this.nameTagContainers[sessionId];
                    }
                    return;
                }

                if (sessionId !== this.room.sessionId) {
                    const dx = player.x - entity.x;
                    entity.x = player.x;
                    entity.y = player.y;

                    // Update name tag position
                    if (this.nameTagContainers[sessionId]) {
                        this.nameTagContainers[sessionId].setPosition(entity.x, entity.y - 35);
                    }

                    if (dx !== 0 || Math.abs(dx) > 0.1) {
                        entity.anims.play('walk', true);
                        entity.setFlipX(dx < 0);
                    }
                }

                // Update name text if it changed
                this.updateNameTagText(sessionId, player.name);

                // Update Score if me
                if (sessionId === this.room.sessionId) {
                    const uiScene = this.scene.get('UIScene') as UIScene;
                    if (uiScene) uiScene.updateScore(player.score);
                }
            });
        });

        this.room.state.players.onRemove((player: any, sessionId: string) => {
            const entity = this.playerEntities[sessionId];
            if (entity) entity.destroy();
            delete this.playerEntities[sessionId];

            // Destroy name tag
            if (this.nameTagContainers[sessionId]) {
                this.nameTagContainers[sessionId].destroy();
                delete this.nameTagContainers[sessionId];
            }
        });

        // --- Enemy Sync ---
        this.room.state.enemies.onAdd((enemy: any, index: number) => {
            // PRIVATE VISIBILITY: Each player ONLY sees their OWN enemies
            // This is the correct behavior - enemies are spawned randomly per player
            if (enemy.ownerId !== this.room.sessionId) return;

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
        this.quizPopup = new QuizPopup(this, (answerIndex: number, btn: HTMLElement) => {
            this.handleAnswer(answerIndex, btn);
        });

        // --- Controls UI ---
        this.controls = new HTMLControlAdapter();

        // Show HTML UI Layer
        const uiLayer = document.getElementById('ui-layer');
        if (uiLayer) uiLayer.classList.remove('hidden');

        // --- Game Events from Server ---

        // Timer updates
        this.room.onMessage('timerUpdate', (data: { remaining: number }) => {
            const uiScene = this.scene.get('UIScene') as UIScene;
            if (uiScene && uiScene.updateTimer) {
                uiScene.updateTimer(data.remaining);
            }
        });

        // Player finished (answered all questions)
        this.room.onMessage('playerFinished', () => {
            console.log('Player finished! Showing waiting screen...');
            // Store room reference for WaitingResultsScene
            this.registry.set('room', this.room);
            this.scene.start('WaitingResultsScene');
        });

        // Game ended (all players finished or timer expired)
        this.room.onMessage('gameEnded', (data: { rankings: any[] }) => {
            console.log('Game ended! Showing leaderboard...', data.rankings);
            this.registry.set('leaderboardData', data.rankings);
            this.scene.start('LeaderboardScene');
        });

        // --- Player Indicator (Floating Arrow) ---
        this.createPlayerIndicator();

        // --- Click To Move System ---
        this.clickToMove = new ClickToMoveSystem(this);
    }

    createPlayerIndicator() {
        // Wait for player to be created, might need slight delay
        this.time.addEvent({
            delay: 500,
            callback: () => {
                if (!this.currentPlayer) return;

                // Create Container following player
                this.indicatorContainer = this.add.container(
                    this.currentPlayer.x,
                    this.currentPlayer.y - 15
                );
                this.indicatorContainer.setDepth(200);

                // Add Indicator Image inside
                const indicator = this.add.image(0, 0, 'indicator');
                indicator.setOrigin(0.5, 1);
                this.indicatorContainer.add(indicator);

                // Floating Animation
                this.tweens.add({
                    targets: indicator,
                    y: -4,
                    duration: 600,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }
        });
    }

    createNameTag(sessionId: string, name: string, x: number, y: number) {
        // Create container for name tag (Above pointer)
        const container = this.add.container(x, y - 35);
        container.setDepth(150);
        container.setScale(0.9); // Shrink slightly (but not too much)

        // Create pixel text first to measure width
        const nameText = this.add.text(0, 0, name.toUpperCase(), {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '6px',
            color: '#000000',
            resolution: 2
        });
        nameText.setOrigin(0.5, 0.5);
        nameText.setName('nameText');

        // Calculate label width based on text
        const textWidth = nameText.width;
        const padding = 4;
        const minMiddleWidth = Math.max(textWidth + padding, 12);

        // Get label asset dimensions
        const leftImg = this.textures.get('label_left');
        const rightImg = this.textures.get('label_right');
        const leftWidth = leftImg.getSourceImage().width;
        const rightWidth = rightImg.getSourceImage().width;

        // Create 9-slice label background
        const labelLeft = this.add.image(-minMiddleWidth / 2 - leftWidth / 2, 0, 'label_left');
        labelLeft.setOrigin(0.5, 0.5);

        const labelMiddle = this.add.image(0, 0, 'label_middle');
        labelMiddle.setOrigin(0.5, 0.5);
        labelMiddle.setDisplaySize(minMiddleWidth, labelMiddle.height);

        const labelRight = this.add.image(minMiddleWidth / 2 + rightWidth / 2, 0, 'label_right');
        labelRight.setOrigin(0.5, 0.5);

        // Add to container (order matters for layering)
        container.add([labelLeft, labelMiddle, labelRight, nameText]);

        // Store reference
        this.nameTagContainers[sessionId] = container;
    }

    updateNameTagText(sessionId: string, newName: string) {
        const container = this.nameTagContainers[sessionId];
        if (!container) return;

        // Find the text object by name
        const nameText = container.getByName('nameText') as Phaser.GameObjects.Text;
        if (nameText && nameText.text !== newName.toUpperCase()) {
            nameText.setText(newName.toUpperCase());

            // Recalculate label widths
            const textWidth = nameText.width;
            const padding = 4;
            const minMiddleWidth = Math.max(textWidth + padding, 12);

            const leftImg = this.textures.get('label_left');
            const rightImg = this.textures.get('label_right');
            const leftWidth = leftImg.getSourceImage().width;
            const rightWidth = rightImg.getSourceImage().width;

            // Update positions
            const children = container.list as Phaser.GameObjects.Image[];
            // children[0] = labelLeft, children[1] = labelMiddle, children[2] = labelRight
            if (children[0]) children[0].setX(-minMiddleWidth / 2 - leftWidth / 2);
            if (children[1]) children[1].setDisplaySize(minMiddleWidth, children[1].height);
            if (children[2]) children[2].setX(minMiddleWidth / 2 + rightWidth / 2);
        }
    }

    handleAnswer(answerIndex: number, btnElement?: HTMLElement) {
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

            // Show Feedback Popup via DOM
            if (btnElement && this.quizPopup) {
                // If wrong, we still show the 'cancel' icon. 
                // User said: "if wrong, do not show correct answer". 
                // We just show X on the clicked button.
                this.quizPopup.showFeedback(isCorrect, btnElement);
            }

            if (isCorrect) {
                console.log("Sending correctAnswer to server");
                this.room.send("correctAnswer", {
                    questionId: this.activeQuestionId,
                    enemyIndex: this.activeEnemyId
                });
                // Add Score (10 points)
                this.room.send("addScore", { amount: 10 });
            } else {
                console.log("Sending wrongAnswer to server");
                this.room.send("wrongAnswer", { questionId: this.activeQuestionId });
                // Kill enemy without sending correctAnswer (to avoid double-counting)
                this.room.send("killEnemy", { enemyIndex: this.activeEnemyId });
            }
        } else {
            console.error(`Question Data not found for ID: ${this.activeQuestionId}`);
            if (this.quizPopup) this.quizPopup.hide();
        }

        this.activeQuestionId = null;
        this.activeEnemyId = null;

        // Reset Camera delayed to match feedback animation
        this.time.delayedCall(1200, () => {
            this.resetCamera();
        });
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

                            // Cancel tracking when quiz triggers
                            if (this.clickToMove) {
                                this.clickToMove.cancelMovement();
                            }
                        }
                    }
                }
            }
        });

        if (hitEnemy) return;

        // --- Click To Move Logic ---
        this.clickToMove.update(delta);

        // Sync valid click movement to server and local prediction
        if (this.clickToMove.isMovingByClick()) {
            this.room.send("movePlayer", { x: this.currentPlayer.x, y: this.currentPlayer.y });

            // Sync indicators
            if (this.indicatorContainer) {
                this.indicatorContainer.setPosition(this.currentPlayer.x, this.currentPlayer.y - 15);
            }
            if (this.nameTagContainers[this.room.sessionId]) {
                this.nameTagContainers[this.room.sessionId].setPosition(this.currentPlayer.x, this.currentPlayer.y - 35);
            }

            return; // Skip WASD logic if moving by click
        } else {
            // If WASD key is pressed, CANCEL click movement
            const nav = this.controls.getNav();
            if (this.cursors.left.isDown || this.cursors.right.isDown || this.cursors.up.isDown || this.cursors.down.isDown ||
                this.input.keyboard?.addKey('W').isDown || this.input.keyboard?.addKey('A').isDown ||
                this.input.keyboard?.addKey('S').isDown || this.input.keyboard?.addKey('D').isDown ||
                nav.left || nav.right || nav.up || nav.down) {
                if (this.clickToMove) this.clickToMove.cancelMovement();
            }
        }

        // Simple movement logic
        const speed = 200;
        const velocity = { x: 0, y: 0 };
        const inputPayload = {
            left: false,
            right: false,
            up: false,
            down: false,
        };
        let isMoving = false;

        const nav = this.controls.getNav();

        if (this.cursors.left.isDown || this.input.keyboard?.addKey('A').isDown || nav.left) {
            inputPayload.left = true;
            this.currentPlayer.setFlipX(true);
            isMoving = true;
        } else if (this.cursors.right.isDown || this.input.keyboard?.addKey('D').isDown || nav.right) {
            inputPayload.right = true;
            this.currentPlayer.setFlipX(false);
            isMoving = true;
        }

        if (this.cursors.up.isDown || this.input.keyboard?.addKey('W').isDown || nav.up) {
            inputPayload.up = true;
            isMoving = true;
        } else if (this.cursors.down.isDown || this.input.keyboard?.addKey('S').isDown || nav.down) {
            inputPayload.down = true;
            isMoving = true;
        }

        // Apply velocity based on inputPayload
        if (inputPayload.left) velocity.x -= 1;
        if (inputPayload.right) velocity.x += 1;
        if (inputPayload.up) velocity.y -= 1;
        if (inputPayload.down) velocity.y += 1;

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

            // Update Indicator Position
            if (this.indicatorContainer) {
                this.indicatorContainer.setPosition(this.currentPlayer.x, this.currentPlayer.y - 15);
            }

            // Update Current Player's Name Tag Position
            if (this.nameTagContainers[this.room.sessionId]) {
                this.nameTagContainers[this.room.sessionId].setPosition(this.currentPlayer.x, this.currentPlayer.y - 35);
            }
        } else {
            const sprite = this.currentPlayer as unknown as Phaser.GameObjects.Sprite;
            if (sprite.anims) {
                sprite.anims.play('idle', true);
            }
        }
    }

    handleEnemyInteraction(enemyId: string) {
        // Cancel tracking when quiz triggers
        if (this.clickToMove) {
            this.clickToMove.cancelMovement();
        }

        // Triggered by ClickToMoveSystem when snapping finishes
        const enemyState = this.room.state.enemies[enemyId];
        if (enemyState && enemyState.isAlive && !this.cooldownEnemies.has(enemyId)) {
            const enemySprite = this.enemyEntities[enemyId];
            this.activeEnemyId = enemyId;
            this.activeQuestionId = enemyState.questionId;

            const questions = QUESTIONS;
            const qData = questions.find((q: any) => q.id === this.activeQuestionId);

            if (qData) {
                // Derive name from type
                const name = (enemyState.type || 'ENEMY').toUpperCase();
                this.quizPopup.show(qData, name);

                // Start Combat Camera
                if (enemySprite) {
                    this.startCombatCamera(enemySprite.x, enemySprite.y);
                }
            }
        }
    }
}
