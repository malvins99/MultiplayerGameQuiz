import Phaser from 'phaser';
import { Room } from 'colyseus.js';
import { Router } from '../../../utils/Router';
import { TransitionManager } from '../../../utils/TransitionManager';
import { OrientationManager } from '../../../utils/OrientationManager';

export class HostProgressScene extends Phaser.Scene {
    room!: Room;
    map!: Phaser.Tilemaps.Tilemap;
    playerEntities: { [sessionId: string]: Phaser.GameObjects.Container } = {};
    isDragPan: boolean = false;
    dragOrigin!: Phaser.Math.Vector2;
    uiContainer!: HTMLDivElement;
    disposers: Array<() => void> = [];
    minZoom: number = 0.8;
    isMuted: boolean = false;
    isGameStarted: boolean = false;
    isGameReady: boolean = false; // Block iris until map/UI load complete
    private resizeListener: (() => void) | null = null;

    constructor() {
        super('HostProgressScene');
    }

    init(data: { room: Room }) {
        console.log("[Spectator] Initializing with data:", data);
        if (!data || !data.room) {
            console.error("[Spectator] No room data provided! Redirecting to lobby...");
            window.location.href = '/';
            return;
        }
        this.room = data.room;

        // Store room in registry for reliable cleanup by other scenes
        this.registry.set('room', this.room);

        // Register message listeners directly on room
        console.log(`[Spectator][Room:${this.room.id}] Registering message handlers. SessionId: ${this.room.sessionId}`);
        if (this.room) {
            this.room.onMessage('timerUpdate', (data: { remaining: number }) => {
                this.updateTimer(data.remaining);
            });

            // --- UNIFIED GLOBAL COUNTDOWN SYNC ---
            // If the scene starts during countdown (early loading), keep the overlay updated
            this.room.state.listen("countdown", (val: number, previousVal: number) => {
                if (val > 0) {
                    TransitionManager.ensureClosed(); // Stay black during load
                    TransitionManager.setCountdownText(val.toString());
                } else if (val === 0 && (previousVal || 0) > 0) {
                    TransitionManager.setCountdownText("GO!");
                }
            });

            // Listen for game start to open the iris
            this.room.state.listen("isGameStarted", (isStarted: boolean) => {
                if (isStarted) {
                    this.isGameStarted = true;
                    TransitionManager.setCountdownText(""); // Clear "GO!" or countdown
                    if (this.isGameReady) {
                        TransitionManager.open();
                    }
                }
            });
        }

        this.room.onMessage('gameEnded', (data: any) => {
            console.log(`[Spectator][Room:${this.room.id}] Game ended. Leaving room and transitioning...`);

            if (this.uiContainer && this.uiContainer.parentNode) {
                document.body.removeChild(this.uiContainer);
            }

            const isHost = this.room.sessionId === this.room.state.hostId;
            this.registry.set('isHost', isHost);
            this.registry.set('leaderboardData', data.rankings);

            // Store sessionId before leaving so LeaderboardScene can still use it
            this.registry.set('mySessionId', this.room.sessionId);

            // Fetch stored options correctly from localStorage as registry might be cleared
            const storedOpts = localStorage.getItem('lastGameOptions');
            const opts = storedOpts ? JSON.parse(storedOpts) : null;
            const storedQ = localStorage.getItem('lastSelectedQuiz');
            const q = storedQ ? JSON.parse(storedQ) : null;

            // Leave the room NOW
            this.room.leave();
            this.registry.set('room', null);

            TransitionManager.close(() => {
                const engine = (window as any).gameInstance;
                if (engine) {
                    engine.destroy(true);
                    (window as any).gameInstance = null;
                }
                import('../leaderboard/page').then((m) => {
                    const manager = new m.HostLeaderboardManager();
                    manager.start({
                        rankings: data.rankings,
                        isHost: isHost,
                        mySessionId: this.room.sessionId,
                        lastGameOptions: opts,
                        lastSelectedQuiz: q
                    });
                });
            });
        });
    }

    preload() {
        console.log("[Spectator] Preloading...");
        if (!this.room) return;
        // Determine map based on difficulty
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
        console.log(`[HostProgressScene][Preload] Loading Map. Difficulty: ${difficulty}, MapKey: ${mapKey}, MapFile: ${mapFile}`);
        this.load.tilemapTiledJSON(mapKey, `/assets/${mapFile}${cb}`);
        
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
    }

