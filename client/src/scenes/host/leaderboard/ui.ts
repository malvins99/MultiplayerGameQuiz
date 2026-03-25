export interface RankingEntry {
    rank: number;
    sessionId: string;
    name: string;
    hairId?: number;
    score: number;
    duration: number;
}

export class LeaderboardUI {
    static getGlobalStyles(): string {
        return `
            .podium-avatar { position: relative; display: flex; justify-content: center; align-items: center; overflow: hidden; }
            .char-anim { 
                width: 96px; 
                height: 64px; 
                image-rendering: pixelated; 
                position: absolute; 
                transform: scale(4); 
                animation: lb-play-idle 1s steps(9) infinite; 
            }
            @keyframes lb-play-idle { 
                from { background-position: 0 0; } 
                to { background-position: -864px 0; } 
            }
            .pixel-bg-pattern { background-image: radial-gradient(#2d5a30 1px, transparent 1px); background-size: 24px 24px; }
            .firefly { position: absolute; width: 4px; height: 4px; background: #FEFF9F; border-radius: 50%; filter: blur(1px); animation: firefly-bounce 4s infinite ease-in-out; z-index: 1; pointer-events: none; }
            @keyframes firefly-bounce { 0%, 100% { transform: translateY(0) scale(1); opacity: 0.5; } 50% { transform: translateY(-20px) scale(1.2); opacity: 1; } }
            @keyframes drift { from { transform: translateX(-100%) scale(var(--s)); } to { transform: translateX(100vw) scale(var(--s)); } }
            @keyframes drift-reverse { from { transform: translateX(100vw) scale(var(--s)); } to { transform: translateX(-100%) scale(var(--s)); } }
            .cloud { position: absolute; pointer-events: none; }
            @keyframes base-walk-cycle { from { background-position: 0 0; } to { background-position: -768px 0; } }
            @keyframes walk-across-right { from { transform: translate3d(-100px, 0, 0) scale(1.5, 1.5); } to { transform: translate3d(100vw, 0, 0) scale(1.5, 1.5); } }
            @keyframes walk-across-left { from { transform: translate3d(100vw, 0, 0) scale(-1.5, 1.5); } to { transform: translate3d(-100px, 0, 0) scale(-1.5, 1.5); } }
            .walking-char { position: absolute; bottom: 20px; left: 0; width: 96px; height: 64px; background-image: url('/assets/base_walk_strip8.png'); background-size: 768px 64px; image-rendering: pixelated; z-index: 2; pointer-events: none; will-change: transform; }
            .logo-center { position: fixed; top: 25px; left: 0; right: 0; margin: 0 auto; width: 200px; z-index: 2000; pointer-events: none; display: none; }
            .logo-left { position: absolute; top: -30px; left: -40px; width: 280px; z-index: 20; pointer-events: none; }
            .logo-right { position: absolute; top: -45px; right: -15px; width: 320px; z-index: 20; pointer-events: none; }
            .lb-footer-mobile { display: none; }
            .desktop-floating-actions { display: none; }
            .nav-btn {
                pointer-events: auto; background: #92C140; border: none; border-bottom: 4px solid #386938; border-radius: 12px;
                width: 72px; height: 72px; display: flex; align-items: center; justify-content: center; color: white; cursor: pointer; transition: all 0.2s;
                box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
            }
            .nav-btn:hover { filter: brightness(110%); }
            .nav-btn:active { transform: translateY(4px); border-bottom-width: 0; }
            .nav-btn .material-symbols-outlined { font-size: 30px; }
            @media (max-width: 768px) {
                .logo-left, .logo-right { display: none; }
                .logo-center { display: block; width: 8rem; top: 10px; }
                .lb-footer-mobile {
                    display: flex; position: fixed; bottom: 12px; left: 0; width: 100%; flex-direction: row; gap: 8px; padding: 0 10px; z-index: 100;
                }
                .nav-btn-wide {
                    flex: 1; pointer-events: auto; height: 44px; border-radius: 10px;
                    display: flex; align-items: center; justify-content: center; gap: 4px;
                    font-family: 'Retro Gaming', monospace; font-size: 9px; text-transform: uppercase;
                    border: none; cursor: pointer; transition: all 0.2s;
                    background: #92C140; color: white; border-bottom: 3px solid #478D47; box-shadow: 0 6px 0 #478D47;
                }
                .nav-btn-wide:active { transform: translateY(2px); border-bottom-width: 2px; box-shadow: 0 4px 0 #478D47; }
            }
            @media (min-width: 768px) {
                .desktop-floating-actions {
                    display: flex;
                }
                .char-anim { transform: scale(5.5); }
                .char-anim-sm { transform: scale(1.8); }
            }
            .char-anim-sm { 
                width: 96px; 
                height: 64px; 
                image-rendering: pixelated; 
                position: absolute; 
                transform: scale(1.3); 
                animation: lb-play-idle 1s steps(9) infinite; 
            }
        `;
    }

