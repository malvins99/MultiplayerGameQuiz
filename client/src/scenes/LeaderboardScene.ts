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

export class LeaderboardScene extends Phaser.Scene {
    private container!: HTMLDivElement;
    private client!: Client;

    constructor() {
        super({ key: 'LeaderboardScene' });
    }

    create() {
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
        const isHost = this.registry.get('isHost') || false;

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

        // CSS Styles
        const style = document.createElement('style');
        style.id = 'leaderboard-styles';
        style.innerHTML = `
            @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

            #leaderboard-ui {
                background: #151515; /* Solid Dark Background per request */
                color: white;
                display: flex;
                flex-direction: column;
                align-items: center;
                overflow-y: auto;
                font-family: 'Press Start 2P', monospace;
                padding-bottom: 20px;
                overflow-x: hidden;
            }

            /* ... (rest of CSS) ... */

            /* --- PODIUM --- */
            .podium-section {
                display: flex;
                justify-content: center;
                align-items: flex-end;
                gap: 16px;
                margin-bottom: 40px;
                padding-top: 100px; 
                position: relative;
            }

            /* ... Spotlight ... */
            .spotlight-container {
                position: absolute;
                top: -80px; left: 50%;
                transform: translateX(-50%);
                width: 500px; 
                height: 600px;
                pointer-events: none;
                z-index: 0;
            }
            .spotlight-beam {
                width: 100%; height: 100%;
                background: conic-gradient(from 0deg at 50% 0%, transparent 160deg, rgba(255, 255, 255, 0.1) 180deg, transparent 200deg);
                filter: blur(15px);
                animation: flicker 4s infinite alternate;
            }
             @keyframes flicker { 0%{opacity:0.9} 100%{opacity:1} }
             
             .rank-1::before {
                 content: '';
                 position: absolute;
                 bottom: -20px; left: 50%;
                 transform: translateX(-50%);
                 width: 200px; height: 30px;
                 background: rgba(255, 255, 255, 0.3);
                 border-radius: 50%;
                 filter: blur(20px);
                 z-index: -1;
             }

            /* ... Podium Columns ... */
            .podium-column {
                display: flex;
                flex-direction: column;
                align-items: center;
                position: relative;
                width: 160px; /* Widened from 130px */
                transition: transform 0.3s ease;
                z-index: 5;
            }
            .podium-column:hover { transform: translateY(-5px); }
            
            .podium-column.rank-1 { order: 2; z-index: 10; width: 200px; /* Widened from 160px */ }
            .podium-column.rank-2 { order: 1; margin-bottom: 0; }
            .podium-column.rank-3 { order: 3; margin-bottom: 0; }

            /* Podium Content */
            .podium-body {
                width: 100%;
                border-radius: 20px 20px 0 0; 
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 10px;
                position: relative; 
                box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                backdrop-filter: blur(5px);
                overflow: visible; /* ALLOW TOOLTIP TO SHOW OUTSIDE */
            }

            /* Specific Colors per Rank (Solid Gradients) - ENLARGED HEIGHTS */
            .rank-1 .podium-body { 
                height: 300px; /* Tallest (center) - enlarged */
                background: linear-gradient(180deg, #FFD700 0%, #B8860B 100%);
                border: none;
                box-shadow: 0 10px 30px rgba(255, 215, 0, 0.3);
            }
            .rank-2 .podium-body { 
                height: 270px; /* Medium (left) - enlarged */
                background: linear-gradient(180deg, #E0E0E0 0%, #808080 100%);
                border: none; 
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            }
            .rank-3 .podium-body { 
                height: 270px; /* Increased for safety margin */
                background: linear-gradient(180deg, #CD7F32 0%, #8B4513 100%);
                border: none;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            }

            /* Inner Content Wrapper */
            .podium-content-inner {
                display: flex;
                flex-direction: column;
                align-items: center;
                width: 100%;
                padding-top: 5px;
                flex: 1; 
                justify-content: flex-start;
                overflow: visible; /* ALLOW TOOLTIP TO SHOW OUTSIDE */
            }

            /* 1. NAME (Top) - BADGE CONTAINER */
            .podium-name {
                position: relative; /* For tooltip positioning */
                max-width: 95%; 
                margin-bottom: 15px;
                overflow: visible; /* ALLOW TOOLTIP TO ESCAPE */
            }
            
            /* Inner text span with ellipsis */
            .podium-name-text {
                font-family: 'Press Start 2P', monospace;
                font-size: 10px;
                color: #ffffff;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                white-space: nowrap; 
                overflow: hidden; 
                text-overflow: ellipsis;
                display: block;
                text-align: center;
                line-height: 1.5;
                
                /* High Contrast "Badge" Style */
                background: rgba(0, 0, 0, 0.6);
                padding: 8px 14px;
                border-radius: 8px;
                border: 1px solid rgba(255, 255, 255, 0.2);
                box-shadow: 0 4px 6px rgba(0,0,0,0.2);
                text-shadow: 1px 1px 0 rgba(0,0,0,0.8);
            }

            /* Rank 1: Gold */
            .rank-1 .podium-name-text { 
                font-size: 11px; 
                color: #FFD700;
                background: rgba(0, 0, 0, 0.75);
                border-color: rgba(255, 215, 0, 0.5);
            }
            .rank-1 .podium-name { margin-bottom: 20px; }
            
            /* Rank 2: Silver */
            .rank-2 .podium-name-text { 
                font-size: 10px; 
                color: #E0E0E0;
                background: rgba(0, 0, 0, 0.75);
                border-color: rgba(224, 224, 224, 0.5); 
            }
            .rank-2 .podium-name { margin-bottom: 15px; }
            
            /* Rank 3: Bronze */
            .rank-3 .podium-name-text { 
                font-size: 10px; 
                color: #CD7F32;
                background: rgba(0, 0, 0, 0.75);
                border-color: rgba(205, 127, 50, 0.5);
            }
            .rank-3 .podium-name { margin-bottom: 15px; }

            /* 2. CHARACTER (Middle) */
            .podium-avatar {
                width: 100%; 
                height: 100px; 
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
                margin-bottom: 0; /* Reduced from 5px to 0 to remove space */
            }
            
            .char-anim {
                 width: 96px; 
                 height: 64px; 
                 image-rendering: pixelated;
                 position: absolute;
                 top: 50%; left: 50%;
                 transform: translate(-50%, -50%) scale(4.5); /* ENLARGED from 3.5 */
            }
            .anim-play {
                animation: lb-play-idle 1s steps(9) infinite;
                background-repeat: no-repeat;
            }
            @keyframes lb-play-idle { 
                from { background-position: 0 0; } 
                to { background-position: -864px 0; } 
            }

            /* 3. POINT (Bottom) - MATCHES PODIUM COLORS */
            .podium-score {
                font-family: 'Press Start 2P', monospace; 
                font-size: 20px;
                font-weight: 400; 
                margin-top: auto;
                margin-bottom: 20px;
                padding: 10px 22px;
                border-radius: 12px;
                border: 3px solid;
                min-width: 80px;
                text-align: center;
                max-width: 90%; 
            }
            
            /* Rank 1: Gold - Matching Podium */
            .rank-1 .podium-score { 
                font-size: 24px;
                padding: 12px 26px;
                background: linear-gradient(180deg, #FFD700 0%, #DAA520 100%); /* Gold gradient */
                border-color: #B8860B; /* DarkGoldenrod */
                color: #4A3000; /* Dark brown text */
                margin-bottom: 25px;
            }
            
            /* Rank 2: Silver - Matching Podium */
            .rank-2 .podium-score { 
                background: linear-gradient(180deg, #D3D3D3 0%, #A9A9A9 100%); /* Silver gradient */
                border-color: #808080; /* Gray */
                color: #333333; /* Dark gray text */
            }
            
            /* Rank 3: Bronze - Matching Podium */
            .rank-3 .podium-score { 
                background: linear-gradient(180deg, #CD7F32 0%, #A0522D 100%); /* Bronze gradient */
                border-color: #8B4513; /* SaddleBrown */
                color: #3D1C00; /* Dark brown text */
            }

            .podium-rank-num { display: none; }


            /* --- Footer (Nav Buttons) --- */
            .lb-footer {
                position: fixed;
                top: 50%;
                left: 0;
                width: 100%;
                height: 0; 
                display: flex;
                justify-content: space-between;
                padding: 0 40px;
                z-index: 200;
                pointer-events: none; 
                transform: translateY(-50%);
            }

            .nav-btn {
                pointer-events: auto;
                background: rgba(255, 255, 255, 0.05);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 50%; 
                width: 64px; height: 64px;
                display: flex; align-items: center; justify-content: center;
                color: white; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                position: absolute; 
                box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            }
            .nav-btn:hover {
                border-color: #4ade80; 
                background: rgba(74, 222, 128, 0.1);
                transform: scale(1.15); color: #4ade80;
                box-shadow: 0 0 30px rgba(74, 222, 128, 0.3);
            }
            
            .btn-left { left: 40px; }
            .btn-right { right: 40px; }
            .nav-btn .material-symbols-outlined { font-size: 28px; }

            /* --- List --- */
            .list-section { width: 100%; max-width: 600px; display: flex; flex-direction: column; gap: 8px; margin-top: 20px; }
            .list-item {
                display: grid; /* Use Grid for spacing control */
                grid-template-columns: 50px 1fr 100px 80px; /* Rank | Name | Time | Score */
                align-items: center; 
                background: rgba(255,255,255,0.03);
                border: 1px solid rgba(255,255,255,0.05);
                padding: 12px 20px; border-radius: 12px;
                transition: transform 0.2s;
            }
            .list-item:hover { transform: translateX(5px); background: rgba(255,255,255,0.06); }
            
            .list-rank { font-family: 'Press Start 2P'; font-size: 10px; color: #666; text-align: left; }
            .list-name { font-weight: 700; font-size: 14px; color: #ddd; text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .list-time { 
                font-family: 'Press Start 2P', monospace; 
                color: #aaa; 
                font-weight: 400; font-size: 10px; 
                text-align: center; /* Center time */
            }
            .list-stats { 
                font-family: 'Press Start 2P', monospace; 
                color: #4ade80; 
                font-weight: 400; font-size: 12px; 
                text-align: right; 
            }
        `;
        document.head.appendChild(style);

        // Helper to format duration (ms -> MM:SS or 00:SS)
        // FORCE MM:SS format to fix user confusion about "35.38"
        const formatTime = (ms: number) => {
            if (!ms) return '00:00';
            const totalSeconds = Math.floor(ms / 1000);
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        };

        // Calculate HTML Content
        const podiumHTML = this.renderPodium(top3);
        const listHTML = others.map(p => `
            <div class="list-item">
                <div class="list-rank">#${p.rank}</div>
                <div class="list-name">${p.name}</div>
                <div class="list-time">${formatTime(p.duration || 0)}</div>
                <div class="list-stats text-glow">${p.score}</div>
            </div>
        `).join('');

        // Buttons HTML
        const homeButton = `
            <button id="lb-home-btn" class="nav-btn btn-left" style="pointer-events:all !important; cursor:pointer !important; z-index:9999;">
                <span class="material-symbols-outlined">home</span>
            </button>
        `;

        const restartButton = isHost ? `
            <button id="lb-restart-btn" class="nav-btn btn-right" style="pointer-events:all !important; cursor:pointer !important; z-index:9999;">
                <span class="material-symbols-outlined">restart_alt</span>
            </button>
        ` : '';

        // Spotlight Element (Only visible if Rank 1 exists)
        const spotlightHTML = top3.length > 0 ? `
            <div class="spotlight-container">
                <div class="spotlight-beam"></div>
            </div>
        ` : '';

        // Clean Layout: Podium Top, List Bottom
        this.container.innerHTML = `
            <div class="podium-section">
                ${spotlightHTML}
                ${podiumHTML}
            </div>

            <div class="list-section">
                ${listHTML}
            </div>

            <div class="lb-footer">
                ${homeButton}
                ${restartButton}
            </div>
        `;

        document.body.appendChild(this.container);

        // --- Event Listeners with DEBUG LOGS ---
        setTimeout(() => {
            const homeBtn = document.getElementById('lb-home-btn');
            const restartBtn = document.getElementById('lb-restart-btn');

            console.log("Attaching listeners...", { homeBtn, restartBtn });

            if (homeBtn) {
                homeBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("[DEBUG] Home button clicked!");
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
                    console.log("[DEBUG] Restart button clicked!");

                    // 1. Get Old Options
                    const options = this.registry.get('lastGameOptions');
                    console.log("[DEBUG] Restart options:", options);

                    if (!options) {
                        console.error("No restart options found!");
                        return;
                    }

                    // 2. Leave Current Room
                    const room = this.registry.get('room');
                    if (room) room.leave();

                    // 3. Create New Room
                    try {
                        this.container.innerHTML = `<div style="display:flex;height:100%;align-items:center;justify-content:center;color:white;font-family:'Press Start 2P'">CREATING ROOM...</div>`;
                        const newRoom = await this.client.joinOrCreate("game_room", options);
                        console.log("[DEBUG] New Room created:", newRoom);

                        TransitionManager.transitionTo(() => {
                            this.cleanup();
                            Router.navigate('/host/lobby');
                            this.scene.start('HostWaitingRoomScene', { room: newRoom, isHost: true });
                        });
                    } catch (e) {
                        console.error("[DEBUG] Restart Failed:", e);
                        alert("Failed to restart room.");
                        window.location.href = '/';
                    }
                });
            }
        }, 100);
    }

    renderPodium(top3: RankingEntry[]): string {
        const order = [1, 0, 2];

        return order.map(i => {
            const player = top3[i];
            const rank = i + 1;

            if (!player) {
                return `<div class="podium-column rank-${rank}" style="opacity:0"></div>`;
            }

            // Generate Animation Styles
            // Base layer
            const baseStyle = `background-image: url('/assets/base_idle_strip9.png'); background-size: 864px 64px;`;

            // Hair layer
            let hairStyle = '';
            if (player.hairId && player.hairId > 0) {
                const hairFiles: Record<number, string> = {
                    1: 'bowlhair', 2: 'curlyhair', 3: 'longhair', 4: 'mophair', 5: 'shorthair', 6: 'spikeyhair'
                };
                const key = hairFiles[player.hairId];
                if (key) {
                    hairStyle = `background-image: url('/assets/${key}_idle_strip9.png'); background-size: 864px 64px;`;
                }
            }

            return `
                <div class="podium-column rank-${player.rank}">
                    <div class="podium-body">
                        <!-- Content Inside Body: Name -> Character -> Score -->
                        <div class="podium-content-inner">
                            <div class="podium-name" title="${player.name}"><span class="podium-name-text">${player.name}</span></div>
                            
                            <div class="podium-avatar">
                                <!-- Base Sprite -->
                                <div class="char-anim anim-play" style="${baseStyle}"></div>
                                <!-- Hair Sprite -->
                                ${hairStyle ? `<div class="char-anim anim-play" style="${hairStyle}"></div>` : ''}
                            </div>
                            
                            <div class="podium-score">${player.score}</div>
                        </div>

                        <!-- Rank Number (Hidden via CSS) -->
                        <div class="podium-rank-num">${player.rank}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    cleanup() {
        if (this.container) this.container.remove();
        const style = document.getElementById('leaderboard-styles');
        if (style) style.remove();
    }
}
