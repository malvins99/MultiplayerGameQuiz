import Phaser from 'phaser';
import { Room } from 'colyseus.js';
import { Router } from '../utils/Router';
import { TransitionManager } from '../utils/TransitionManager';

export class HostSpectatorScene extends Phaser.Scene {
    room!: Room;
    map!: Phaser.Tilemaps.Tilemap;
    playerEntities: { [sessionId: string]: Phaser.GameObjects.Container } = {};
    isDragPan: boolean = false;
    dragOrigin!: Phaser.Math.Vector2;
    uiContainer!: HTMLDivElement;
    disposers: Array<() => void> = [];
    minZoom: number = 0.8;

    constructor() {
        super('HostSpectatorScene');
    }

    init(data: { room: Room }) {
        console.log("[Spectator] Initializing with data:", data);
        if (!data || !data.room) {
            console.error("[Spectator] No room data provided! Redirecting to lobby...");
            window.location.href = '/';
            return;
        }
        this.room = data.room;
    }

    preload() {
        console.log("[Spectator] Preloading...");
        if (!this.room) return;
        // Determine map based on difficulty
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
        this.load.image('forest_tiles', '/assets/spr_tileset_sunnysideworld_forest_32px.png');
        this.load.spritesheet('character', '/assets/base_walk_strip8.png', { frameWidth: 96, frameHeight: 64 });
        this.load.spritesheet('base_idle', '/assets/base_idle_strip9.png', { frameWidth: 96, frameHeight: 64 });

        const hairKeys = ['bowlhair', 'curlyhair', 'longhair', 'mophair', 'shorthair', 'spikeyhair'];
        hairKeys.forEach(key => {
            this.load.spritesheet(`${key}_walk`, `/assets/${key}_walk_strip8.png`, { frameWidth: 96, frameHeight: 64 });
            this.load.spritesheet(`${key}_idle`, `/assets/${key}_idle_strip9.png`, { frameWidth: 96, frameHeight: 64 });
        });
    }

