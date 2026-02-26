import Phaser from 'phaser';
import { Client } from 'colyseus.js';
import { TransitionManager } from '../../../utils/TransitionManager';
import { Router } from '../../../utils/Router';
import { RoomService } from '../../../services/RoomService';

interface RankingEntry {
    rank: number;
    sessionId: string;
    name: string;
    hairId?: number;
    score: number;
    duration: number;
}

export class HostLeaderboardScene extends Phaser.Scene {
    private container!: HTMLDivElement;
    private client!: Client;
    private rankings: RankingEntry[] = [];
    private isHost: boolean = true;

    constructor() {
        super({ key: 'HostLeaderboardScene' });
    }

    create() {
        this.initializeClient();
        TransitionManager.ensureClosed();

        this.rankings = this.registry.get('leaderboardData') || [];
        this.rankings.sort((a, b) => a.rank - b.rank);

        this.container = document.createElement('div');
        this.container.id = 'leaderboard-ui';
        this.container.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; z-index:1000;';
        document.body.appendChild(this.container);

        if (!document.getElementById('leaderboard-styles')) {
            const style = document.createElement('style');
            style.id = 'leaderboard-styles';
            style.innerHTML = this.getGlobalStyles();
            document.head.appendChild(style);
        }

        this.renderLeaderboard();
        setTimeout(() => TransitionManager.open(), 100);
    }

    private initializeClient() {
        const envServerUrl = import.meta.env.VITE_SERVER_URL;
        let host = envServerUrl;
        if (!host) {
            const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
            host = `${protocol}://${window.location.host}`;
            if (window.location.hostname === 'localhost') host = `${protocol}://localhost:2567`;
        }
        this.client = new Client(host);
    }

    private getGlobalStyles(): string {
        return `
            #leaderboard-ui {
                background: #151515; color: white; display: flex; flex-direction: column; align-items: center;
                font-family: 'Retro Gaming', monospace; overflow-y: auto; height: 100vh; width: 100vw;
            }
            .podium-section { display: flex; justify-content: center; align-items: flex-end; gap: 16px; margin-bottom: 40px; padding-top: 100px; position: relative; }
            .podium-column { display: flex; flex-direction: column; align-items: center; width: 160px; z-index: 5; }
            .podium-column.rank-1 { order: 2; z-index: 10; width: 200px; }
            .podium-column.rank-2 { order: 1; }
            .podium-column.rank-3 { order: 3; }
            .podium-body { width: 100%; border-radius: 20px 20px 0 0; display: flex; flex-direction: column; align-items: center; padding: 10px; position: relative; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
            .rank-1 .podium-body { height: 300px; background: linear-gradient(180deg, #FFD700 0%, #B8860B 100%); }
            .rank-2 .podium-body { height: 260px; background: linear-gradient(180deg, #E0E0E0 0%, #808080 100%); }
            .rank-3 .podium-body { height: 220px; background: linear-gradient(180deg, #CD7F32 0%, #8B4513 100%); }
            .podium-name-text { background: rgba(0,0,0,0.6); padding: 8px 14px; border-radius: 8px; font-size: 10px; color: white; white-space: nowrap; }
            .podium-avatar { width: 100%; height: 100px; position: relative; display: flex; justify-content: center; align-items: center; }
            .char-anim { width: 96px; height: 64px; image-rendering: pixelated; position: absolute; transform: scale(4.5); animation: lb-play-idle 1s steps(9) infinite; }
            @keyframes lb-play-idle { from { background-position: 0 0; } to { background-position: -864px 0; } }
            .podium-score { font-size: 20px; margin-top: auto; margin-bottom: 20px; padding: 10px 22px; border-radius: 12px; border: 3px solid #4A3000; background: rgba(255,255,255,0.1); }
            .list-section { width: 100%; max-width: 600px; display: flex; flex-direction: column; gap: 8px; padding-bottom: 100px; }
            .list-item { display: grid; grid-template-columns: 50px 1fr 100px 80px; background: rgba(255,255,255,0.03); padding: 12px 20px; border-radius: 12px; }
            .lb-footer {
                position: fixed;
                top: 50%;
                left: 0;
                width: 100%;
                display: flex;
                justify-content: space-between;
                padding: 0 40px;
                pointer-events: none;
                transform: translateY(-50%);
                z-index: 100;
            }
            .nav-btn {
                pointer-events: auto;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 50%;
                width: 72px;
                height: 72px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                color: white;
                border: 1px solid rgba(255, 255, 255, 0.2);
                transition: all 0.2s ease;
                backdrop-filter: blur(5px);
            }
            .nav-btn:hover { background: rgba(255, 255, 255, 0.2); transform: scale(1.1); }
            .logo-left { position: absolute; top: -60px; left: -65px; width: 384px; pointer-events: none; opacity: 0.9; }
            .logo-right { position: absolute; top: 8px; right: 8px; width: 256px; pointer-events: none; opacity: 0.9; }
        `;
    }

