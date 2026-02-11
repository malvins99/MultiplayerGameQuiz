import Phaser from 'phaser';
import { Room } from 'colyseus.js';
import { Router } from '../utils/Router';
import { TransitionManager } from '../utils/TransitionManager';

export class HostSpectatorScene extends Phaser.Scene {
    room!: Room;
    map!: Phaser.Tilemaps.Tilemap;
    playerEntities: { [sessionId: string]: Phaser.GameObjects.Container } = {};
    activeSubRoomIndex: number = 0;
    subRoomIds: string[] = [];
    isDragPan: boolean = false;
    dragOrigin!: Phaser.Math.Vector2;
    uiContainer!: HTMLDivElement;
    disposers: Array<() => void> = [];
    minZoom: number = 0.8;

    constructor() {
        super('HostSpectatorScene');
    }

    init(data: { room: Room, targetRoomIndex?: number }) {
        this.room = data.room;
        if (data.targetRoomIndex !== undefined) {
            this.activeSubRoomIndex = data.targetRoomIndex;
        }
    }

    preload() {
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
        // --- Map Rendering ---
        const difficulty = this.room.state.difficulty;
        const mapKey = difficulty === 'sedang' ? 'map_medium' : difficulty === 'sulit' ? 'map_hard' : 'map_easy';

        this.map = this.make.tilemap({ key: mapKey });
        const tileset1 = this.map.addTilesetImage('spr_tileset_sunnysideworld_16px', 'tiles');
        const tileset2 = this.map.addTilesetImage('spr_tileset_sunnysideworld_forest_32px', 'forest_tiles');

        const tilesets: Phaser.Tilemaps.Tileset[] = [];
        if (tileset1) tilesets.push(tileset1);
        if (tileset2) tilesets.push(tileset2);

        if (tilesets.length > 0) {
            this.map.layers.forEach(layerData => {
                try {
                    this.map.createLayer(layerData.name, tilesets, 0, 0);
                } catch (e) {
                    console.warn(`Skipping layer: ${layerData.name}`);
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
        this.minZoom = Math.max(this.scale.width / this.map.widthInPixels, this.scale.height / this.map.heightInPixels);

        this.cameras.main.centerOn(this.map.widthInPixels / 2, this.map.heightInPixels / 2);
        this.cameras.main.setZoom(Math.max(0.8, this.minZoom));
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

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
        this.refreshSubRooms();
        this.createUI();

        // --- Room Sync ---
        this.disposers.push(this.room.state.subRooms.onAdd(() => this.refreshSubRooms()));
        this.disposers.push(this.room.state.subRooms.onRemove(() => this.refreshSubRooms()));

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

            this.disposers.push(player.onChange(() => {
                container.setData({ subRoomId: player.subRoomId, targetX: player.x, targetY: player.y });
                const tag = container.getByName('nameTag') as Phaser.GameObjects.Text;
                if (tag) tag.setText(`${player.name} (${player.correctAnswers})`);
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
    }

    // Adding helper for background if needed, but let's just stick to UI update
    createUI() {
        // Clean up any existing UI
        if (this.uiContainer && this.uiContainer.parentNode) {
            this.uiContainer.parentNode.removeChild(this.uiContainer);
        }

        this.uiContainer = document.createElement('div');
        this.uiContainer.id = 'host-spectator-ui';

        // Spotlight Style (reused from Progress)
        const style = document.createElement('style');
        style.innerHTML = `
            .spotlight-container {
                position: absolute;
                top: -100px; left: 50%;
                transform: translateX(-50%);
                width: 600px; 
                height: 500px;
                pointer-events: none;
                z-index: 0;
            }
            .spotlight-beam {
                width: 100%; height: 100%;
                background: conic-gradient(from 0deg at 50% 0%, transparent 160deg, rgba(255, 255, 255, 0.08) 180deg, transparent 200deg);
                filter: blur(25px);
                animation: flicker 4s infinite alternate;
            }
        `;
        document.head.appendChild(style);

        this.uiContainer.style.cssText = `
            position: fixed;
            inset: 0;
            pointer-events: none; /* Let clicks pass to map except for buttons */
            display: flex;
            flex-direction: column;
            padding: 40px 60px;
            font-family: 'Press Start 2P', monospace;
            color: white;
            z-index: 100;
        `;

        const currentRoomName = this.subRoomIds[this.activeSubRoomIndex] || `Room ${this.activeSubRoomIndex + 1}`;

        this.uiContainer.innerHTML = `
            <div class="spotlight-container">
                <div class="spotlight-beam"></div>
            </div>

            <!-- Header (Logo Spacer + Dynamic Room Title) -->
            <div style="display: flex; align-items: center; justify-content: center; position: relative; margin-bottom: 20px; width: 100%;">
                <div style="position: absolute; left: 0; width: 200px; height: 50px; opacity: 0.5;"></div>
                <h1 id="spectator-title" style="font-size: 32px; text-transform: uppercase; color: #00ff88; tracking-widest; margin: 0; font-family: 'Press Start 2P'; text-shadow: 0 0 30px rgba(0,255,136,0.3); pointer-events: auto;">
                    ${currentRoomName}
                </h1>
            </div>

            <!-- Top Bar: Timer & Controls -->
            <div style="max-width: 1200px; width: 100%; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; padding: 12px 28px; background: rgba(0,0,0,0.4); border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); pointer-events: auto; backdrop-filter: blur(8px);">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span class="material-symbols-outlined" style="font-size: 28px; color: #00ff88;">timer</span>
                    <span id="game-timer" style="font-size: 18px; color: #00ff88;">05:00</span>
                </div>
                <button id="spec-end-btn" class="pixel-btn-red" style="background: #ff0055; border: 2px solid white; padding: 10px 20px; color: white; cursor: pointer; font-family: inherit; font-size: 10px; text-transform: uppercase; border-radius: 8px;">
                    Akhiri Game
                </button>
            </div>

            <!-- Floating Side Navs (Sequence Logic) - v6 Fix: Floating Absolute -->
            <button id="spec-prev-btn" style="
                position: absolute; left: -60px; top: 50%; transform: translateY(-50%);
                background: none; border: none; 
                color: #00ff88; 
                display: flex; align-items: center; justify-content: center; 
                cursor: pointer; pointer-events: auto;
                filter: drop-shadow(0 0 10px rgba(0,255,136,0.4));
                z-index: 10;">
                <span class="material-symbols-outlined" style="font-size: 64px;">chevron_left</span>
            </button>

            <button id="spec-next-btn" style="
                position: absolute; right: -60px; top: 50%; transform: translateY(-50%);
                background: none; border: none; 
                color: #00ff88; 
                display: flex; align-items: center; justify-content: center; 
                cursor: pointer; pointer-events: auto;
                filter: drop-shadow(0 0 10px rgba(0,255,136,0.4));
                z-index: 10;
                ${this.activeSubRoomIndex >= this.subRoomIds.length - 1 ? 'opacity: 0.1; cursor: not-allowed; pointer-events: none;' : ''}">
                <span class="material-symbols-outlined" style="font-size: 64px;">chevron_right</span>
            </button>
        `;

        document.body.appendChild(this.uiContainer);

        // First frame focus? Wait 1 frame for positions to settle
        this.time.delayedCall(100, () => this.focusOnRoomPlayers());

        const handlePrev = () => {
            if (this.activeSubRoomIndex === 0) {
                // Back to Progress
                import('../utils/TransitionManager').then(({ TransitionManager }) => {
                    TransitionManager.sceneTo(this, 'HostProgressScene', { room: this.room });
                });
            } else {
                // Prev Room
                this.activeSubRoomIndex--;
                this.createUI();
            }
        };

        const handleNext = () => {
            if (this.activeSubRoomIndex < this.subRoomIds.length - 1) {
                this.activeSubRoomIndex++;
                this.createUI();
                this.focusOnRoomPlayers();
            }
        };

        // Bindings
        document.getElementById('spec-prev-btn')!.onclick = handlePrev;
        document.getElementById('spec-next-btn')!.onclick = handleNext;

        // v5: Keyboard Navigation Support
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                handlePrev();
            } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                handleNext();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        this.events.once('shutdown', () => {
            window.removeEventListener('keydown', handleKeyDown);
            this.disposers.forEach(d => d());
            this.disposers = [];
            if (this.uiContainer && this.uiContainer.parentNode) {
                document.body.removeChild(this.uiContainer);
            }
        });

        document.getElementById('spec-end-btn')!.onclick = () => {
            if (confirm('Akhiri game untuk SEMUA?')) {
                this.room.send('hostEndGame');
            }
        };
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

    focusOnRoomPlayers() {
        if (this.subRoomIds.length === 0) return;
        const currentRoomId = this.subRoomIds[this.activeSubRoomIndex];

        // Find all player containers belonging to this room
        const playersInRoom: Phaser.GameObjects.Container[] = [];
        Object.values(this.playerEntities).forEach(container => {
            if (container.getData('subRoomId') === currentRoomId) {
                playersInRoom.push(container);
            }
        });

        if (playersInRoom.length > 0) {
            // Focus on the first player found
            const target = playersInRoom[0];
            this.cameras.main.pan(target.x, target.y, 800, 'Power2');
        } else {
            // Pan to center if empty
            this.cameras.main.pan(this.map.widthInPixels / 2, this.map.heightInPixels / 2, 800, 'Power2');
        }
    }

    updateRoomLabel() {
        const titleEl = document.getElementById('spectator-title');
        if (titleEl) {
            const currentName = this.subRoomIds[this.activeSubRoomIndex] || `Room ${this.activeSubRoomIndex + 1}`;
            titleEl.innerText = currentName;
        }
    }

    update(time: number, delta: number) {
        // Filter visibility based on active room
        const currentRoomId = this.subRoomIds[this.activeSubRoomIndex];

        Object.keys(this.playerEntities).forEach(sessionId => {
            const container = this.playerEntities[sessionId];
            const subRoomId = container.getData('subRoomId');

            // Visibility Check
            const isVisible = subRoomId === currentRoomId;
            container.setVisible(isVisible);

            // Interpolation
            if (isVisible) {
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
                        // hair play walk... (simplified)
                    } else {
                        base.play('idle', true);
                    }
                }
            }
        });
    }

    refreshSubRooms() {
        this.subRoomIds = this.room.state.subRooms.map((s: any) => s.id);
        // Ensure index is valid after refresh
        if (this.activeSubRoomIndex >= this.subRoomIds.length && this.subRoomIds.length > 0) {
            this.activeSubRoomIndex = this.subRoomIds.length - 1;
        }
    }

    createNameTag(sessionId: string, name: string, container: Phaser.GameObjects.Container) {
        const text = this.add.text(0, -40, name, {
            fontSize: '14px',
            fontFamily: '"Press Start 2P"',
            color: '#00ff88',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        text.setName('nameTag');
        container.add(text);
    }
}
