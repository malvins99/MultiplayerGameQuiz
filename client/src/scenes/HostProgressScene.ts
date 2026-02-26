import Phaser from 'phaser';
import { Room } from 'colyseus.js';
import { Router } from '../utils/Router';
import { TransitionManager } from '../utils/TransitionManager';
import { supabaseB, SESSION_TABLE, PARTICIPANT_TABLE } from '../lib/supabaseB';

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
    private resizeListener: (() => void) | null = null;
    
    // Scale faktor untuk mendukung fitur "stretch to fit" jika diperlukan
    mapScaleX: number = 1;
    mapScaleY: number = 1;

    constructor() {
        super('HostProgressScene');
    }

    init(data: { room: Room }) {
        console.log("[HostProgress] Initializing...");
        if (!data || !data.room) {
            window.location.href = '/';
            return;
        }
        this.room = data.room;
        this.registry.set('room', this.room);

        // Listener Timer
        this.room.onMessage('timerUpdate', (data: { remaining: number }) => {
            this.updateTimer(data.remaining);
        });

        // Listener Game Ended dengan sinkronisasi Supabase
        this.room.onMessage('gameEnded', async (data: any) => {
            console.log("[HostProgress] Game Ended. Syncing to Supabase...");
            
            // 1. Sinkronisasi Supabase (Fitur Utama HEAD)
            if (this.room?.state?.roomCode) {
                await this.syncToSupabase(data.rankings);
            }

            // 2. Cleanup UI & Transition
            if (this.uiContainer?.parentNode) {
                document.body.removeChild(this.uiContainer);
            }

            this.registry.set('isHost', true);
            this.registry.set('leaderboardData', data.rankings);
            this.registry.set('mySessionId', this.room.sessionId);

            const roomCode = this.room.state.roomCode || 'unknown';
            this.room.leave();
            
            Router.navigate(`/host/${roomCode}/leaderboard`);
            TransitionManager.sceneTo(this, 'HostLeaderboardScene');
        });
    }

    private async syncToSupabase(rankings: any[]) {
        // Update Session
        await supabaseB.from(SESSION_TABLE).update({
            status: 'finished',
            ended_at: new Date().toISOString()
        }).eq('game_pin', this.room.state.roomCode);

        // Update Participants
        for (const rank of rankings) {
            await supabaseB.from(PARTICIPANT_TABLE).update({
                score: rank.score,
                correct: rank.correctAnswers,
                duration: rank.duration,
                completion: 'finished',
                answers: rank.answers,
                current_question: rank.currentQuestion
            })
            .eq('session_id', (this.room as any).metadata?.sessionId || this.room.roomId)
            .eq('nickname', rank.name);
        }
    }

    preload() {
        const difficulty = this.room.state.difficulty;
        const mapConfig = {
            'sedang': { key: 'map_medium', file: 'map_baru2.tmj' },
            'sulit': { key: 'map_hard', file: 'map_baru3.tmj' },
            'easy': { key: 'map_easy', file: 'map_newest_easy_nomor1.tmj' }
        };
        const config = mapConfig[difficulty as keyof typeof mapConfig] || mapConfig.easy;

        this.load.tilemapTiledJSON(config.key, `/assets/${config.file}`);
        this.load.image('tiles', '/assets/spr_tileset_sunnysideworld_16px.png');
        this.load.image('forest_tiles', '/assets/spr_tileset_sunnysideworld_forest_32px.png');
        this.load.spritesheet('character', '/assets/base_walk_strip8.png', { frameWidth: 96, frameHeight: 64 });
        this.load.spritesheet('base_idle', '/assets/base_idle_strip9.png', { frameWidth: 96, frameHeight: 64 });
        
        ['bowlhair', 'curlyhair', 'longhair', 'mophair', 'shorthair', 'spikeyhair'].forEach(key => {
            this.load.spritesheet(`${key}_walk`, `/assets/${key}_walk_strip8.png`, { frameWidth: 96, frameHeight: 64 });
            this.load.spritesheet(`${key}_idle`, `/assets/${key}_idle_strip9.png`, { frameWidth: 96, frameHeight: 64 });
        });
    }

    create() {
        if (!this.room) return;

        // Render Map
        const difficulty = this.room.state.difficulty;
        const mapKey = difficulty === 'sedang' ? 'map_medium' : difficulty === 'sulit' ? 'map_hard' : 'map_easy';
        this.map = this.make.tilemap({ key: mapKey });
        const tilesets = [
            this.map.addTilesetImage('spr_tileset_sunnysideworld_16px', 'tiles'),
            this.map.addTilesetImage('spr_tileset_sunnysideworld_forest_32px', 'forest_tiles')
        ].filter(t => t !== null) as Phaser.Tilemaps.Tileset[];

        this.map.layers.forEach(layerData => {
            this.map.createLayer(layerData.name, tilesets, 0, 0);
        });

        // Setup Kamera (Fitur Spectator)
        this.setupSpectatorCamera();

        // UI & Animations
        this.createUI();
        this.setupAnimations();

        // Player Sync
        this.room.state.players.onAdd((player: any, sessionId: string) => {
            if (player.isHost) return;
            this.addPlayerEntity(player, sessionId);
        });

        TransitionManager.open();
    }

    private setupSpectatorCamera() {
        const updateCamera = () => {
            const mapW = this.map.widthInPixels;
            const mapH = this.map.heightInPixels;
            const zoomX = this.scale.width / mapW;
            const zoomY = this.scale.height / mapH;
            this.minZoom = Math.max(zoomX, zoomY);

            this.cameras.main.setBounds(0, 0, mapW, mapH);
            this.cameras.main.setZoom(this.minZoom);
            this.cameras.main.centerOn(mapW / 2, mapH / 2);
        };

        updateCamera();
        this.scale.on('resize', updateCamera);
        this.resizeListener = updateCamera;

        // Controls (Drag & Scroll)
        this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
            this.isDragPan = true;
            this.dragOrigin = new Phaser.Math.Vector2(p.x, p.y);
        });
        this.input.on('pointerup', () => this.isDragPan = false);
        this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
            if (this.isDragPan) {
                const cam = this.cameras.main;
                cam.scrollX -= (p.x - this.dragOrigin.x) / cam.zoom;
                cam.scrollY -= (p.y - this.dragOrigin.y) / cam.zoom;
                this.dragOrigin.set(p.x, p.y);
            }
        });
        this.input.on('wheel', (_p: any, _gO: any, _dx: number, dy: number) => {
            const newZoom = this.cameras.main.zoom - dy * 0.001;
            this.cameras.main.setZoom(Phaser.Math.Clamp(newZoom, this.minZoom, 3));
        });
    }

    private addPlayerEntity(player: any, sessionId: string) {
        const container = this.add.container(player.x, player.y);
        container.setDepth(100).setScale(2);

        const base = this.add.sprite(0, 0, 'character').play('idle');
        const hair = this.add.sprite(0, 0, '').setVisible(false);
        container.add([base, hair]);
        container.setData({ baseSprite: base, hairSprite: hair });

        this.createNameTag(sessionId, player.name || 'Player', container);
        this.playerEntities[sessionId] = container;

        player.onChange(() => {
            container.setData({ targetX: player.x, targetY: player.y });
            this.updatePlayerProgress(player, container);
        });
    }

    private updatePlayerProgress(player: any, container: Phaser.GameObjects.Container) {
        const diff = this.room.state.difficulty;
        const target = diff === 'sedang' ? 10 : diff === 'sulit' ? 20 : 5;
        const answered = player.answeredQuestions || 0;
        
        const progressText = container.getByName('progressText') as Phaser.GameObjects.Text;
        if (progressText) progressText.setText(`${answered}/${target}`);

        const progressBar = container.getByName('progressBar') as Phaser.GameObjects.Graphics;
        if (progressBar) {
            const progress = Phaser.Math.Clamp(answered / target, 0, 1);
            progressBar.clear();
            progressBar.fillStyle(0x000000, 0.5).fillRect(0, 0, 40, 6);
            progressBar.fillStyle(0x00ff88, 1).fillRect(0, 0, 40 * progress, 6);
        }
    }

    createUI() {
        this.uiContainer = document.createElement('div');
        this.uiContainer.style.cssText = `position:fixed; inset:0; pointer-events:none; z-index:9999; font-family:'Retro Gaming', monospace;`;
        this.uiContainer.innerHTML = `
            <img src="/logo/Zigma-logo.webp" style="position:absolute; top:-60px; left:-65px; width:384px; pointer-events:none; filter:drop-shadow(0 0 15px rgba(255,255,255,0.2));" />
            <div style="position:absolute; top:30px; left:50%; transform:translateX(-50%); display:flex; align-items:center; gap:15px;">
                <span id="game-timer" style="font-size:48px; color:white; font-weight:bold; text-shadow:2px 2px 0 #000;">05:00</span>
            </div>
            <button id="spec-end-btn" style="position:absolute; bottom:40px; right:40px; background:#ff0055; color:white; border:none; padding:18px 36px; border-radius:12px; cursor:pointer; pointer-events:auto; box-shadow:0 6px 0 #990033;">
                Akhiri Game
            </button>
        `;
        document.body.appendChild(this.uiContainer);
        
        const endBtn = document.getElementById('spec-end-btn');
        if (endBtn) endBtn.onclick = () => this.showEndGamePopup();
    }

    showEndGamePopup() {
        if (confirm("Akhiri game dan putuskan semua pemain?")) {
            this.room.send('hostEndGame');
        }
    }

    updateTimer(remainingMs: number) {
        const totalSec = Math.ceil(remainingMs / 1000);
        const min = String(Math.floor(totalSec / 60)).padStart(2, '0');
        const sec = String(totalSec % 60).padStart(2, '0');
        const el = document.getElementById('game-timer');
        if (el) el.innerText = `${min}:${sec}`;
    }

    createNameTag(sessionId: string, name: string, container: Phaser.GameObjects.Container) {
        const nameText = this.add.text(-20, -50, name, { fontSize: '12px', fontFamily: '"Retro Gaming"', color: '#ffffff', stroke: '#000', strokeThickness: 3 }).setOrigin(0, 0.5);
        const progressText = this.add.text(-20, -35, '0/0', { fontSize: '9px', color: '#00ff88', stroke: '#000', strokeThickness: 2 }).setOrigin(0, 0.5);
        const progressBar = this.add.graphics({ x: -20, y: -25 });

        nameText.setName('nameTag');
        progressText.setName('progressText');
        progressBar.setName('progressBar');
        container.add([nameText, progressText, progressBar]);
    }

    setupAnimations() {
        if (!this.anims.exists('idle')) {
            this.anims.create({ key: 'idle', frames: this.anims.generateFrameNumbers('base_idle', { start: 0, end: 8 }), frameRate: 10, repeat: -1 });
            this.anims.create({ key: 'walk', frames: this.anims.generateFrameNumbers('character', { start: 0, end: 7 }), frameRate: 10, repeat: -1 });
        }
    }

    update() {
        Object.keys(this.playerEntities).forEach(sid => {
            const container = this.playerEntities[sid];
            const tx = container.getData('targetX');
            const ty = container.getData('targetY');
            if (tx !== undefined && ty !== undefined) {
                container.x += (tx - container.x) * 0.1;
                container.y += (ty - container.y) * 0.1;
            }
        });
    }
}