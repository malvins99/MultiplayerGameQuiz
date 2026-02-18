import Phaser from 'phaser';
import { Room } from 'colyseus.js';
import { QuizPopup } from '../ui/QuizPopup';
import { UIScene } from './UIScene'; // Import UI Scene for types
import { TransitionManager } from '../utils/TransitionManager';

import { HTMLControlAdapter } from '../ui/HTMLControlAdapter';
import { ClickToMoveSystem } from '../systems/ClickToMoveSystem';
// import { QUESTIONS } from '../dummyQuestions'; // Removed to enforce server questions

export class GameScene extends Phaser.Scene {
    room!: Room;
    playerEntities: { [sessionId: string]: Phaser.GameObjects.Container } = {};
    enemyEntities: { [id: string]: Phaser.GameObjects.Sprite } = {};
    chestContainers: { [index: number]: Phaser.GameObjects.Container } = {};
    nameTagContainers: { [sessionId: string]: Phaser.GameObjects.Container } = {};
    cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    currentPlayer!: Phaser.GameObjects.Container;
    map!: Phaser.Tilemaps.Tilemap;

    quizPopup!: QuizPopup;
    activeEnemyId: string | null = null;
    activeQuestionId: number | null = null;
    isChestPopupVisible: boolean = false;
    activeChestIndex: number | null = null;
    cooldownEnemies: Set<string> = new Set();
    isZooming: boolean = false;
    controls!: HTMLControlAdapter;
    indicatorContainer: Phaser.GameObjects.Container | null = null;
    clickToMove!: ClickToMoveSystem;

    isGameReady: boolean = false; // Block input until countdown finishes

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
        let mapFile = 'map_baru1_tetap.tmj';

        if (difficulty === 'sedang') {
            mapKey = 'map_medium';
            mapFile = 'map_baru2.tmj';
        } else if (difficulty === 'sulit') {
            mapKey = 'map_hard';
            mapFile = 'map_baru3.tmj';
        }

        this.load.tilemapTiledJSON(mapKey, `/assets/${mapFile}`);
        this.load.image('tiles', '/assets/spr_tileset_sunnysideworld_16px.png');
        this.load.image('forest_tiles', '/assets/spr_tileset_sunnysideworld_forest_32px.png'); // Load Forest Tileset
        this.load.image('forest_tiles', '/assets/spr_tileset_sunnysideworld_forest_32px.png'); // Load Forest Tileset
        this.load.spritesheet('character', '/assets/base_walk_strip8.png', { frameWidth: 96, frameHeight: 64 });
        this.load.spritesheet('base_idle', '/assets/base_idle_strip9.png', { frameWidth: 96, frameHeight: 64 });

        // Load Hair Assets
        const hairKeys = ['bowlhair', 'curlyhair', 'longhair', 'mophair', 'shorthair', 'spikeyhair'];
        hairKeys.forEach(key => {
            this.load.spritesheet(`${key}_walk`, `/assets/${key}_walk_strip8.png`, { frameWidth: 96, frameHeight: 64 });
            this.load.spritesheet(`${key}_idle`, `/assets/${key}_idle_strip9.png`, { frameWidth: 96, frameHeight: 64 });
        });

        // Skeleton
        // Skeleton
        this.load.spritesheet('skeleton_idle', '/assets/characters/Skeleton/PNG/skeleton_idle_strip6.png', { frameWidth: 96, frameHeight: 64 });
        this.load.spritesheet('skeleton_walk', '/assets/characters/Skeleton/PNG/skeleton_walk_strip8.png', { frameWidth: 96, frameHeight: 64 });
        this.load.spritesheet('skeleton_death', '/assets/characters/Skeleton/PNG/skeleton_death_strip10.png', { frameWidth: 96, frameHeight: 64 });

        // Goblin
        this.load.spritesheet('goblin_idle', '/assets/characters/Goblin/PNG/spr_idle_strip9.png', { frameWidth: 96, frameHeight: 64 });
        this.load.spritesheet('goblin_walk', '/assets/characters/Goblin/PNG/spr_walk_strip8.png', { frameWidth: 96, frameHeight: 64 });
        this.load.spritesheet('goblin_death', '/assets/characters/Goblin/PNG/spr_death_strip13.png', { frameWidth: 96, frameHeight: 64 });