    private async yieldThread() {
        return new Promise(resolve => setTimeout(resolve, 0));
    }

    async create() {
        console.log(`[Spectator][Room:${this.room?.id}] Creating... SessionId: ${this.room?.sessionId}`);
        if (!this.room) {
            console.error("[Spectator] Create failed: No room!");
            return;
        }

        // --- Map Rendering ---
        const difficulty = this.room.state.difficulty;
        const mapKey = difficulty === 'sedang' ? 'map_medium' : difficulty === 'sulit' ? 'map_hard' : 'map_easy';

        this.map = this.make.tilemap({ key: mapKey });
        await this.yieldThread(); // Menerapkan Teknik Time-Slicing agar UI tetap responsif
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
            this.map.layers.forEach((layerData, index) => {
                try {
                    const existingLayer = this.map.getLayer(layerData.name);
                    if (existingLayer && existingLayer.tilemapLayer) return;

                    this.map.createLayer(layerData.name, tilesets, 0, 0);
                } catch (e) {
                    console.log("Error creating layer safely handled:", e);
                }
            });
        }

        // Texture Filtering for sharp pixels
        if (this.textures.exists('tiles')) this.textures.get('tiles').setFilter(Phaser.Textures.FilterMode.NEAREST);
        if (this.textures.exists('forest_tiles')) this.textures.get('forest_tiles').setFilter(Phaser.Textures.FilterMode.NEAREST);
        if (this.textures.exists('coracle_tiles')) this.textures.get('coracle_tiles').setFilter(Phaser.Textures.FilterMode.NEAREST);
        if (this.textures.exists('windmill_tiles')) this.textures.get('windmill_tiles').setFilter(Phaser.Textures.FilterMode.NEAREST);

        // --- Animations ---
        await this.yieldThread(); // Mencicil proses pembuatan texturing dan animasi
        if (!this.anims.exists('idle')) {
            this.anims.create({
                key: 'idle', frames: this.anims.generateFrameNumbers('base_idle', { start: 0, end: 8 }), frameRate: 10, repeat: -1
            });
            this.anims.create({
                key: 'walk', frames: this.anims.generateFrameNumbers('character', { start: 0, end: 7 }), frameRate: 10, repeat: -1
            });
            // Tools Anims
            this.anims.create({
                key: 'tools_idle', frames: this.anims.generateFrameNumbers('tools_idle', { start: 0, end: 8 }), frameRate: 10, repeat: -1
            });
            this.anims.create({
                key: 'tools_walk', frames: this.anims.generateFrameNumbers('tools_walk', { start: 0, end: 7 }), frameRate: 10, repeat: -1
            });
            // Attack Anims
            this.anims.create({
                key: 'base_attack', frames: this.anims.generateFrameNumbers('base_attack', { start: 0, end: 9 }), frameRate: 15, repeat: 0
            });
            this.anims.create({
                key: 'tools_attack', frames: this.anims.generateFrameNumbers('tools_attack', { start: 0, end: 9 }), frameRate: 15, repeat: 0
            });
        }
        const hairKeys = ['bowlhair', 'curlyhair', 'longhair', 'mophair', 'shorthair', 'spikeyhair'];
        hairKeys.forEach(key => {
            if (!this.anims.exists(`${key}_idle`)) {
                this.anims.create({
                    key: `${key}_walk`, frames: this.anims.generateFrameNumbers(`${key}_walk`, { start: 0, end: 7 }), frameRate: 10, repeat: -1
                });
                this.anims.create({
                    key: `${key}_idle`, frames: this.anims.generateFrameNumbers(`${key}_idle`, { start: 0, end: 8 }), frameRate: 10, repeat: -1
                });
                this.anims.create({
                    key: `${key}_attack`, frames: this.anims.generateFrameNumbers(`${key}_attack`, { start: 0, end: 9 }), frameRate: 15, repeat: 0
                });
            }
        });

