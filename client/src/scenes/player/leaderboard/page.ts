import Phaser from 'phaser';
import { TransitionManager } from '../../../utils/TransitionManager';
import { Router } from '../../../utils/Router';

interface RankingEntry {
    rank: number;
    sessionId: string;
    name: string;
    hairId?: number;
    score: number;
    duration: number;
}

export class LeaderboardScene extends Phaser.Scene {
    private container!: HTMLDivElement;
    private rankings: RankingEntry[] = [];
    private mySessionId: string = "";

    constructor() {
        super({ key: 'LeaderboardScene' });
    }

    create() {
        TransitionManager.ensureClosed();
        this.rankings = this.registry.get('leaderboardData') || [];
        this.rankings.sort((a, b) => a.rank - b.rank);
        const room = this.registry.get('room');
        this.mySessionId = this.registry.get('mySessionId') || (room ? room.sessionId : "");

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

    private getGlobalStyles(): string {
        return `
            #leaderboard-ui {
                background: #151515; color: white; display: flex; flex-direction: column; align-items: center;
                font-family: 'Retro Gaming', monospace; overflow-y: auto; height: 100vh; width: 100vw;
            }
            .podium-section { display: flex; justify-content: center; align-items: flex-end; gap: 16px; margin-bottom: 40px; padding-top: 100px; position: relative; }
            .podium-column { display: flex; flex-direction: column; align-items: center; width: 140px; }
            .podium-column.rank-1 { order: 2; z-index: 10; width: 180px; }
            .podium-column.rank-2 { order: 1; }
            .podium-column.rank-3 { order: 3; }
            .podium-body { width: 100%; border-radius: 20px 20px 0 0; display: flex; flex-direction: column; align-items: center; padding: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
            .rank-1 .podium-body { height: 260px; background: linear-gradient(180deg, #FFD700 0%, #B8860B 100%); }
            .rank-2 .podium-body { height: 230px; background: linear-gradient(180deg, #E0E0E0 0%, #808080 100%); }
            .rank-3 .podium-body { height: 230px; background: linear-gradient(180deg, #CD7F32 0%, #8B4513 100%); }
            .podium-name-text { background: rgba(0,0,0,0.6); padding: 6px 10px; border-radius: 6px; font-size: 8px; color: white; white-space: nowrap; margin-bottom: 10px; }
            .podium-avatar { width: 100%; height: 80px; position: relative; display: flex; justify-content: center; align-items: center; }
            .char-anim { width: 96px; height: 64px; image-rendering: pixelated; position: absolute; transform: scale(3.5); animation: lb-play-idle 1s steps(9) infinite; }
            @keyframes lb-play-idle { from { background-position: 0 0; } to { background-position: -864px 0; } }
            .podium-score { font-size: 16px; margin-top: auto; margin-bottom: 15px; padding: 6px 16px; border-radius: 10px; border: 2px solid #4A3000; background: rgba(255,255,255,0.1); }
            .list-section { width: 100%; max-width: 500px; display: flex; flex-direction: column; gap: 6px; padding-bottom: 80px; }
            .list-item { display: grid; grid-template-columns: 40px 1fr 100px 60px; background: rgba(255,255,255,0.03); padding: 10px 15px; border-radius: 10px; font-size: 11px; }
            .lb-footer {
                position: fixed;
                bottom: 40px;
                left: 0;
                width: 100%;
                display: flex;
                justify-content: center;
                gap: 40px;
                padding: 0 40px;
                pointer-events: none;
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
            .logo-left { position: absolute; top: -30px; left: -40px; width: 256px; pointer-events: none; z-index: 1000; }
            .logo-right { position: absolute; top: -45px; right: -15px; width: 320px; pointer-events: none; z-index: 1000; }
        `;
    }

    private renderLeaderboard() {
        Router.navigate('/player/leaderboard');
        const top3 = this.rankings.slice(0, 3);
        const others = this.rankings.slice(3);

        const formatTime = (ms: number) => {
            const s = Math.floor(ms / 1000);
            return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
        };

        const podiumHTML = [1, 0, 2].map(i => {
            const p = top3[i]; if (!p) return `<div class="podium-column" style="opacity:0"></div>`;
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
            <img src="/logo/Zigma-new-logo.webp" class="logo-left" />
            <img src="/logo/gameforsmart-new-logo.webp" class="logo-right" />
            <div class="podium-section">${podiumHTML}</div>
            <div class="list-section">${others.map(p => `
                <div class="list-item">
                    <span>#${p.rank}</span><span>${p.name}</span><span>${formatTime(p.duration)}</span><span>${p.score}</span>
                </div>
            `).join('')}</div>
            <div class="lb-footer">
                <button id="lb-home-btn" class="nav-btn"><span class="material-symbols-outlined">home</span></button>
                <button id="lb-back-btn" class="nav-btn"><span class="material-symbols-outlined">person</span></button>
            </div>
        `;

        this.attachListeners();
    }

    private attachListeners() {
        const homeBtn = document.getElementById('lb-home-btn');
        const backBtn = document.getElementById('lb-back-btn');

        if (homeBtn) homeBtn.onclick = () => TransitionManager.transitionTo(() => {
            this.cleanup(); const r = this.registry.get('room'); if (r) r.leave();
            window.location.href = '/';
        });

        if (backBtn) backBtn.onclick = () => TransitionManager.transitionTo(() => {
            this.cleanup(); this.scene.start('ResultScene');
        });
    }

    cleanup() {
        if (this.container) this.container.remove();
        const s = document.getElementById('leaderboard-styles'); if (s) s.remove();
    }
}