        // Load Chest Tileset as Spritesheet for frame access
        this.load.spritesheet('chest_tiles', '/assets/spr_tileset_sunnysideworld_16px.png', {
            frameWidth: 16,
            frameHeight: 16,
            margin: 0,
            spacing: 0
        });

        // Load Player Indicator
        this.load.image('indicator', '/assets/indicator.png');

        // Load Name Tag Label Assets
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
        this.load.image('expression_alerted', '/assets/expression_alerted.png');
    }

    create() {
        // DEBUG: Check if textures are loaded
        console.log('[DEBUG] Textures loaded:');
        console.log('  skeleton_idle:', this.textures.exists('skeleton_idle'));
        console.log('  skeleton_walk:', this.textures.exists('skeleton_walk'));
        console.log('  goblin_idle:', this.textures.exists('goblin_idle'));
        console.log('  goblin_walk:', this.textures.exists('goblin_walk'));

        // --- UI Scene Launch ---
        this.scene.launch('UIScene');
        this.scene.bringToTop('UIScene');

        // --- Start Game Directly (No 5s Countdown) --- (As requested)
        this.isGameReady = true;
        TransitionManager.open();
        console.log("Game Started! Input unlocked immediately.");

        // --- Map Rendering ---
        const difficulty = this.room.state.difficulty;
        const mapKey = difficulty === 'sedang' ? 'map_medium' : difficulty === 'sulit' ? 'map_hard' : 'map_easy';

        this.map = this.make.tilemap({ key: mapKey });

        // Add both tilesets
        const tileset1 = this.map.addTilesetImage('spr_tileset_sunnysideworld_16px', 'tiles');
        const tileset2 = this.map.addTilesetImage('spr_tileset_sunnysideworld_forest_32px', 'forest_tiles');

        const tilesets: Phaser.Tilemaps.Tileset[] = [];
        if (tileset1) tilesets.push(tileset1);
        if (tileset2) tilesets.push(tileset2);

        if (tilesets.length > 0) {
            this.map.layers.forEach(layerData => {
                try {
                    // Check if layer already exists (to prevent "Layer ID already exists" error)
                    const existingLayer = this.map.getLayer(layerData.name);
                    if (existingLayer && existingLayer.tilemapLayer) {
                        // Already initialized, skip
                        return;
                    }
                    this.map.createLayer(layerData.name, tilesets, 0, 0);
                } catch (e) {
                    console.warn(`Skipping layer render: ${layerData.name}`, e);
                }
            });
        } else {
            console.error("Could not load tilesets properly!");
        }

        // --- Animations ---
        // Base Animations
        this.anims.create({
            key: 'walk',
            frames: this.anims.generateFrameNumbers('character', { start: 0, end: 7 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'idle',
            frames: this.anims.generateFrameNumbers('base_idle', { start: 0, end: 8 }),
            frameRate: 10,
            repeat: -1
        });

        // Hair Animations
        const hairKeys = ['bowlhair', 'curlyhair', 'longhair', 'mophair', 'shorthair', 'spikeyhair'];
        hairKeys.forEach(key => {
            this.anims.create({
                key: `${key}_walk`,
                frames: this.anims.generateFrameNumbers(`${key}_walk`, { start: 0, end: 7 }),
                frameRate: 10,
                repeat: -1
            });
            this.anims.create({
                key: `${key}_idle`,
                frames: this.anims.generateFrameNumbers(`${key}_idle`, { start: 0, end: 8 }),
                frameRate: 10,
                repeat: -1
            });
        });

        // Enemy Animations
        this.anims.create({
            key: 'skeleton_idle',
            frames: this.anims.generateFrameNumbers('skeleton_idle', { start: 0, end: 5 }), // Updated to 6 frames
            frameRate: 8,
            repeat: -1
        });
        this.anims.create({
            key: 'skeleton_walk',
            frames: this.anims.generateFrameNumbers('skeleton_walk', { start: 0, end: 7 }),
            frameRate: 12,
            repeat: -1
        });
        this.anims.create({
            key: 'skeleton_death',
            frames: this.anims.generateFrameNumbers('skeleton_death', { start: 0, end: 9 }), // Updated to 10 frames
            frameRate: 8,
            repeat: 0
        });

        // Goblin Animations
        this.anims.create({
            key: 'goblin_idle',
            frames: this.anims.generateFrameNumbers('goblin_idle', { start: 0, end: 8 }), // Updated to 9 frames
            frameRate: 8,
            repeat: -1
        });
        this.anims.create({
            key: 'goblin_walk',
            frames: this.anims.generateFrameNumbers('goblin_walk', { start: 0, end: 7 }),
            frameRate: 12,
            repeat: -1
        });
        this.anims.create({
            key: 'goblin_death',
            frames: this.anims.generateFrameNumbers('goblin_death', { start: 0, end: 12 }),
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

            // Container for Base + Hair
            const container = this.add.container(player.x, player.y);
            container.setDepth(10); // Standard depth

            // Base Sprite
            const baseSprite = this.add.sprite(0, 0, 'character');
            baseSprite.setOrigin(0.5, 0.5);
            baseSprite.play('idle');

            // Hair Sprite
            const hairSprite = this.add.sprite(0, 0, 'bowlhair_idle'); // placeholder key
            hairSprite.setOrigin(0.5, 0.5);
            hairSprite.setVisible(false); // Hidden by default if 0/none or not set

            container.add([baseSprite, hairSprite]);
            container.setData('hairSprite', hairSprite); // Store ref
            container.setData('baseSprite', baseSprite);

            this.playerEntities[sessionId] = container;

            // Helper to update hair visual
            const updateHairVisuals = () => {
                const hairId = player.hairId || 0;
                import('../data/characterData').then(({ getHairById }) => {
                    const hairData = getHairById(hairId);
                    if (hairData.id === 0) {
                        hairSprite.setVisible(false);
                    } else {
                        hairSprite.setVisible(true);
                        // We need to play the correct animation based on current state (idle or walk)
                        const currentAnim = baseSprite.anims.currentAnim?.key;
                        const isWalking = currentAnim === 'walk';
                        const newKey = isWalking ? hairData.walkKey : hairData.idleKey;

                        // Only play if different or not playing
                        if (hairSprite.anims.currentAnim?.key !== newKey) {
                            hairSprite.play(newKey);
                            // Sync frame with base if possible, but they are same FPS so starting play should be enough
                            // hairSprite.setFrame(baseSprite.frame.name); 
                        }
                    }
                });
            };

            // Initial hair update (wait for module? or just run)
            updateHairVisuals();

            // Create Name Tag for this player
            this.createNameTag(sessionId, player.name || 'Player', container.x, container.y);

            if (sessionId === this.room.sessionId) {
                this.currentPlayer = container as any; // Cast container to sprite compatible for camera
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
                    const entity = this.playerEntities[sessionId];
                    if (entity) {
                        const dx = player.x - entity.x;
                        entity.x = player.x;
                        entity.y = player.y;

                        // Update name tag position
                        if (this.nameTagContainers[sessionId]) {
                            this.nameTagContainers[sessionId].setPosition(entity.x, entity.y - 35);
                        }

                        const bSprite = entity.getData('baseSprite') as Phaser.GameObjects.Sprite;
                        const hSprite = entity.getData('hairSprite') as Phaser.GameObjects.Sprite;

                        if (dx !== 0 || Math.abs(dx) > 0.1) {
                            if (bSprite.anims.currentAnim?.key !== 'walk') bSprite.play('walk', true);

                            // Container cannot be flipped directly, flip children
                            bSprite.setFlipX(dx < 0);
                            hSprite.setFlipX(dx < 0);

                            // Sync Hair Animation
                            const hairId = player.hairId || 0;
                            if (hairId > 0) {
                                import('../data/characterData').then(({ getHairById }) => {
                                    const h = getHairById(hairId);
                                    if (hSprite.anims.currentAnim?.key !== h.walkKey) {
                                        hSprite.play(h.walkKey, true);
                                    }
                                });
                            }
                        } else {
                            // Idle
                            if (bSprite.anims.currentAnim?.key !== 'idle') bSprite.play('idle', true);

                            // Sync Hair Idle
                            const hairId = player.hairId || 0;
                            if (hairId > 0) {
                                import('../data/characterData').then(({ getHairById }) => {
                                    const h = getHairById(hairId);
                                    if (hSprite.anims.currentAnim?.key !== h.idleKey) {
                                        hSprite.play(h.idleKey, true);
                                    }
                                });
                            }
                        }
                    }
                }

                // If I am moving myself (client-side prediction usually, but here we might need to sync hair animation locally too if not handled)
                // Actually my local movement logic is usually input-driven.
                // But my player.onChange handles *server* updates.
                // If hair changes, we must update visuals regardless of movement.
                updateHairVisuals();

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

        // --- Chest Sync ---
        this.room.state.chests.onAdd((chest: any, index: number) => {
            const container = this.add.container(chest.x, chest.y);
            container.setDepth(50);

            // Interaction: Touch/Overlap
            container.setSize(32, 32);
            this.physics.world.enable(container);
            (container.body as Phaser.Physics.Arcade.Body).setImmovable(true);

            // Create sprite layers
            // 1. Shadow: Frame 2019 (Always visible)
            // 2. Body: 1956 (Closed), 1957 (Open Empty), 1958 (Locked)
            // 3. Lid: 1891 (Lid Open) -> Only visible when Open

            const shadow = this.add.sprite(0, 5, 'chest_tiles', 2020);
            const body = this.add.sprite(0, 0, 'chest_tiles', 1956); // Start Closed
            const lid = this.add.sprite(0, -5, 'chest_tiles', 1892); // Lid (Hidden by default)
            lid.setVisible(false);

            container.add([shadow, body, lid]);
            this.chestContainers[index] = container;

            // Visual Update Function
            const updateVisuals = (animate: boolean = false) => {
                const myPlayer = this.room.state.players.get(this.room.sessionId);
                if (!myPlayer) return;

                body.setTint(0xffffff); // Reset Visuals
                lid.setVisible(false);  // Default hidden
                lid.y = -5;

                if (chest.isCollected) {
                    // --- OPENED State ---
                    // Body: Open Empty (1957)
                    body.setFrame(1957);

                    // Lid: Visible & Animated
                    lid.setVisible(true);
                    lid.setFrame(1893);

                    if (animate) {
                        this.tweens.add({
                            targets: lid,
                            y: -15, duration: 300, ease: 'Back.easeOut',
                            onComplete: () => { lid.y = -12; }
                        });
                    } else {
                        lid.y = -12;
                    }
                }
                else if (myPlayer.hasUsedChest) {
                    // --- LOCKED State ---
                    // Body: Locked (1958)
                    body.setFrame(1958);
                }
                else {
                    // --- AVAILABLE State ---
                    // Body: Closed (1956)
                    body.setFrame(1956);
                }
            };

            updateVisuals(false);

            chest.onChange(() => {
                updateVisuals(chest.isCollected); // Animate if becomes collected
            });

            const myPlayer = this.room.state.players.get(this.room.sessionId);
            if (myPlayer) {
                myPlayer.onChange(() => { updateVisuals(false); });
            }
        });

        // Handle Retry Question
        this.room.onMessage('retryQuestion', (data: { questionId: number }) => {
            this.showRetryQuestionPopup(data.questionId);
        });

        // --- Enemy Sync ---
        this.room.state.enemies.onAdd((enemy: any, index: number) => {
            console.log(`[Enemy] onAdd: index=${index}, ownerId=${enemy.ownerId}, myId=${this.room.sessionId}, type=${enemy.type}, pos=(${enemy.x}, ${enemy.y})`);

            // PRIVATE VISIBILITY: Each player ONLY sees their OWN enemies
            // This is the correct behavior - enemies are spawned randomly per player
            if (enemy.ownerId !== this.room.sessionId) {
                console.log(`[Enemy] Skipping enemy ${index} - belongs to different player`);
                return;
            }

            console.log(`[Enemy] Creating sprite for enemy ${index}`);
            const type = enemy.type || 'skeleton';
            const animKey = type + '_idle';

            const enemySprite = this.physics.add.sprite(enemy.x, enemy.y, type + '_idle');

            // Play animation correctly
            if (this.anims.exists(animKey)) {
                enemySprite.play(animKey);
            } else {
                console.warn(`Animation ${animKey} missing for enemy ${type}`);
            }

            enemySprite.setOrigin(0.5, 0.5);
            // Height is 64px, so anchor at feet (roughly 0.8 to look grounded) or center
            // Let's stick to center for now but adjust scale if needed.
            // Original scale 2 was for 16px sprites. For 96x64 sprites, scale 1 is likely fine, or even smaller (0.5).
            // Let's try scale 1 first.
            enemySprite.setScale(1);
            enemySprite.setDepth(50); // Ensure above map tiles
            enemySprite.setInteractive();

            // Store previous position to calculate direction
            enemySprite.setData('prevX', enemy.x);

            // Enemy Interaction (Click)
            enemySprite.on('pointerdown', () => {
                // Check distance
                const dist = Phaser.Math.Distance.Between(
                    this.currentPlayer.x, this.currentPlayer.y,
                    enemySprite.x, enemySprite.y
                );

                if (dist < 50) {
                    // Check if not already in a quiz or cooling down
                    if (!this.activeQuestionId && !this.cooldownEnemies.has(String(index))) {
                        this.triggerQuiz(enemy);
                    }
                } else {
                    // Move to enemy
                    this.clickToMove.moveTo(enemySprite.x, enemySprite.y, () => {
                        // Verify distance again after moving
                        const newDist = Phaser.Math.Distance.Between(
                            this.currentPlayer.x, this.currentPlayer.y,
                            enemySprite.x, enemySprite.y
                        );
                        if (newDist < 60 && !this.activeQuestionId && !this.cooldownEnemies.has(String(index))) {
                            this.triggerQuiz(enemy);
                        }
                    });
                }
            });

            this.enemyEntities[index] = enemySprite;

            enemy.onChange(() => {
                if (enemy.isAlive) {
                    // Calculate movement for animation
                    const prevX = enemySprite.getData('prevX') || enemySprite.x;
                    const isMoving = Math.abs(enemy.x - prevX) > 0.1 || Math.abs(enemy.y - enemySprite.y) > 0.1;

                    // Update position
                    enemySprite.x = enemy.x;
                    enemySprite.y = enemy.y;

                    // Update data
                    enemySprite.setData('prevX', enemy.x);

                    // Animation Logic
                    const type = enemy.type === 'goblin' ? 'goblin' : 'skeleton';
                    const currentAnim = enemySprite.anims.currentAnim?.key;

                    if (isMoving) {
                        const walkKey = type + '_walk';
                        if (currentAnim !== walkKey && this.anims.exists(walkKey)) {
                            enemySprite.play(walkKey, true);
                        }

                        // Flip based on movement direction
                        if (enemy.x < prevX) {
                            enemySprite.setFlipX(true);
                        } else if (enemy.x > prevX) {
                            enemySprite.setFlipX(false);
                        }
                    } else {
                        const idleKey = type + '_idle';
                        if (currentAnim !== idleKey && this.anims.exists(idleKey)) {
                            enemySprite.play(idleKey, true);
                        }
                    }

                    // --- Alert Animation ---
                    if (enemy.isFleeing && !enemySprite.getData('wasFleeing')) {
                        // Enemy just started fleeing - play alert
                        const alert = this.add.image(enemy.x, enemy.y - 40, 'expression_alerted');
                        alert.setDepth(100);
                        alert.setScale(1.5); // Increased scale

                        this.tweens.add({
                            targets: alert,
                            y: enemy.y - 70, // Move up
                            alpha: 0,        // Fade out
                            duration: 1000,
                            ease: 'Power1',
                            onComplete: () => {
                                alert.destroy();
                            }
                        });
                    }
                    enemySprite.setData('wasFleeing', enemy.isFleeing);

                    // --- Trail Dots Rendering ---
                    // Clear existing trail
                    const existingTrail = enemySprite.getData('trail') as Phaser.GameObjects.Group | null;
                    if (existingTrail) {
                        existingTrail.clear(true, true);
                    }

                    // Draw trail if enemy has a target waypoint
                    if (enemy.targetX > 0 && enemy.targetY > 0) {
                        const trail = existingTrail || this.add.group();
                        const startX = enemy.x;
                        const startY = enemy.y;
                        const endX = enemy.targetX;
                        const endY = enemy.targetY;

                        // Calculate distance and number of dots
                        const dist = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
                        const dotSpacing = 30; // px between dots
                        const numDots = Math.floor(dist / dotSpacing);

                        for (let i = 1; i <= numDots; i++) {
                            const t = i / (numDots + 1);
                            const dotX = startX + (endX - startX) * t;
                            const dotY = startY + (endY - startY) * t;

                            const dot = this.add.image(dotX, dotY, 'select_dots');
                            dot.setScale(1.2); // Increased visibility
                            dot.setAlpha(1);
                            dot.setDepth(40);
                            trail.add(dot);
                        }

                        enemySprite.setData('trail', trail);
                    }
                } else {
                    // Handle death
                    // Clear trail on death
                    const existingTrail = enemySprite.getData('trail') as Phaser.GameObjects.Group | null;
                    if (existingTrail) {
                        existingTrail.clear(true, true);
                    }

                    // If we want to play death anim, ensure we don't snap back to idle
                    if (enemySprite.anims.currentAnim?.key.includes('death')) return;

                    const deathAnim = enemy.type === 'goblin' ? 'goblin_death' : 'skeleton_death';
                    if (this.anims.exists(deathAnim)) {
                        enemySprite.play(deathAnim);
                        enemySprite.once('animationcomplete', () => {
                            enemySprite.destroy();
                            delete this.enemyEntities[index];
                        });
                    } else {
                        enemySprite.destroy();
                        delete this.enemyEntities[index];
                    }
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
            console.log('Game ended! Showing personal result...', data.rankings);
            this.registry.set('leaderboardData', data.rankings);
            // Route via WaitingResultsScene for consistent UI experience
            this.registry.set('room', this.room); // Ensure room is set
            this.scene.start('WaitingResultsScene');
        });

        // --- Player Indicator (Floating Arrow) ---
        this.createPlayerIndicator();

        // --- Click To Move System ---
        this.clickToMove = new ClickToMoveSystem(this);
    }

    createPlayerIndicator() {
        if (this.currentPlayer) {
            // Update camera to follow player
            this.cameras.main.startFollow(this.currentPlayer);

            // Add collision/overlap with enemies for manual triggering
            this.physics.add.overlap(
                this.currentPlayer,
                Object.values(this.enemyEntities).filter((e: any) => e !== undefined) as Phaser.GameObjects.Sprite[],
                (player, enemySprite: any) => {
                    // Find the enemy data object
                    // We need to find which enemy index this sprite corresponds to
                    let enemyId: string | null = null;
                    Object.entries(this.enemyEntities).forEach(([id, sprite]) => {
                        if (sprite === enemySprite) enemyId = id;
                    });

                    if (enemyId && !this.cooldownEnemies.has(enemyId) && !this.activeQuestionId) {
                        // Get the enemy state data from the map? 
                        // Actually we need the room state enemy data
                        const enemyState = this.room.state.enemies.get(enemyId);
                        if (enemyState) {
                            this.triggerQuiz(enemyState);
                            // Stop movement to prevent sliding through
                            (this.currentPlayer.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
                            if (this.clickToMove) this.clickToMove.cancelMovement();
                        }
                    }
                }
            );
        }

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

    triggerQuiz(enemy: any, enemyIndex?: string): boolean {
        // Find question data from Server State
        // enemy.questionId is the index in state.questions
        const qIndex = enemy.questionId;
        let currentQ = this.room.state.questions[qIndex];

        // Fallback if question is missing (Prevent UI from being silent)
        if (!currentQ) {
            console.warn(`[GameScene] No question found for index ${qIndex}. Using Error Fallback.`);
            currentQ = {
                id: 9999,
                text: "Error: Question Data Missing",
                imageUrl: "",
                answerType: "text",
                options: ["Report Bug", "Refresh", "Ignore", "OK"],
                correctAnswer: 3
            } as any;
        }

        // Map Server Question Schema to QuizPopup format
        // Convert Colyseus ArraySchema to JS Array safely
        const optionsArray: string[] = [];
        if (currentQ.options) {
            currentQ.options.forEach((opt: string) => optionsArray.push(opt));
        }

        const questionData = {
            id: currentQ.id,
            pertanyaan: currentQ.text,
            image: currentQ.imageUrl || null,
            answerType: currentQ.answerType || 'text',
            jawaban_a: optionsArray[0] || "",
            jawaban_b: optionsArray[1] || "",
            jawaban_c: optionsArray[2] || "",
            jawaban_d: optionsArray[3] || ""
        };

        console.log(`Triggering quiz for question Index: ${qIndex}`, questionData);
        this.activeQuestionId = qIndex;

        // Find enemy ID/Key
        let foundKey: string | null = enemyIndex || null;

        if (!foundKey) {
            this.room.state.enemies.forEach((val: any, idx: number) => {
                if (val === enemy) {
                    foundKey = idx.toString();
                }
            });
        }

        if (!foundKey) {
            console.warn("[GameScene] Could not find enemy key in state!");
            return false;
        }

        this.activeEnemyId = foundKey;
        this.isChestPopupVisible = false;
        this.activeChestIndex = null;

        if (this.quizPopup) {
            this.quizPopup.show(questionData, (enemy.type || 'SKELETON').toUpperCase());

            // Notify Server to Halt Enemy
            if (this.activeEnemyId !== null) {
                // If it's a fallback question, don't engage on server to avoid crashing server logic?
                // Actually server is fine, just doesn't know the question ID if invalid.
                // But engaging is for movement.
                this.room.send("engageEnemy", { enemyIndex: Number(this.activeEnemyId) });

                // Start Combat Camera
                const enemySprite = this.enemyEntities[this.activeEnemyId];
                if (enemySprite) {
                    this.startCombatCamera(enemySprite.x, enemySprite.y);
                } else {
                    console.warn(`[GameScene] No sprite found for enemy ${this.activeEnemyId}`);
                }
            }
            return true;
        }
        return false;
    }

    handleAnswer(answerIndex: number, btnElement?: HTMLElement) {
        console.log(`handleAnswer called with index: ${answerIndex}, activeQuestionId: ${this.activeQuestionId}`);

        const isFromChest = this.isChestPopupVisible;

        // Mark enemy as locally processed to prevent immediate re-trigger
        if (this.activeEnemyId) {
            this.cooldownEnemies.add(this.activeEnemyId);
        }

        // Retrieve Question from State
        if (this.activeQuestionId === null) return;

        const currentQ = this.room.state.questions[this.activeQuestionId];

        if (currentQ) {
            // Check Answer (Server standardized correctAnswer as index 0-3)
            const isCorrect = (answerIndex === currentQ.correctAnswer);

            console.log(`Checking answer. CorrectIdx: ${currentQ.correctAnswer}, UserIdx: ${answerIndex}, isCorrect: ${isCorrect}`);

            // Show Feedback Popup via DOM
            if (btnElement && this.quizPopup) {
                this.quizPopup.showFeedback(isCorrect, btnElement);
            }

            if (isCorrect) {
                console.log("Sending correctAnswer to server");
                if (isFromChest) {
                    this.room.send("addScoreFromChest", { amount: 10 }); // Half points
                } else {
                    this.room.send("correctAnswer", {
                        questionId: this.activeQuestionId,
                        answerId: answerIndex, // Send Answer ID (Index 0-3)
                        enemyIndex: Number(this.activeEnemyId)
                    });
                    this.room.send("addScore", { amount: 20 }); // Full points
                }
            } else {
                console.log("Sending wrongAnswer to server");
                // Wrong answer logic is same for both (no points, opportunity lost)
                if (!isFromChest) {
                    this.room.send("wrongAnswer", {
                        questionId: this.activeQuestionId,
                        answerId: answerIndex // Send Answer ID
                    });
                    this.room.send("killEnemy", { enemyIndex: Number(this.activeEnemyId) });
                }
            }
        } else {
            console.error(`Question Data not found for ID: ${this.activeQuestionId}`);
            if (this.quizPopup) this.quizPopup.hide();
        }

        this.activeQuestionId = null;
        this.activeEnemyId = null;
        this.isChestPopupVisible = false;
        this.activeChestIndex = null;

        // Reset Camera delayed to match feedback animation
        this.time.delayedCall(1200, () => {
            this.resetCamera();
        });
    }



    handleChestInteraction(chestIndex: number) {
        const chest = this.room.state.chests[chestIndex];
        const myPlayer = this.room.state.players.get(this.room.sessionId);

        if (!chest || !myPlayer) return;

        // Check distance
        const chestContainer = this.chestContainers[chestIndex];
        const dist = Phaser.Math.Distance.Between(
            this.currentPlayer.x, this.currentPlayer.y,
            chestContainer.x, chestContainer.y
        );

        if (dist > 50) return; // Too far

        if (myPlayer.hasUsedChest) {
            console.log("You have already used a chest!");
            return;
        }

        if (chest.isCollected) {
            console.log("Chest is empty!");
            return;
        }

        if (!myPlayer.hasWrongAnswer) {
            console.log("Chest is locked! You need to answer a question wrong first.");
            return;
        }

        // Valid! Send to server
        this.room.send('collectChest', { chestIndex });
        this.activeChestIndex = chestIndex;
    }

    showRetryQuestionPopup(questionId: number) {
        // questionId is index from lastWrongQuestionId
        const currentQ = this.room.state.questions[questionId];

        if (currentQ) {
            const qData = {
                id: currentQ.id,
                pertanyaan: currentQ.text,
                image: currentQ.imageUrl || null,
                answerType: currentQ.answerType || 'text',
                jawaban_a: currentQ.options[0],
                jawaban_b: currentQ.options[1],
                jawaban_c: currentQ.options[2],
                jawaban_d: currentQ.options[3]
            };

            this.activeQuestionId = questionId; // Set active ID for handleAnswer
            this.isChestPopupVisible = true;
            this.quizPopup.show(qData, 'RETRY CHEST');

            // Optional: Zoom to chest?
            if (this.activeChestIndex !== null) {
                const chest = this.chestContainers[this.activeChestIndex];
                if (chest) {
                    this.startCombatCamera(chest.x, chest.y);
                }
            }
        }
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

        // BLOCK INPUT IF COUNTDOWN RUNNING
        if (!this.isGameReady) return;

        // Block movement if quiz is open
        if (this.quizPopup.isVisible()) {
            return;
        }

        // --- Interaction Check ---
        let hitEnemy = false;

        // --- Chest Interaction Check (TOUCH) ---
        // Iterate over chest containers to check distance
        Object.keys(this.chestContainers).forEach(key => {
            const index = Number(key);
            const chestContainer = this.chestContainers[index];
            if (chestContainer && chestContainer.visible) {
                const dist = Phaser.Math.Distance.Between(this.currentPlayer.x, this.currentPlayer.y, chestContainer.x, chestContainer.y);
                // 40px radius for touch interaction
                if (dist < 40) {
                    this.handleChestInteraction(index);
                }
            }
        });

        // --- Enemy Interaction Check ---
        Object.keys(this.enemyEntities).forEach(key => {
            const enemySprite = this.enemyEntities[key];
            if (enemySprite && enemySprite.active && enemySprite.visible) {
                const dist = Phaser.Math.Distance.Between(this.currentPlayer.x, this.currentPlayer.y, enemySprite.x, enemySprite.y);
                if (dist < 50) {
                    const enemyState = this.room.state.enemies[key as any];
                    if (enemyState && enemyState.isAlive && !this.cooldownEnemies.has(key)) {
                        // Use centralized trigger function, passing key directly
                        const triggered = this.triggerQuiz(enemyState, key);

                        if (triggered) {
                            hitEnemy = true;
                            // Cancel tracking when quiz triggers
                            if (this.clickToMove) {
                                this.clickToMove.cancelMovement();
                            }
                        } else {
                            // If failed (e.g. no questions), add short cooldown to prevent blocking movement forever
                            this.cooldownEnemies.add(key);
                            this.time.delayedCall(2000, () => {
                                this.cooldownEnemies.delete(key);
                            });
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
        const speed = 130; // Reduced from 200
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
            const b = this.currentPlayer.getData('baseSprite');
            const h = this.currentPlayer.getData('hairSprite');
            if (b) b.setFlipX(true);
            if (h) h.setFlipX(true);
            isMoving = true;
        } else if (this.cursors.right.isDown || this.input.keyboard?.addKey('D').isDown || nav.right) {
            inputPayload.right = true;
            const b = this.currentPlayer.getData('baseSprite');
            const h = this.currentPlayer.getData('hairSprite');
            if (b) b.setFlipX(false);
            if (h) h.setFlipX(false);
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

            // Animate Children (Base + Hair) - NOT Container
            const base = this.currentPlayer.getData('baseSprite') as Phaser.GameObjects.Sprite;
            const hair = this.currentPlayer.getData('hairSprite') as Phaser.GameObjects.Sprite;

            if (base) {
                base.play('walk', true);
                if (velocity.x !== 0) base.setFlipX(velocity.x < 0);
            }
            if (hair && hair.visible) {
                // Infer key from current idle/walk or data
                const currentKey = hair.anims.currentAnim?.key || '';
                const baseKey = currentKey.split('_')[0];
                if (baseKey && baseKey !== 'walk' && baseKey !== 'idle') {
                    hair.play(baseKey + '_walk', true);
                }
                if (velocity.x !== 0) hair.setFlipX(velocity.x < 0);
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
            // Idle Logic
            const base = this.currentPlayer.getData('baseSprite') as Phaser.GameObjects.Sprite;
            const hair = this.currentPlayer.getData('hairSprite') as Phaser.GameObjects.Sprite;

            if (base) base.play('idle', true);
            if (hair && hair.visible) {
                const currentKey = hair.anims.currentAnim?.key || '';
                const baseKey = currentKey.split('_')[0];
                if (baseKey) hair.play(baseKey + '_idle', true);
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
            // Reuse centralized function
            this.triggerQuiz(enemyState);
        }
    }
}
