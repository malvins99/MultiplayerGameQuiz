import Phaser from 'phaser';
import { Client } from 'colyseus.js';
import { TransitionManager } from '../utils/TransitionManager';
import { Router } from '../utils/Router';

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

export class ResultScene extends Phaser.Scene {
    private container!: HTMLDivElement;
    private rankings: RankingEntry[] = [];
    private mySessionId: string = "";

    constructor() {
        super({ key: 'ResultScene' });
    }

    create() {
        TransitionManager.ensureClosed();

        // 1. Get Data from Registry
        this.rankings = this.registry.get('leaderboardData') || [];
        const room = this.registry.get('room');
        this.mySessionId = room ? room.sessionId : "";

        // 2. Setup Container
        this.container = document.createElement('div');
        this.container.id = 'result-ui';
        this.container.style.position = 'absolute';
        this.container.style.top = '0';
        this.container.style.left = '0';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.zIndex = '1000';
        document.body.appendChild(this.container);

        // Standard Styles
        if (!document.getElementById('result-styles')) {
            const style = document.createElement('style');
            style.id = 'result-styles';
            style.innerHTML = this.getStyles();
            document.head.appendChild(style);
        }

        // 3. Initial Render
        this.renderIndividualResult();

        // Open Iris to reveal results
        setTimeout(() => {
            TransitionManager.open();
        }, 100);
    }

    private getStyles(): string {
        return `
            @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

            #result-ui {
                background: #151515;
                color: white;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                font-family: 'Retro Gaming', monospace;
                overflow: hidden;
                height: 100vh;
                width: 100vw;
            }

            .result-card {
                background: rgba(255, 255, 255, 0.02);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 20px;
                padding: 40px;
                display: flex; flex-direction: column; align-items: center;
                min-width: 480px;
                backdrop-filter: blur(10px);
                position: relative;
                box-shadow: 0 0 100px rgba(255, 255, 255, 0.03);
                z-index: 10;
            }

            .result-avatar-container {
                width: 180px; height: 180px;
                background: rgba(0, 0, 0, 0.4);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 16px;
                display: flex; align-items: center; justify-content: center;
                margin-bottom: 25px;
                position: relative; overflow: visible;
            }

            .char-anim { width: 96px; height: 64px; image-rendering: pixelated; position: absolute; transform: scale(4.5); }
            .anim-play { animation: lb-play-idle 1s steps(9) infinite; background-repeat: no-repeat; }
            @keyframes lb-play-idle { from { background-position: 0 0; } to { background-position: -864px 0; } }
            .result-char { transform: scale(8); }

            .result-name {
                font-family: 'Retro Gaming', monospace;
                font-size: 26px; color: #fff;
                text-transform: uppercase; letter-spacing: 2px;
                margin-bottom: 40px;
            }

            .result-stats-row {
                display: flex; gap: 15px; width: 100%; justify-content: center;
            }

            .stat-box {
                background: rgba(255, 255, 255, 0.03);
                border: 1px solid rgba(255, 255, 255, 0.05);
                border-radius: 12px;
                padding: 20px 10px;
                width: 120px;
                display: flex; flex-direction: column; align-items: center;
                transition: background 0.2s, border-color 0.2s;
            }

            .stat-box:hover { background: rgba(255, 255, 255, 0.06); border-color: rgba(255, 255, 255, 0.2); }
            .stat-icon { font-size: 28px; margin-bottom: 12px; color: #aaa; }
            .stat-value { font-family: 'Retro Gaming', monospace; font-size: 18px; color: #fff; margin-bottom: 6px; }
            .stat-label { font-size: 9px; color: #888; text-transform: uppercase; letter-spacing: 1px; }

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
                z-index: 20; 
            }
            .nav-btn {
                pointer-events: auto; background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px);
                border: 1px solid rgba(255,255,255,0.1); border-radius: 50%; width: 64px; height: 64px;
                display: flex; align-items: center; justify-content: center; color: white; cursor: pointer; transition: all 0.3s;
                box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            }
            .nav-btn:hover { border-color: rgba(255,255,255,0.4); background: rgba(255, 255, 255, 0.1); transform: scale(1.1); }
            .btn-left { left: 40px; } .btn-right { right: 40px; }
            .nav-btn .material-symbols-outlined { font-size: 28px; }

            /* ENHANCED SPOTLIGHT EFFECT */
            .spotlight-container { 
                position: absolute; 
                top: 0; left: 50%; 
                transform: translateX(-50%); 
                width: 100vw; height: 100vh; 
                pointer-events: none; 
                z-index: 1; 
                overflow: hidden;
            }
            .spotlight-beam { 
                width: 200%; height: 200%; 
                position: absolute;
                top: -50%; left: -50%;
                background: radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 30%, transparent 60%); 
                filter: blur(60px); 
                animation: flicker 4s infinite alternate; 
            }
            .spotlight-center {
                position: absolute;
                top: 50%; left: 50%;
                transform: translate(-50%, -50%);
                width: 600px; height: 600px;
                background: radial-gradient(circle, rgba(0, 255, 136, 0.1) 0%, transparent 70%);
                filter: blur(40px);
                z-index: 2;
            }
            @keyframes flicker { 0%{opacity:0.8} 100%{opacity:1} }

            .logo-left { position: absolute; top: -60px; left: -65px; width: 384px; z-index: 20; object-fit: contain; filter: drop-shadow(0 0 15px rgba(255,255,255,0.2)); pointer-events: none; }
            .logo-right { position: absolute; top: 8px; right: 8px; width: 256px; z-index: 20; object-fit: contain; filter: drop-shadow(0 0 15px rgba(0,255,136,0.3)); pointer-events: none; }
        `;
    }

