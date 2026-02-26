import Phaser from 'phaser';
import { Room } from 'colyseus.js';
import { QuizPopup } from '../ui/QuizPopup';
import { UIScene } from './UIScene'; 
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

    isGameReady: boolean = false; 

    constructor() {
        super('GameScene');
    }

    init(data: { room: Room }) {
        this.room = data.room;
        this.registry.set('room', this.room);
        console.log(`[GameScene][Room:${this.room.id}] Initialized. SessionId: ${this.room.sessionId}`);

        if (this.room.state.countdown > 0) {
            TransitionManager.ensureClosed();
            TransitionManager.setCountdownText(this.room.state.countdown.toString());
        }

        this.room.state.listen("countdown", (val: number, previousVal: number) => {
            if (val > 0) {
                TransitionManager.ensureClosed();
                TransitionManager.setCountdownText(val.toString());
            } else if (val === 0 && (previousVal || 0) > 0) {
                TransitionManager.setCountdownText("GO!");
            }
        });

        this.room.state.listen("isGameStarted", (isStarted: boolean) => {
            if (isStarted && this.isGameReady) { 
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
            mapFile = 'map_baru2.tmj';
        } else if (difficulty === 'sulit') {
            mapKey = 'map_hard';
            mapFile = 'map_baru3.tmj';
        }

        this.load.tilemapTiledJSON(mapKey, `/assets/${mapFile}`);
        this.load.image('tiles', '/assets/spr_tileset_sunnysideworld_16px.png');
        this.load.image('forest_tiles', '/assets/spr_tileset_sunnysideworld_forest_32px.png'); 
        this.load.spritesheet('character', '/assets/base_walk_strip8.png', { frameWidth: 96, frameHeight: 64 });
        this.load.spritesheet('base_idle', '/assets/base_idle_strip9.png', { frameWidth: 96, frameHeight: 64 });

        const hairKeys = ['bowlhair', 'curlyhair', 'longhair', 'mophair', 'shorthair', 'spikeyhair'];
        hairKeys.forEach(key => {
            this.load.spritesheet(`${key}_walk`, `/assets/${key}_walk_strip8.png`, { frameWidth: 96, frameHeight: 64 });
            this.load.spritesheet(`${key}_idle`, `/assets/${key}_idle_strip9.png`, { frameWidth: 96, frameHeight: 64 });
        });

        this.load.spritesheet('skeleton_idle', '/assets/characters/Skeleton/PNG/skeleton_idle_strip6.png', { frameWidth: 96, frameHeight: 64 });
        this.load.spritesheet('skeleton_walk', '/assets/characters/Skeleton/PNG/skeleton_walk_strip8.png', { frameWidth: 96, frameHeight: 64 });
        this.load.spritesheet('skeleton_death', '/assets/characters/Skeleton/PNG/skeleton_death_strip10.png', { frameWidth: 96, frameHeight: 64 });

        this.load.spritesheet('goblin_idle', '/assets/characters/Goblin/PNG/spr_idle_strip9.png', { frameWidth: 96, frameHeight: 64 });
        this.load.spritesheet('goblin_walk', '/assets/characters/Goblin/PNG/spr_walk_strip8.png', { frameWidth: 96, frameHeight: 64 });
        this.load.spritesheet('goblin_death', '/assets/characters/Goblin/PNG/spr_death_strip13.png', { frameWidth: 96, frameHeight: 64 });

        this.load.spritesheet('chest_tiles', '/assets/spr_tileset_sunnysideworld_16px.png', {
            frameWidth: 16,
            frameHeight: 16
        });

        this.load.image('indicator', '/assets/indicator.png');
        this.load.image('label_left', '/assets/label_left.png');
        this.load.image('label_middle', '/assets/label_middle.png');
        this.load.image('label_right', '/assets/label_right.png');
        this.load.image('expression_alerted', '/assets/expression_alerted.png');
    }

    create() {
        // --- Logo Integration ---
        const logoContainer = document.createElement('div');
        logoContainer.className = 'game-logo-container';
        logoContainer.innerHTML = `
            <img src="/logo/Zigma-logo.webp" style="top: -60px; left: -65px; position: absolute; width: 24rem; z-index: 20;" />
            <img src="/logo/gameforsmart.webp" style="position: absolute; top: 0.5rem; right: 0.5rem; width: 16rem; z-index: 20;" />
        `;
        document.body.appendChild(logoContainer);
        this.events.once('shutdown', () => logoContainer.remove());

        this.scene.launch('UIScene');
        this.scene.bringToTop('UIScene');

        // --- Start Game Logic (HEAD version - Immediate Start) ---
        this.isGameReady = true;
        TransitionManager.open();
        
        // --- Map Rendering ---
        const difficulty = this.room.state.difficulty;
        const mapKey = difficulty === 'sedang' ? 'map_medium' : difficulty === 'sulit' ? 'map_hard' : 'map_easy';
        this.map = this.make.tilemap({ key: mapKey });

        const tileset1 = this.map.addTilesetImage('spr_tileset_sunnysideworld_16px', 'tiles');
        const tileset2 = this.map.addTilesetImage('spr_tileset_sunnysideworld_forest_32px', 'forest_tiles');

        const tilesets: Phaser.Tilemaps.Tileset[] = [];
        if (tileset1) tilesets.push(tileset1);
        if (tileset2) tilesets.push(tileset2);

        this.map.layers.forEach(layerData => {
            this.map.createLayer(layerData.name, tilesets, 0, 0);
        });

        // --- Animations ---
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

        // --- Player Sync ---
        this.room.state.players.onAdd((player: any, sessionId: string) => {
            const container = this.add.container(player.x, player.y);
            container.setDepth(10);

            const baseSprite = this.add.sprite(0, 0, 'character');
            baseSprite.play('idle');
            
            const hairSprite = this.add.sprite(0, 0, 'bowlhair_idle');
            hairSprite.setVisible(false);

            container.add([baseSprite, hairSprite]);
            container.setData({ baseSprite, hairSprite });
            this.playerEntities[sessionId] = container;

            this.createNameTag(sessionId, player.name || 'Player', container.x, container.y);

            if (sessionId === this.room.sessionId) {
                this.currentPlayer = container;
                this.cameras.main.startFollow(this.currentPlayer, true, 0.2, 0.2);
                this.cameras.main.setZoom(2);
            }

            player.onChange(() => {
                if (sessionId !== this.room.sessionId) {
                    const entity = this.playerEntities[sessionId];
                    if (entity) {
                        entity.setData({ targetX: player.x, targetY: player.y });
                    }
                }
                this.updateNameTagText(sessionId, player.name);
            });
        });

        // --- Game Messages ---
        this.room.onMessage('gameEnded', (data: { rankings: any[] }) => {
            console.log('Game ended! Routing to WaitingResultsScene...');
            this.registry.set('leaderboardData', data.rankings);
            this.registry.set('room', this.room); 
            this.scene.start('WaitingResultsScene');
        });

        this.quizPopup = new QuizPopup(this, (answerIndex: number, btn: HTMLElement) => {
            this.handleAnswer(answerIndex, btn);
        });

        this.controls = new HTMLControlAdapter();
        this.clickToMove = new ClickToMoveSystem(this);
        this.createPlayerIndicator();
    }

    // Helper functions (triggerQuiz, handleAnswer, handleEnemyInteraction)
    triggerQuiz(enemy: any, enemyIndex?: string): boolean {
        const qIndex = enemy.questionId;
        let currentQ = this.room.state.questions[qIndex];
        if (!currentQ) return false;

        const optionsArray: string[] = [];
        currentQ.options.forEach((opt: string) => optionsArray.push(opt));

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

        this.activeQuestionId = qIndex;
        this.activeEnemyId = enemyIndex || null;
        this.quizPopup.show(questionData, (enemy.type || 'SKELETON').toUpperCase());

        if (this.activeEnemyId) {
            this.room.send("engageEnemy", { enemyIndex: Number(this.activeEnemyId) });
            const enemySprite = this.enemyEntities[this.activeEnemyId];
            if (enemySprite) this.startCombatCamera(enemySprite.x, enemySprite.y);
        }
        return true;
    }

    handleAnswer(answerIndex: number, btnElement?: HTMLElement) {
        if (this.activeQuestionId === null) return;
        const currentQ = this.room.state.questions[this.activeQuestionId];
        const isCorrect = (answerIndex === currentQ.correctAnswer);

        if (btnElement) this.quizPopup.showFeedback(isCorrect, btnElement);

        if (isCorrect) {
            this.room.send("correctAnswer", {
                questionId: this.activeQuestionId,
                answerId: answerIndex,
                enemyIndex: Number(this.activeEnemyId)
            });
        } else {
            this.room.send("wrongAnswer", {
                questionId: this.activeQuestionId,
                answerId: answerIndex
            });
            this.room.send("killEnemy", { enemyIndex: Number(this.activeEnemyId) });
        }

        this.time.delayedCall(1200, () => {
            this.resetCamera();
            this.activeQuestionId = null;
            this.activeEnemyId = null;
        });
    }

    handleEnemyInteraction(enemyId: string) {
        if (this.clickToMove) this.clickToMove.cancelMovement();
        const enemyState = this.room.state.enemies[enemyId];
        if (enemyState && enemyState.isAlive && !this.cooldownEnemies.has(enemyId)) {
            this.triggerQuiz(enemyState, enemyId);
        }
    }

    // Camera, UI, and Update logic follows...
    startCombatCamera(targetX: number, targetY: number) {
        if (this.isZooming) return;
        this.isZooming = true;
        this.cameras.main.stopFollow();
        this.cameras.main.pan(targetX, targetY, 800, 'Power2');
        this.cameras.main.zoomTo(3.5, 1000, 'Power2');
    }

    resetCamera() {
        this.isZooming = false;
        this.cameras.main.zoomTo(2.0, 800, 'Power2');
        if (this.currentPlayer) this.cameras.main.startFollow(this.currentPlayer, true, 0.2, 0.2);
    }

    update(time: number, delta: number) {
        if (!this.currentPlayer || !this.isGameReady) return;
        
        const isQuizOpen = this.quizPopup.isVisible();
        
        // Enemy interaction check
        Object.keys(this.enemyEntities).forEach(key => {
            const enemySprite = this.enemyEntities[key];
            if (enemySprite && enemySprite.active && !isQuizOpen) {
                const dist = Phaser.Math.Distance.Between(this.currentPlayer.x, this.currentPlayer.y, enemySprite.x, enemySprite.y);
                if (dist < 15) {
                    const enemyState = this.room.state.enemies[key as any];
                    if (enemyState && enemyState.isAlive && !this.cooldownEnemies.has(key)) {
                        this.triggerQuiz(enemyState, key);
                        if (this.clickToMove) this.clickToMove.cancelMovement();
                    }
                }
            }
        });

        // Movement Sync
        if (!isQuizOpen && this.room.connection.isOpen) {
            this.room.send("movePlayer", { x: this.currentPlayer.x, y: this.currentPlayer.y });
        }
    }
    
    // (Tambahkan fungsi createNameTag, updateNameTagText, createPlayerIndicator dari kode asli kamu di sini)
}