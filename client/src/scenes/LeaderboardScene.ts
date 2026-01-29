import Phaser from 'phaser';

interface RankingEntry {
    rank: number;
    sessionId: string;
    name: string;
    score: number;
    finishTime: number;
    correctAnswers: number;
    wrongAnswers: number;
}

export class LeaderboardScene extends Phaser.Scene {
    private container!: HTMLDivElement;

    constructor() {
        super({ key: 'LeaderboardScene' });
    }

    create() {
        const rankings: RankingEntry[] = this.registry.get('leaderboardData') || [];
        const top3 = rankings.slice(0, 3);
        const rest = rankings.slice(3);

        // Build HTML
        this.container = document.createElement('div');
        this.container.id = 'leaderboard-overlay';
        this.container.innerHTML = `
            <style>
                #leaderboard-overlay {
                    position: fixed;
                    inset: 0;
                    background: #0a0a0a;
                    display: flex;
                    flex-direction: column;
                    z-index: 9999;
                    font-family: 'Press Start 2P', monospace;
                    color: #fff;
                    overflow-y: auto;
                }
                .lb-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px 24px;
                    background: #111;
                    border-bottom: 2px solid #00ff88;
                }
                .lb-title {
                    font-size: 14px;
                    color: #00ff88;
                }
                .lb-title span { color: #fff; }
                .lb-content {
                    flex: 1;
                    padding: 24px;
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                }
                /* Podium */
                .podium {
                    display: flex;
                    justify-content: center;
                    align-items: flex-end;
                    gap: 16px;
                    margin-bottom: 24px;
                }
                .podium-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                }
                .podium-avatar {
                    width: 48px;
                    height: 48px;
                    background: #222;
                    border: 3px solid #00ff88;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                    margin-bottom: 8px;
                }
                .podium-name {
                    font-size: 10px;
                    color: #00ff88;
                    margin-bottom: 4px;
                    max-width: 100px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .podium-score {
                    font-size: 8px;
                    color: #888;
                }
                .podium-bar {
                    width: 80px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 32px;
                    font-weight: bold;
                    border: 3px solid #333;
                }
                .podium-bar.first { height: 120px; background: #00ff88; color: #0a0a0a; }
                .podium-bar.second { height: 90px; background: #1a3a2a; color: #00ff88; }
                .podium-bar.third { height: 60px; background: #1a2a3a; color: #00aaff; }
                /* Rankings Table */
                .rankings-section {
                    background: #111;
                    border: 2px solid #333;
                    padding: 16px;
                }
                .rankings-header {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 16px;
                    font-size: 10px;
                    color: #00ff88;
                }
                .rankings-table {
                    width: 100%;
                }
                .rankings-row {
                    display: flex;
                    align-items: center;
                    padding: 12px 8px;
                    background: rgba(0,0,0,0.3);
                    border: 1px solid #222;
                    margin-bottom: 4px;
                }
                .rank-num { width: 50px; color: #666; font-size: 10px; }
                .rank-name { flex: 1; font-size: 10px; }
                .rank-score { width: 80px; text-align: right; color: #00ff88; font-size: 10px; }
                /* Buttons */
                .lb-buttons {
                    display: flex;
                    gap: 16px;
                    padding: 16px 24px;
                    background: #111;
                    border-top: 2px solid #333;
                }
                .lb-btn {
                    flex: 1;
                    padding: 16px;
                    font-family: 'Press Start 2P', monospace;
                    font-size: 10px;
                    border: 3px solid #333;
                    cursor: pointer;
                    text-transform: uppercase;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }
                .lb-btn.secondary { background: #222; color: #fff; }
                .lb-btn.primary { background: #00ff88; color: #0a0a0a; }
                .lb-btn:hover { opacity: 0.9; }
            </style>
            <div class="lb-header">
                <div class="lb-title">🎮 <span>MATCH RESULT</span> SUMMARY</div>
            </div>
            <div class="lb-content">
                <div class="podium">
                    ${this.renderPodium(top3)}
                </div>
                <div class="rankings-section">
                    <div class="rankings-header">
                        <span>📋 FINAL RANKINGS</span>
                        <span>SHOWING ${rankings.length} PLAYERS</span>
                    </div>
                    <div class="rankings-table">
                        ${rankings.map(r => `
                            <div class="rankings-row">
                                <span class="rank-num">#${String(r.rank).padStart(2, '0')}</span>
                                <span class="rank-name">👤 ${r.name.toUpperCase()}</span>
                                <span class="rank-score">${r.score.toLocaleString()}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
            <div class="lb-buttons">
                <button class="lb-btn secondary" id="lb-back">← BACK TO LOBBY</button>
                <button class="lb-btn primary" id="lb-again">↻ PLAY AGAIN</button>
            </div>
        `;
        document.body.appendChild(this.container);

        // Button handlers
        document.getElementById('lb-back')?.addEventListener('click', () => {
            this.cleanup();
            // Full page reload to clean all overlays and reset game state
            window.location.href = window.location.origin + '/#/lobby';
            window.location.reload();
        });

        document.getElementById('lb-again')?.addEventListener('click', () => {
            this.cleanup();
            // Full page reload to clean all overlays and reset game state
            window.location.href = window.location.origin + '/#/lobby';
            window.location.reload();
        });

        // Update URL hash
        window.location.hash = '/leaderboard';
    }

    renderPodium(top3: RankingEntry[]): string {
        const positions = ['second', 'first', 'third'];
        const order = [1, 0, 2]; // Display order: 2nd, 1st, 3rd

        return order.map(i => {
            const player = top3[i];
            if (!player) return '';
            return `
                <div class="podium-item">
                    <div class="podium-avatar">👤</div>
                    <div class="podium-name">${player.name.toUpperCase()}</div>
                    <div class="podium-score">${player.score.toLocaleString()} PTS</div>
                    <div class="podium-bar ${positions[i]}">${player.rank}</div>
                </div>
            `;
        }).join('');
    }

    cleanup() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }

    shutdown() {
        this.cleanup();
    }
}
