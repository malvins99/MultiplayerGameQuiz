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
    correctAnswers: number;
    wrongAnswers: number;
}

export class ResultScene extends Phaser.Scene {
    private container!: HTMLDivElement;
    private rankings: RankingEntry[] = [];
    private mySessionId: string = "";

    constructor() {
        super({ key: 'ResultScene' });
    }

    create() {
        TransitionManager.ensureClosed();
        this.rankings = this.registry.get('leaderboardData') || [];
        const room = this.registry.get('room');
        this.mySessionId = this.registry.get('mySessionId') || (room ? room.sessionId : "");

        this.container = document.createElement('div');
        this.container.id = 'result-ui';
        this.container.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; z-index:1000;';
        document.body.appendChild(this.container);

        if (!document.getElementById('result-styles')) {
            const style = document.createElement('style');
            style.id = 'result-styles';
            style.innerHTML = this.getStyles();
            document.head.appendChild(style);
        }

        this.renderIndividualResult();
        setTimeout(() => TransitionManager.open(), 100);
    }

    private getStyles(): string {
        return `
            #result-ui {
                background: #151515; color: white; display: flex; flex-direction: column; align-items: center;
                justify-content: center; font-family: 'Retro Gaming', monospace; height: 100vh; width: 100vw;
            }
            .result-card {
                background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 20px; padding: 40px; display: flex; flex-direction: column; align-items: center;
                min-width: 480px; backdrop-filter: blur(10px); position: relative; z-index: 10;
            }
            .result-avatar-container {
                width: 180px; height: 180px; background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 16px; display: flex; align-items: center; justify-content: center; margin-bottom: 25px; position: relative;
            }
            .char-anim { width: 96px; height: 64px; image-rendering: pixelated; position: absolute; transform: scale(8); animation: lb-play-idle 1s steps(9) infinite; }
            @keyframes lb-play-idle { from { background-position: 0 0; } to { background-position: -864px 0; } }
            .result-name { font-size: 26px; color: #fff; text-transform: uppercase; margin-bottom: 40px; }
            .result-stats-row { display: flex; gap: 15px; width: 100%; justify-content: center; }
            .stat-box {
                background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.05);
                border-radius: 12px; padding: 20px 10px; width: 120px; display: flex; flex-direction: column; align-items: center;
            }
            .stat-icon { font-size: 28px; margin-bottom: 12px; color: #aaa; }
            .stat-value { font-size: 18px; color: #fff; margin-bottom: 6px; }
            .stat-label { font-size: 9px; color: #888; text-transform: uppercase; }
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
                z-index: 20;
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
                color: white;
                cursor: pointer;
                border: 1px solid rgba(255, 255, 255, 0.2);
                transition: all 0.2s ease;
                backdrop-filter: blur(5px);
            }
            .nav-btn:hover { background: rgba(255, 255, 255, 0.2); transform: scale(1.1); }
            .logo-left { position: absolute; top: -30px; left: -40px; width: 256px; pointer-events: none; }
            .logo-right { position: absolute; top: -45px; right: -15px; width: 320px; pointer-events: none; }
        `;
    }

    private renderIndividualResult() {
        Router.navigate('/player/result');
        const myEntry = this.rankings.find(p => p.sessionId === this.mySessionId) || this.rankings[0];
        if (!myEntry) return;

        const formatTime = (ms: number) => {
            const s = Math.floor(ms / 1000);
            return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
        };

        const hairKey = myEntry.hairId ? ['bowlhair', 'curlyhair', 'longhair', 'mophair', 'shorthair', 'spikeyhair'][myEntry.hairId - 1] : null;

        this.container.innerHTML = `
            <img src="/logo/Zigma-new-logo.webp" class="logo-left" />
            <img src="/logo/gameforsmart-new-logo.webp" class="logo-right" />
            <div class="result-card">
                <div class="result-avatar-container">
                    <div class="char-anim" style="background-image:url('/assets/base_idle_strip9.png')"></div>
                    ${hairKey ? `<div class="char-anim" style="background-image:url('/assets/${hairKey}_idle_strip9.png')"></div>` : ''}
                </div>
                <div class="result-name">${myEntry.name}</div>
                <div class="result-stats-row">
                    <div class="stat-box"><span class="material-symbols-outlined stat-icon">military_tech</span><div class="stat-value">#${myEntry.rank}</div><div class="stat-label">RANK</div></div>
                    <div class="stat-box"><span class="material-symbols-outlined stat-icon">workspace_premium</span><div class="stat-value">${myEntry.score}</div><div class="stat-label">SCORE</div></div>
                    <div class="stat-box"><span class="material-symbols-outlined stat-icon">task_alt</span><div class="stat-value">${myEntry.correctAnswers}/5</div><div class="stat-label">CORRECT</div></div>
                    <div class="stat-box"><span class="material-symbols-outlined stat-icon">schedule</span><div class="stat-value">${formatTime(myEntry.duration)}</div><div class="stat-label">TIME</div></div>
                </div>
            </div>
            <div class="lb-footer">
                <button id="lb-home-btn" class="nav-btn"><span class="material-symbols-outlined">home</span></button>
                <button id="lb-full-btn" class="nav-btn"><span class="material-symbols-outlined">leaderboard</span></button>
            </div>
        `;

        this.attachListeners();
    }

    private attachListeners() {
        const homeBtn = document.getElementById('lb-home-btn');
        const fullBtn = document.getElementById('lb-full-btn');
        if (homeBtn) homeBtn.onclick = () => TransitionManager.transitionTo(() => {
            this.cleanup(); const r = this.registry.get('room'); if (r) r.leave();
            window.location.href = '/';
        });
        if (fullBtn) fullBtn.onclick = () => TransitionManager.transitionTo(() => {
            this.cleanup(); this.scene.start('LeaderboardScene');
        });
    }

    cleanup() {
        if (this.container) this.container.remove();
        const s = document.getElementById('result-styles'); if (s) s.remove();
    }
}