    private renderLeaderboard() {
        Router.navigate('/host/leaderboard');
        const top3 = this.rankings.slice(0, 3);
        const others = this.rankings.slice(3);

        const formatTime = (ms: number) => {
            const s = Math.floor(ms / 1000);
            return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
        };

        const podiumHTML = [1, 0, 2].map(i => {
            const rankNum = i + 1;
            const p = top3[i]; 
            if (!p) return `<div class="podium-column rank-${rankNum}" style="opacity:0"></div>`;
            const hairKey = p.hairId ? ['bowlhair', 'curlyhair', 'longhair', 'mophair', 'shorthair', 'spikeyhair'][p.hairId - 1] : null;
            return `
                <div class="podium-column rank-${p.rank}">
                    <div class="podium-body">
                        <span class="podium-name-text">${p.name}</span>
                        <div class="podium-avatar">
                            <div class="char-anim" style="background-image:url('/assets/base_idle_strip9.png')"></div>
                            ${hairKey ? `<div class="char-anim" style="background-image:url('/assets/${hairKey}_idle_strip9.png')"></div>` : ''}
                        </div>
                        <div class="podium-score">${p.score}</div>
                    </div>
                </div>
            `;
        }).join('');

        this.container.innerHTML = `
            <img src="/logo/Zigma-logo.webp" class="logo-left" />
            <img src="/logo/gameforsmart.webp" class="logo-right" />
            <div class="podium-section">${podiumHTML}</div>
            <div class="list-section">${others.map(p => `
                <div class="list-item">
                    <span>#${p.rank}</span><span>${p.name}</span><span>${formatTime(p.duration)}</span><span>${p.score}</span>
                </div>
            `).join('')}</div>
            <div class="lb-footer">
                <button id="lb-home-btn" class="nav-btn"><span class="material-symbols-outlined">home</span></button>
                <button id="lb-restart-btn" class="nav-btn"><span class="material-symbols-outlined">restart_alt</span></button>
            </div>
        `;

        this.attachListeners();
    }

    private attachListeners() {
        const homeBtn = document.getElementById('lb-home-btn');
        const restartBtn = document.getElementById('lb-restart-btn');

        if (homeBtn) {
            homeBtn.onclick = () => TransitionManager.transitionTo(() => {
                this.cleanup();
                const r = this.registry.get('room'); if (r) r.leave();
                window.history.pushState({}, '', '/');
                this.scene.start('LobbyScene');
            });
        }

        if (restartBtn) {
            restartBtn.onclick = async () => {
                const opts = this.registry.get('lastGameOptions');
                const q = this.registry.get('lastSelectedQuiz');
                if (opts && q) {
                    TransitionManager.close(async () => {
                        try {
                            const { room, options } = await RoomService.createRoom(this.client, { ...opts, quiz: q });
                            this.registry.set('lastGameOptions', options);
                            this.cleanup();
                            this.scene.start('HostWaitingRoomScene', { room, isHost: true });
                            setTimeout(() => TransitionManager.open(), 600);
                        } catch (e) {
                            alert("Restart error. Returning to lobby.");
                            this.cleanup(); this.scene.start('LobbyScene');
                        }
                    });
                }
            };
        }
    }

    cleanup() {
        if (this.container) this.container.remove();
        const s = document.getElementById('leaderboard-styles'); if (s) s.remove();
    }
}
