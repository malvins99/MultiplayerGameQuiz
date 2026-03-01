import Phaser from 'phaser';
import { Room } from 'colyseus.js';
import { QuizPopup } from '../ui/QuizPopup';
import { UIScene } from './UIScene'; // Import UI Scene for types
import { TransitionManager } from '../utils/TransitionManager';

import { HTMLControlAdapter } from '../ui/HTMLControlAdapter';
import { ClickToMoveSystem } from '../systems/ClickToMoveSystem';

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
        // Store room in registry for reliable cleanup by other scenes
        this.registry.set('room', this.room);
        console.log(`[GameScene][Room:${this.room.id}] Initialized. SessionId: ${this.room.sessionId}`);

        // --- BACKGROUND LOADING SYNC ---
        // Ensure screen is closed and showing countdown EVEN DURING PRELOAD
        if (this.room.state.countdown > 0) {
            TransitionManager.ensureClosed();
            TransitionManager.setCountdownText(this.room.state.countdown.toString());
        }

        // Listen for Countdown updates during preload
        this.room.state.listen("countdown", (val: number, previousVal: number) => {
            if (val > 0) {
                TransitionManager.ensureClosed();
                TransitionManager.setCountdownText(val.toString());
            } else if (val === 0 && (previousVal || 0) > 0) {
                TransitionManager.setCountdownText("GO!");
            }
        });

        // Listen for Game Start state during preload
        this.room.state.listen("isGameStarted", (isStarted: boolean) => {
            if (isStarted && this.isGameReady) { // isGameReady set in create()
                this.revealGame();
            }
        });
    }

    private revealGame() {
        console.log("Game Ready & Started! Opening Iris.");
        TransitionManager.setCountdownText("");
        TransitionManager.open();
    }

    preload() {
        // Determine map based on difficulty from room state
        const difficulty = this.room.state.difficulty;
        let mapKey = 'map_easy';
        let mapFile = 'map_newest_easy_nomor1.tmj';

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

        // --- Logo Integration ---
        const logoStyleId = 'game-logo-styles';
        if (!document.getElementById(logoStyleId)) {
            const style = document.createElement('style');
            style.id = logoStyleId;
            style.innerHTML = `
                .game-logo-container {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                    z-index: 100;
                }
            `;
            document.head.appendChild(style);
        }

        const logoContainer = document.createElement('div');
        logoContainer.className = 'game-logo-container';
        logoContainer.innerHTML = `
            <!-- LOGO TOP LEFT -->
            <img src="/logo/Zigma-logo.webp" style="top: -60px; left: -65px;" class="absolute w-96 z-20 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
            
            <!-- LOGO TOP RIGHT -->
            <img src="/logo/gameforsmart.webp" class="absolute top-2 right-2 w-64 z-20 object-contain drop-shadow-[0_0_15px_rgba(0,255,136,0.3)]" />
        `;
        document.body.appendChild(logoContainer);
        this.events.once('shutdown', () => logoContainer.remove());

        // --- UI Scene Launch ---
        this.scene.launch('UIScene');
        this.scene.bringToTop('UIScene');

        // --- Final Reveal Check ---
        this.isGameReady = true; // Assets finished loading

        // If server already started the game while we were preloading, open now
        if (this.room.state.isGameStarted) {
            this.revealGame();
        }

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
                    const existingLayer = this.map.getLayer(layerData.name);
                    if (existingLayer && existingLayer.tilemapLayer) return;

                    const layer = this.map.createLayer(layerData.name, tilesets, 0, 0);
                    if (layer) {
                        layer.setX(0);
                        layer.setY(0);
                    }
                } catch (e) {
                    console.warn(`Skipping layer render: ${layerData.name}`, e);
                }
            });
        }

        // Force NEAREST filtering on the tileset textures
        if (this.textures.exists('tiles')) {
            this.textures.get('tiles').setFilter(Phaser.Textures.FilterMode.NEAREST);
        }
        if (this.textures.exists('forest_tiles')) {
            this.textures.get('forest_tiles').setFilter(Phaser.Textures.FilterMode.NEAREST);
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
            frames: this.anims.generateFrameNumbers('goblin_idle', { start: 0, end: 7 }), // Corrected to 8 frames
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
            frames: this.anims.generateFrameNumbers('goblin_death', { start: 0, end: 8 }), // Corrected to 9 frames
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
                this.cameras.main.startFollow(this.currentPlayer, true, 0.2, 0.2); // Smooth follow (fixes bleeding)
                this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
                this.cameras.main.setZoom(2);
                this.cameras.main.roundPixels = true; // Reinforce rounding

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
                        const dx = player.x - (entity.getData('targetX') || entity.x);

                        // Update target for interpolation
                        entity.setData({ targetX: player.x, targetY: player.y });

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
            enemySprite.setScale(0); // Start at 0 for spawn animation

            // --- Spawn Animation ---
            this.tweens.add({
                targets: enemySprite,
                scale: 1,
                duration: 500,
                ease: 'Back.easeOut'
            });

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

                    // Update target position for interpolation
                    enemySprite.setData('targetX', enemy.x);
                    enemySprite.setData('targetY', enemy.y);

                    // Update previous data for logic
                    enemySprite.setData('prevX', enemy.x);

                    // Animation Logic
                    const type = enemy.type === 'goblin' ? 'goblin' : 'skeleton';

                    // Robust safety check for animations during scene transitions
                    if (!enemySprite.anims) return;

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
                } else {
                    // Handle death
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
            console.log('Player finished! Handling transition...');

            // Check for other players
            let activePlayerCount = 0;
            this.room.state.players.forEach((p: any) => {
                if (!p.isHost) activePlayerCount++;
            });

            if (activePlayerCount > 1) {
                // Multiplayer: Close Iris and show waiting text with spinner
                TransitionManager.close(() => {
                    TransitionManager.showWaiting("MENUNGGU PEMAIN LAIN...");
                });
            } else {
                // Solo: Just close Iris
                TransitionManager.close(() => {
                    // Stays black until gameEnded arrives
                });
            }
        });

        // Game ended (all players finished or timer expired)
        this.room.onMessage('gameEnded', (data: { rankings: any[] }) => {
            console.log('Game ended! Showing results...', data.rankings);

            // Determine if I am host
            const isHost = this.room.sessionId === this.room.state.hostId;
            this.registry.set('isHost', isHost);
            this.registry.set('leaderboardData', data.rankings);

            // Host goes to Leaderboard, Player goes to Result
            if (isHost) {
                this.scene.start('LeaderboardScene');
            } else {
                this.scene.start('ResultScene');
            }
        });

        // --- Player Indicator (Floating Arrow) ---
        this.createPlayerIndicator();

        // --- Click To Move System ---
        this.clickToMove = new ClickToMoveSystem(this);

        // --- Disconnection Handling ---
        this.room.onLeave((code) => {
            console.warn(`[GameScene] Disconnected from room (code: ${code})`);
            // Stop logic if needed or show alert
            this.isGameReady = false;

            // Optional: return to lobby or show popup
            // TransitionManager.sceneTo(this, 'LobbyScene');
        });
    }

    createPlayerIndicator() {
        if (this.currentPlayer) {
            // Update camera to follow player
            this.cameras.main.startFollow(this.currentPlayer, true, 0.2, 0.2);

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
            this.currentPlayer.y - 8
        );
        this.indicatorContainer.setDepth(200);

        // Add Indicator Image inside
        const indicator = this.add.image(0, 0, 'indicator');
        indicator.setOrigin(0.5, 1);
        this.indicatorContainer.add(indicator);

        // Floating Animation
        this.tweens.add({
            targets: indicator,
            y: -2,
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }


    createNameTag(sessionId: string, name: string, x: number, y: number) {
        // Create container for name tag (Above pointer)
        const container = this.add.container(x, y - 21);
        container.setDepth(150);
        container.setScale(0.9); // Shrink slightly (but not too much)

        // Create pixel text first to measure width
        const nameText = this.add.text(0, 0, name.toUpperCase(), {
            fontFamily: '"Retro Gaming", monospace',
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

    triggerQuiz(enemy: any) {
        // Find question data from Colyseus Room State (Questions are stored as an ArraySchema)
        const allQuestions = this.room.state.questions;
        const currentQ = allQuestions[enemy.questionId];

        if (currentQ) {
            // Map Colyseus state data structure to expected format for the UI
            const questionData = {
                id: currentQ.id,
                question: currentQ.text,
                image: currentQ.imageUrl,
                options: Array.from(currentQ.options), // Convert ArraySchema to regular array
                correctAnswer: currentQ.correctAnswer
            };

            console.log(`Triggering quiz for question ID: ${questionData.id}`);
            this.activeQuestionId = questionData.id;

            // Find enemy index/key from state
            let foundKey = null;
            this.room.state.enemies.forEach((val: any, key: string) => {
                if (val === enemy) foundKey = key;
            });
            this.activeEnemyId = foundKey;

            this.isChestPopupVisible = false;
            this.activeChestIndex = null;

            if (this.quizPopup) {
                this.quizPopup.show(questionData, (enemy.type || 'SKELETON').toUpperCase());

                // Notify Server to Halt Enemy
                if (this.activeEnemyId !== null) {
                    this.room.send("engageEnemy", { enemyIndex: this.activeEnemyId });

                    // Start Combat Camera
                    const enemySprite = this.enemyEntities[this.activeEnemyId];
                    if (enemySprite) {
                        this.startCombatCamera(enemySprite.x, enemySprite.y);
                    }
                }
            }
        }
    }

    handleAnswer(answerIndex: number, btnElement?: HTMLElement) {
        console.log(`handleAnswer called with index: ${answerIndex}, activeQuestionId: ${this.activeQuestionId}`);

        const isFromChest = this.isChestPopupVisible;

        // Mark enemy as locally processed to prevent immediate re-trigger
        if (this.activeEnemyId) {
            this.cooldownEnemies.add(this.activeEnemyId);
        }

        // Use Room State Questions
        const allQuestions = this.room.state.questions;
        const currentQ = allQuestions[this.activeQuestionId as any];

        if (currentQ) {
            // Determine correct index from state
            const correctIdx = currentQ.correctAnswer;
            const isCorrect = correctIdx === answerIndex;

            console.log(`Checking answer. CorrectIdx: ${correctIdx}, UserIdx: ${answerIndex}, isCorrect: ${isCorrect}`);

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
                        enemyIndex: this.activeEnemyId
                    });
                    this.room.send("addScore", { amount: 20 }); // Full points
                }
            } else {
                console.log("Sending wrongAnswer to server");
                // Wrong answer logic is same for both (no points, opportunity lost)
                if (!isFromChest) {
                    this.room.send("wrongAnswer", {
                        questionId: this.activeQuestionId,
                        enemyIndex: this.activeEnemyId
                    });
                    this.room.send("killEnemy", { enemyIndex: this.activeEnemyId });
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
        const allQuestions = this.room.state.questions;
        const currentQ = allQuestions[questionId];

        if (currentQ) {
            const qData = {
                id: currentQ.id,
                question: currentQ.text,
                image: currentQ.imageUrl,
                options: Array.from(currentQ.options),
                correctAnswer: currentQ.correctAnswer
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
            this.cameras.main.startFollow(this.currentPlayer, true, 0.2, 0.2);
        }
    }

    update(time: number, delta: number) {
        if (!this.currentPlayer) return;

        // BLOCK INPUT IF COUNTDOWN RUNNING
        if (!this.isGameReady) return;

        // --- Interaction Check ---
        let hitEnemy = false;

        // Block interaction if quiz is open
        const isQuizOpen = this.quizPopup.isVisible();

        // --- Chest Interaction Check (TOUCH) ---
        Object.keys(this.chestContainers).forEach(key => {
            const index = Number(key);
            const chestContainer = this.chestContainers[index];
            if (chestContainer && chestContainer.visible) {
                const dist = Phaser.Math.Distance.Between(this.currentPlayer.x, this.currentPlayer.y, chestContainer.x, chestContainer.y);
                if (dist < 40 && !isQuizOpen) {
                    this.handleChestInteraction(index);
                }
            }
        });

        // --- Enemy Interaction Check ---
        Object.keys(this.enemyEntities).forEach(key => {
            const enemySprite = this.enemyEntities[key];
            if (enemySprite && enemySprite.active && enemySprite.visible) {
                const dist = Phaser.Math.Distance.Between(this.currentPlayer.x, this.currentPlayer.y, enemySprite.x, enemySprite.y);
                if (dist < 15 && !isQuizOpen) {
                    const enemyState = this.room.state.enemies[key as any];
                    if (enemyState && enemyState.isAlive && !this.cooldownEnemies.has(key)) {
                        this.activeEnemyId = key;
                        this.activeQuestionId = enemyState.questionId;

                        const allQuestions = this.room.state.questions;
                        const currentQ = allQuestions[enemyState.questionId];

                        if (currentQ) {
                            const qData = {
                                id: currentQ.id,
                                question: currentQ.text,
                                image: currentQ.imageUrl,
                                options: Array.from(currentQ.options),
                                correctAnswer: currentQ.correctAnswer
                            };
                            const name = (enemyState.type || 'ENEMY').toUpperCase();
                            this.quizPopup.show(qData, name);
                            this.startCombatCamera(enemySprite.x, enemySprite.y);
                            hitEnemy = true;
                            if (this.clickToMove) this.clickToMove.cancelMovement();
                        }
                    }
                }
            }
        });

        if (hitEnemy) return;

        // --- Click To Move Logic ---
        if (!isQuizOpen) {
            this.clickToMove.update(delta);
        }

        if (this.clickToMove.isMovingByClick()) {
            // Sync valid click movement to server
            if (this.room && this.room.connection.isOpen) {
                this.room.send("movePlayer", { x: this.currentPlayer.x, y: this.currentPlayer.y });
            }

            // Sync indicators
            if (this.indicatorContainer) {
                this.indicatorContainer.setPosition(this.currentPlayer.x, this.currentPlayer.y - 8);
            }
            if (this.nameTagContainers[this.room.sessionId]) {
                this.nameTagContainers[this.room.sessionId].setPosition(this.currentPlayer.x, this.currentPlayer.y - 21);
            }
            return; // Skip WASD logic if moving by click
        }

        // If WASD key is pressed, CANCEL click movement
        if (!isQuizOpen) {
            const nav = this.controls.getNav();
            if (this.cursors.left.isDown || this.cursors.right.isDown || this.cursors.up.isDown || this.cursors.down.isDown ||
                this.input.keyboard?.addKey('W').isDown || this.input.keyboard?.addKey('A').isDown ||
                this.input.keyboard?.addKey('S').isDown || this.input.keyboard?.addKey('D').isDown ||
                nav.left || nav.right || nav.up || nav.down) {
                if (this.clickToMove) this.clickToMove.cancelMovement();
            }
        }

        // Simple movement logic
        // Simple movement logic
        const speed = 130;
        const velocity = { x: 0, y: 0 };
        const inputPayload = {
            left: false, right: false, up: false, down: false
        };

        if (!isQuizOpen) {
            const nav = this.controls.getNav();
            if (this.cursors.left.isDown || this.input.keyboard?.addKey('A').isDown || nav.left) inputPayload.left = true;
            else if (this.cursors.right.isDown || this.input.keyboard?.addKey('D').isDown || nav.right) inputPayload.right = true;

            if (this.cursors.up.isDown || this.input.keyboard?.addKey('W').isDown || nav.up) inputPayload.up = true;
            else if (this.cursors.down.isDown || this.input.keyboard?.addKey('S').isDown || nav.down) inputPayload.down = true;
        }

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

            const base = this.currentPlayer.getData('baseSprite') as Phaser.GameObjects.Sprite;
            const hair = this.currentPlayer.getData('hairSprite') as Phaser.GameObjects.Sprite;

            if (base) {
                base.play('walk', true);
                if (velocity.x !== 0) base.setFlipX(velocity.x < 0);
            }
            if (hair && hair.visible) {
                const currentKey = hair.anims.currentAnim?.key || '';
                const baseKey = currentKey.split('_')[0];
                if (baseKey && baseKey !== 'walk' && baseKey !== 'idle') {
                    hair.play(baseKey + '_walk', true);
                }
                if (velocity.x !== 0) hair.setFlipX(velocity.x < 0);
            }

            if (this.room && this.room.connection.isOpen) {
                this.room.send("movePlayer", { x: this.currentPlayer.x, y: this.currentPlayer.y });
            }

            if (this.indicatorContainer) this.indicatorContainer.setPosition(this.currentPlayer.x, this.currentPlayer.y - 8);
            if (this.nameTagContainers[this.room.sessionId]) {
                this.nameTagContainers[this.room.sessionId].setPosition(this.currentPlayer.x, this.currentPlayer.y - 21);
            }
        } else {
            const base = this.currentPlayer.getData('baseSprite') as Phaser.GameObjects.Sprite;
            const hair = this.currentPlayer.getData('hairSprite') as Phaser.GameObjects.Sprite;
            if (base) base.play('idle', true);
            if (hair && hair.visible) {
                const currentKey = hair.anims.currentAnim?.key || '';
                const baseKey = currentKey.split('_')[0];
                if (currentKey && !currentKey.includes('idle')) hair.play(baseKey + '_idle', true);
            }
        }

        // --- Enemy Interpolation & Other Player Sync ---
        Object.keys(this.enemyEntities).forEach(id => {
            const enemy = this.enemyEntities[id];
            const tx = enemy.getData('targetX');
            const ty = enemy.getData('targetY');

            // Only move if enemy is still active/alive and has a target
            const enemyState = this.room.state.enemies[id as any];
            const isAlive = enemyState ? enemyState.isAlive : true;

            if (isAlive && tx !== undefined && ty !== undefined) {
                enemy.x += (tx - enemy.x) * 0.1;
                enemy.y += (ty - enemy.y) * 0.1;
            } else if (!isAlive) {
                // If not alive, clear velocity/interpolation to prevent sliding
                enemy.setData('targetX', enemy.x);
                enemy.setData('targetY', enemy.y);
            }
        });

        Object.keys(this.playerEntities).forEach(sid => {
            if (sid !== this.room.sessionId) {
                const entity = this.playerEntities[sid];
                if (entity) {
                    const tx = entity.getData('targetX');
                    const ty = entity.getData('targetY');
                    if (tx !== undefined && ty !== undefined) {
                        entity.x += (tx - entity.x) * 0.1;
                        entity.y += (ty - entity.y) * 0.1;
                    }
                    if (this.nameTagContainers[sid]) {
                        this.nameTagContainers[sid].setPosition(entity.x, entity.y - 21);
                    }
                }
            }
        });
    }

    handleEnemyInteraction(enemyId: string) {
        if (this.clickToMove) this.clickToMove.cancelMovement();
        const enemyState = this.room.state.enemies[enemyId];
        if (enemyState && enemyState.isAlive && !this.cooldownEnemies.has(enemyId)) {
            const enemySprite = this.enemyEntities[enemyId];
            this.activeEnemyId = enemyId;
            this.activeQuestionId = enemyState.questionId;

            const allQuestions = this.room.state.questions;
            const currentQ = allQuestions[enemyState.questionId];

            if (currentQ) {
                const qData = {
                    id: currentQ.id,
                    question: currentQ.text,
                    image: currentQ.imageUrl,
                    options: Array.from(currentQ.options),
                    correctAnswer: currentQ.correctAnswer
                };
                const name = (enemyState.type || 'ENEMY').toUpperCase();
                this.quizPopup.show(qData, name);
                if (enemySprite) this.startCombatCamera(enemySprite.x, enemySprite.y);
            }
        }
    }
}
