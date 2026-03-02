import Phaser from 'phaser';
import { Client } from 'colyseus.js';
import { TransitionManager } from '../utils/TransitionManager';
import { Router } from '../utils/Router';
import { RoomService } from '../services/RoomService';

interface RankingEntry {
    rank: number;
    sessionId: string;
    name: string;
    hairId?: number;
    score: number;
    finishTime: number;
    duration: number;
    correctAnswers: number;
    wrongAnswers: number;
}

export class LeaderboardScene extends Phaser.Scene {
    private container!: HTMLDivElement;
    private client!: Client;
    private isHost: boolean = false;
    private rankings: RankingEntry[] = [];
    private mySessionId: string = "";

    constructor() {
        super({ key: 'LeaderboardScene' });
    }

    create() {
        this.initializeClient();

        // Ensure we reveal after rendering
        TransitionManager.ensureClosed();

        // 1. Get Data from Registry
        this.rankings = this.registry.get('leaderboardData') || [];
        this.isHost = this.registry.get('isHost') || false;
        // Use stored sessionId (room may already be left by the time we get here)
        this.mySessionId = this.registry.get('mySessionId') || "";

        // Sort rankings
        this.rankings.sort((a, b) => a.rank - b.rank);

        // 2. Setup Container
        this.container = document.createElement('div');
        this.container.id = 'leaderboard-ui';
        this.container.style.position = 'absolute';
        this.container.style.top = '0';
        this.container.style.left = '0';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.zIndex = '1000';
        document.body.appendChild(this.container);

        // Standard Styles
        if (!document.getElementById('leaderboard-styles')) {
            const style = document.createElement('style');
            style.id = 'leaderboard-styles';
            style.innerHTML = this.getGlobalStyles();
            document.head.appendChild(style);
        }

        // 3. Render
        this.renderFullLeaderboard();

        // Open Iris to reveal results
        setTimeout(() => {
            TransitionManager.open();
        }, 100);
    }

    private initializeClient() {
        const envServerUrl = import.meta.env.VITE_SERVER_URL;
        let host = envServerUrl;

        if (!host) {
            const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
            const defaultPort = '2567';

            if (window.location.hostname === 'localhost' || /^(\d+\.){3}\d+$/.test(window.location.hostname)) {
                host = `${protocol}://${window.location.hostname}:${defaultPort}`;
            } else {
                host = `${protocol}://${window.location.host}`;
            }
        }

        console.log("LeaderboardScene connecting to Colyseus server:", host);
        this.client = new Client(host);
    }