    create() {
        console.log("[Spectator] Creating...");
        if (!this.room) {
            console.error("[Spectator] Create failed: No room!");
            return;
        }

        // --- Map Rendering ---
        const difficulty = this.room.state.difficulty;
        console.log("[Spectator] Difficulty:", difficulty);
        const mapKey = difficulty === 'sedang' ? 'map_medium' : difficulty === 'sulit' ? 'map_hard' : 'map_easy';
        console.log("[Spectator] Loading map with key:", mapKey);

        this.map = this.make.tilemap({ key: mapKey });
        const tileset1 = this.map.addTilesetImage('spr_tileset_sunnysideworld_16px', 'tiles');
        const tileset2 = this.map.addTilesetImage('spr_tileset_sunnysideworld_forest_32px', 'forest_tiles');

        if (!tileset1 && !tileset2) {
            console.error("[Spectator] Failed to load tilesets! Check map keys.");
        }

        const tilesets: Phaser.Tilemaps.Tileset[] = [];
        if (tileset1) tilesets.push(tileset1);
        if (tileset2) tilesets.push(tileset2);

        if (tilesets.length > 0) {
            console.log(`[Spectator] Iterating through ${this.map.layers.length} layers...`);
            this.map.layers.forEach((layerData, index) => {
                try {
                    // Try to create the layer. createLayer handles the name vs index properly.
                    const layer = this.map.createLayer(layerData.name, tilesets, 0, 0);
                    if (layer) {
                        console.log(`[Spectator] Successfully rendered layer: ${layerData.name}`);
                    } else {
                        console.warn(`[Spectator] Layer created as null: ${layerData.name}`);
                    }
                } catch (e) {
                    // This might happen for object layers or groups if Phaser doesn't flatten them as expected
                    console.log(`[Spectator] Note: Could not render layer '${layerData.name}' as a tile layer. This is normal for object/group layers.`);
                }
            });
        }

        // --- Animations ---
        if (!this.anims.exists('idle')) {
            this.anims.create({
                key: 'idle', frames: this.anims.generateFrameNumbers('base_idle', { start: 0, end: 8 }), frameRate: 10, repeat: -1
            });
            this.anims.create({
                key: 'walk', frames: this.anims.generateFrameNumbers('character', { start: 0, end: 7 }), frameRate: 10, repeat: -1
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
            }
        });

        // --- Camera Setup ---
        const mapW = this.map.widthInPixels || 1920;
        const mapH = this.map.heightInPixels || 1080;
        this.minZoom = Math.max(this.scale.width / mapW, this.scale.height / mapH);

        console.log(`[Spectator] Map size: ${mapW}x${mapH}, Zoom: ${this.minZoom}`);

        this.cameras.main.setBackgroundColor('#1a1a1a');
        this.cameras.main.centerOn(mapW / 2, mapH / 2);
        this.cameras.main.setZoom(Math.max(0.6, this.minZoom));
        this.cameras.main.setBounds(0, 0, mapW, mapH);

        // Drag Pan
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            this.isDragPan = true;
            this.dragOrigin = new Phaser.Math.Vector2(pointer.x, pointer.y);
        });
        this.input.on('pointerup', () => this.isDragPan = false);
        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (this.isDragPan) {
                const cam = this.cameras.main;
                const sensitivity = 1.0 / cam.zoom;
                cam.scrollX -= (pointer.x - this.dragOrigin.x) * sensitivity;
                cam.scrollY -= (pointer.y - this.dragOrigin.y) * sensitivity;
                this.dragOrigin.set(pointer.x, pointer.y);
            }
        });
        this.input.on('wheel', (pointer: any, gO: any, dx: number, dy: number) => {
            const newZoom = this.cameras.main.zoom - dy * 0.001;
            this.cameras.main.setZoom(Phaser.Math.Clamp(newZoom, this.minZoom, 2));
        });

        // --- UI Initialization ---
        this.createUI();

        // --- Player Sync ---
        const handlePlayerAdd = (player: any, sessionId: string) => {
            if (player.isHost) return;
            const container = this.add.container(player.x, player.y);
            container.setDepth(100);

            const baseSprite = this.add.sprite(0, 0, 'character').play('idle');
            const hairSprite = this.add.sprite(0, 0, '').setVisible(false);

            container.add([baseSprite, hairSprite]);
            container.setData({ baseSprite, hairSprite, subRoomId: player.subRoomId });

            this.createNameTag(sessionId, player.name || 'Player', container);
            this.playerEntities[sessionId] = container;
            console.log(`[Spectator] Added player entity: ${sessionId} (${player.name})`);

            // Target questions based on difficulty
            const diff = this.room.state.difficulty;
            const target = diff === 'sedang' ? 10 : diff === 'sulit' ? 20 : 5;

            const updateHair = () => {
                const hairId = player.hairId || 0;
                import('../data/characterData').then(({ getHairById }) => {
                    const h = getHairById(hairId);
                    if (h.id > 0) {
                        const hairFiles: Record<number, string> = { 1: 'bowlhair', 2: 'curlyhair', 3: 'longhair', 4: 'mophair', 5: 'shorthair', 6: 'spikeyhair' };
                        const key = hairFiles[h.id];
                        if (key) {
                            hairSprite.setTexture(`${key}_idle`);
                            hairSprite.setVisible(true);
                            hairSprite.play(`${key}_idle`);
                        }
                    } else hairSprite.setVisible(false);
                });
            };
            updateHair();
            this.disposers.push(player.listen("hairId", updateHair));

            const updateProgress = () => {
                const tag = container.getByName('nameTag') as Phaser.GameObjects.Text;
                if (tag) {
                    const answered = player.answeredQuestions || 0;
                    tag.setText(`${player.name} (${answered}/${target})`);
                }
            };
            updateProgress();

            this.disposers.push(player.onChange(() => {
                container.setData({ targetX: player.x, targetY: player.y });
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

        this.disposers.push(this.room.onMessage('timerUpdate', (data: { remaining: number }) => {
            this.updateTimer(data.remaining);
        }));

        this.disposers.push(this.room.onMessage('gameEnded', (data: any) => {
            if (this.uiContainer && this.uiContainer.parentNode) {
                document.body.removeChild(this.uiContainer);
            }
            this.registry.set('leaderboardData', data.rankings);
            TransitionManager.sceneTo(this, 'LeaderboardScene');
        }));

        this.time.delayedCall(500, () => this.focusOnAllPlayers());

        // --- Open Transition (Critical Fix) ---
        TransitionManager.open();

        console.log("[Spectator] Create finished.");
    }

    // Adding helper for background if needed, but let's just stick to UI update
    createUI() {
        // Clean up any existing UI
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
            font-family: 'Press Start 2P', monospace;
            color: white;
            z-index: 9999; /* Force to top */
            background: transparent;
        `;


        this.uiContainer.innerHTML = `
            <!-- Top Bar: Timer & Controls -->
            <div style="max-width: 1200px; width: 100%; margin: 10px auto 0 auto; display: flex; justify-content: space-between; align-items: center; padding: 12px 28px; background: rgba(0,0,0,0.6); border-radius: 16px; border: 1px solid rgba(0,255,136,0.2); pointer-events: auto; backdrop-filter: blur(8px); box-shadow: 0 4px 20px rgba(0,0,0,0.4);">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span class="material-symbols-outlined" style="font-size: 28px; color: #00ff88;">timer</span>
                    <span id="game-timer" style="font-size: 18px; color: #00ff88;">05:00</span>
                </div>
                <button id="spec-end-btn" style="
                    background: #ff0055; 
                    border: none; 
                    padding: 12px 24px; 
                    color: white; 
                    cursor: pointer; 
                    font-family: inherit; 
                    font-size: 10px; 
                    text-transform: uppercase; 
                    border-radius: 8px; 
                    box-shadow: 0 5px 0 #990033; 
                    transition: all 0.05s;
                    position: relative;
                    outline: none;
                ">
                    Akhiri Game
                </button>
            </div>
            <style>
                #spec-end-btn:active {
                    transform: translateY(3px);
                    box-shadow: 0 2px 0 #990033;
                }
            </style>
        `;

        console.log("[Spectator] UI innerHTML set. Appending to body...");
        document.body.appendChild(this.uiContainer);

        // Bindings
        const endBtn = document.getElementById('spec-end-btn');
        if (endBtn) {
            endBtn.onclick = () => this.showEndGamePopup();
        }

        this.events.once('shutdown', () => {
            this.disposers.forEach(d => d());
            this.disposers = [];
            if (this.uiContainer && this.uiContainer.parentNode) {
                document.body.removeChild(this.uiContainer);
            }
        });

    }

    showEndGamePopup() {
        // Create Overlay
        const overlay = document.createElement('div');
        overlay.id = 'popup-overlay';
        overlay.style.cssText = `
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.85);
            backdrop-filter: blur(8px);
            z-index: 10001;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Press Start 2P', monospace;
            opacity: 0;
            transition: opacity 0.25s ease;
            pointer-events: auto;
        `;

        const popup = document.createElement('div');
        popup.style.cssText = `
            width: 480px;
            background: #1a1a1b;
            border: 3px solid #ff4444;
            border-radius: 24px;
            padding: 45px 25px;
            box-shadow: 0 0 40px rgba(255, 68, 68, 0.25);
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            position: relative;
            transform: translateY(20px);
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        `;

        popup.innerHTML = `
            <!-- Warning Icon -->
            <div style="color: #ff4444; margin-bottom: 25px; filter: drop-shadow(0 0 10px rgba(255,68,68,0.5));">
                <span class="material-symbols-outlined" style="font-size: 72px; font-variation-settings: 'FILL' 1;">warning</span>
            </div>
            
            <h2 style="color: white; font-size: 22px; margin: 0 0 15px 0; text-transform: uppercase; letter-spacing: 2px; text-shadow: 0 0 10px rgba(255,255,255,0.2);">
                END GAME?
            </h2>
            
            <p style="color: #aaa; font-size: 10px; line-height: 1.8; margin: 0 0 40px 0; max-width: 85%;">
                This will terminate the current session and disconnect all players.
            </p>

            <div style="display: flex; gap: 24px; width: 100%; justify-content: center;">
                <button id="popup-no" style="
                    background: #2a2a2a;
                    border: none;
                    color: #fff;
                    padding: 18px 45px;
                    border-radius: 12px;
                    font-family: inherit;
                    font-size: 13px;
                    cursor: pointer;
                    box-shadow: 0 5px 0 #111;
                    transition: all 0.05s;
                    text-transform: uppercase;
                    position: relative;
                ">NO</button>
                <button id="popup-yes" style="
                    background: #ff4444;
                    border: none;
                    color: white;
                    padding: 18px 45px;
                    border-radius: 12px;
                    font-family: inherit;
                    font-size: 13px;
                    cursor: pointer;
                    box-shadow: 0 5px 0 #990000;
                    transition: all 0.05s;
                    text-transform: uppercase;
                    position: relative;
                ">YES</button>
            </div>

            <style>
                #popup-no:hover { background: #333; }
                #popup-yes:hover { background: #ff5555; }
                #popup-no:active, #popup-yes:active {
                    transform: translateY(3px);
                    box-shadow: 0 2px 0 #000;
                }
                #popup-yes:active { box-shadow: 0 2px 0 #660000; }
            </style>
        `;

        overlay.appendChild(popup);
        document.body.appendChild(overlay);

        // Forced reflow for animation
        overlay.offsetHeight;

        overlay.style.opacity = '1';
        popup.style.transform = 'translateY(0)';

        const closePopup = () => {
            overlay.style.opacity = '0';
            popup.style.transform = 'translateY(20px)';
            setTimeout(() => overlay.remove(), 300);
        };

        const yesBtn = popup.querySelector('#popup-yes') as HTMLButtonElement;
        const noBtn = popup.querySelector('#popup-no') as HTMLButtonElement;

        yesBtn.onclick = () => {
            this.room.send('hostEndGame');
            closePopup();
        };
        noBtn.onclick = closePopup;
        overlay.onclick = (e) => { if (e.target === overlay) closePopup(); };
    }

    updateTimer(remainingMs: number) {
        const timerEl = document.getElementById('game-timer');
        if (timerEl) {
            const totalSeconds = Math.ceil(remainingMs / 1000);
            const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
            const s = (totalSeconds % 60).toString().padStart(2, '0');
            timerEl.innerText = `${m}:${s}`;

            if (totalSeconds <= 30) {
                timerEl.style.color = '#ff0055';
            }
        }
    }

    focusOnAllPlayers() {
        // Find all player containers
        const players = Object.values(this.playerEntities);
        if (players.length > 0) {
            // Focus on the first player found
            const target = players[0];
            this.cameras.main.pan(target.x, target.y, 800, 'Power2');
        } else {
            // Pan to center if empty
            this.cameras.main.pan(this.map.widthInPixels / 2, this.map.heightInPixels / 2, 800, 'Power2');
        }
    }


    update(time: number, delta: number) {
        if (!this.room || !this.room.state) return;

        try {
            Object.keys(this.playerEntities).forEach(sessionId => {
                const container = this.playerEntities[sessionId];
                if (!container || !container.active) return;

                // Universal Visibility: All players are visible to host
                container.setVisible(true);

                // Interpolation
                const tx = container.getData('targetX');
                const ty = container.getData('targetY');
                if (tx !== undefined && ty !== undefined) {
                    // Simple lerp (0.1 factor)
                    container.x += (tx - container.x) * 0.1;
                    container.y += (ty - container.y) * 0.1;

                    // Flip & Anim
                    const dx = tx - container.x;
                    const base = container.getData('baseSprite') as Phaser.GameObjects.Sprite;
                    const hair = container.getData('hairSprite') as Phaser.GameObjects.Sprite;

                    if (Math.abs(dx) > 0.5) {
                        base.play('walk', true);
                        base.setFlipX(dx < 0);
                        hair.setFlipX(dx < 0);

                        // Specific hair walk animation matching base
                        const player = this.room.state.players.get(sessionId);
                        if (player && player.hairId > 0) {
                            const hairFiles: Record<number, string> = { 1: 'bowlhair', 2: 'curlyhair', 3: 'longhair', 4: 'mophair', 5: 'shorthair', 6: 'spikeyhair' };
                            const key = hairFiles[player.hairId];
                            if (key) {
                                hair.play(`${key}_walk`, true);
                            }
                        }
                    } else {
                        base.play('idle', true);
                        const player = this.room.state.players.get(sessionId);
                        if (player && player.hairId > 0) {
                            const hairFiles: Record<number, string> = { 1: 'bowlhair', 2: 'curlyhair', 3: 'longhair', 4: 'mophair', 5: 'shorthair', 6: 'spikeyhair' };
                            const key = hairFiles[player.hairId];
                            if (key) {
                                hair.play(`${key}_idle`, true);
                            }
                        }
                    }
                }
            });
        } catch (e) {
            console.error("[Spectator] Update error:", e);
        }
    }

    refreshSubRooms() { }

    createNameTag(sessionId: string, name: string, container: Phaser.GameObjects.Container) {
        const text = this.add.text(0, -42, name, {
            fontSize: '18px', // Slightly larger for clarity
            fontFamily: '"Press Start 2P"',
            color: '#00ff88',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center'
        }).setOrigin(0.5);

        // High resolution for text
        text.setResolution(2);
        text.setScale(0.5); // Scale down to maintain size but with double resolution (sharper)

        text.setName('nameTag');
        container.add(text);
    }
}
