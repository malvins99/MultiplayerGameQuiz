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
            @media (min-width: 768px) {
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
            const s = Math.floor(ms / 1000);
            return `${(s / 60 < 1 ? '' : Math.floor(s / 60).toString() + ':')}${(s % 60).toString().padStart(2, '0')}s`;
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


                    <div class="${avatarSize} podium-avatar rounded-full bg-black/80 border-4 shadow-[0_0_20px_${colorGlow}] flex items-center justify-center font-bold mb-4 relative backdrop-blur-sm group-hover:-translate-y-2 transition-transform duration-300" style="color: ${colorHex}; border-color: ${colorHex}">
                        <!-- Character Animation -->
                        <div class="char-anim" style="background-image: url('/assets/base_idle_strip9.png')"></div>
                        ${hairKey ? `<div class="char-anim" style="background-image: url('/assets/${hairKey}_idle_strip9.png')"></div>` : ''}
                        

                    </div>

                    <div class="text-white text-xs md:text-base mb-2 truncate max-w-[100px] md:max-w-[160px] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] text-center">${p.name}</div>

                    <div class="${width} ${height} rounded-t-2xl border-4 border-b-0 flex flex-col items-center justify-center relative overflow-hidden backdrop-blur-md" style="border-color: ${colorHex}; background: linear-gradient(to top, rgba(0,0,0,0.9), ${colorBg}); box-shadow: inset 0 0 30px ${colorGlow}, 0 -5px 20px ${colorGlow}">
                        <div class="absolute inset-0 bg-[url('/assets/bg_pattern.png')] opacity-10 mix-blend-overlay"></div>
                        <div class="text-2xl md:text-5xl font-bold mb-2 drop-shadow-[0_0_10px_rgba(0,0,0,1)] relative z-10" style="color: ${colorHex}">${p.score}</div>
                        <span class="material-symbols-outlined text-4xl md:text-6xl opacity-40 relative z-10" style="color: ${colorHex}">${icon}</span>
                    </div>
                </div>
            `;
        }).join('');

        const tableHtml = others.map((p) => {
            const hairKey = p.hairId ? ['bowlhair', 'curlyhair', 'longhair', 'mophair', 'shorthair', 'spikeyhair'][p.hairId - 1] : null;
            return `
            <div class="grid grid-cols-[60px_1fr_100px_100px] md:grid-cols-[100px_1fr_150px_150px] p-4 text-white items-center border-b border-white/5 hover:bg-white/5 transition-colors group">
                <div class="text-center font-bold text-white/50 group-hover:text-primary transition-colors text-xs md:text-base">${p.rank}</div>
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 md:w-10 md:h-10 rounded-full bg-black/40 border-2 border-white/10 flex items-center justify-center font-bold text-xs md:text-sm group-hover:border-primary transition-colors overflow-hidden relative podium-avatar">
                        <div class="char-anim-sm" style="background-image: url('/assets/base_idle_strip9.png')"></div>
                        ${hairKey ? `<div class="char-anim-sm" style="background-image: url('/assets/${hairKey}_idle_strip9.png')"></div>` : ''}
                    </div>
                    <div class="font-bold text-xs md:text-base truncate max-w-[120px] md:max-w-[300px]">${p.name}</div>
                </div>
                <div class="text-center text-primary font-bold text-sm md:text-lg drop-shadow-[0_0_5px_rgba(0,255,85,0.3)]">${p.score}</div>
                <div class="text-center flex border-white/10 items-center justify-center gap-1 text-white/50 text-xs md:text-sm">
                    <span class="material-symbols-outlined text-sm">timer</span>
                    ${formatTime(p.duration)}
                </div>
            </div>
        `}).join('');

        return `
            <div class="fixed inset-0 w-full h-screen overflow-hidden fantasy-bg text-white pointer-events-auto select-none">
                
                <!-- GameForSmart Logo - Top Right Corner -->
                <div class="absolute top-4 right-4 md:top-6 md:right-6 z-50">
                    <img src="/logo/gameforsmart-logo-fix.webp" alt="GameForSmart" draggable="false"
                        class="w-32 h-auto md:w-56 object-contain drop-shadow-[0_0_10px_rgba(0,255,85,0.4)] hover:scale-105 hover:drop-shadow-[0_0_20px_rgba(0,255,85,0.6)] transition-all duration-300" />
                </div>

                <!-- Zigma Logo - Top Left Corner -->
                <div class="absolute top-4 left-4 md:top-6 md:left-6 z-50">
                    <img src="/logo/Zigma-logo-fix.webp" alt="Zigma" draggable="false"
                        class="w-24 h-auto md:w-32 object-contain drop-shadow-[0_0_10px_rgba(0,255,85,0.4)] hover:scale-105 hover:drop-shadow-[0_0_20px_rgba(0,255,85,0.6)] transition-all duration-300" />
                </div>

                <!-- Fantasy Forest Gradient Overlay -->
                <div class="absolute inset-0 pointer-events-none"
                    style="background: radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%);"></div>

                <!-- Mystical Fog Layer -->
                <div class="absolute inset-0 pointer-events-none mystical-fog"></div>
                <div class="absolute inset-0 pointer-events-none mystical-fog"
                    style="animation-delay: 5s; animation-direction: reverse;"></div>

                <!-- Magic Firefly Particles -->
                <div class="firefly" style="top: 20%; left: 10%; animation-delay: 0s; animation-duration: 7s;"></div>
                <div class="firefly" style="top: 60%; left: 85%; animation-delay: 1s; animation-duration: 5s;"></div>
                <div class="firefly" style="top: 30%; left: 50%; animation-delay: 2s; animation-duration: 6s;"></div>
                <div class="firefly" style="top: 80%; left: 30%; animation-delay: 0.5s; animation-duration: 8s;"></div>
                <div class="firefly" style="top: 15%; left: 70%; animation-delay: 1.5s; animation-duration: 7s;"></div>

                <!-- Glowing Orbs -->
                <div class="absolute top-1/4 -left-32 w-96 h-96 bg-primary/15 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
                <div class="absolute bottom-1/4 -right-32 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none animate-pulse" style="animation-delay: 1s;"></div>

                <!-- Bottom Forest Silhouette -->
                <div class="absolute bottom-0 left-0 right-0 h-32 pointer-events-none forest-silhouette opacity-50"></div>

                <!-- MAIN CONTENT AREA -->
                <div class="relative z-10 w-full h-full flex flex-col items-center pt-24 pb-12 px-4 overflow-y-auto custom-scrollbar">
                    


                    <!-- Podiums -->
                    <div class="flex items-end justify-center gap-2 md:gap-8 mb-12">
                        ${podiumsHtml}
                    </div>

                    <!-- Leaderboard Table Card -->
                    ${others.length > 0 ? `
                    <div class="w-full max-w-4xl bg-[#1a1a20]/90 backdrop-blur-md border-[3px] border-primary/30 rounded-3xl shadow-[0_0_50px_rgba(0,255,85,0.1)] overflow-hidden shrink-0 mb-20">
                        <!-- Header -->
                        <div class="bg-black/80 border-b-[3px] border-primary/20 relative">
                            <div class="grid grid-cols-[60px_1fr_100px_100px] md:grid-cols-[100px_1fr_150px_150px] p-4 md:p-5 font-bold text-primary/80 uppercase tracking-widest text-[10px] md:text-xs">
                                <div class="text-center">RANK</div>
                                <div>PLAYER</div>
                                <div class="text-center">SCORE</div>
                                <div class="text-center">TIME</div>
                            </div>
                        </div>
                        
                        <!-- List -->
                        <div class="flex flex-col">
                            ${tableHtml}
                        </div>
                    </div>
                    ` : ''}
                </div>

                <!-- FLOATING ACTIONS (Left & Right) -->
                <div class="fixed top-[40%] md:top-1/2 left-4 md:left-6 -translate-y-1/2 flex flex-col gap-4 z-50">
                    <button id="lb-home-btn" class="w-14 h-14 md:w-16 md:h-16 bg-[#1a1a20]/80 backdrop-blur-md border-2 border-white/10 hover:border-primary text-white/70 hover:text-primary rounded-2xl flex items-center justify-center transition-all group hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(0,255,85,0.2)]" title="Home">
                        <span class="material-symbols-outlined text-2xl md:text-3xl group-hover:scale-110 transition-transform">home</span>
                    </button>
                    <button id="lb-restart-btn" class="w-14 h-14 md:w-16 md:h-16 bg-[#1a1a20]/80 backdrop-blur-md border-2 border-white/10 hover:border-secondary text-white/70 hover:text-secondary rounded-2xl flex items-center justify-center transition-all group hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(0,212,255,0.2)]" title="Play Again">
                        <span class="material-symbols-outlined text-2xl md:text-3xl group-hover:-rotate-180 transition-transform duration-500">restart_alt</span>
                    </button>
                </div>

                <div class="fixed top-[40%] md:top-1/2 right-4 md:right-6 -translate-y-1/2 flex flex-col gap-4 z-50">
                    <button id="lb-stats-btn" class="w-14 h-14 md:w-16 md:h-16 bg-[#1a1a20]/80 backdrop-blur-md border-2 border-white/10 hover:border-accent text-white/70 hover:text-accent rounded-2xl flex items-center justify-center transition-all group hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(204,0,255,0.2)]" title="Statistics">
                        <span class="material-symbols-outlined text-2xl md:text-3xl group-hover:scale-110 transition-transform">analytics</span>
                    </button>
                </div>
            </div>
        `;
    }
}
