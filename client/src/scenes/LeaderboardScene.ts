import Phaser from 'phaser';
import { TransitionManager } from '../utils/TransitionManager';

interface RankingEntry {
    rank: number;
    sessionId: string;
    name: string;
    score: number;
    finishTime: number;
    duration: number; // New field from server
    correctAnswers: number;
    wrongAnswers: number;
}

export class LeaderboardScene extends Phaser.Scene {
    private container!: HTMLDivElement;

    constructor() {
        super({ key: 'LeaderboardScene' });
    }

    create() {
        // 1. Get Data from Registry (passed from GameScene)
        let rankings: RankingEntry[] = this.registry.get('leaderboardData') || [];
        console.log("LeaderboardScene received rankings:", rankings);

        // FALLBACK FOR TESTING
        if (rankings.length === 0) {
            console.warn("No leaderboard data found! Using dummy data for testing.");
            rankings = [
                { rank: 1, sessionId: '1', name: 'Alif', score: 2400, finishTime: 100, duration: 45000, correctAnswers: 10, wrongAnswers: 0 },
                { rank: 2, sessionId: '2', name: 'Budi', score: 1800, finishTime: 110, duration: 48000, correctAnswers: 8, wrongAnswers: 2 },
                { rank: 3, sessionId: '3', name: 'Citra', score: 1200, finishTime: 120, duration: 50000, correctAnswers: 6, wrongAnswers: 4 },
                { rank: 4, sessionId: '4', name: 'Dewi', score: 900, finishTime: 130, duration: 55000, correctAnswers: 4, wrongAnswers: 6 },
                { rank: 5, sessionId: '5', name: 'Eko', score: 600, finishTime: 140, duration: 60000, correctAnswers: 2, wrongAnswers: 8 },
            ];
        }

        // Sort just in case server didn't
        rankings.sort((a, b) => a.rank - b.rank);

        const top3 = rankings.slice(0, 3);
        const others = rankings.slice(3);

        // 2. Build HTML Structure
        this.container = document.createElement('div');
        this.container.id = 'leaderboard-ui';
        this.container.style.position = 'absolute';
        this.container.style.top = '0';
        this.container.style.left = '0';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.zIndex = '1000';

        // CSS Styles (Premium Gradient Theme)
        const style = document.createElement('style');
        style.id = 'leaderboard-styles'; // Add ID for cleanup
        style.innerHTML = `
            @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Space+Grotesk:wght@400;700&display=swap');

            #leaderboard-ui {
                /* Deep rich background match reference mood but cleaner */
                background: radial-gradient(circle at center top, #2a2a35 0%, #121216 80%);
                color: white;
                display: flex;
                flex-direction: column;
                align-items: center;
                overflow-y: auto;
                font-family: 'Space Grotesk', sans-serif; /* Cleaner main font */
                padding-bottom: 20px; /* Space for footer */
            }

            /* Hide Scrollbar */
            #leaderboard-ui::-webkit-scrollbar {
                display: none;
            }
            #leaderboard-ui {
                -ms-overflow-style: none;  /* IE and Edge */
                scrollbar-width: none;  /* Firefox */
            }

            /* --- Header --- */
            .lb-header {
                text-align: center;
                margin-top: 40px;
                margin-bottom: 20px; /* Reduced margin */
                z-index: 10;
            }
            .lb-title {
                font-family: 'Press Start 2P', cursive;
                font-size: 36px;
                color: #ffffff;
                text-shadow: 0 4px 10px rgba(0,0,0,0.5);
                margin-bottom: 8px;
                text-transform: uppercase;
                letter-spacing: 2px;
            }
            
            /* --- PODIUM (Premium Gradient) --- */
            .podium-section {
                display: flex;
                justify-content: center;
                align-items: flex-end;
                gap: 20px; /* Slightly wider gap */
                margin-bottom: 50px;
                perspective: 1000px;
                padding-top: 50px; /* Extra space for names/crowns */
            }

            .podium-column {
                display: flex;
                flex-direction: column;
                align-items: center;
                position: relative;
                width: 140px; /* Slightly wider */
                transition: transform 0.3s ease;
            }
            .podium-column:hover {
                transform: translateY(-5px);
            }

            /* Order: 2, 1, 3 */
            .podium-column.rank-1 { order: 2; z-index: 10; }
            .podium-column.rank-2 { order: 1; }
            .podium-column.rank-3 { order: 3; }

            /* Avatar & Name Group */
            .podium-head-group {
                display: flex;
                flex-direction: column;
                align-items: center;
                margin-bottom: 5px; /* Tiny gap before base */
                position: relative;
                z-index: 5;
            }

            .podium-avatar {
                width: 70px;
                height: 70px;
                border-radius: 50%;
                background: #333;
                border: 4px solid #fff;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 10px 20px rgba(0,0,0,0.4);
                position: relative;
                z-index: 2;
                overflow: hidden;
                margin-bottom: 8px; /* Space between Avatar and Name */
            }
            .podium-avatar span { font-size: 32px; color: #fff; }
            
            /* Crown for Rank 1 */
            .rank-1 .podium-head-group::after {
                content: '👑';
                font-size: 40px;
                position: absolute;
                top: -36px;
                left: 50%;
                transform: translateX(-50%);
                filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
                animation: float 2s ease-in-out infinite;
            }
            @keyframes float { 0%{transform:translate(-50%,0)} 50%{transform:translate(-50%,-6px)} 100%{transform:translate(-50%,0)} }

            /* Avatar Colors */
            .rank-1 .podium-avatar { border-color: #FFD700; background: linear-gradient(135deg, #FFD700, #B8860B); }
            .rank-2 .podium-avatar { border-color: #C0C0C0; background: linear-gradient(135deg, #E0E0E0, #A9A9A9); }
            .rank-3 .podium-avatar { border-color: #CD7F32; background: linear-gradient(135deg, #CD7F32, #8B4513); }
            
            .rank-1 .podium-avatar span { color: #5c4202; }
            .rank-2 .podium-avatar span { color: #333; }
            .rank-3 .podium-avatar span { color: #3e1f06; }

            /* Name & Score (No Container) */
            .podium-info {
                text-align: center;
                /* Removed background box */
            }
            .podium-name {
                font-weight: 700;
                font-size: 15px; /* Slightly larger */
                margin-bottom: 2px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                color: #fff;
                text-shadow: 0 2px 4px rgba(0,0,0,1); /* Strong shadow for readability */
                display: block;
                max-width: 140px; /* Match column width */
            }
            .podium-score {
                font-size: 11px;
                font-weight: 700;
                color: #00ff55; /* Neon green highlight */
                text-shadow: 0 1px 2px rgba(0,0,0,1);
            }

            /* Podium Base */
            .podium-base {
                width: 100%;
                border-radius: 12px 12px 0 0;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center; /* Center Number Vertically */
                box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                position: relative;
                
                /* Subtle shine */
                overflow: hidden;
            }
            .podium-base::before {
                content: '';
                position: absolute;
                top: 0; left: 0; right: 0; height: 100%;
                background: linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent);
                transform: skewX(-20deg) translateX(-150%);
                animation: shine 4s infinite;
            }
            @keyframes shine { 100% { transform: skewX(-20deg) translateX(200%); } }

            /* Podium Heights */
            .rank-1 .podium-base { height: 180px; background: linear-gradient(180deg, #FFD700 0%, #E6C200 40%, #B8860B 100%); }
            .rank-2 .podium-base { height: 140px; background: linear-gradient(180deg, #E0E0E0 0%, #CCCCCC 40%, #808080 100%); }
            .rank-3 .podium-base { height: 110px; background: linear-gradient(180deg, #E39C64 0%, #CD7F32 40%, #8B4513 100%); }

            /* Rank Number on Base - OUTLINED */
            .podium-rank-num {
                font-family: 'Press Start 2P';
                font-size: 64px; /* Larger */
                color: #ffffff; 
                margin: 0;
                line-height: 1;
                /* Text Stroke / Outline */
                -webkit-text-stroke: 4px rgba(0,0,0,0.4); 
                paint-order: stroke fill;
                /* Drop Shadow */
                filter: drop-shadow(0 4px 0 rgba(0,0,0,0.3));
                opacity: 1; 
                mix-blend-mode: normal; /* Remove overlay blend to make it pop */
            }

            /* --- Other Ranks List --- */
            .list-section {
                width: 100%;
                max-width: 600px;
                display: flex;
                flex-direction: column;
                gap: 8px;
                padding: 0 20px;
            }

            .list-item {
                display: flex;
                align-items: center;
                background: rgba(255,255,255,0.05);
                border-left: 4px solid #444;
                padding: 12px 16px;
                border-radius: 0 8px 8px 0;
                transition: background 0.2s;
            }
            .list-item:hover {
                background: rgba(255,255,255,0.1);
            }

            .list-rank {
                font-family: 'Press Start 2P';
                font-size: 12px;
                color: #888;
                width: 40px;
            }
            .list-avatar {
                width: 32px;
                height: 32px;
                background: #333;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 12px;
                border: 1px solid #555;
            }
            .list-avatar span { font-size: 16px; color: #888; }
            
            .list-name { flex: 1; font-weight: 700; font-size: 14px; color: #eee; }
            .list-stats {
                display: flex;
                gap: 16px;
                font-size: 12px;
                font-family: 'Space Grotesk', monospace;
                color: #aaa;
            }
            .stat-highlight { color: #00ff55; font-weight: bold; }

            /* --- Footer (Nav Buttons) --- */
            .lb-footer {
                position: fixed;
                top: 50%;
                left: 0;
                width: 100%;
                display: flex;
                justify-content: space-between;
                padding: 0 20px;
                z-index: 200;
                pointer-events: none; 
                transform: translateY(-50%); 
            }

            .nav-btn {
                pointer-events: auto;
                background: rgba(20, 20, 24, 0.9);
                backdrop-filter: blur(10px);
                border: 2px solid rgba(255,255,255,0.2);
                border-radius: 50%; 
                width: 60px;
                height: 60px;
                padding: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                cursor: pointer;
                transition: all 0.2s;
                box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            }
            .nav-btn:hover {
                border-color: #00ff55;
                transform: scale(1.1);
                box-shadow: 0 0 20px rgba(0, 255, 85, 0.4);
                color: #00ff55;
            }
            .nav-btn .material-symbols-outlined { font-size: 28px; }

        `;
        document.head.appendChild(style);

        // HTML Content Construction
        this.container.innerHTML = `
            <div class="lb-header">
                <div class="lb-title">Leaderboard</div>
            </div>

            <!-- PODIUM -->
            <div class="podium-section">
                ${this.renderPodium(top3)}
            </div>

            <!-- LIST -->
            <div class="list-section">
                ${others.map(p => `
                    <div class="list-item">
                        <div class="list-rank">#${p.rank}</div>
                        <div class="list-avatar"><span class="material-symbols-outlined">person</span></div>
                        <div class="list-name">${p.name}</div>
                        <div class="list-stats">
                            <span>${this.formatDuration(p.duration)}</span>
                            <span class="stat-highlight">${p.score} PTS</span>
                        </div>
                    </div>
                `).join('')}
            </div>

            <!-- FOOTER NAV -->
            <div class="lb-footer">
                <button id="lb-back-btn" class="nav-btn">
                    <span class="material-symbols-outlined">arrow_back</span>
                </button>
                
                <button id="lb-home-btn" class="nav-btn">
                    <span class="material-symbols-outlined">home</span>
                </button>
            </div>
        `;

        document.body.appendChild(this.container);

        // --- Event Listeners ---
        document.getElementById('lb-back-btn')?.addEventListener('click', () => {
            TransitionManager.transitionTo(() => {
                this.cleanup();
                window.location.href = '/';
            });
        });

        document.getElementById('lb-home-btn')?.addEventListener('click', () => {
            TransitionManager.transitionTo(() => {
                this.cleanup();
                window.location.href = '/';
            });
        });
    }

    renderPodium(top3: RankingEntry[]): string {
        const order = [1, 0, 2];

        return order.map(i => {
            const player = top3[i];
            const rank = i + 1;

            if (!player) {
                return `<div class="podium-column rank-${rank}" style="opacity:0.2"></div>`;
            }

            const actualRank = player.rank;

            return `
                <div class="podium-column rank-${actualRank}">
                    <!-- Head Group: Avatar + Name + Score (Now floating above base) -->
                    <div class="podium-head-group">
                        <div class="podium-avatar">
                            <span class="material-symbols-outlined">face</span>
                        </div>
                        <div class="podium-info">
                            <div class="podium-name">${player.name}</div>
                            <div class="podium-score">${player.score} PTS</div>
                        </div>
                    </div>

                    <!-- Base: Just the Rank Number -->
                    <div class="podium-base">
                        <div class="podium-rank-num">${actualRank}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    formatDuration(ms: number): string {
        if (!ms) return "--:--";
        const seconds = Math.floor(ms / 1000);
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    cleanup() {
        if (this.container) {
            this.container.remove();
        }
        const style = document.getElementById('leaderboard-styles');
        if (style) {
            style.remove();
        }
    }
}
