import Phaser from 'phaser';
import { Router } from '../utils/Router';
import { supabase } from '../lib/supabase';

// Interfaces for Room State (simplified)
interface PlayerSync {
    sessionId: string;
    x: number;
    y: number;
    name: string;
    isHost: boolean;
    hairId: number;
    score: number;
    correctAnswers: number;
    wrongAnswers: number;
    finishTime: number;
}

export class WaitingResultsScene extends Phaser.Scene {
    private container!: HTMLDivElement;
    private dots: string = '';
    private dotInterval!: number;
    private characterContainer!: Phaser.GameObjects.Container;

    constructor() {
        super({ key: 'WaitingResultsScene' });
    }

    create() {
        // --- CLEANUP GAME UI ---
        // Ensure Game UI layer is hidden
        const uiLayer = document.getElementById('ui-layer');
        if (uiLayer) uiLayer.classList.add('hidden');

        // Stop the HUD/UI Scene from the game
        if (this.scene.isActive('UIScene')) {
            this.scene.stop('UIScene');
        }

        // Update URL
        Router.navigate('/player/result');

        // Check Room State
        const room = this.registry.get('room');
        const playerCount = room?.state?.players?.size || 0;

        // Retrieve Player Data (Initial Mock/State)
        let myPlayer: PlayerSync | null = null;
        let gameStartTime = 0;

        if (room) {
            myPlayer = room.state.players.get(room.sessionId);
            gameStartTime = room.state.gameStartTime || Date.now();
        }

        // Placeholder Stats (while fetching DB)
        let score = myPlayer?.score || 0;
        let correct = myPlayer?.correctAnswers || 0;
        let wrong = myPlayer?.wrongAnswers || 0;
        let totalQuestions = room?.state?.questions?.length || 5;

        let durationStr = "00:00";
        if (myPlayer?.finishTime) {
            const durationMs = myPlayer.finishTime - gameStartTime;
            const minutes = Math.floor(durationMs / 60000);
            const seconds = Math.floor((durationMs % 60000) / 1000);
            durationStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }

        // --- FETCH REAL DATA FROM SUPABASE ---
        if (room && myPlayer) {
            const fetchDBStats = async () => {
                const sessionId = room.id; // Assuming Colyseus Room ID = Supabase Session ID
                const nickname = myPlayer?.name;

                if (!sessionId || !nickname) return;

                const { data, error } = await supabase
                    .from('participants')
                    .select('score, correct, answers, duration, finished_at, current_question')
                    .eq('session_id', sessionId)
                    .ilike('nickname', nickname) // Case-insensitive match if needed
                    .maybeSingle();

                if (data) {
                    console.log("[WaitingResults] Extracted DB Data:", data);

                    // Update Score
                    const scoreEl = this.container.querySelector('.stat-value.score');
                    if (scoreEl) scoreEl.textContent = Math.round(data.score || 0).toString();

                    // Update Correct
                    const correctEl = this.container.querySelector('.stat-value.correct');
                    const totalAns = data.answers ? (Array.isArray(data.answers) ? data.answers.length : 0) : 0;
                    // Use max(totalAns, current_question) just in case
                    const displayTotal = Math.max(totalAns, data.current_question || 0);

                    if (correctEl) {
                        correctEl.innerHTML = `${data.correct || 0}<span class="text-xs text-white/50 block mt-1">/${displayTotal}</span>`;
                    }

                    // Update Time
                    const timeEl = this.container.querySelector('.stat-value.time');
                    if (timeEl) {
                        let ms = data.duration || 0;
                        if (ms === 0 && data.finished_at) {
                            // Fallback calculation if duration is 0
                            // This part is tricky without started_at, assume ms is valid if > 0
                        }

                        // If ms is small (<10000), assume seconds. Else ms.
                        // Typically DB stores ms or seconds. Let's assume MS based on Phaser usage.
                        // If it's seconds, multiply by 1000.
                        const timeVal = ms < 10000 ? ms * 1000 : ms;

                        const mins = Math.floor(timeVal / 60000);
                        const secs = Math.floor((timeVal % 60000) / 1000);
                        timeEl.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                    }
                } else if (error) {
                    console.error("[WaitingResults] DB Fetch Error:", error);
                }
            };
            fetchDBStats();
        }

        // --- 1. BACKGROUND (Phaser) ---
        this.cameras.main.setBackgroundColor('#121216');

        // --- 2. AVATAR (Phaser Sprites) ---
        // Centered roughly in the upper middle
        const cx = this.cameras.main.width / 2;
        const cy = this.cameras.main.height / 2 - 100; // Shifted up further (from -50)

        if (myPlayer) {
            this.characterContainer = this.add.container(cx, cy);

            // Base
            const baseSprite = this.add.sprite(0, 0, 'base_idle');
            baseSprite.play('idle');
            baseSprite.setScale(5); // Increased scale for visibility

            // Hair
            const hairKeys = ['bowlhair', 'curlyhair', 'longhair', 'mophair', 'shorthair', 'spikeyhair'];
            const hairKey = hairKeys[myPlayer.hairId] || 'bowlhair';
            const hairSprite = this.add.sprite(0, 0, `${hairKey}_idle`);
            hairSprite.play(`${hairKey}_idle`);
            hairSprite.setScale(5);

            this.characterContainer.add([baseSprite, hairSprite]);

            // Floating Animation
            this.tweens.add({
                targets: this.characterContainer,
                y: cy - 20,
                duration: 2000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        // --- 3. UI OVERLAY (DOM) ---
        this.container = document.createElement('div');
        this.container.id = 'player-result-ui';

        // Remove bg-background-dark to make it transparent
        // We only keep the font and layout classes
        this.container.className = "fixed inset-0 z-50 flex flex-col items-center justify-between pointer-events-none overflow-hidden font-['Press_Start_2P']";

        const playerName = myPlayer?.name || "Player";

        this.container.innerHTML = `
            <!-- Removed blocking background patterns -->
            
            <style>
                /* Retro/Pixel Theme Overrides */
                .pixel-card {
                    background-color: #1a1a20; /* Surface Dark */
                    border: 4px solid #000;
                    position: relative;
                    /* Pixel Shadow */
                    box-shadow: 6px 6px 0px 0px rgba(0,0,0,0.5);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 15px;
                    text-align: center;
                    min-width: 160px;
                }
                
                /* Specific Border Colors for Stats */
                .pixel-card.rank-card { box-shadow: 6px 6px 0px 0px #cc00ff; border-color: #cc00ff; }
                .pixel-card.score-card { box-shadow: 6px 6px 0px 0px #ffcc00; border-color: #ffcc00; }
                .pixel-card.correct-card { box-shadow: 6px 6px 0px 0px #00ff55; border-color: #00ff55; }
                .pixel-card.time-card { box-shadow: 6px 6px 0px 0px #00d4ff; border-color: #00d4ff; }

                .stat-label {
                    font-size: 10px;
                    color: #aaa;
                    margin-bottom: 8px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                .stat-value {
                    font-size: 20px;
                    color: white;
                    text-shadow: 2px 2px 0px #000;
                    line-height: 1.2;
                }

                .stat-value.score { color: #ffcc00; }
                .stat-value.rank { color: #cc00ff; font-size: 24px; }
                .stat-value.correct { color: #00ff55; }
                .stat-value.time { color: #00d4ff; }

                /* Avatar Frame - Retro Style */
                .avatar-frame {
                    width: 280px;
                    height: 280px;
                    border: 4px solid #fff;
                    background: rgba(0,0,0,0.3);
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -75%); /* Shifted Up from -60% */
                    z-index: -1;
                    /* Corner decorations */
                    box-shadow: 
                        inset 10px 10px 0 0 #000,
                        inset -10px -10px 0 0 #000,
                        0 0 0 4px #000; 
                }

                /* Nav Buttons - Pixel Style */
                .pixel-btn {
                    width: 60px;
                    height: 60px;
                    background: #333;
                    border: 4px solid #000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    pointer-events: auto;
                    cursor: pointer;
                    transition: transform 0.1s;
                    box-shadow: 4px 4px 0 0 #000;
                }
                .pixel-btn:active {
                    transform: translate(2px, 2px);
                    box-shadow: 2px 2px 0 0 #000;
                }
                .pixel-btn:hover {
                    background: #444;
                }
                .pixel-btn.highlighted {
                    background: #1a1a20;
                    border-color: #00ff55;
                    box-shadow: 4px 4px 0 0 #00ff55;
                }
                
                .pulse-text {
                    animation: blink 1s steps(2, start) infinite;
                }
                @keyframes blink {
                    to { visibility: hidden; }
                }
            </style>

            <!-- Header (Cleared to avoid duplicates) -->
            <div class="w-full py-8 px-12 flex justify-between items-center relative z-10 pointer-events-none">
                <!-- Content removed as requested -->
            </div>

            <!-- Avatar Background Frame -->
            <div class="avatar-frame"></div>

            <!-- Content Container -->
            <div class="w-full flex-1 flex flex-col justify-end pb-10 items-center relative z-10 gap-6">
                
                <!-- Player Name (Pixel Style) -->
                <div class="bg-black/80 px-6 py-3 border-2 border-white/20 mb-4 transform -skew-x-12">
                     <span class="text-2xl text-white drop-shadow-[3px_3px_0_#000] transform skew-x-12 block">
                        ${playerName}
                     </span>
                </div>
                
                <!-- Stats Grid (Retro Cards) -->
                <div class="grid grid-cols-4 gap-4 w-full max-w-4xl px-4">
                    <!-- Rank -->
                    <div class="pixel-card rank-card">
                        <div class="stat-label">RANK</div>
                        <div class="stat-value rank result-value rank">#?</div>
                    </div>

                    <!-- Score -->
                    <div class="pixel-card score-card">
                        <div class="stat-label">SCORE</div>
                        <div class="stat-value score">${Math.round(score)}</div>
                    </div>

                    <!-- Correct -->
                    <div class="pixel-card correct-card">
                        <div class="stat-label">CORRECT</div>
                        <div class="stat-value correct">${correct}<span class="text-xs text-white/50 block mt-1">/${totalQuestions}</span></div>
                    </div>

                    <!-- Time -->
                    <div class="pixel-card time-card">
                        <div class="stat-label">TIME</div>
                        <div class="stat-value time text-sm mt-1">${durationStr}</div>
                    </div>
                </div>

                <!-- Footer / Nav -->
                <div class="w-full flex justify-between items-center px-12 mt-6">
                    <!-- Home Button -->
                    <button class="pixel-btn group">
                        <span class="material-symbols-outlined text-white group-hover:text-primary">home</span>
                    </button>
                    
                    <!-- Center Space (Status Removed) -->
                    <div class="flex-1"></div>

                    <!-- Stats/Right Button -->
                    <button class="nav-btn nav-btn-right pixel-btn group">
                        <span class="material-symbols-outlined text-white group-hover:text-secondary">bar_chart</span>
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(this.container);

        // --- Listen for Game End ---
        // Helper to update UI with final results
        const showFinalResults = (rankings: any[]) => {
            // Find my rank
            const myRankData = rankings.find((r: any) => r.sessionId === room?.sessionId);
            const finalRank = myRankData ? `#${myRankData.rank}` : '-';

            // Update Rank Display
            const rankEl = this.container.querySelector('.result-value.rank');
            if (rankEl) rankEl.textContent = finalRank;

            // Update Status Text
            const statusText = this.container.querySelector('.waiting-pulse');
            if (statusText) {
                statusText.textContent = "HASIL AKHIR";
                statusText.classList.remove('waiting-pulse');
                statusText.classList.add('text-white');
            }

            const subStatus = this.container.querySelector('.text-white\\/40');
            if (subStatus) subStatus.textContent = "Permainan Selesai";

            // Show "View Leaderboard" Button (replace existing placeholder)
            const rightBtn = this.container.querySelector('.nav-btn:last-child');
            if (rightBtn) {
                rightBtn.innerHTML = '<span class="material-symbols-outlined text-white">leaderboard</span>';
                rightBtn.addEventListener('click', () => {
                    const isHost = this.registry.get('isHost') || (room?.sessionId === room?.state.hostId);
                    const targetScene = isHost ? 'HostLeaderboardScene' : 'LeaderboardScene';
                    this.scene.start(targetScene);
                });
                // Highlight button
                (rightBtn as HTMLElement).style.boxShadow = "0 0 20px #00ff88";
                (rightBtn as HTMLElement).style.borderColor = "#00ff88";
            }
        };

        // Check if data already exists (from GameScene redirect)
        const existingData = this.registry.get('leaderboardData');
        if (existingData) {
            showFinalResults(existingData);
        } else if (room) {
            room.onMessage('gameEnded', (data: { rankings: any[] }) => {
                console.log("[WaitingResults] gameEnded received!", data);
                this.registry.set('leaderboardData', data.rankings);
                showFinalResults(data.rankings);
            });
        }
    }

    cleanup() {
        if (this.dotInterval) clearInterval(this.dotInterval);
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }

    shutdown() {
        this.cleanup();
    }
}
