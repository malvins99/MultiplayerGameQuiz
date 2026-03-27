import { GlobalBackground } from '../../../ui/shared/GlobalBackground';

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
            .logo-center { position: fixed; top: 25px; left: 0; right: 0; margin: 0 auto; width: 200px; z-index: 2000; pointer-events: none; display: none; }
            .logo-left { position: absolute; top: -30px; left: -40px; width: 280px; z-index: 20; pointer-events: none; }
            .logo-right { position: absolute; top: -45px; right: -15px; width: 320px; z-index: 20; pointer-events: none; }
            .lb-footer-mobile { display: none; }
            .desktop-floating-actions { display: none; }
            .nav-btn {
                pointer-events: auto; background: #336B23; border: none; border-bottom: 4px solid #1F4514; border-radius: 12px;
                width: 72px; height: 72px; display: flex; align-items: center; justify-content: center; color: white; cursor: pointer; transition: all 0.2s;
                box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
            }
            .nav-btn:hover { filter: brightness(85%); }
            .nav-btn:active { transform: translateY(4px); border-bottom-width: 0; }
            .nav-btn .material-symbols-outlined { font-size: 30px; color: white; }
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
                    background: #336B23; color: white; border-bottom: 3px solid #1F4514; box-shadow: 0 6px 0 #1F4514;
                }
                .nav-btn-wide:hover { filter: brightness(85%); }
                .nav-btn-wide:active { transform: translateY(2px); border-bottom-width: 2px; box-shadow: 0 4px 0 #1F4514; }
                .nav-btn-wide .material-symbols-outlined { color: white; }
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

                    <div class="text-sm md:text-2xl mb-3 font-bold text-center uppercase tracking-widest" style="color: #ffffff; font-family: 'Retro Gaming', monospace; letter-spacing: 2px; text-shadow: 1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000; -webkit-font-smoothing: none;">${p.name}</div>

                    <!-- The literal podium block (Hidden on mobile) -->
                    <div class="hidden md:flex ${width} ${height} rounded-t-2xl border-4 border-b-0 flex-col items-center justify-center relative overflow-hidden" style="border-color: ${colorHex}; background: linear-gradient(to top, rgba(0,0,0,0.9), ${colorBg});">
                        <div class="absolute inset-0 bg-[url('/assets/bg_pattern.png')] opacity-10"></div>
                        <div class="text-2xl md:text-5xl font-bold mb-2 relative z-10" style="font-family: 'Retro Gaming', monospace; color: #ffffff; text-shadow: 1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000; -webkit-font-smoothing: none;">${p.score}</div>
                        <span class="material-symbols-outlined text-4xl md:text-6xl opacity-40 relative z-10" style="color: ${colorHex}">${icon}</span>
                    </div>
                </div>
            `;
        }).join('');

        const tableHtml = others.map((p) => {
            const hairKey = p.hairId ? ['bowlhair', 'curlyhair', 'longhair', 'mophair', 'shorthair', 'spikeyhair'][p.hairId - 1] : null;
            return `
            <div class="grid grid-cols-[40px_1fr_60px_60px] md:grid-cols-[100px_1fr_150px_150px] p-4 text-gray-800 items-center border-b border-gray-200 hover:bg-gray-100 transition-colors group font-['Retro_Gaming']" style="-webkit-font-smoothing: none;">
                <div class="text-center font-bold text-gray-600 group-hover:text-[#336B23] transition-colors text-sm md:text-lg">${p.rank}</div>
                <div class="flex items-center gap-2 md:gap-3">
                    <div class="hidden md:flex w-10 h-10 rounded-full bg-[#e2e8f0]/95 border-2 border-gray-300 items-center justify-center font-bold text-sm group-hover:border-[#336B23] transition-colors overflow-hidden relative podium-avatar">
                        <div class="char-anim-sm" style="background-image: url('/assets/base_idle_strip9.png')"></div>
                        ${hairKey ? `<div class="char-anim-sm" style="background-image: url('/assets/${hairKey}_idle_strip9.png')"></div>` : ''}
                    </div>
                    <div class="font-bold text-xs md:text-lg truncate max-w-[150px] md:max-w-[300px] py-1 uppercase text-[#336B23]">${p.name}</div>
                </div>
                <div class="text-center text-[#478D47] font-bold text-sm md:text-xl">${p.score}</div>
                <div class="text-center text-gray-700 text-xs md:text-base font-bold">
                    ${formatTime(p.duration)}
                </div>
            </div>
        `}).join('');

        return `
            <div translate="no" class="notranslate fixed inset-0 w-full h-screen overflow-hidden text-white pointer-events-auto select-none" style="background: linear-gradient(180deg, #6CC452 0%, #478D47 100%);">
                
                ${GlobalBackground.getHTML('leaderboard')}

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
                    <div class="w-full max-w-4xl bg-white border-[3px] border-[#336B23] rounded-3xl shadow-[0_0_30px_rgba(51,107,35,0.2)] overflow-hidden shrink-0 md:mb-20 flex flex-col flex-1 md:flex-none min-h-0">
                        <!-- Header -->
                        <div class="bg-[#F1F8E9] border-b-[3px] border-[#336B23] relative shrink-0">
                            <div class="grid grid-cols-[40px_1fr_60px_60px] md:grid-cols-[100px_1fr_150px_150px] p-4 md:p-5 font-bold text-[#6CC452] uppercase tracking-widest text-sm md:text-lg font-['Retro_Gaming']" style="text-shadow: 1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000;">
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