    static generateHTML(rankings: RankingEntry[]): string {
        const top3 = [
            rankings[0],
            rankings[1],
            rankings[2]
        ];

        const others = rankings;

        const formatTime = (ms: number) => {
            const totalSec = Math.floor(ms / 1000);
            const m = Math.floor(totalSec / 60);
            const s = totalSec % 60;
            return `${m}:${s.toString().padStart(2, '0')}`;
        };

        const getInitials = (name: string) => name ? name.charAt(0).toUpperCase() : '?';

        // Podium Display Order: 2nd, 1st, 3rd
        const displayOrder = [top3[1], top3[0], top3[2]];

        const podiumsHtml = displayOrder.map((p) => {
            if (!p) return `<div class="w-[100px] md:w-[150px]"></div>`;

            const rank = p.rank;
            const isFirst = rank === 1;
            const isSecond = rank === 2;

            let colorHex = '#cd7f32'; // Bronze
            let colorBg = 'bg-orange-900/40';
            let colorGlow = 'rgba(205,127,50,0.5)';
            let icon = 'military_tech';
            let height = 'h-32';
            let width = 'w-[100px] md:w-[140px]';
            let avatarSize = 'w-20 h-20 md:w-28 md:h-28';

            if (isFirst) {
                colorHex = '#ffcc00'; // Gold
                colorBg = 'bg-yellow-600/40';
                colorGlow = 'rgba(255,204,0,0.6)';
                icon = 'emoji_events';
                height = 'h-48 md:h-56';
                width = 'w-[120px] md:w-[180px]';
                avatarSize = 'w-24 h-24 md:w-32 md:h-32';
            } else if (isSecond) {
                colorHex = '#c0c0c0'; // Silver
                colorBg = 'bg-gray-600/40';
                colorGlow = 'rgba(192,192,192,0.5)';
                height = 'h-40 md:h-44';
            }

            const hairKey = p.hairId ? ['bowlhair', 'curlyhair', 'longhair', 'mophair', 'shorthair', 'spikeyhair'][p.hairId - 1] : null;

            return `
                <div class="flex flex-col items-center relative z-20 group">


                    <div class="${avatarSize} podium-avatar rounded-full border-4 flex items-center justify-center font-bold mb-4 relative" style="background-color: ${colorHex}; border-color: ${colorHex};">
                        <!-- Character Animation -->
                        <div class="char-anim" style="background-image: url('/assets/base_idle_strip9.png')"></div>
                        ${hairKey ? `<div class="char-anim" style="background-image: url('/assets/${hairKey}_idle_strip9.png')"></div>` : ''}
                        
                    </div>

                    <div class="text-sm md:text-2xl mb-2 font-bold text-center leading-tight drop-shadow-lg" style="color: ${colorHex}; font-family: 'Retro Gaming', monospace; text-shadow: 2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000; letter-spacing: 1px;">${p.name}</div>

                    <!-- The literal podium block (Hidden on mobile) -->
                    <div class="hidden md:flex ${width} ${height} rounded-t-2xl border-4 border-b-0 flex-col items-center justify-center relative overflow-hidden" style="border-color: ${colorHex}; background: linear-gradient(to top, rgba(0,0,0,0.9), ${colorBg});">
                        <div class="absolute inset-0 bg-[url('/assets/bg_pattern.png')] opacity-10"></div>
                        <div class="text-2xl md:text-5xl font-bold mb-2 drop-shadow-[0_0_10px_rgba(0,0,0,1)] relative z-10" style="color: ${colorHex}">${p.score}</div>
                        <span class="material-symbols-outlined text-4xl md:text-6xl opacity-40 relative z-10" style="color: ${colorHex}">${icon}</span>
                    </div>
                </div>
            `;
        }).join('');

        const tableHtml = others.map((p) => {
            const hairKey = p.hairId ? ['bowlhair', 'curlyhair', 'longhair', 'mophair', 'shorthair', 'spikeyhair'][p.hairId - 1] : null;
            return `
            <div class="grid grid-cols-[40px_1fr_60px_60px] md:grid-cols-[100px_1fr_150px_150px] p-4 text-white items-center border-b border-white/5 hover:bg-white/5 transition-colors group">
                <div class="text-center font-bold text-white/50 group-hover:text-primary transition-colors text-xs md:text-base">${p.rank}</div>
                <div class="flex items-center gap-2 md:gap-3">
                    <div class="hidden md:flex w-10 h-10 rounded-full bg-[#e2e8f0]/95 border-2 border-white/10 items-center justify-center font-bold text-sm group-hover:border-primary transition-colors overflow-hidden relative podium-avatar">
                        <div class="char-anim-sm" style="background-image: url('/assets/base_idle_strip9.png')"></div>
                        ${hairKey ? `<div class="char-anim-sm" style="background-image: url('/assets/${hairKey}_idle_strip9.png')</div>` : ''}
                    </div>
                    <div class="font-bold text-[10px] md:text-base truncate max-w-[150px] md:max-w-[300px]">${p.name}</div>
                </div>
                <div class="text-center text-primary font-bold text-xs md:text-lg">${p.score}</div>
                <div class="text-center text-white/50 text-[10px] md:text-sm font-bold">
                    ${formatTime(p.duration)}
                </div>
            </div>
        `}).join('');

        return `
            <div class="fixed inset-0 w-full h-screen overflow-hidden text-white pointer-events-auto select-none" style="background: linear-gradient(180deg, #6CC452 0%, #478D47 100%);">
                
                <!-- Pixel-art Background Decorations -->
                <div class="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                    <div class="absolute inset-0 pixel-bg-pattern opacity-[0.06]"></div>

                    <!-- Clouds -->
                    <div class="cloud top-[10%] opacity-20 animate-[drift_80s_linear_infinite]" style="--s: 1.0; left: -10%;">
                        <div class="relative w-10 h-3 bg-white"><div class="absolute -top-1 left-2 w-3 h-1 bg-white"></div></div>
                    </div>
                    <div class="cloud top-[45%] opacity-15 animate-[drift-reverse_95s_linear_infinite]" style="--s: 0.8; left: 80%;">
                        <div class="relative w-12 h-4 bg-[#D3EE98]"><div class="absolute -top-2 left-3 w-4 h-2 bg-[#D3EE98]"></div></div>
                    </div>
                    <div class="cloud top-[15%] opacity-15 animate-[drift_110s_linear_infinite]" style="--s: 1.2; left: 40%;">
                        <div class="relative w-14 h-4 bg-white"><div class="absolute -top-2 left-4 w-5 h-2 bg-white"></div></div>
                    </div>

                    <!-- Fireflies -->
                    <div class="firefly" style="top: 25%; left: 15%; animation-delay: 0s;"></div>
                    <div class="firefly" style="top: 65%; left: 80%; animation-delay: 1.5s;"></div>
                    <div class="firefly" style="top: 45%; left: 45%; animation-delay: 3s;"></div>
                    <div class="firefly" style="top: 15%; left: 30%; animation-delay: 1.2s; animation-duration: 5s;"></div>
                    <div class="firefly" style="top: 85%; left: 20%; animation-delay: 2.1s; animation-duration: 6s;"></div>
                </div>

                <!-- Walking Characters Container -->
                <div id="leaderboard-walking-characters-container" class="absolute inset-0 z-0 overflow-hidden pointer-events-none"></div>

                <!-- Logos -->
                <img src="/logo/Zigma-logo-fix.webp" alt="Zigma Logo" class="logo-center" />
                <img src="/logo/Zigma-logo-fix.webp" alt="Zigma Logo" class="logo-left" />
                <img src="/logo/gameforsmart-logo-fix.webp" alt="GameForSmart Logo" class="logo-right" />

                <!-- MAIN CONTENT AREA: overflow-hidden for mobile to prevent scrollbars, auto for desktop -->
                <div class="relative z-10 w-full h-[100dvh] flex flex-col items-center pt-24 md:pt-28 pb-20 md:pb-12 px-4 overflow-hidden md:overflow-y-auto custom-scrollbar">
                    


                    <!-- Podiums (Keep wrapper flex but adjust bottom margin for mobile) -->
                    <div class="flex items-end justify-center gap-2 md:gap-8 mb-4 md:mb-12 shrink-0">
                        ${podiumsHtml}
                    </div>

                    <!-- Leaderboard Table Card -->
                    ${others.length > 0 ? `
                    <div class="w-full max-w-4xl bg-[#1a1a20]/90 border-[3px] border-primary/30 rounded-3xl shadow-[0_0_50px_rgba(0,255,85,0.1)] overflow-hidden shrink-0 md:mb-20 flex flex-col flex-1 md:flex-none min-h-0">
                        <!-- Header -->
                        <div class="bg-black/80 border-b-[3px] border-primary/20 relative shrink-0">
                            <div class="grid grid-cols-[40px_1fr_60px_60px] md:grid-cols-[100px_1fr_150px_150px] p-4 md:p-5 font-bold text-primary/80 uppercase tracking-widest text-[8px] md:text-xs">
                                <div class="text-center">RANK</div>
                                <div>PLAYER</div>
                                <div class="text-center">SCORE</div>
                                <div class="text-center">TIME</div>
                            </div>
                        </div>
                        
                        <!-- List (Make internal scrollable on mobile so we don't need body scroll) -->
                        <div class="flex flex-col overflow-y-auto custom-scrollbar flex-1 min-h-0 pb-4 md:pb-0">
                            ${tableHtml}
                        </div>
                    </div>
                    ` : ''}
                </div>

                <!-- FLOATING ACTIONS (Left & Right) -->
                <div class="desktop-floating-actions fixed top-[40%] md:top-1/2 left-4 md:left-6 -translate-y-1/2 flex-col gap-4 z-50">
                    <button id="lb-home-btn" class="nav-btn" title="Home">
                        <span class="material-symbols-outlined">home</span>
                    </button>
                    <button id="lb-restart-btn" class="nav-btn" title="Play Again">
                        <span class="material-symbols-outlined">restart_alt</span>
                    </button>
                </div>

                <div class="desktop-floating-actions fixed top-[40%] md:top-1/2 right-4 md:right-6 -translate-y-1/2 flex-col gap-4 z-50">
                    <button id="lb-stats-btn" class="nav-btn" title="Statistics">
                        <span class="material-symbols-outlined">analytics</span>
                    </button>
                </div>

                <!-- MOBILE FOOTER ACTIONS -->
                <div class="lb-footer-mobile">
                    <button id="lb-home-btn-mobile" class="nav-btn-wide">
                        <span class="material-symbols-outlined text-[14px]">home</span>HOME
                    </button>
                    <button id="lb-restart-btn-mobile" class="nav-btn-wide">
                        <span class="material-symbols-outlined text-[14px]">restart_alt</span>RESTART
                    </button>
                    <button id="lb-stats-btn-mobile" class="nav-btn-wide">
                        <span class="material-symbols-outlined text-[14px]">analytics</span>STATS
                    </button>
                </div>
            </div>
        `;
    }
}