    private getGlobalStyles(): string {
        return `
            @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

            #leaderboard-ui {
                background: #151515;
                color: white;
                display: flex;
                flex-direction: column;
                align-items: center;
                font-family: 'Retro Gaming', monospace;
                overflow-x: hidden;
                overflow-y: auto;
                height: 100vh;
                width: 100vw;
            }

            .text-glow { text-shadow: 0 0 10px rgba(0, 255, 85, 0.4); }

            /* --- FULL LEADERBOARD (HOST) --- */
            .podium-section {
                display: flex; justify-content: center; align-items: flex-end;
                gap: 16px; margin-bottom: 40px; padding-top: 100px; position: relative;
            }
            .podium-column { display: flex; flex-direction: column; align-items: center; position: relative; width: 160px; transition: transform 0.3s ease; z-index: 5; }
            .podium-column.rank-1 { order: 2; z-index: 10; width: 200px; }
            .podium-column.rank-2 { order: 1; }
            .podium-column.rank-3 { order: 3; }
            .podium-body { width: 100%; border-radius: 20px 20px 0 0; display: flex; flex-direction: column; align-items: center; padding: 10px; position: relative; box-shadow: 0 10px 30px rgba(0,0,0,0.5); backdrop-filter: blur(5px); }
            
            .rank-1 .podium-body { height: 300px; background: linear-gradient(180deg, #FFD700 0%, #B8860B 100%); }
            .rank-2 .podium-body { height: 270px; background: linear-gradient(180deg, #E0E0E0 0%, #808080 100%); }
            .rank-3 .podium-body { height: 270px; background: linear-gradient(180deg, #CD7F32 0%, #8B4513 100%); }

            .podium-name-text {
                font-family: 'Retro Gaming', monospace; font-size: 10px; color: #fff; text-transform: uppercase;
                background: rgba(0, 0, 0, 0.6); padding: 8px 14px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.2);
                white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block;
            }
            .rank-1 .podium-name-text { color: #FFD700; border-color: rgba(255, 215, 0, 0.5); }

            .podium-avatar { width: 100%; height: 100px; display: flex; align-items: center; justify-content: center; position: relative; }
            .char-anim { width: 96px; height: 64px; image-rendering: pixelated; position: absolute; transform: scale(4.5); }
            .anim-play { animation: lb-play-idle 1s steps(9) infinite; background-repeat: no-repeat; }
            @keyframes lb-play-idle { from { background-position: 0 0; } to { background-position: -864px 0; } }

            .podium-score { font-size: 20px; margin-top: auto; margin-bottom: 20px; padding: 10px 22px; border-radius: 12px; border: 3px solid; color: #4A3000; }
            .rank-1 .podium-score { background: linear-gradient(180deg, #FFD700 0%, #DAA520 100%); border-color: #B8860B; }
            .rank-2 .podium-score { background: linear-gradient(180deg, #D3D3D3 0%, #A9A9A9 100%); border-color: #808080; }
            .rank-3 .podium-score { background: linear-gradient(180deg, #CD7F32 0%, #A0522D 100%); border-color: #8B4513; }

            .list-section { width: 100%; max-width: 600px; display: flex; flex-direction: column; gap: 8px; margin-top: 20px; padding-bottom: 100px; }
            .list-item { display: grid; grid-template-columns: 50px 1fr 100px 80px; align-items: center; background: rgba(255,255,255,0.03); padding: 12px 20px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); }

            .lb-footer { position: fixed; top: 50%; left: 0; width: 100%; display: flex; justify-content: space-between; padding: 0 40px; pointer-events: none; transform: translateY(-50%); z-index: 100; }
            .nav-btn {
                pointer-events: auto; background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px);
                border: 1px solid rgba(255,255,255,0.1); border-radius: 50%; width: 64px; height: 64px;
                display: flex; align-items: center; justify-content: center; color: white; cursor: pointer; transition: all 0.3s;
                box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            }
            .nav-btn:hover { border-color: rgba(255,255,255,0.4); background: rgba(255, 255, 255, 0.1); transform: scale(1.1); }
            .btn-left { left: 40px; } .btn-right { right: 40px; }
            .nav-btn .material-symbols-outlined { font-size: 28px; }

            .spotlight-container { position: absolute; top: -80px; left: 50%; transform: translateX(-50%); width: 500px; height: 600px; pointer-events: none; z-index: 0; }
            .spotlight-beam { width: 100%; height: 100%; background: conic-gradient(from 0deg at 50% 0%, transparent 160deg, rgba(255, 255, 255, 0.08) 180deg, transparent 200deg); filter: blur(15px); animation: flicker 4s infinite alternate; }
            @keyframes flicker { 0%{opacity:0.9} 100%{opacity:1} }

            .logo-left { position: absolute; top: -40px; left: -50px; width: 288px; z-index: 20; object-fit: contain; filter: drop-shadow(0 0 15px rgba(255,255,255,0.2)); pointer-events: none; }
            .logo-right { position: absolute; top: -10px; right: -10px; width: 320px; z-index: 20; object-fit: contain; pointer-events: none; }
        `;
    }

    private renderFullLeaderboard() {
        Router.navigate('/host/leaderboard');
        this.container.innerHTML = '';

        const top3 = this.rankings.slice(0, 3);
        const others = this.rankings.slice(3);

        const formatTime = (ms: number) => {
            const totalSeconds = Math.floor(ms / 1000);
            const mins = Math.floor(totalSeconds / 60);
            const secs = totalSeconds % 60;
            return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        };

        const podiumHTML = this.renderPodium(top3);
        const listHTML = others.map(p => `
            <div class="list-item">
                <div class="list-rank">#${p.rank}</div>
                <div class="list-name">${p.name}</div>
                <div class="list-time">${formatTime(p.duration || 0)}</div>
                <div class="list-stats text-glow">${p.score}</div>
            </div>
        `).join('');

        const spotlightHTML = top3.length > 0 ? `<div class="spotlight-container"><div class="spotlight-beam"></div></div>` : '';

        const homeButton = `
            <button id="lb-home-btn" class="nav-btn btn-left" type="button">
                <span class="material-symbols-outlined">home</span>
            </button>
        `;

        const actionButton = this.isHost ? `
            <button id="lb-restart-btn" class="nav-btn btn-right" type="button">
                <span class="material-symbols-outlined">restart_alt</span>
            </button>
        ` : `
            <button id="lb-back-btn" class="nav-btn btn-right" type="button">
                <span class="material-symbols-outlined">person</span>
            </button>
        `;

        this.container.innerHTML = `
            <!-- LOGO TOP LEFT -->
            <img src="/logo/Zigma-new-logo.webp" class="logo-left" />
            
            <!-- LOGO TOP RIGHT -->
            <img src="/logo/gameforsmart-new-logo.webp" class="logo-right" />

            <div class="podium-section">
                ${spotlightHTML}
                ${podiumHTML}
            </div>
            <div class="list-section">
                ${listHTML}
            </div>
            <div class="lb-footer">
                ${homeButton}
                ${actionButton}
            </div>
        `;

        this.attachListeners();
    }