    private renderIndividualResult() {
        Router.navigate('/player/result');
        this.container.innerHTML = '';

        const myEntry = this.rankings.find(p => p.sessionId === this.mySessionId) || this.rankings[0];
        if (!myEntry) return;

        const formatTime = (ms: number) => {
            const totalSeconds = Math.floor(ms / 1000);
            const mins = Math.floor(totalSeconds / 60);
            const secs = totalSeconds % 60;
            return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        };

        const characterVisuals = this.getCharacterVisuals(myEntry);

        this.container.innerHTML = `
            <div class="spotlight-container">
                <div class="spotlight-beam"></div>
                <div class="spotlight-center"></div>
            </div>

            <!-- LOGO TOP LEFT -->
            <img src="/logo/Zigma-logo.webp" class="logo-left" />
            
            <!-- LOGO TOP RIGHT -->
            <img src="/logo/gameforsmart.webp" class="logo-right" />

            <div class="result-card">
                <div class="result-avatar-container">
                    <div class="char-anim result-char anim-play" style="${characterVisuals.base}"></div>
                    ${characterVisuals.hair ? `<div class="char-anim result-char anim-play" style="${characterVisuals.hair}"></div>` : ''}
                </div>
                <div class="result-name">${myEntry.name}</div>
                
                <div class="result-stats-row">
                    <div class="stat-box">
                        <span class="material-symbols-outlined stat-icon">military_tech</span>
                        <div class="stat-value">#${myEntry.rank}</div>
                        <div class="stat-label">RANK</div>
                    </div>
                    <div class="stat-box">
                        <span class="material-symbols-outlined stat-icon">workspace_premium</span>
                        <div class="stat-value">${myEntry.score}</div>
                        <div class="stat-label">SCORE</div>
                    </div>
                    <div class="stat-box">
                        <span class="material-symbols-outlined stat-icon">task_alt</span>
                        <div class="stat-value">${myEntry.correctAnswers}/5</div>
                        <div class="stat-label">CORRECT</div>
                    </div>
                    <div class="stat-box">
                        <span class="material-symbols-outlined stat-icon">schedule</span>
                        <div class="stat-value">${formatTime(myEntry.duration)}</div>
                        <div class="stat-label">TIME</div>
                    </div>
                </div>
            </div>

            <div class="lb-footer">
                <button id="lb-home-btn" class="nav-btn btn-left">
                    <span class="material-symbols-outlined">home</span>
                </button>
                <button id="lb-full-btn" class="nav-btn btn-right">
                    <span class="material-symbols-outlined">leaderboard</span>
                </button>
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

    private attachListeners() {
        setTimeout(() => {
            const homeBtn = document.getElementById('lb-home-btn');
            const fullBtn = document.getElementById('lb-full-btn');

            if (homeBtn) homeBtn.onclick = () => {
                TransitionManager.transitionTo(() => {
                    this.cleanup();
                    const room = this.registry.get('room');
                    if (room) room.leave();
                    window.location.href = '/';
                });
            };

            if (fullBtn) fullBtn.onclick = () => {
                TransitionManager.transitionTo(() => {
                    this.cleanup();
                    this.scene.start('LeaderboardScene');
                });
            };
        }, 50);
    }

    cleanup() {
        if (this.container) this.container.remove();
        const style = document.getElementById('result-styles');
        if (style) style.remove();
    }
}
