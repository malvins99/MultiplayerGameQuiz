import Phaser from 'phaser';
import { Room } from 'colyseus.js';
import { QuizPopup } from '../../../ui/shared/QuizPopup';
import { UIScene } from '../ui/page';
import { TransitionManager } from '../../../utils/TransitionManager';

import { HTMLControlAdapter } from '../../../ui/shared/HTMLControlAdapter';
import { OrientationManager } from '../../../utils/OrientationManager';
// Removed legacy QUESTIONS import

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
    isAttacking: boolean = false;
    barrierAreas: any[] = []; // Menampung rectangle maupun data polygon asli

    isGameReady: boolean = false; // Block input until countdown finishes
    private lastNetworkSendTime: number = 0;
    private networkSendRate: number = 100; // ms (10 times a second)
    private wasMovingKeyboard: boolean = false;

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
        const difficulty = this.room.state.difficulty;
        let mapKey = 'map_easy';
        let mapFile = 'map_newest_easy_nomor1.tmj';

        if (difficulty === 'sedang') {
            mapKey = 'map_medium';
            mapFile = 'map_medium.tmj';
        } else if (difficulty === 'sulit') {
            mapKey = 'map_hard';
            mapFile = 'map_hard.tmj';
        }

        const cb = `?v=${Date.now()}`;
        console.log(`[GameScene][Preload] Loading Map. Difficulty: ${difficulty}, MapKey: ${mapKey}, MapFile: ${mapFile}`);
        this.load.tilemapTiledJSON(mapKey, `/assets/maps/${mapFile}${cb}`);
        
        // --- Organized Tileset & Elements Paths ---
        this.load.image('tiles', `/assets/tileset/spr_tileset_sunnysideworld_16px.png${cb}`);
        this.load.image('forest_tiles', `/assets/tileset/spr_tileset_sunnysideworld_forest_32px.png${cb}`);
        this.load.image('coracle_tiles', `/assets/elements/spr_deco_coracle_strip4.png${cb}`);
        this.load.image('windmill_tiles', `/assets/elements/spr_deco_windmill_withshadow_strip9.png${cb}`);
        
        // --- Human Character Assets (Organized) ---
        const humanPath = '/assets/characters/Human';
        this.load.spritesheet('character', `${humanPath}/WALKING/base_walk_strip8.png`, { frameWidth: 96, frameHeight: 64 });
        this.load.spritesheet('base_idle', `${humanPath}/IDLE/base_idle_strip9.png`, { frameWidth: 96, frameHeight: 64 });
        this.load.spritesheet('base_attack', `${humanPath}/ATTACK/base_attack_strip10.png`, { frameWidth: 96, frameHeight: 64 });
        
        this.load.spritesheet('tools_walk', `${humanPath}/WALKING/tools_walk_strip8.png`, { frameWidth: 96, frameHeight: 64 });
        this.load.spritesheet('tools_idle', `${humanPath}/IDLE/tools_idle_strip9.png`, { frameWidth: 96, frameHeight: 64 });
        this.load.spritesheet('tools_attack', `${humanPath}/ATTACK/tools_attack_strip10.png`, { frameWidth: 96, frameHeight: 64 });
        
        const hairKeys = ['bowlhair', 'curlyhair', 'longhair', 'mophair', 'shorthair', 'spikeyhair'];
        hairKeys.forEach(key => {
            this.load.spritesheet(`${key}_walk`, `${humanPath}/WALKING/${key}_walk_strip8.png`, { frameWidth: 96, frameHeight: 64 });
            this.load.spritesheet(`${key}_idle`, `${humanPath}/IDLE/${key}_idle_strip9.png`, { frameWidth: 96, frameHeight: 64 });
            this.load.spritesheet(`${key}_attack`, `${humanPath}/ATTACK/${key}_attack_strip10.png`, { frameWidth: 96, frameHeight: 64 });
        });

        // Skeleton
        this.load.spritesheet('skeleton_idle', '/assets/characters/Skeleton/PNG/skeleton_idle_strip6.png', { frameWidth: 96, frameHeight: 64 });
        this.load.spritesheet('skeleton_walk', '/assets/characters/Skeleton/PNG/skeleton_walk_strip8.png', { frameWidth: 96, frameHeight: 64 });
        this.load.spritesheet('skeleton_death', '/assets/characters/Skeleton/PNG/skeleton_death_strip10.png', { frameWidth: 96, frameHeight: 64 });

        // Goblin
        this.load.spritesheet('goblin_idle', '/assets/characters/Goblin/PNG/spr_idle_strip9.png', { frameWidth: 96, frameHeight: 64 });
        this.load.spritesheet('goblin_walk', '/assets/characters/Goblin/PNG/spr_walk_strip8.png', { frameWidth: 96, frameHeight: 64 });
        this.load.spritesheet('goblin_death', '/assets/characters/Goblin/PNG/spr_death_strip13.png', { frameWidth: 96, frameHeight: 64 });

        // Load Chest Tileset as Spritesheet for frame access
        this.load.spritesheet('chest_tiles', '/assets/tileset/spr_tileset_sunnysideworld_16px.png', {
            frameWidth: 16,
            frameHeight: 16,
            margin: 0,
            spacing: 0
        });

        // Load Player Indicator

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
        this.load.image('expression_working', '/assets/elements/expression_working.png');
    }

    private async yieldThread() {
        return new Promise(resolve => setTimeout(resolve, 0));
    }

    async create() {
        // DEBUG: Check if textures are loaded
        console.log('[DEBUG] Textures loaded:');
        console.log('  skeleton_idle:', this.textures.exists('skeleton_idle'));
        console.log('  skeleton_walk:', this.textures.exists('skeleton_walk'));
        console.log('  goblin_idle:', this.textures.exists('goblin_idle'));
        console.log('  goblin_walk:', this.textures.exists('goblin_walk'));

        // --- UI Scene Launch ---
        this.scene.launch('UIScene', { room: this.room });
        this.scene.bringToTop('UIScene');

        // --- Final Reveal Check ---
        this.isGameReady = true; // Assets finished loading

        // If server already started the game while we were preloading, open now
        if (this.room.state.isGameStarted) {
            this.revealGame();
        }

        // --- Map Rendering ---
        const difficulty = this.room.state.difficulty;
        let mapKey = 'map_easy';
        if (difficulty === 'sedang') mapKey = 'map_medium';
        if (difficulty === 'sulit') mapKey = 'map_hard';

        this.map = this.make.tilemap({ key: mapKey });
        await this.yieldThread(); // Menerapkan Teknik Time-Slicing agar countdown background tetap mulus

        // Add both tilesets
        const tileset1 = this.map.addTilesetImage('spr_tileset_sunnysideworld_16px', 'tiles');
        const tileset2 = this.map.addTilesetImage('spr_tileset_sunnysideworld_forest_32px', 'forest_tiles');
        const tileset3 = this.map.addTilesetImage('spr_deco_coracle_strip4', 'coracle_tiles');
        const tileset4 = this.map.addTilesetImage('spr_deco_windmill_withshadow_strip9', 'windmill_tiles');

        const tilesets: Phaser.Tilemaps.Tileset[] = [];
        if (tileset1) tilesets.push(tileset1);
        if (tileset2) tilesets.push(tileset2);
        if (tileset3) tilesets.push(tileset3);
        if (tileset4) tilesets.push(tileset4);

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

        // --- Barrier Collision Setup ---
        this.parseBarriers();

        // Force NEAREST filtering on the tileset textures
        if (this.textures.exists('tiles')) {
            this.textures.get('tiles').setFilter(Phaser.Textures.FilterMode.NEAREST);
        }
        if (this.textures.exists('forest_tiles')) {
            this.textures.get('forest_tiles').setFilter(Phaser.Textures.FilterMode.NEAREST);
        }
        if (this.textures.exists('coracle_tiles')) {
            this.textures.get('coracle_tiles').setFilter(Phaser.Textures.FilterMode.NEAREST);
        }
        if (this.textures.exists('windmill_tiles')) {
            this.textures.get('windmill_tiles').setFilter(Phaser.Textures.FilterMode.NEAREST);
        }

        // --- Animations ---
        await this.yieldThread(); // Mencicil beban CPU

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
        
        // Attack Animations
        this.anims.create({
            key: 'base_attack',
            frames: this.anims.generateFrameNumbers('base_attack', { start: 0, end: 9 }),
            frameRate: 15,
            repeat: 0
        });

        // Tools Animations
        this.anims.create({
            key: 'tools_walk',
            frames: this.anims.generateFrameNumbers('tools_walk', { start: 0, end: 7 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'tools_idle',
            frames: this.anims.generateFrameNumbers('tools_idle', { start: 0, end: 8 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'tools_attack',
            frames: this.anims.generateFrameNumbers('tools_attack', { start: 0, end: 9 }),
            frameRate: 15,
            repeat: 0
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
            this.anims.create({
                key: `${key}_attack`,
                frames: this.anims.generateFrameNumbers(`${key}_attack`, { start: 0, end: 9 }),
                frameRate: 15,
                repeat: 0
            });
        });

        // Enemy Animations
        this.anims.create({
            key: 'skeleton_idle',
            frames: this.anims.generateFrameNumbers('skeleton_idle', { start: 0, end: 5 }),
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
            frames: this.anims.generateFrameNumbers('skeleton_death', { start: 0, end: 9 }),
            frameRate: 8,
            repeat: 0
        });

        // Goblin Animations
        this.anims.create({
            key: 'goblin_idle',
            frames: this.anims.generateFrameNumbers('goblin_idle', { start: 0, end: 7 }),
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
            frames: this.anims.generateFrameNumbers('goblin_death', { start: 0, end: 8 }),
            frameRate: 8,
            repeat: 0
        });

        // --- Inputs ---
        this.cursors = this.input.keyboard!.createCursorKeys();

        // --- Player Sync ---
        await this.yieldThread(); // Mencegah freeze saat banyak player sinkronisasi pertama kali

        this.room.state.players.onAdd((player: any, sessionId: string) => {
            const myPlayer = this.room.state.players.get(this.room.sessionId);
            if (!myPlayer || player.subRoomId !== myPlayer.subRoomId) return;

            const container = this.add.container(player.x, player.y);
            container.setDepth(10);

            const baseSprite = this.add.sprite(0, 0, 'character');
            baseSprite.setOrigin(0.5, 0.5);
            baseSprite.play('idle');

            const toolsSprite = this.add.sprite(0, 0, 'tools_idle');
            toolsSprite.setOrigin(0.5, 0.5);
            toolsSprite.play('tools_idle');

            const hairSprite = this.add.sprite(0, 0, 'bowlhair_idle');
            hairSprite.setOrigin(0.5, 0.5);
            hairSprite.setVisible(false);

            container.add([baseSprite, toolsSprite, hairSprite]);
            container.setData('hairSprite', hairSprite);
            container.setData('toolsSprite', toolsSprite);
            container.setData('baseSprite', baseSprite);

            // -- Visual Difference for Other Players --
            if (sessionId !== this.room.sessionId) {
                const otherAlpha = 0.6;
                const otherTint = 0x999999;
                
                baseSprite.setAlpha(otherAlpha);
                toolsSprite.setAlpha(otherAlpha);
                hairSprite.setAlpha(otherAlpha);
                
                baseSprite.setTint(otherTint);
                toolsSprite.setTint(otherTint);
                hairSprite.setTint(otherTint);
            }

            this.playerEntities[sessionId] = container;

            const updateHairVisuals = () => {
                if (this.isAttacking && sessionId === this.room.sessionId) {
                    console.log("[Attack-Fix] updateHairVisuals skipped because isAttacking is true");
                    return;
                }
                const hairId = player.hairId || 0;
                import('../../../data/characterData').then(({ getHairById }) => {
                    const hairData = getHairById(hairId);
                    if (hairData.id === 0) {
                        hairSprite.setVisible(false);
                    } else {
                        hairSprite.setVisible(true);
                        const currentAnim = baseSprite.anims.currentAnim?.key;
                        const isWalking = currentAnim === 'walk';
                        const newKey = isWalking ? hairData.walkKey : hairData.idleKey;

                        if (hairSprite.anims.currentAnim?.key !== newKey) {
                            hairSprite.play(newKey);
                        }
                        container.setData('hairPrefix', hairData.id > 0 ? hairData.idleKey.split('_')[0] : null);
                    }
                });
            };

            updateHairVisuals();
            this.createNameTag(sessionId, player.name || 'Player', container.x, container.y);

            if (sessionId === this.room.sessionId) {
                this.currentPlayer = container as any;
                
                // Initial camera setup
                this.cameras.main.startFollow(this.currentPlayer, true, 0.2, 0.2);
                this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
                this.cameras.main.setRoundPixels(true);
                
                // Initial resize call to set correct zoom and viewport
                this.handleResize(this.scale.gameSize);

                const uiScene = this.scene.get('UIScene') as UIScene;
                if (uiScene) uiScene.updateScore(player.score);
            }

            player.onChange(() => {
                if (player.subRoomId !== myPlayer.subRoomId) {
                    if (this.playerEntities[sessionId]) {
                        this.playerEntities[sessionId].destroy();
                        delete this.playerEntities[sessionId];
                    }
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
                        entity.setData({ targetX: player.x, targetY: player.y });

                        const bSprite = entity.getData('baseSprite') as Phaser.GameObjects.Sprite;
                        const hSprite = entity.getData('hairSprite') as Phaser.GameObjects.Sprite;
                        const tSprite = entity.getData('toolsSprite') as Phaser.GameObjects.Sprite;

                        // 1. Attack Animation Priority
                        if (player.isAttacking) {
                            if (bSprite.anims.currentAnim?.key !== 'base_attack') bSprite.play('base_attack', true);
                            if (tSprite && tSprite.anims.currentAnim?.key !== 'tools_attack') tSprite.play('tools_attack', true);
                            
                            const hairId = player.hairId || 0;
                            if (hairId > 0) {
                                import('../../../data/characterData').then(({ getHairById }) => {
                                    const h = getHairById(hairId);
                                    const hPrefix = h.idleKey.split('_')[0];
                                    const attackKey = `${hPrefix}_attack`;
                                    if (hSprite.anims.currentAnim?.key !== attackKey) {
                                        hSprite.play(attackKey, true);
                                    }
                                });
                            }
                            
                            // Handle Flip while attacking (if moving and attacking at same time)
                            if (Math.abs(dx) > 0.1) {
                                bSprite.setFlipX(dx < 0);
                                hSprite.setFlipX(dx < 0);
                                if (tSprite) tSprite.setFlipX(dx < 0);
                            }
                        }
                        // 2. Walk Animation
                        else if (dx !== 0 || Math.abs(dx) > 0.1) {
                            if (bSprite.anims.currentAnim?.key !== 'walk') bSprite.play('walk', true);
                            if (tSprite && tSprite.anims.currentAnim?.key !== 'tools_walk') tSprite.play('tools_walk', true);
                            
                            bSprite.setFlipX(dx < 0);
                            hSprite.setFlipX(dx < 0);
                            if (tSprite) tSprite.setFlipX(dx < 0);

                            const hairId = player.hairId || 0;
                            if (hairId > 0) {
                                import('../../../data/characterData').then(({ getHairById }) => {
                                    const h = getHairById(hairId);
                                    if (hSprite.anims.currentAnim?.key !== h.walkKey) {
                                        hSprite.play(h.walkKey, true);
                                    }
                                });
                            }
                        } else {
                            if (bSprite.anims.currentAnim?.key !== 'idle') bSprite.play('idle', true);
                            if (tSprite && tSprite.anims.currentAnim?.key !== 'tools_idle') tSprite.play('tools_idle', true);
                            
                            const hairId = player.hairId || 0;
                            if (hairId > 0) {
                                import('../../../data/characterData').then(({ getHairById }) => {
                                    const h = getHairById(hairId);
                                    if (hSprite.anims.currentAnim?.key !== h.idleKey) {
                                        hSprite.play(h.idleKey, true);
                                    }
                                });
                            }
                        }
                    }
                }

                updateHairVisuals();
                this.updateNameTagText(sessionId, player.name);

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

            if (this.nameTagContainers[sessionId]) {
                this.nameTagContainers[sessionId].destroy();
                delete this.nameTagContainers[sessionId];
            }
        });

        // --- Chest Sync ---
        this.room.state.chests.onAdd((chest: any, index: number) => {
            const container = this.add.container(chest.x, chest.y);
            container.setDepth(50);

            container.setSize(32, 32);
            this.physics.world.enable(container);
            (container.body as Phaser.Physics.Arcade.Body).setImmovable(true);

            const shadow = this.add.sprite(0, 5, 'chest_tiles', 2020);
            const body = this.add.sprite(0, 0, 'chest_tiles', 1956);
            const lid = this.add.sprite(0, -5, 'chest_tiles', 1892);
            lid.setVisible(false);

            container.add([shadow, body, lid]);
            this.chestContainers[index] = container;

            const updateVisuals = (animate: boolean = false) => {
                const myPlayer = this.room.state.players.get(this.room.sessionId);
                if (!myPlayer) return;

                body.setTint(0xffffff);
                lid.setVisible(false);
                lid.y = -5;

                if (chest.isCollected) {
                    body.setFrame(1957);
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
                    body.setFrame(1958);
                }
                else {
                    body.setFrame(1956);
                }
            };

            updateVisuals(false);

            chest.onChange(() => {
                updateVisuals(chest.isCollected);
            });

            const myPlayer = this.room.state.players.get(this.room.sessionId);
            if (myPlayer) {
                myPlayer.onChange(() => { updateVisuals(false); });
            }
        });

        this.room.onMessage('retryQuestion', (data: { questionId: number }) => {
            this.showRetryQuestionPopup(data.questionId);
        });

        // --- Enemy Sync ---
        this.room.state.enemies.onAdd((enemy: any, index: number) => {
            if (enemy.ownerId !== this.room.sessionId) return;

            const type = enemy.type || 'skeleton';
            const animKey = type + '_idle';
            const enemySprite = this.physics.add.sprite(enemy.x, enemy.y, type + '_idle');

            if (this.anims.exists(animKey)) {
                enemySprite.play(animKey);
            }

            enemySprite.setOrigin(0.5, 0.5);
            enemySprite.setScale(0);

            this.tweens.add({
                targets: enemySprite,
                scale: 1,
                duration: 500,
                ease: 'Back.easeOut'
            });

            enemySprite.setDepth(50);
            enemySprite.setInteractive();
            enemySprite.setData('prevX', enemy.x);

            // Enemy pointerdown logic removed. Players now left-click to attack.

            this.enemyEntities[index] = enemySprite;

            enemy.onChange(() => {
                if (enemy.isAlive) {
                    const prevX = enemySprite.getData('prevX') || enemySprite.x;
                    let isMoving = Math.abs(enemy.x - prevX) > 0.1 || Math.abs(enemy.y - enemySprite.y) > 0.1;
                    if (enemy.isBusy) isMoving = false; // Force idle when attacked/engaged
                    enemySprite.setData('targetX', enemy.x);
                    enemySprite.setData('targetY', enemy.y);
                    enemySprite.setData('prevX', enemy.x);

                    const type = enemy.type === 'goblin' ? 'goblin' : 'skeleton';
                    if (!enemySprite.anims) return;
                    const currentAnim = enemySprite.anims.currentAnim?.key;

                    if (isMoving) {
                        const walkKey = type + '_walk';
                        if (currentAnim !== walkKey && this.anims.exists(walkKey)) {
                            enemySprite.play(walkKey, true);
                        }
                        if (enemy.x < prevX) enemySprite.setFlipX(true);
                        else if (enemy.x > prevX) enemySprite.setFlipX(false);
                    } else {
                        const idleKey = type + '_idle';
                        if (currentAnim !== idleKey && this.anims.exists(idleKey)) {
                            enemySprite.play(idleKey, true);
                        }
                    }

                    if (enemy.isFleeing && !enemySprite.getData('wasFleeing')) {
                        const alert = this.add.image(enemy.x, enemy.y - 40, 'expression_alerted');
                        alert.setDepth(100);
                        alert.setScale(1.5);
                        this.tweens.add({
                            targets: alert,
                            y: enemy.y - 70,
                            alpha: 0,
                            duration: 1000,
                            ease: 'Power1',
                            onComplete: () => { if (alert.active) alert.destroy(); }
                        });
                    }
                    enemySprite.setData('wasFleeing', enemy.isFleeing);

                    // Fatigue/Resting Indicator
                    if (enemy.isResting && !enemySprite.getData('wasResting')) {
                        const tired = this.add.image(enemy.x, enemy.y - 40, 'expression_working');
                        tired.setDepth(100);
                        tired.setScale(1.5);
                        
                        // Descend slowly and fade out
                        this.tweens.add({
                            targets: tired,
                            y: enemy.y - 10,
                            alpha: { from: 1, to: 0 },
                            duration: 4500, // Nearly the full 5s rest
                            ease: 'Linear',
                            onComplete: () => { if (tired.active) tired.destroy(); }
                        });
                    }
                    enemySprite.setData('wasResting', enemy.isResting);
                } else {
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

        const uiLayer = document.getElementById('ui-layer');
        if (uiLayer) {
            uiLayer.classList.remove('hidden');
            this.events.once('shutdown', () => {
                uiLayer.classList.add('hidden');
                this.scene.stop('UIScene');
                if (this.quizPopup) this.quizPopup.hide();
            });
        }

        // --- Game Events from Server ---
        this.room.onMessage('timerUpdate', (data: { remaining: number }) => {
            const uiScene = this.scene.get('UIScene') as UIScene;
            if (uiScene && uiScene.updateTimer) {
                uiScene.updateTimer(data.remaining);
            }
        });

        this.room.onMessage('playerFinished', (data: any) => {
            this.registry.set('leaderboardData', [data]);
            if (this.quizPopup) this.quizPopup.hide();
            TransitionManager.close(() => {
                const engine = (window as any).gameInstance;
                if (engine) {
                    engine.destroy(true);
                    (window as any).gameInstance = null;
                }
                import('../results/page').then((m) => {
                    const manager = new m.ResultManager();
                    manager.start({ room: this.room, leaderboardData: [data] });
                });
            });
        });

        this.room.onMessage('gameEnded', (data: { rankings: any[] }) => {
            const isHost = this.room.sessionId === this.room.state.hostId;
            this.registry.set('isHost', isHost);
            this.registry.set('leaderboardData', data.rankings);

            if (this.quizPopup) this.quizPopup.hide();

            if (isHost) {
                this.room.leave();
                TransitionManager.close(() => {
                    const engine = (window as any).gameInstance;
                    if (engine) {
                        engine.destroy(true);
                        (window as any).gameInstance = null;
                    }
                    import('../../host/leaderboard/page').then((m) => {
                        const manager = new m.HostLeaderboardManager();
                        manager.start({
                            rankings: data.rankings,
                            isHost: isHost,
                            mySessionId: this.room.sessionId
                        });
                    });
                });
            } else {
                TransitionManager.close(() => {
                    const engine = (window as any).gameInstance;
                    if (engine) {
                        engine.destroy(true);
                        (window as any).gameInstance = null;
                    }
                    import('../results/page').then((m) => {
                        const manager = new m.ResultManager();
                        manager.start({ room: this.room, leaderboardData: data.rankings });
                    });
                });
            }
        });

        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (this.activeQuestionId !== null) return;
            if (this.isChestPopupVisible) return;
            this.tryAttack(pointer);
        });

        // Attack with Spacebar
        this.input.keyboard?.on('keydown-SPACE', () => {
            if (this.activeQuestionId !== null) return;
            if (this.isChestPopupVisible) return;
            this.tryAttack();
        });

        // --- Handle Resizing ---
        this.scale.on('resize', () => this.handleResize(), this);
        
        this.room.onLeave((code) => {
            console.warn(`[GameScene] Disconnected from room (code: ${code})`);
            this.isGameReady = false;
        });
    }

    tryAttack(pointer?: Phaser.Input.Pointer) {
        if (this.isAttacking) return;
        this.isAttacking = true;
        
        // Sync attack state to server for spectators and other players
        this.room.send("attack");

        const base = this.currentPlayer.getData('baseSprite') as Phaser.GameObjects.Sprite;
        const hair = this.currentPlayer.getData('hairSprite') as Phaser.GameObjects.Sprite;
        const tools = this.currentPlayer.getData('toolsSprite') as Phaser.GameObjects.Sprite;

        // Play base attack
        if (base) base.play('base_attack', true);
        
        // Play corresponding hair attack animation
        const hairPrefix = this.currentPlayer.getData('hairPrefix');
        console.log(`[Attack-Fix] tryAttack: base_attack started, hairPrefix: ${hairPrefix}, hairVisible: ${hair?.visible}`);
        
        if (hair && hair.visible && hairPrefix) {
            const attackKey = `${hairPrefix}_attack`;
            console.log(`[Attack-Fix] Playing hair attack: ${attackKey}`);
            hair.play(attackKey, true);
        }

        // Play tools attack
        if (tools) tools.play('tools_attack', true);

        // Use current character facing direction for attack
        const isLeft = base ? base.flipX : false;

        // Trigger hitbox halfway through animation (e.g. at 200ms)
        this.time.delayedCall(200, () => {
             if (this.scene.isActive()) this.performAttackHitbox(isLeft);
        });

        // Listen for finish
        base.once('animationcomplete', (anim: Phaser.Animations.Animation) => {
            if (anim.key === 'base_attack') {
                this.isAttacking = false;
                
                // Go back to idle
                base.play('idle', true);
                const hPrefix = this.currentPlayer.getData('hairPrefix');
                if (hair && hair.visible && hPrefix) {
                    hair.play(`${hPrefix}_idle`, true);
                }
                if (tools) tools.play('tools_idle', true);
            }
        });
    }

    performAttackHitbox(isLeft: boolean) {
        const range = 55; // Increased range to make it easier (as requested)
        const angleTolerance = Math.PI / 3; // Wider spread (60 degrees instead of 45)

        Object.keys(this.enemyEntities).forEach(id => {
            const enemySprite = this.enemyEntities[id];
            const enemyState = this.room.state.enemies[id as any];
            
            if (enemySprite && enemyState && enemyState.isAlive && !this.cooldownEnemies.has(id)) {
                const dist = Phaser.Math.Distance.Between(this.currentPlayer.x, this.currentPlayer.y, enemySprite.x, enemySprite.y);
                
                if (dist <= range) {
                    const angleToEnemy = Phaser.Math.Angle.Between(this.currentPlayer.x, this.currentPlayer.y, enemySprite.x, enemySprite.y);
                    const facingAngle = isLeft ? Math.PI : 0;
                    let diff = Phaser.Math.Angle.Wrap(angleToEnemy - facingAngle);
                    
                    if (Math.abs(diff) <= angleTolerance) {
                        this.handleEnemyInteraction(id);
                    }
                }
            }
        });
    }

    createNameTag(sessionId: string, name: string, x: number, y: number) {
        const container = this.add.container(x, y - 21);
        container.setDepth(150);
        container.setScale(0.9);

        const nameText = this.add.text(0, 0, name.toUpperCase(), {
            fontFamily: '"Retro Gaming", monospace',
            fontSize: '6px',
            color: '#000000',
            resolution: 2
        });
        nameText.setOrigin(0.5, 0.5);
        nameText.setName('nameText');

        const textWidth = nameText.width;
        const padding = 4;
        const minMiddleWidth = Math.max(textWidth + padding, 12);

        const leftImg = this.textures.get('label_left');
        const rightImg = this.textures.get('label_right');
        const leftWidth = leftImg.getSourceImage().width;
        const rightWidth = rightImg.getSourceImage().width;

        const labelLeft = this.add.image(-minMiddleWidth / 2 - leftWidth / 2, 0, 'label_left');
        labelLeft.setOrigin(0.5, 0.5);

        const labelMiddle = this.add.image(0, 0, 'label_middle');
        labelMiddle.setOrigin(0.5, 0.5);
        labelMiddle.setDisplaySize(minMiddleWidth, labelMiddle.height);

        const labelRight = this.add.image(minMiddleWidth / 2 + rightWidth / 2, 0, 'label_right');
        labelRight.setOrigin(0.5, 0.5);

        container.add([labelLeft, labelMiddle, labelRight, nameText]);
        
        // -- Visual Difference for Other Players' Name Tags --
        if (sessionId !== this.room.sessionId) {
            container.setAlpha(0.85); // Slightly transparent but still readable
        }

        this.nameTagContainers[sessionId] = container;
    }

    updateNameTagText(sessionId: string, newName: string) {
        const container = this.nameTagContainers[sessionId];
        if (!container) return;

        const nameText = container.getByName('nameText') as Phaser.GameObjects.Text;
        if (nameText && nameText.text !== newName.toUpperCase()) {
            nameText.setText(newName.toUpperCase());
            const textWidth = nameText.width;
            const padding = 4;
            const minMiddleWidth = Math.max(textWidth + padding, 12);
            const leftImg = this.textures.get('label_left');
            const rightImg = this.textures.get('label_right');
            const leftWidth = leftImg.getSourceImage().width;
            const rightWidth = rightImg.getSourceImage().width;
            const children = container.list as Phaser.GameObjects.Image[];
            if (children[0]) children[0].setX(-minMiddleWidth / 2 - leftWidth / 2);
            if (children[1]) children[1].setDisplaySize(minMiddleWidth, children[1].height);
            if (children[2]) children[2].setX(minMiddleWidth / 2 + rightWidth / 2);
        }
    }

    triggerQuiz(enemy: any) {
        // Use questions from the server state instead of local dummy data
        const questions = this.room.state.questions;
        const qIndex = enemy.questionId;
        const currentQ = questions[qIndex];

        if (currentQ) {
            const questionData = {
                id: qIndex, // Using the index as ID for mapping feedback
                question: currentQ.text,
                image: currentQ.imageUrl,
                options: Array.from(currentQ.options), // Convert ArraySchema to regular array
                correctAnswer: currentQ.correctAnswer
            };

            this.activeQuestionId = qIndex;
            let foundKey: string | null = null;
            this.room.state.enemies.forEach((val: any, key: string) => {
                if (val === enemy) foundKey = key;
            });
            this.activeEnemyId = foundKey;
            this.isChestPopupVisible = false;
            this.activeChestIndex = null;

            if (this.quizPopup) {
                this.quizPopup.show(questionData, (enemy.type || 'SKELETON').toUpperCase());
                if (this.activeEnemyId !== null) {
                    this.room.send("engageEnemy", { enemyIndex: this.activeEnemyId });
                    const enemySprite = this.enemyEntities[this.activeEnemyId];
                    if (enemySprite) this.startCombatCamera(enemySprite.x, enemySprite.y);
                }
            }
        }
    }

    handleAnswer(answerIndex: number, btnElement?: HTMLElement) {
        const isFromChest = this.isChestPopupVisible;
        if (this.activeEnemyId) this.cooldownEnemies.add(this.activeEnemyId);

        const currentQ = this.room.state.questions[this.activeQuestionId!];

        if (currentQ) {
            const isCorrect = currentQ.correctAnswer === answerIndex;

            if (btnElement && this.quizPopup) this.quizPopup.showFeedback(isCorrect, btnElement);

            if (isCorrect) {
                if (isFromChest) {
                    this.room.send("addScoreFromChest", { amount: 10 });
                } else {
                    this.room.send("correctAnswer", { questionId: this.activeQuestionId, enemyIndex: this.activeEnemyId, answerId: answerIndex });
                }
            } else {
                if (!isFromChest) {
                    this.room.send("wrongAnswer", { questionId: this.activeQuestionId, enemyIndex: this.activeEnemyId, answerId: answerIndex });
                    this.room.send("killEnemy", { enemyIndex: this.activeEnemyId });
                }
            }
        }

        this.activeQuestionId = null;
        this.activeEnemyId = null;
        this.isChestPopupVisible = false;
        this.activeChestIndex = null;

        this.time.delayedCall(1200, () => {
            this.resetCamera();
        });
    }

    handleChestInteraction(chestIndex: number) {
        const chest = this.room.state.chests[chestIndex];
        const myPlayer = this.room.state.players.get(this.room.sessionId);
        if (!chest || !myPlayer) return;

        const chestContainer = this.chestContainers[chestIndex];
        const dist = Phaser.Math.Distance.Between(this.currentPlayer.x, this.currentPlayer.y, chestContainer.x, chestContainer.y);

        if (dist > 50) return;
        if (myPlayer.hasUsedChest || chest.isCollected || !myPlayer.hasWrongAnswer) return;

        this.room.send('collectChest', { chestIndex });
        this.activeChestIndex = chestIndex;
    }

    showRetryQuestionPopup(questionId: number) {
        const qData = this.room.state.questions[questionId];

        if (qData) {
            const questionData = {
                id: questionId,
                question: qData.text,
                image: qData.imageUrl,
                options: Array.from(qData.options),
                correctAnswer: qData.correctAnswer
            };
            this.activeQuestionId = questionId;
            this.isChestPopupVisible = true;
            this.quizPopup.show(questionData, 'RETRY CHEST');

            if (this.activeChestIndex !== null) {
                const chest = this.chestContainers[this.activeChestIndex];
                if (chest) this.startCombatCamera(chest.x, chest.y);
            }
        }
    }

    startCombatCamera(targetX: number, targetY: number) {
        if (this.isZooming) return;
        this.isZooming = true;
        this.cameras.main.stopFollow();
        this.cameras.main.pan(targetX, targetY, 800, 'Power2');
        this.cameras.main.zoomTo(3.5, 1000, 'Power2');
    }

    resetCamera() {
        if (!this.isZooming) return;
        this.isZooming = false;
        
        const targetZoom = window.innerWidth <= 768 ? 1.2 : 2;
        this.cameras.main.zoomTo(targetZoom, 800, 'Power2');
        if (this.currentPlayer) this.cameras.main.startFollow(this.currentPlayer, true, 0.2, 0.2);
    }

    update(time: number, delta: number) {
        if (!this.currentPlayer || !this.isGameReady) return;
        const isQuizOpen = this.quizPopup.isVisible();

        Object.keys(this.chestContainers).forEach(key => {
            const index = Number(key);
            const chestContainer = this.chestContainers[index];
            if (chestContainer && chestContainer.visible) {
                const dist = Phaser.Math.Distance.Between(this.currentPlayer.x, this.currentPlayer.y, chestContainer.x, chestContainer.y);
                if (dist < 40 && !isQuizOpen) this.handleChestInteraction(index);
            }
        });

        // Enemy collision auto-trigger removed in favor of manual attack hitbox

        const speed = 130;
        const velocity = { x: 0, y: 0 };
        const inputPayload = { left: false, right: false, up: false, down: false };

        if (!isQuizOpen && !this.isAttacking) {
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

        if (!this.isAttacking) {
            if (velocity.x !== 0 || velocity.y !== 0) {
                const length = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
                velocity.x /= length; velocity.y /= length;

                // Simpan posisi lama sebelum bergerak
                const prevX = this.currentPlayer.x;
                const prevY = this.currentPlayer.y;

                // Hitung posisi baru
                const newX = prevX + velocity.x * speed * (delta / 1000);
                const newY = prevY + velocity.y * speed * (delta / 1000);

                // Cek collision per-axis (sliding collision)
                // Coba X dulu
                if (!this.isInsideBarrier(newX, prevY)) {
                    this.currentPlayer.x = newX;
                } 
                // Coba Y
                if (!this.isInsideBarrier(this.currentPlayer.x, newY)) {
                    this.currentPlayer.y = newY;
                }

                const base = this.currentPlayer.getData('baseSprite') as Phaser.GameObjects.Sprite;
                const hair = this.currentPlayer.getData('hairSprite') as Phaser.GameObjects.Sprite;
                const tools = this.currentPlayer.getData('toolsSprite') as Phaser.GameObjects.Sprite;

                if (base) {
                    base.play('walk', true);
                    if (velocity.x !== 0) base.setFlipX(velocity.x < 0);
                }
                if (tools) {
                    tools.play('tools_walk', true);
                    if (velocity.x !== 0) tools.setFlipX(velocity.x < 0);
                }
                if (hair && hair.visible) {
                    const hPrefix = this.currentPlayer.getData('hairPrefix');
                    if (hPrefix) hair.play(`${hPrefix}_walk`, true);
                    if (velocity.x !== 0) hair.setFlipX(velocity.x < 0);
                }

                this.wasMovingKeyboard = true;

            } else {
                const base = this.currentPlayer.getData('baseSprite') as Phaser.GameObjects.Sprite;
                const hair = this.currentPlayer.getData('hairSprite') as Phaser.GameObjects.Sprite;
                const tools = this.currentPlayer.getData('toolsSprite') as Phaser.GameObjects.Sprite;
                if (base) base.play('idle', true);
                if (tools) tools.play('tools_idle', true);
                if (hair && hair.visible) {
                    const hPrefix = this.currentPlayer.getData('hairPrefix');
                    if (hPrefix) hair.play(`${hPrefix}_idle`, true);
                }
            }
        }
        
        // Handle network and UI indicators unconditionally so they don't break
        if (velocity.x !== 0 || velocity.y !== 0 || this.wasMovingKeyboard) {
            const now = Date.now();
            if (now - this.lastNetworkSendTime > this.networkSendRate || velocity.x === 0) {
                if (this.room && this.room.connection.isOpen) {
                    this.room.send("movePlayer", { x: this.currentPlayer.x, y: this.currentPlayer.y });
                }
                this.lastNetworkSendTime = now;
            }
            if (velocity.x === 0 && velocity.y === 0) {
                this.wasMovingKeyboard = false;
            }
        }
        
        if (this.indicatorContainer) this.indicatorContainer.setPosition(this.currentPlayer.x, this.currentPlayer.y - 8);
        if (this.nameTagContainers[this.room.sessionId]) this.nameTagContainers[this.room.sessionId].setPosition(this.currentPlayer.x, this.currentPlayer.y - 21);

        // --- Frustum Culling Setup ---
        const view = this.cameras.main.worldView;
        const margin = 200;
        const viewRect = new Phaser.Geom.Rectangle(view.x - margin, view.y - margin, view.width + margin * 2, view.height + margin * 2);

        Object.keys(this.enemyEntities).forEach(id => {
            const enemy = this.enemyEntities[id];
            const tx = enemy.getData('targetX');
            const ty = enemy.getData('targetY');
            const enemyState = this.room.state.enemies[id as any];
            const isAlive = enemyState ? enemyState.isAlive : true;

            if (isAlive) {
                const isVisible = viewRect.contains(enemy.x, enemy.y);
                enemy.setVisible(isVisible);
                if (!isVisible && enemy.anims && enemy.anims.isPlaying) enemy.anims.pause();
                else if (isVisible && enemy.anims && !enemy.anims.isPlaying) enemy.anims.resume();

                if (tx !== undefined && ty !== undefined) {
                    if (isVisible) {
                        enemy.x += (tx - enemy.x) * 0.1;
                        enemy.y += (ty - enemy.y) * 0.1;
                    } else {
                        enemy.x = tx;
                        enemy.y = ty;
                    }
                }
            } else {
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
                    
                    const isVisible = viewRect.contains(entity.x, entity.y);
                    entity.setVisible(isVisible);
                    if (this.nameTagContainers[sid]) this.nameTagContainers[sid].setVisible(isVisible);

                    if (tx !== undefined && ty !== undefined) {
                        if (isVisible) {
                            entity.x += (tx - entity.x) * 0.1;
                            entity.y += (ty - entity.y) * 0.1;
                        } else {
                            entity.x = tx;
                            entity.y = ty;
                            // Reset anmations if invisible
                            const base = entity.getData('baseSprite') as Phaser.GameObjects.Sprite;
                            const hair = entity.getData('hairSprite') as Phaser.GameObjects.Sprite;
                            const tools = entity.getData('toolsSprite') as Phaser.GameObjects.Sprite;
                            if (base && base.anims) base.anims.pause();
                            if (hair && hair.anims) hair.anims.pause();
                            if (tools && tools.anims) tools.anims.pause();
                        }
                    } else if (isVisible) {
                        // Resume idle standing if visible but no target
                        const base = entity.getData('baseSprite') as Phaser.GameObjects.Sprite;
                        const hair = entity.getData('hairSprite') as Phaser.GameObjects.Sprite;
                        const tools = entity.getData('toolsSprite') as Phaser.GameObjects.Sprite;
                        if (base && base.anims && !base.anims.isPlaying) base.anims.resume();
                        if (hair && hair.anims && !hair.anims.isPlaying) hair.anims.resume();
                        if (tools && tools.anims && !tools.anims.isPlaying) tools.anims.resume();
                    }
                    if (this.nameTagContainers[sid]) this.nameTagContainers[sid].setPosition(entity.x, entity.y - 21);
                }
            }
        });
    }

    handleEnemyInteraction(enemyId: string) {
        const enemyState = this.room.state.enemies[enemyId];
        if (enemyState && enemyState.isAlive && !this.cooldownEnemies.has(enemyId)) {
            const enemySprite = this.enemyEntities[enemyId];
            this.activeEnemyId = enemyId;
            const qIndex = enemyState.questionId;
            const qData = this.room.state.questions[qIndex];
            if (qData) {
                const questionData = {
                    id: qIndex,
                    question: qData.text,
                    image: qData.imageUrl,
                    options: Array.from(qData.options),
                    correctAnswer: qData.correctAnswer
                };
                this.activeQuestionId = qIndex;
                const name = (enemyState.type || 'ENEMY').toUpperCase();
                
                // SEND ENGAGE SIGNAL TO SERVER TO FREEZE ENEMY
                this.room.send("engageEnemy", { enemyIndex: Number(enemyId) });
                
                this.quizPopup.show(questionData, name);
                if (enemySprite) this.startCombatCamera(enemySprite.x, enemySprite.y);
            }
        }
    }

    // ═══════════════════════════════════════════════
    // BARRIER COLLISION SYSTEM
    // ═══════════════════════════════════════════════

    /**
     * Membaca semua object rectangle dari layer "barrier" di Tiled map.
     * Object dengan width/height = 0 (titik/ellipse kosong) diabaikan.
     */
    private parseBarriers() {
        this.barrierAreas = [];

        // HANYA cari layer yang namanya persis "Barrier"
        const targetLayerName = 'Barrier';

        // 1. Cek di daftar objects utama Phaser
        if (this.map.objects) {
            const layer = this.map.objects.find(l => l.name === targetLayerName);
            if (layer && layer.objects) {
                this.parseLayerObjects(layer.objects);
            }
        }

        console.log(`[Barrier] Loaded ${this.barrierAreas.length} precise barrier areas from layer "${targetLayerName}".`);
        // Debug mode dimatikan sesuai permintaan user
        // this.drawDebugBarriers();
    }



    /**
     * Memproses daftar objek dari sebuah layer dan memasukkannya ke barrierAreas
     */
    private parseLayerObjects(objects: any[]) {
        for (const obj of objects) {
            // Case 1: Rectangle
            if (obj.width && obj.height && obj.width > 0 && obj.height > 0 && !obj.polygon && !obj.polyline) {
                this.barrierAreas.push({
                    type: 'rect',
                    x: obj.x ?? 0,
                    y: obj.y ?? 0,
                    width: obj.width,
                    height: obj.height
                });
            } 
            // Case 2: Polygon
            else if (obj.polygon) {
                const points = (obj.polygon as any[]).map(p => ({
                    x: (obj.x ?? 0) + p.x,
                    y: (obj.y ?? 0) + p.y
                }));

                this.barrierAreas.push({
                    type: 'poly',
                    points: points
                });
            }
        }
    }


    private drawDebugBarriers() {
        const debugGraphics = this.add.graphics();
        debugGraphics.setDepth(1000);
        debugGraphics.lineStyle(2, 0xff0000, 1);
        debugGraphics.fillStyle(0xff0000, 0.2);

        this.barrierAreas.forEach(area => {
            if (area.type === 'rect') {
                debugGraphics.strokeRect(area.x, area.y, area.width, area.height);
                debugGraphics.fillRect(area.x, area.y, area.width, area.height);
            } else if (area.type === 'poly') {
                debugGraphics.beginPath();
                debugGraphics.moveTo(area.points[0].x, area.points[0].y);
                for (let i = 1; i < area.points.length; i++) {
                    debugGraphics.lineTo(area.points[i].x, area.points[i].y);
                }
                debugGraphics.closePath();
                debugGraphics.strokePath();
                debugGraphics.fillPath();
            }
        });
    }


    /**
     * Mengecek apakah posisi (px, py) berada di dalam salah satu barrier rectangle.
     * Menggunakan hitbox kecil (8px) sebagai radius karakter.
     * Return: true = terblokir, false = aman.
     */
    private isInsideBarrier(px: number, py: number): boolean {
        const playerRadius = 4; // Lebih kecil agar tidak gampang nyangkut
        
        for (const area of this.barrierAreas) {
            if (area.type === 'rect') {
                if (px + playerRadius > area.x && px - playerRadius < area.x + area.width &&
                    py + playerRadius > area.y && py - playerRadius < area.y + area.height) {
                    return true;
                }
            } else if (area.type === 'poly') {
                // Ray Casting Algorithm untuk Point-in-Polygon presisi
                let inside = false;
                const points = area.points;
                for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
                    const xi = points[i].x, yi = points[i].y;
                    const xj = points[j].x, yj = points[j].y;
                    
                    const intersect = ((yi > py) !== (yj > py)) &&
                        (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
                    if (intersect) inside = !inside;
                }
                if (inside) return true;
            }
        }
        return false;
    }


    private handleResize(gameSize?: Phaser.Structs.Size) {
        // Use window dimensions directly if gameSize is not yet updated properly (common on mobile)
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        console.log(`[GameScene] Resizing: ${width}x${height}`);

        // Update main camera viewport to fill the new game size
        this.cameras.main.setViewport(0, 0, width, height);

        // Update zoom dynamically - Use INTEGER zoom levels to prevent tearing (lines between tiles)
        if (width > height) {
            // Mobile Landscape or Desktop Wide
            if (width <= 950) { 
                // Smaller landscape (mobile) - Wide view requested
                this.cameras.main.setZoom(1);
            } else { 
                // Desktop/Large Tablet - Closer view is fine
                this.cameras.main.setZoom(2);
            }
        } else {
            // Portrait (during transition or warning)
            this.cameras.main.setZoom(1);
        }

        this.cameras.main.setRoundPixels(true);

        // Re-ensure bounds and follow are correct
        if (this.map) {
            this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        }

        // Re-center character follow if active
        if (this.currentPlayer) {
            this.cameras.main.startFollow(this.currentPlayer, true, 0.2, 0.2);
        }
    }
}
