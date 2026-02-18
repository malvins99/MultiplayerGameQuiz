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

export class HostLeaderboardScene extends Phaser.Scene {
    private container!: HTMLDivElement;
    private client!: Client;

    constructor() {
        super({ key: 'HostLeaderboardScene' });
    }

    preload() {
        // Load base character sprite (idle)
        this.load.spritesheet('base_idle', '/assets/base_idle_strip9.png', {
            frameWidth: 96,
            frameHeight: 64
        });

        // Load hair sprites (idle) - hairId 1-6
        const hairKeys = ['bowlhair', 'curlyhair', 'longhair', 'mophair', 'shorthair', 'spikeyhair'];
        hairKeys.forEach(key => {
            this.load.spritesheet(`${key}_idle`, `/assets/${key}_idle_strip9.png`, {
                frameWidth: 96,
                frameHeight: 64
            });
        });
    }

    create() {
        console.log("[HostLeaderboardScene] Scene started!");

        try {
            // Initialize Client for Restart Capability
            const envServerUrl = import.meta.env.VITE_SERVER_URL;
            let host = envServerUrl;
            if (!host) {
                const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
                host = window.location.hostname === 'localhost'
                    ? 'ws://localhost:2567'
                    : `${protocol}://${window.location.host}`;
            }
            this.client = new Client(host);

            // 1. Get Data from Registry
            let rankings: RankingEntry[] = this.registry.get('leaderboardData') || [];

            // Sort just in case server didn't
            rankings.sort((a, b) => a.rank - b.rank);

            const top2 = rankings.slice(0, 2);
            const allPlayers = rankings;

            // 2. Build HTML Structure
            this.container = document.createElement('div');
            this.container.id = 'host-leaderboard-ui';

            // CRITICAL: Inline styles for positioning
            this.container.style.cssText = `
                position: fixed;
                inset: 0;
                width: 100%;
                height: 100%;
                z-index: 9999;
                overflow-y: auto;
                overflow-x: hidden;
            `;

            // Helper to format duration (ms -> MM:SS)
            const formatTime = (ms: number): string => {
                const totalSeconds = Math.floor(ms / 1000);
                const minutes = Math.floor(totalSeconds / 60);
                const seconds = totalSeconds % 60;
                return `${minutes}:${seconds.toString().padStart(2, '0')}`;
            };

            // CSS + HTML
            this.container.innerHTML = `
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');
                
                #host-leaderboard-ui {
                    position: fixed;
                    inset: 0;
                    background: linear-gradient(135deg, #0a1f0a 0%, #0f2e1a 50%, #0a1912 100%);
                    color: #fff;
                    font-family: 'Orbitron', sans-serif;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 20px;
                    box-sizing: border-box;
                }

                /* Top Winner Cards Container */
                .top-winners {
                    display: flex;
                    justify-content: center;
                    align-items: flex-end;
                    gap: 30px;
                    margin-top: 80px;
                    margin-bottom: 60px;
                    position: relative;
                }

                /* Winner Card */
                .winner-card {
                    position: relative;
                    background: rgba(20, 25, 45, 0.95);
                    border-radius: 20px;
                    padding: 30px 20px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    min-width: 240px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.5);
                    transition: transform 0.3s ease;
                }

                .winner-card:hover {
                    transform: translateY(-5px);
                }

                /* Rank 1 (center, larger, gold border) */
                .winner-card.rank-1 {
                    border: 3px solid #4ade80;
                    box-shadow: 0 0 30px rgba(74, 222, 128, 0.5);
                    min-height: 350px;
                }

                /* Rank 2 (left, silver border) */
                .winner-card.rank-2 {
                    border: 3px solid #C0C0C0;
                    box-shadow: 0 0 20px rgba(192, 192, 192, 0.3);
                    min-height: 320px;
                }

                /* Rank Badge */
                .rank-badge {
                    position: absolute;
                    top: -15px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: #FFD700;
                    color: #000;
                    font-weight: 900;
                    font-size: 18px;
                    padding: 8px 20px;
                    border-radius: 20px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                    z-index: 10;
                }

                .rank-badge.rank-2 {
                    background: #C0C0C0;
                }

                /* Character Sprite Canvas */
                .character-sprite, .character-sprite-container {
                    width: 100px;
                    height: 100px;
                    margin: 20px 0;
                    background: rgba(255,255,255,0.05);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 48px;
                }

                /* Player Name */
                .player-name {
                    font-size: 18px;
                    font-weight: 700;
                    color: #4ade80;
                    margin: 10px 0;
                    text-align: center;
                    max-width: 200px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                /* Score Display */
                .score-display {
                    font-size: 36px;
                    font-weight: 900;
                    color: #FFD700;
                    text-shadow: 0 0 20px rgba(255,215,0,0.8);
                    margin-top: 10px;
                }

                .winner-card.rank-2 .score-display {
                    color: #C0C0C0;
                    text-shadow: 0 0 20px rgba(192,192,192,0.6);
                }

                /* Leaderboard Table */
                .leaderboard-table-container {
                    width: 90%;
                    max-width: 800px;
                    background: rgba(20, 25, 45, 0.7);
                    border-radius: 15px;
                    padding: 20px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.4);
                }

                .leaderboard-table {
                    width: 100%;
                    border-collapse: collapse;
                }

                .leaderboard-table thead {
                    background: rgba(34, 197, 94, 0.1);
                }

                .leaderboard-table th {
                    padding: 15px;
                    text-align: left;
                    font-size: 14px;
                    font-weight: 700;
                    color: #4ade80;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    border-bottom: 2px solid rgba(74, 222, 128, 0.3);
                }

                .leaderboard-table tbody tr {
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                    transition: background 0.2s ease;
                }

                .leaderboard-table tbody tr:hover {
                    background: rgba(34, 197, 94, 0.05);
                }

                .leaderboard-table td {
                    padding: 15px;
                    font-size: 14px;
                }

                .leaderboard-table td.rank-cell {
                    color: #4ade80;
                    font-weight: 700;
                    font-size: 16px;
                }

                .leaderboard-table td.player-cell {
                    color: #fff;
                    font-weight: 600;
                }

                .leaderboard-table td.score-cell {
                    color: #FFD700;
                    font-weight: 700;
                    font-size: 16px;
                }

                .leaderboard-table td.time-cell {
                    color: #999;
                    font-family: monospace;
                }

                /* Action Buttons - Centered Vertically on Left and Right */
                .home-btn {
                    position: fixed;
                    left: 30px;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    border: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #16a34a, #15803d);
                    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                    z-index: 100;
                }

                .home-btn:hover {
                    transform: translateY(-50%) scale(1.15);
                    box-shadow: 0 6px 25px rgba(34, 197, 94, 0.6);
                }

                .restart-btn {
                    position: fixed;
                    right: 30px;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    border: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #eab308, #ca8a04);
                    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                    z-index: 100;
                }

                .restart-btn:hover {
                    transform: translateY(-50%) scale(1.15);
                    box-shadow: 0 6px 25px rgba(234, 179, 8, 0.6);
                }

                .action-btn svg {
                    width: 28px;
                    height: 28px;
                    fill: white;
                }
            </style>

            <div class="top-winners">
                ${this.renderTop2Cards(top2)}
            </div>

            <div class="leaderboard-table-container">
                <table class="leaderboard-table">
                    <thead>
                        <tr>
                            <th>RANK</th>
                            <th>PLAYER</th>
                            <th>SCORE</th>
                            <th>TIME</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${allPlayers.map(p => `
                            <tr>
                                <td class="rank-cell">#${p.rank}</td>
                                <td class="player-cell">${this.escapeHtml(p.name)}</td>
                                <td class="score-cell">${p.score}</td>
                                <td class="time-cell">${formatTime(p.duration)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <!-- Action Buttons -->
            <button class="home-btn" id="home-btn">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                </svg>
            </button>
            <button class="restart-btn" id="restart-btn">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
                </svg>
            </button>
        `;

            document.body.appendChild(this.container);
            console.log("[HostLeaderboardScene] Container appended to body");

            // Attach Event Listeners
            setTimeout(() => {
                const homeBtn = document.getElementById('home-btn');
                const restartBtn = document.getElementById('restart-btn');

                if (homeBtn) {
                    homeBtn.addEventListener('click', () => {
                        TransitionManager.transitionTo(() => {
                            this.cleanup();
                            const room = this.registry.get('room');
                            if (room) room.leave();
                            window.location.href = '/';
                        });
                    });
                }

                if (restartBtn) {
                    restartBtn.addEventListener('click', async (e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        const options = this.registry.get('lastGameOptions');
                        if (!options) {
                            console.error("No restart options found!");
                            return;
                        }

                        const room = this.registry.get('room');
                        if (room) room.leave();

                        try {
                            this.container.innerHTML = `<div style="display:flex;height:100%;align-items:center;justify-content:center;color:white;font-family:'Orbitron'">CREATING ROOM...</div>`;
                            const newRoom = await this.client.joinOrCreate("game_room", options);

                            TransitionManager.transitionTo(() => {
                                this.cleanup();
                                Router.navigate('/host/lobby');
                                this.scene.start('HostWaitingRoomScene', { room: newRoom, isHost: true });
                            });
                        } catch (e) {
                            console.error("Restart Failed:", e);
                            alert("Failed to restart room.");
                            window.location.href = '/';
                        }
                    });
                }

                console.log("[HostLeaderboardScene] Event listeners attached");
            }, 100);

            console.log("[HostLeaderboardScene] Create completed successfully!");

        } catch (error) {
            console.error("[HostLeaderboardScene] ERROR in create():", error);
            // Show error on screen
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = 'position:fixed;inset:0;background:#000;color:#ff0000;font-family:monospace;padding:20px;font-size:14px;overflow:auto;z-index:99999;';
            errorDiv.textContent = `HostLeaderboardScene Error:\n${error}`;
            document.body.appendChild(errorDiv);
        }
    }

    renderTop2Cards(top2: RankingEntry[]): string {
        if (top2.length === 0) {
            return '<div style="color:#999;">No players</div>';
        }

        let html = '';
        console.log('[HostLeaderboard] Rendering top 2 cards:', top2);

        // Render in order: #2, #1 (so #1 appears centered and larger)
        const rank2 = top2.find(p => p.rank === 2);
        const rank1 = top2.find(p => p.rank === 1);

        if (rank2) {
            console.log('[HostLeaderboard] Rank 2 player:', rank2.name, 'hairId:', rank2.hairId);
            html += `
                <div class="winner-card rank-2" id="rank2-card">
                    <div class="rank-badge rank-2">#2</div>
                    <div class="character-sprite-container" id="char-rank2"></div>
                    <div class="player-name">${this.escapeHtml(rank2.name)}</div>
                    <div class="score-display">${rank2.score}</div>
                </div>
            `;
            // Create Phaser sprite
            setTimeout(() => {
                console.log('[HostLeaderboard] Attempting to create sprite for rank2');
                this.createCharacterSprite('char-rank2', rank2.hairId || 1);
            }, 200);
        }

        if (rank1) {
            console.log('[HostLeaderboard] Rank 1 player:', rank1.name, 'hairId:', rank1.hairId);
            html += `
                <div class="winner-card rank-1" id="rank1-card">
                    <div class="rank-badge rank-1">#1</div>
                    <div class="character-sprite-container" id="char-rank1"></div>
                    <div class="player-name">${this.escapeHtml(rank1.name)}</div>
                    <div class="score-display">${rank1.score}</div>
                </div>
            `;
            // Create Phaser sprite
            setTimeout(() => {
                console.log('[HostLeaderboard] Attempting to create sprite for rank1');
                this.createCharacterSprite('char-rank1', rank1.hairId || 1);
            }, 200);
        }

        return html;
    }

    createCharacterSprite(containerId: string, hairId: number) {
        try {
            const container = document.getElementById(containerId);
            if (!container) {
                console.error(`[HostLeaderboard] Container ${containerId} not found`);
                return;
            }

            // Map hairId (1-6) to hair key
            const hairKeys = ['bowlhair', 'curlyhair', 'longhair', 'mophair', 'shorthair', 'spikeyhair'];
            const hairKey = hairKeys[hairId - 1] || 'bowlhair';

            console.log(`[HostLeaderboard] Creating sprite for ${containerId} with hairId ${hairId} (${hairKey})`);

            // Create offscreen render texture (2x larger for better visibility)
            const rt = this.add.renderTexture(0, 0, 192, 128);
            rt.setVisible(false);

            // Create base sprite
            const baseSprite = this.add.sprite(96, 64, 'base_idle', 1);
            baseSprite.setOrigin(0.5, 0.5);
            baseSprite.setScale(2); // Scale 2x for larger display

            // Create hair sprite
            const hairSprite = this.add.sprite(96, 64, `${hairKey}_idle`, 1);
            hairSprite.setOrigin(0.5, 0.5);
            hairSprite.setScale(2); // Scale 2x for larger display

            // Draw to render texture
            rt.draw(baseSprite);
            rt.draw(hairSprite);

            // Convert to image and inject into HTML
            rt.snapshot((snapshot: HTMLImageElement | Phaser.Display.Color) => {
                if (snapshot instanceof HTMLImageElement && snapshot.src) {
                    container.innerHTML = `<img src="${snapshot.src}" style="width: 100%; height: 100%; object-fit: contain; image-rendering: pixelated;" />`;
                    console.log(`[HostLeaderboard] Successfully rendered character for ${containerId}`);
                }
            });

            // Cleanup
            baseSprite.destroy();
            hairSprite.destroy();
            setTimeout(() => rt.destroy(), 500);

        } catch (e) {
            console.error('[HostLeaderboard] Failed to create character sprite:', e);
        }
    }


    escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    cleanup() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}