        // --- Camera Setup ---
        await this.yieldThread(); // Mencicil proses kalkulasi viewport
        const updateCamera = () => {
            if (!this.cameras || !this.cameras.main || !this.map) return;

            const mapW = this.map.widthInPixels || (this.map.width * this.map.tileWidth);
            const mapH = this.map.heightInPixels || (this.map.height * this.map.tileHeight);

            const zoomX = this.scale.width / mapW;
            const zoomY = this.scale.height / mapH;
            
            // We want to "cover" the screen, so take the MAX zoom. 
            // If it's a mobile screen, we want it to be even a bit closer.
            const isMobile = window.innerWidth <= 768;
            this.minZoom = Math.max(zoomX, zoomY);
            
            if (isMobile && this.minZoom < 1.0) this.minZoom = 1.0; 

            this.cameras.main.setBackgroundColor('#1a1a1a');
            this.cameras.main.centerOn(mapW / 2, mapH / 2);
            this.cameras.main.setZoom(this.minZoom);
            this.cameras.main.setBounds(0, 0, mapW, mapH);
        };

        updateCamera();

        // --- Restore Drag and Zoom ---
        this.input.on('wheel', (pointer: Phaser.Input.Pointer, gameObjects: any, deltaX: number, deltaY: number, deltaZ: number) => {
            const newZoom = this.cameras.main.zoom - (deltaY * 0.001);
            this.cameras.main.setZoom(Phaser.Math.Clamp(newZoom, this.minZoom, 3.0));
        });

        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (pointer.rightButtonDown() || pointer.leftButtonDown()) {
                this.isDragPan = true;
                this.dragOrigin = new Phaser.Math.Vector2(pointer.x, pointer.y);
            }
        });

        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (this.isDragPan && this.dragOrigin) {
                const deltaX = pointer.x - this.dragOrigin.x;
                const deltaY = pointer.y - this.dragOrigin.y;
                if (this.cameras && this.cameras.main && this.cameras.main.zoom > 0) {
                    this.cameras.main.scrollX -= deltaX / this.cameras.main.zoom;
                    this.cameras.main.scrollY -= deltaY / this.cameras.main.zoom;
                }
                this.dragOrigin.set(pointer.x, pointer.y);
            }
        });

        this.input.on('pointerup', () => this.isDragPan = false);
        this.input.on('pointerupoutside', () => this.isDragPan = false);

        // Handle Window Resize
        this.resizeListener = () => {
            updateCamera();
        };
        this.scale.on('resize', this.resizeListener);

        // --- UI Initialization ---
        this.createUI();
        OrientationManager.requireLandscape();

        // --- Player Sync ---
        const handlePlayerAdd = (player: any, sessionId: string) => {
            if (player.isHost) return;
            const container = this.add.container(player.x, player.y);
            container.setDepth(100);
            container.setScale(2.5); // Diperbesar lagi agar karakter lebih dominan/jelas

            const baseSprite = this.add.sprite(0, 0, 'character').play('idle');
            const toolsSprite = this.add.sprite(0, 0, 'tools_idle').play('tools_idle');
            const hairSprite = this.add.sprite(0, 0, '').setVisible(false);

            container.add([baseSprite, toolsSprite, hairSprite]);
            container.setData({ baseSprite, toolsSprite, hairSprite, subRoomId: player.subRoomId });

            this.createNameTag(sessionId, player.name || 'Player', container);
            this.playerEntities[sessionId] = container;

            const updateHair = () => {
                const hairId = player.hairId || 0;
                import('../../../data/characterData').then(({ getHairById }) => {
                    const h = getHairById(hairId);
                    if (h && h.id > 0) {
                        const hPrefix = h.idleKey.split('_')[0];
                        container.setData('hairPrefix', hPrefix);
                        if (!player.isAttacking) {
                            hairSprite.setTexture(`${hPrefix}_idle`).play(`${hPrefix}_idle`, true);
                        }
                        hairSprite.setVisible(true);
                    } else {
                        hairSprite.setVisible(false);
                    }
                });
            };

            updateHair();
            this.disposers.push(player.onChange(() => {
                // Determine movement direction and state BEFORE moving
                const dx = player.x - container.x;
                const dy = player.y - container.y;
                const isMoving = Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1;

                container.setPosition(player.x, player.y);

                // Attack takes priority
                if (player.isAttacking) {
                    if (baseSprite.anims.currentAnim?.key !== 'base_attack') baseSprite.play('base_attack', true);
                    if (toolsSprite.anims.currentAnim?.key !== 'tools_attack') toolsSprite.play('tools_attack', true);
                    
                    const hPrefix = container.getData('hairPrefix');
                    if (hPrefix) {
                        const attackKey = `${hPrefix}_attack`;
                        if (hairSprite.anims.currentAnim?.key !== attackKey) {
                            hairSprite.play(attackKey, true);
                        }
                    }
                    
                    // Allow flipping while attacking if also moving
                    if (Math.abs(dx) > 0.1) {
                        const flip = dx < 0;
                        baseSprite.setFlipX(flip);
                        toolsSprite.setFlipX(flip);
                        hairSprite.setFlipX(flip);
                    }
                } 
                // Walk animation
                else if (isMoving) {
                    if (baseSprite.anims.currentAnim?.key !== 'walk') baseSprite.play('walk', true);
                    if (toolsSprite.anims.currentAnim?.key !== 'tools_walk') toolsSprite.play('tools_walk', true);
                    
                    const hPrefix = container.getData('hairPrefix');
                    if (hPrefix) {
                        const walkKey = `${hPrefix}_walk`;
                        if (hairSprite.anims.currentAnim?.key !== walkKey) {
                            hairSprite.play(walkKey, true);
                        }
                    }

                    const flip = dx < 0;
                    if (Math.abs(dx) > 0.1) {
                        baseSprite.setFlipX(flip);
                        toolsSprite.setFlipX(flip);
                        hairSprite.setFlipX(flip);
                    }
                } 
                // Idle animation
                else {
                    if (baseSprite.anims.currentAnim?.key !== 'idle') baseSprite.play('idle', true);
                    if (toolsSprite.anims.currentAnim?.key !== 'tools_idle') toolsSprite.play('tools_idle', true);
                    
                    const hPrefix = container.getData('hairPrefix');
                    if (hPrefix) {
                        const idleKey = `${hPrefix}_idle`;
                        if (hairSprite.anims.currentAnim?.key !== idleKey) {
                            hairSprite.play(idleKey, true);
                        }
                    }
                }
            }));
            this.disposers.push(player.listen("hairId", updateHair));

            const updateProgress = () => {
                const tag = container.getByName('nameTag') as Phaser.GameObjects.Text;
                const progressBar = container.getByName('progressBar') as Phaser.GameObjects.Graphics;

                const answered = player.answeredQuestions || 0;

                // Get dynamic target from room state
                const qLimit = this.room.state.questionLimit;
                const target = (qLimit === 'all' || !qLimit)
                    ? this.room.state.questions.length
                    : parseInt(qLimit) || 5;

                const progress = Phaser.Math.Clamp(answered / target, 0, 1);

                if (tag) tag.setText(player.name || 'Player');

                if (progressBar) {
                    progressBar.clear();
                    progressBar.fillStyle(0x000000, 0.5);
                    progressBar.fillRect(0, 0, 36, 5);
                    progressBar.fillStyle(0x00ff88, 1);
                    progressBar.fillRect(0, 0, 36 * progress, 5);
                    progressBar.lineStyle(1, 0x000000, 1);
                    progressBar.strokeRect(0, 0, 36, 5);
                }
            };
            updateProgress();

            this.disposers.push(player.listen("x", (val: number) => container.setData('targetX', val)));
            this.disposers.push(player.listen("y", (val: number) => container.setData('targetY', val)));
            this.disposers.push(player.onChange(() => {
                updateProgress();
            }));
        };

        this.disposers.push(this.room.state.players.onAdd(handlePlayerAdd));
        this.disposers.push(this.room.state.players.onRemove((p: any, id: string) => {
            if (this.playerEntities[id]) {
                this.playerEntities[id].destroy();
                delete this.playerEntities[id];
            }
        }));

        this.time.delayedCall(500, () => this.focusOnAllPlayers());
        
        // --- OPTIMIZATION: Wait for Game Start ---
        // TransitionManager.open() is now handled in init() via the isGameStarted listener
        // to ensure it only opens when the countdown hits 0.
        this.isGameReady = true; 
        if (this.room.state.isGameStarted) {
            TransitionManager.open();
        }
    }

    createUI() {
        if (this.uiContainer && this.uiContainer.parentNode) {
            this.uiContainer.parentNode.removeChild(this.uiContainer);
        }

        this.uiContainer = document.createElement('div');
        this.uiContainer.id = 'host-spectator-ui';
        this.uiContainer.style.cssText = `
            position: fixed;
            inset: 0;
            pointer-events: none;
            display: flex;
            flex-direction: column;
            padding: 20px 40px;
            font-family: 'Retro Gaming', monospace;
            color: white;
            z-index: 9999;
            background: transparent;
        `;

        this.uiContainer.innerHTML = `
            <img src="/logo/Zigma-logo-fix.webp" class="absolute top-[-10px] md:top-[-30px] left-[-15px] md:left-[-40px] w-32 md:w-64 z-20 object-contain pointer-events-none" />
            <img src="/logo/gameforsmart-logo-fix.webp" class="absolute top-[-15px] md:top-[-45px] right-0 md:right-[-15px] w-40 md:w-80 z-20 object-contain pointer-events-none" />

            <div class="absolute top-[20px] md:top-[30px] left-1/2 -translate-x-1/2 flex items-center gap-2 md:gap-4">
                <span id="timer-icon" class="material-symbols-outlined text-[32px] md:text-[48px] text-white drop-shadow-md">timer</span>
                <span id="game-timer" class="text-[32px] md:text-[48px] text-white font-bold" style="
                    text-shadow: 
                        -2px -2px 0 #000,  
                         2px -2px 0 #000,
                        -2px  2px 0 #000,
                         2px  2px 0 #000,
                         0 0 15px rgba(255,255,255,0.2);
                ">${String(this.room.state.totalTimeMinutes || 5).padStart(2, '0')}:00</span>
            </div>

            <button id="spec-volume-btn" class="absolute bottom-4 md:bottom-10 left-4 md:left-10 bg-black/60 border-2 border-[#00ff88]/30 text-[#00ff88] w-12 h-12 md:w-16 md:h-16 rounded-full cursor-pointer flex items-center justify-center pointer-events-auto backdrop-blur-sm transition-all duration-200">
                <span id="volume-icon" class="material-symbols-outlined text-[24px] md:text-[32px]">volume_up</span>
            </button>

            <button id="spec-end-btn" class="absolute bottom-4 md:bottom-10 right-4 md:right-10 bg-[#ff0055] border-none px-4 py-2 md:px-9 md:py-4 text-white cursor-pointer font-inherit text-xs md:text-sm uppercase rounded-xl pointer-events-auto transition-all duration-75 tracking-widest shadow-[0_4px_0_#990033] md:shadow-[0_6px_0_#990033] active:translate-y-1 active:shadow-none">
                Akhiri Game
            </button>
        `;

        document.body.appendChild(this.uiContainer);

        const endBtn = document.getElementById('spec-end-btn');
        if (endBtn) endBtn.onclick = () => this.showEndGamePopup();

        const volumeBtn = document.getElementById('spec-volume-btn');
        const volumeIcon = document.getElementById('volume-icon');
        if (volumeBtn && volumeIcon) {
            volumeBtn.onclick = () => {
                this.isMuted = !this.isMuted;
                volumeIcon.innerText = this.isMuted ? 'volume_off' : 'volume_up';
            };
        }

        this.events.once('shutdown', () => {
            if (this.resizeListener) this.scale.off('resize', this.resizeListener);
            this.disposers.forEach(d => d());
            this.disposers = [];
            if (this.uiContainer && this.uiContainer.parentNode) document.body.removeChild(this.uiContainer);
            OrientationManager.disable();
        });
    }


    showEndGamePopup() {
        const overlay = document.createElement('div');
        overlay.id = 'popup-overlay';
        overlay.style.cssText = `
            position: fixed; inset: 0; background: rgba(0, 0, 0, 0.85); backdrop-filter: blur(8px);
            z-index: 10001; display: flex; align-items: center; justify-content: center;
            font-family: 'Retro Gaming', monospace; opacity: 0; transition: opacity 0.25s ease; pointer-events: auto;
        `;

        const popup = document.createElement('div');
        popup.style.cssText = `
            width: 480px; background: #1a1a1b; border: 3px solid #ff4444; border-radius: 24px;
            padding: 45px 25px; box-shadow: 0 0 40px rgba(255, 68, 68, 0.25); display: flex;
            flex-direction: column; align-items: center; text-align: center; position: relative;
            transform: translateY(20px); transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        `;

        popup.innerHTML = `
            <div style="color: #ff4444; margin-bottom: 25px; filter: drop-shadow(0 0 10px rgba(255,68,68,0.5));">
                <span class="material-symbols-outlined" style="font-size: 72px; font-variation-settings: 'FILL' 1;">warning</span>
            </div>
            <h2 style="color: white; font-size: 22px; margin: 0 0 15px 0; text-transform: uppercase;">END GAME?</h2>
            <p style="color: #aaa; font-size: 10px; line-height: 1.8; margin: 0 0 40px 0; max-width: 85%;">This will terminate the current session.</p>
            <div style="display: flex; gap: 24px; width: 100%; justify-content: center;">
                <button id="popup-no" style="background: #2a2a2a; border: none; color: #fff; padding: 18px 45px; border-radius: 12px; cursor: pointer; text-transform: uppercase;">NO</button>
                <button id="popup-yes" style="background: #ff4444; border: none; color: white; padding: 18px 45px; border-radius: 12px; cursor: pointer; text-transform: uppercase;">YES</button>
            </div>
        `;

        overlay.appendChild(popup);
        document.body.appendChild(overlay);
        overlay.offsetHeight; overlay.style.opacity = '1'; popup.style.transform = 'translateY(0)';

        const closePopup = () => {
            overlay.style.opacity = '0'; popup.style.transform = 'translateY(20px)';
            setTimeout(() => overlay.remove(), 300);
        };

        (popup.querySelector('#popup-yes') as HTMLElement).onclick = () => {
            if (this.room && this.room.connection.isOpen) this.room.send('hostEndGame');
            closePopup();
        };
        (popup.querySelector('#popup-no') as HTMLElement).onclick = closePopup;
        overlay.onclick = (e) => { if (e.target === overlay) closePopup(); };
    }

    updateTimer(remainingMs: number) {
        const totalSeconds = Math.ceil(remainingMs / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        const timerElement = document.getElementById('game-timer');
        if (timerElement) timerElement.innerText = formatted;
    }

    focusOnAllPlayers() {
        if (this.map) {
            // Karena ini tampilan statis keutuhan peta, pastikan tetap terkunci di pusat
            this.cameras.main.pan(this.map.widthInPixels / 2, this.map.heightInPixels / 2, 800, 'Power2');
        }
    }

    update(time: number, delta: number) {
        if (!this.room || !this.room.state) return;
        try {
            Object.keys(this.playerEntities).forEach(sessionId => {
                const container = this.playerEntities[sessionId];
                if (!container || !container.active) return;
                const tx = container.getData('targetX');
                const ty = container.getData('targetY');
                if (tx !== undefined && ty !== undefined) {
                    container.x += (tx - container.x) * 0.1;
                    container.y += (ty - container.y) * 0.1;

                    const dx = tx - container.x;
                    const base = container.getData('baseSprite') as Phaser.GameObjects.Sprite;
                    const hair = container.getData('hairSprite') as Phaser.GameObjects.Sprite;

                    if (Math.abs(dx) > 0.5) {
                        base.play('walk', true);
                        base.setFlipX(dx < 0);
                        hair.setFlipX(dx < 0);
                        const player = this.room.state.players.get(sessionId);
                        if (player && player.hairId > 1) {
                            import('../../../data/characterData').then(({ getHairById }) => {
                                const h = getHairById(player.hairId);
                                if (h && hair.anims) hair.play(h.walkKey, true);
                            });
                        }
                    } else {
                        base.play('idle', true);
                        const player = this.room.state.players.get(sessionId);
                        if (player && player.hairId > 1) {
                            import('../../../data/characterData').then(({ getHairById }) => {
                                const h = getHairById(player.hairId);
                                if (h && hair.anims) hair.play(h.idleKey, true);
                            });
                        }
                    }
                }
            });
        } catch (e) { }
    }

    createNameTag(sessionId: string, name: string, container: Phaser.GameObjects.Container) {
        // Render font lebih besar dengan resolusi lebih tinggi lalu di-scale agar tetap tajam (anti-blur)
        // Lowered position from -38 to -25 to be closer to player head
        const nameText = this.add.text(0, -25, name, { fontSize: '24px', fontFamily: '"Retro Gaming"', color: '#ffffff', stroke: '#000000', strokeThickness: 4, resolution: 2 }).setOrigin(0.5, 0.5).setScale(0.5);
        nameText.setName('nameTag');

        // Progress bar tepat di bawah nama (jarak ~6px dalam skala container)
        // Lowered progress bar from -30 to -17
        const progressBar = this.add.graphics({ x: -18, y: -17 });
        progressBar.setName('progressBar');

        container.add([nameText, progressBar]);
    }
}
