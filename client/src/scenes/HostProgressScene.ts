import Phaser from 'phaser';
import { Room } from 'colyseus.js';
import { Router } from '../utils/Router';
import { TransitionManager } from '../utils/TransitionManager';

export class HostProgressScene extends Phaser.Scene {
    room!: Room;
    container!: HTMLDivElement;
    timerInterval!: number;
    gameDuration: number = 5 * 60; // 5 minutes in seconds
    disposers: Array<() => void> = [];

    constructor() {
        super('HostProgressScene');
    }

    init(data: { room: Room }) {
        this.room = data.room;
    }

    create() {
        // Defensive: Clean up any leaked UI from previous sessions
        const existing = document.getElementById('host-progress-ui');
        if (existing && existing.parentNode) {
            existing.parentNode.removeChild(existing);
        }

        // Create HTML Overlay
        this.container = document.createElement('div');
        this.container.id = 'host-progress-ui';
        // Create Styles for Spotlight
        const style = document.createElement('style');
        style.innerHTML = `
            .spotlight-container {
                position: absolute;
                top: -100px; left: 50%;
                transform: translateX(-50%);
                width: 600px; 
                height: 500px;
                pointer-events: none;
                z-index: 0;
            }
            .spotlight-beam {
                width: 100%; height: 100%;
                background: conic-gradient(from 0deg at 50% 0%, transparent 160deg, rgba(255, 255, 255, 0.08) 180deg, transparent 200deg);
                filter: blur(25px);
                animation: flicker 4s infinite alternate;
            }
            @keyframes flicker { 0%{opacity:0.7} 100%{opacity:1} }
            
            #player-progress-list::-webkit-scrollbar { width: 6px; }
            #player-progress-list::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
            #player-progress-list::-webkit-scrollbar-thumb { background: rgba(0,255,136,0.2); border-radius: 10px; }
        `;
        document.head.appendChild(style);

        this.container.style.cssText = `
            position: fixed;
            inset: 0;
            background: radial-gradient(circle at center, #151525 0%, #0a0a14 100%);
            display: flex;
            flex-direction: column;
            padding: 40px 60px;
            font-family: 'Press Start 2P', monospace;
            color: white;
            z-index: 100;
            overflow: visible;
        `;

        // Inner HTML Structure
        this.container.innerHTML = `
            ${/* Spotlight Beam */ ''}
            <div class="spotlight-container">
                <div class="spotlight-beam"></div>
            </div>

            <!-- Top Header Layer (Logo Spacer + Title) -->
            <div style="display: flex; align-items: center; justify-content: center; position: relative; margin-bottom: 40px; width: 100%;">
                <!-- Logo Spacer (Left) - v5: Increased to 200px -->
                <div style="position: absolute; left: 0; width: 200px; height: 50px; display: flex; align-items: center; opacity: 0.5;">
                    <!-- Space for future Logo -->
                </div>

                <!-- Row 1: Main Title (Larger & Spaced) -->
                <h1 style="font-size: 36px; text-transform: uppercase; color: white; tracking-widest; margin: 0; font-family: 'Press Start 2P'; text-shadow: 0 0 30px rgba(0,255,136,0.3); z-index: 1;">Progress Pemain</h1>
            </div>

            <!-- Main Centered Content Wrap (Aligned Grid + Header Bar) -->
            <div style="max-width: 1200px; width: 100%; margin: 0 auto; flex: 1; display: flex; flex-direction: column;">
                
                <!-- Row 2: Stats & Controls (Aligned with Grid) -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding: 16px 32px; background: rgba(255,255,255,0.03); border-radius: 16px; border: 1px solid rgba(255,255,255,0.08); box-shadow: inset 0 0 20px rgba(0,0,0,0.5);">
                    <!-- Timer (Left) -->
                    <div style="display: flex; align-items: center; gap: 16px;">
                        <span class="material-symbols-outlined" style="font-size: 32px; color: #00ff88;">timer</span>
                        <span id="game-timer" style="font-size: 24px; color: #00ff88; font-family: 'Press Start 2P';">05:00</span>
                    </div>

                    <!-- End Game Button (Right) -->
                    <button id="end-game-btn" class="pixel-btn-red" style="
                        background: #ff0055; 
                        border: 2px solid #330011; 
                        color: white; 
                        padding: 12px 28px; 
                        font-family: inherit; 
                        font-size: 11px; 
                        cursor: pointer;
                        text-transform: uppercase;
                        border-radius: 8px;
                        box-shadow: 0 4px 0 #330011;
                        transition: all 0.1s ease;">
                        Akhiri Permainan
                    </button>
                </div>

                <!-- Main Grid Area with Side Navs -->
                <div style="flex: 1; position: relative;">
                    <!-- Left Nav Icon - v6 Fix: Floating Absolute -->
                    <button id="prev-btn" disabled style="
                        position: absolute; left: -60px; top: 50%; transform: translateY(-50%);
                        background: none; border: none; 
                        color: rgba(255,255,255,0.1); 
                        display: flex; align-items: center; justify-content: center; 
                        cursor: not-allowed; z-index: 20;">
                        <span class="material-symbols-outlined" style="font-size: 54px;">chevron_left</span>
                    </button>

                    <!-- Player List Container -->
                    <div id="player-progress-list" style="
                        height: 100%;
                        overflow-y: auto; 
                        display: grid; 
                        grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); 
                        gap: 20px; 
                        padding: 10px;
                        background: rgba(0,0,0,0.1);
                        border-radius: 20px;
                        border: 1px solid rgba(255,255,255,0.03);">
                        <!-- Player items will be injected here -->
                    </div>

                    <!-- Right Nav Icon - v6 Fix: Floating Absolute -->
                    <button id="to-spectator-btn" style="
                        position: absolute; right: -60px; top: 50%; transform: translateY(-50%);
                        background: none; border: none; 
                        color: #00ff88; 
                        display: flex; align-items: center; justify-content: center; 
                        cursor: pointer;
                        transition: all 0.2s ease;
                        filter: drop-shadow(0 0 10px rgba(0,255,136,0.4));
                        z-index: 20;
                        pointer-events: auto;">
                        <span class="material-symbols-outlined" style="font-size: 54px;">chevron_right</span>
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(this.container);

        // Bind Events
        const endBtn = document.getElementById('end-game-btn');
        if (endBtn) {
            endBtn.onclick = () => {
                if (confirm('Yakin ingin mengakhiri permainan untuk SEMUA room?')) {
                    this.room.send('hostEndGame');
                }
            };
        }

        const handleNext = () => {
            TransitionManager.sceneTo(this, 'HostSpectatorScene', { room: this.room, targetRoomIndex: 0 });
        };

        const specBtn = document.getElementById('to-spectator-btn');
        if (specBtn) {
            specBtn.onclick = handleNext;
        }

        // v5: Keyboard Navigation Support
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                handleNext();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        this.events.once('shutdown', () => {
            window.removeEventListener('keydown', handleKeyDown);
            this.disposers.forEach(d => d());
            this.disposers = [];
            this.cleanup();
        });

        // Room Listeners
        this.disposers.push(this.room.onMessage('timerUpdate', (data: { remaining: number }) => {
            this.updateTimer(data.remaining);
        }));

        this.disposers.push(this.room.state.players.onAdd((player: any) => {
            this.updatePlayerList();
            this.disposers.push(player.onChange(() => this.updatePlayerList()));
        }));
        this.disposers.push(this.room.state.players.onRemove(() => this.updatePlayerList()));

        this.disposers.push(this.room.onMessage('gameEnded', (data: any) => {
            this.cleanup();
            this.registry.set('leaderboardData', data.rankings);
            TransitionManager.sceneTo(this, 'LeaderboardScene');
        }));

        // Initial Render
        this.updatePlayerList();

        // Reveal Scene
        TransitionManager.open();
    }

    updateTimer(remainingMs: number) {
        const timerEl = document.getElementById('game-timer');
        if (timerEl) {
            const totalSeconds = Math.ceil(remainingMs / 1000);
            const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
            const s = (totalSeconds % 60).toString().padStart(2, '0');
            timerEl.innerText = `${m}:${s}`;

            if (totalSeconds <= 30) {
                timerEl.style.color = '#ff0055';
            }
        }
    }

    updatePlayerList() {
        const listEl = document.getElementById('player-progress-list');
        if (!listEl) return;

        // Get target questions based on difficulty
        const diff = this.room.state.difficulty;
        let target = 5;
        if (diff === 'sedang') target = 10;
        if (diff === 'sulit') target = 20;

        let html = '';

        // Convert to array and sort (Score/Progress DESC)
        const players = Array.from(this.room.state.players.values())
            .filter((p: any) => !p.isHost)
            .sort((a: any, b: any) => b.answeredQuestions - a.answeredQuestions);

        players.forEach((player: any) => {
            const answered = player.answeredQuestions || 0;
            const progress = Math.min(100, (answered / target) * 100);

            // Neon Green for progress as requested
            const barColor = '#00ff55';
            const shadowColor = 'rgba(0, 255, 85, 0.4)';

            html += `
                <div style="
                    background: rgba(20, 20, 35, 0.9); 
                    border: 1px solid rgba(0, 255, 136, 0.2); 
                    padding: 10px; 
                    border-radius: 16px; 
                    display: flex; 
                    flex-direction: column; 
                    align-items: center; 
                    justify-content: space-between;
                    gap: 8px; 
                    position: relative; 
                    box-shadow: 0 8px 32px rgba(0,0,0,0.4), inset 0 0 10px rgba(0,255,136,0.05);
                    aspect-ratio: 1 / 1.15;
                    width: 100%;
                    max-width: 160px;
                    margin: 0 auto;
                ">
                    <!-- 1. Progress Counter (Top Right) -->
                    <div style="position: absolute; top: 8px; right: 8px; background: rgba(0,255,136,0.1); color: #00ff88; padding: 3px 6px; border-radius: 6px; font-size: 8px; font-weight: bold; border: 1px solid rgba(0,255,136,0.2); backdrop-filter: blur(4px);">
                        ${answered}/${target}
                    </div>
                    
                    <!-- 2. Character (Middle) - v6 Precise Centering -->
                    <div style="width: 70px; height: 70px; background: radial-gradient(circle, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 70%); border-radius: 12px; display: flex; align-items: center; justify-content: center; overflow: hidden; border: 1px solid rgba(255,255,255,0.03); margin-top: 14px;">
                         <div style="
                            width: 32px; height: 32px; 
                            background-image: url('/assets/base_idle_strip9.png');
                            background-repeat: no-repeat;
                            background-position: -32px -16px;
                            transform: scale(1.6);
                            image-rendering: pixelated;
                         "></div>
                    </div>
                    
                    <!-- 3. Player Name -->
                    <div style="text-align: center; width: 100%; padding: 0 4px;">
                        <span style="font-size: 10px; color: white; font-family: 'Press Start 2P', cursive; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; letter-spacing: -0.5px;">
                            ${player.name}
                        </span>
                    </div>

                    <!-- 4. Progress Bar (Bottom) -->
                    <div style="width: 85%; height: 6px; background: rgba(255,255,255,0.05); border-radius: 10px; overflow: hidden; margin-bottom: 6px; border: 1px solid rgba(255,255,255,0.05);">
                        <div style="
                            width: ${progress}%; 
                            height: 100%; 
                            background: ${barColor}; 
                            transition: width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
                            box-shadow: 0 0 12px ${shadowColor};
                        "></div>
                    </div>
                </div>
            `;
        });

        listEl.innerHTML = html;
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