    private getCharacterVisuals(player: RankingEntry) {
        const base = `background-image: url('/assets/base_idle_strip9.png'); background-size: 864px 64px;`;
        let hair = '';
        if (player.hairId && player.hairId > 0) {
            const hairFiles: Record<number, string> = {
                1: 'bowlhair', 2: 'curlyhair', 3: 'longhair', 4: 'mophair', 5: 'shorthair', 6: 'spikeyhair'
            };
            const key = hairFiles[player.hairId];
            if (key) {
                hair = `background-image: url('/assets/${key}_idle_strip9.png'); background-size: 864px 64px;`;
            }
        }
        return { base, hair };
    }

    private renderPodium(top3: RankingEntry[]): string {
        const order = [1, 0, 2];
        return order.map(i => {
            const player = top3[i];
            const rank = i + 1;
            if (!player) return `<div class="podium-column rank-${rank}" style="opacity:0"></div>`;

            const visuals = this.getCharacterVisuals(player);
            return `
                <div class="podium-column rank-${player.rank}">
                    <div class="podium-body">
                        <div class="podium-content-inner" style="display:flex; flex-direction:column; align-items:center; width:100%; flex:1;">
                            <div class="podium-name" style="margin-bottom:15px;"><span class="podium-name-text">${player.name}</span></div>
                            <div class="podium-avatar">
                                <div class="char-anim anim-play" style="${visuals.base}"></div>
                                ${visuals.hair ? `<div class="char-anim anim-play" style="${visuals.hair}"></div>` : ''}
                            </div>
                            <div class="podium-score">${player.score}</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    private attachListeners() {
        setTimeout(() => {
            const homeBtn = document.getElementById('lb-home-btn');
            const restartBtn = document.getElementById('lb-restart-btn');
            const backBtn = document.getElementById('lb-back-btn');

            if (homeBtn) {
                homeBtn.onclick = (e) => {
                    e.preventDefault();
                    TransitionManager.transitionTo(() => {
                        this.cleanup();
                        // Room should already be left, but leave again as safety net
                        const room = this.registry.get('room');
                        if (room) {
                            console.log(`[Leaderboard] Leaving room on home click: ${room.id}`);
                            room.leave();
                            this.registry.set('room', null);
                        }
                        window.history.pushState({}, '', '/');
                        this.scene.start('LobbyScene');
                    });
                };
            }

            if (restartBtn) {
                restartBtn.onclick = async (e) => {
                    e.preventDefault();
                    const lastOptions = this.registry.get('lastGameOptions');
                    const lastQuiz = this.registry.get('lastSelectedQuiz');

                    if (lastOptions && lastQuiz) {
                        TransitionManager.close(async () => {
                            try {
                                // Room was already left by the Spectator/Game scene
                                // Just create a new one
                                console.log(`[Leaderboard] Creating new room for restart...`);


                                const { room, options } = await RoomService.createRoom(this.client, {
                                    difficulty: lastOptions.difficulty,
                                    questionCount: lastOptions.questionCount,
                                    timer: lastOptions.timer,
                                    quiz: lastQuiz
                                });

                                // Update registry for next time
                                this.registry.set('lastGameOptions', options);

                                this.cleanup();
                                this.scene.start('HostWaitingRoomScene', { room, isHost: true });

                                setTimeout(() => {
                                    TransitionManager.open();
                                }, 600);
                            } catch (e) {
                                console.error("Restart error:", e);
                                alert("Error restarting game. Returning to lobby.");
                                TransitionManager.open();
                                this.cleanup();
                                this.scene.start('LobbyScene');
                            }
                        });
                    } else {
                        console.warn("Missing options for restart. Returning to lobby.");
                        TransitionManager.transitionTo(() => {
                            this.cleanup();
                            this.scene.start('LobbyScene');
                        });
                    }
                };
            }

            if (backBtn) {
                backBtn.onclick = (e) => {
                    e.preventDefault();
                    TransitionManager.transitionTo(() => {
                        this.cleanup();
                        this.scene.start('ResultScene');
                    });
                };
            }
        }, 100);
    }

    cleanup() {
        if (this.container) this.container.remove();
        const style = document.getElementById('leaderboard-styles');
        if (style) style.remove();
    }
}
