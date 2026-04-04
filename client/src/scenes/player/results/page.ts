import { Client } from 'colyseus.js';
import { TransitionManager } from '../../../utils/TransitionManager';
import { Router } from '../../../utils/Router';
import { LobbyManager } from '../../lobby/page';
import { OrientationManager } from '../../../utils/OrientationManager';
import { GlobalBackground } from '../../../ui/shared/GlobalBackground';
import { i18n } from '../../../utils/i18n';

interface RankingEntry {
    rank: number;
    sessionId: string;
    name: string;
    hairId?: number;
    avatarUrl?: string; // Added avatarUrl
    score: number;
    finishTime: number;
    duration: number;
    correctAnswers: number;
    wrongAnswers: number;
}

export class ResultManager {
    private container!: HTMLDivElement;
    private rankings: RankingEntry[] = [];
    private mySessionId: string = "";
    private roomId: string = "";
    private supabaseSessionId: string = "";
    private room: any;

    constructor() {}

    start(data?: { room?: any, leaderboardData?: any[] }) {
        TransitionManager.ensureClosed();
        OrientationManager.requirePortrait(i18n.t('player_result.portrait_req_title'), i18n.t('player_result.portrait_req_desc'));

        // Listen for language changes
        window.addEventListener('languageChanged', this.handleLangChange);

        let registryRankings = data?.leaderboardData || [];
        this.room = data?.room;
        let registrySessionId = this.room ? this.room.sessionId : "";
        let registryRoomId = this.room ? this.room.id : "";

        this.supabaseSessionId = localStorage.getItem('supabaseSessionId') || "";

        if (registryRankings.length > 0 && registrySessionId && registryRoomId) {
            this.rankings = registryRankings;
            this.mySessionId = registrySessionId;
            this.roomId = registryRoomId;
            
            // Get dynamic question total
            const qLimit = this.room?.state?.questionLimit || "5";
            const qCount = this.room?.state?.questions?.length || 5;
            const finalTotal = (qLimit === 'all') ? qCount : parseInt(qLimit);

            sessionStorage.setItem('playerResultState', JSON.stringify({
                rankings: this.rankings,
                mySessionId: this.mySessionId,
                roomId: this.roomId,
                supabaseSessionId: this.supabaseSessionId,
                questionTotal: finalTotal
            }));
        } else {
            const savedState = sessionStorage.getItem('playerResultState');
            if (savedState) {
                const parsed = JSON.parse(savedState);
                this.rankings = parsed.rankings;
                this.mySessionId = parsed.mySessionId;
                this.roomId = parsed.roomId;
                if (parsed.supabaseSessionId) {
                    this.supabaseSessionId = parsed.supabaseSessionId;
                }
            }
        }

        const existingUI = document.getElementById('result-ui');
        if (existingUI) existingUI.remove();

        this.container = document.createElement('div');
        this.container.id = 'result-ui';
        this.container.style.position = 'absolute';
        this.container.style.top = '0';
        this.container.style.left = '0';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.zIndex = '1000';
        this.container.style.pointerEvents = 'none'; // Background can be clicked through empty areas
        document.body.appendChild(this.container);

        if (!document.getElementById('result-styles')) {
            const style = document.createElement('style');
            style.id = 'result-styles';
            style.innerHTML = this.getStyles();
            document.head.appendChild(style);
        }

        this.renderIndividualResult();

        if (this.room) {
            this.room.onMessage('gameEnded', (msgData: { rankings: any[] }) => {
                this.rankings = msgData.rankings;
                sessionStorage.setItem('playerResultState', JSON.stringify({
                    rankings: this.rankings,
                    mySessionId: this.mySessionId,
                    roomId: this.roomId,
                    supabaseSessionId: this.supabaseSessionId
                }));
                this.renderIndividualResult();
            });
        }

        setTimeout(() => {
            TransitionManager.open();
        }, 100);
    }

    private getStyles(): string {
        return `
            @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

            #result-ui {
                background: linear-gradient(180deg, #6CC452 0%, #478D47 100%);
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

            .pixel-bg-pattern {
                background-image: radial-gradient(#2d5a30 1px, transparent 1px);
                background-size: 24px 24px;
            }

            .result-card {
                background: white;
                border: 4px solid #6CC452;
                border-bottom: 10px solid #478D47;
                border-radius: 28px;
                padding: 40px;
                display: flex; flex-direction: column; align-items: center;
                min-width: 480px;
                position: relative;
                box-shadow: 0 20px 40px rgba(0,0,0,0.2);
                z-index: 10;
            }

            .result-avatar-container {
                width: 180px; height: 180px;
                background: #F1F8E9;
                border: 2px solid #478D47;
                border-radius: 50%;
                display: flex; align-items: center; justify-content: center;
                margin-bottom: 25px;
                position: relative; overflow: hidden; // Ensures avatar image is clipped
            }
            .result-avatar-img {
                width: 100%; height: 100%;
                object-fit: cover;
                border-radius: 50%;
            }

            .char-anim { width: 96px; height: 64px; image-rendering: pixelated; position: absolute; transform: scale(4.5); }
            .anim-play { animation: lb-play-idle 1s steps(9) infinite; background-repeat: no-repeat; }
            @keyframes lb-play-idle { from { background-position: 0 0; } to { background-position: -864px 0; } }
            .result-char { transform: scale(8); }

            .result-name {
                font-family: 'Retro Gaming', monospace;
                font-size: 26px; color: #478D47;
                text-transform: uppercase; letter-spacing: 2px;
                margin-bottom: 40px;
            }

            .result-stats-row {
                display: flex; gap: 15px; width: 100%; justify-content: center;
            }

            .stat-box {
                background: #F1F8E9;
                border: 2px solid #6CC452;
                border-radius: 16px;
                padding: 20px 10px;
                width: 120px;
                display: flex; flex-direction: column; align-items: center;
                transition: transform 0.2s;
            }
            .stat-box:hover { transform: translateY(-5px); }
            .stat-icon { font-size: 28px; margin-bottom: 12px; color: #478D47; }
            .stat-value { font-family: 'Retro Gaming', monospace; font-size: 18px; color: #478D47; margin-bottom: 6px; }
            .stat-label { 
                font-size: 11px; 
                color: #6CC452; 
                text-transform: uppercase; 
                letter-spacing: 1px;
                font-weight: 800;
            }

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
                pointer-events: auto; 
                background: #336B23; 
                border: none;
                border-bottom: 4px solid #1F4514;
                border-radius: 12px; 
                width: 72px; height: 72px;
                display: flex; align-items: center; justify-content: center; color: white; cursor: pointer; transition: all 0.2s;
                box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
            }
            .nav-btn:hover { filter: brightness(85%); }
            .nav-btn:active { transform: translateY(4px); border-bottom-width: 0; }
            .nav-btn .material-symbols-outlined { font-size: 30px; }

            .logo-center {
                position: fixed;
                top: 25px;
                left: 0;
                right: 0;
                margin: 0 auto;
                width: 200px;
                z-index: 2000;
                pointer-events: none;
                display: none; /* Hide by default, show on mobile */
            }

            .logo-left { 
                position: absolute; 
                top: -30px; 
                left: -40px; 
                width: 280px; 
                z-index: 20; 
                pointer-events: none;
            }
            .logo-right { 
                position: absolute; 
                top: -45px; 
                right: -15px; 
                width: 320px; 
                z-index: 20; 
                pointer-events: none;
            }

            @media (max-width: 768px) {
                .logo-left, .logo-right { display: none; }
                .logo-center { display: block; width: 280px; top: -10px; }
                .result-card { 
                    min-width: 90vw; 
                    padding: 25px 20px;
                    margin-top: 50px;
                    margin-bottom: 20px;
                    background: white;
                    border: 4px solid #6CC452;
                    border-bottom: 10px solid #478D47;
                }
                .result-avatar-container { width: 140px; height: 140px; background: #F1F8E9; border-color: #478D47; border-radius: 50%; }
                .result-name { font-size: 20px; margin-bottom: 30px; color: #478D47; }
                .result-stats-row { 
                    gap: 6px; 
                    width: 100%;
                    justify-content: center;
                }
                .stat-box { 
                    padding: 10px 4px; 
                    flex: 1;
                    min-width: 0; /* Allow shrinking */
                    max-width: 85px; 
                    background: #F1F8E9;
                    border-color: #6CC452;
                }
                .stat-box .material-symbols-outlined { font-size: 22px; margin-bottom: 6px; color: #478D47; }
                .stat-value { font-size: 14px; margin-bottom: 2px; color: #478D47; }
                .stat-label { 
                    font-size: ${i18n.getLanguage() === 'ar' ? '10px' : '8px'}; 
                    color: #6CC452; 
                    font-weight: 800;
                }
                .lb-footer {
                    top: auto;
                    bottom: 40px;
                    transform: none;
                    flex-direction: row;
                    gap: 15px;
                    padding: 0 20px;
                }
                .nav-btn-wide {
                    flex: 1;
                    pointer-events: auto;
                    height: 44px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 4px;
                    font-family: 'Retro Gaming', monospace;
                    font-size: 9px;
                    text-transform: uppercase;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s;
                    background: #336B23; 
                    color: white;
                    border-bottom: 3px solid #1F4514;
                    box-shadow: 0 6px 0 #1F4514;
                }
                .nav-btn-wide:hover { filter: brightness(85%); }
                .nav-btn-wide:active { transform: translateY(2px); border-bottom-width: 2px; box-shadow: 0 4px 0 #1F4514; }
                .nav-btn { display: none; }
            }

            @media (min-width: 769px) {
                .nav-btn-wide { display: none; }
            }
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

        const upscaleAvatarUrl = (url?: string) => {
            if (!url) return url;
            if (url.includes('googleusercontent.com')) {
                return url.replace(/=s\d+(-c)?/, '=s384-c');
            }
            return url;
        };

        const savedState = sessionStorage.getItem('playerResultState');
        const questionTotal = savedState ? (JSON.parse(savedState).questionTotal || 5) : 5;

        const characterVisuals = this.getCharacterVisuals(myEntry);

        this.container.innerHTML = `
            ${GlobalBackground.getHTML('result')}

            <img src="/logo/Zigma-logo-fix.webp" class="logo-center" />
            <img src="/logo/Zigma-logo-fix.webp" class="logo-left" />
            <img src="/logo/gameforsmart-logo-fix.webp" class="logo-right" />

            <div class="result-card pointer-events-auto">
                <div class="result-avatar-container">
                    ${myEntry.avatarUrl ? 
                        `<img src="${upscaleAvatarUrl(myEntry.avatarUrl)}" class="result-avatar-img" />` :
                        `<div class="char-anim result-char anim-play" style="${characterVisuals.base}"></div>
                         <div class="char-anim result-char anim-play" style="${characterVisuals.tools}"></div>
                         ${characterVisuals.hair ? `<div class="char-anim result-char anim-play" style="${characterVisuals.hair}"></div>` : ''}`
                    }
                </div>
                <div class="result-name">${myEntry.name}</div>
                
                <div class="result-stats-row">
                    <div class="stat-box">
                        <span class="material-symbols-outlined stat-icon">military_tech</span>
                        <div class="stat-value">${myEntry.rank === -1 ? (this.room?.state?.players?.size === 1 ? '#1' : '#?') : '#' + myEntry.rank}</div>
                        <div id="txt-pr-rank" class="stat-label">${i18n.t('player_result.rank')}</div>
                    </div>
                    <div class="stat-box">
                        <span class="material-symbols-outlined stat-icon">workspace_premium</span>
                        <div class="stat-value">${Math.round(myEntry.score)}</div>
                        <div id="txt-pr-score" class="stat-label">${i18n.t('player_result.score')}</div>
                    </div>
                    <div class="stat-box">
                        <span class="material-symbols-outlined stat-icon">task_alt</span>
                        <div class="stat-value">${myEntry.correctAnswers}/${questionTotal}</div>
                        <div id="txt-pr-correct" class="stat-label">${i18n.t('player_result.correct')}</div>
                    </div>
                    <div class="stat-box">
                        <span class="material-symbols-outlined stat-icon">schedule</span>
                        <div class="stat-value">${formatTime(myEntry.duration)}</div>
                        <div id="txt-pr-time" class="stat-label">${i18n.t('player_result.time')}</div>
                    </div>
                </div>
            </div>

            <div class="lb-footer">
                <button id="lb-home-btn" class="nav-btn btn-left" title="${i18n.t('player_result.title_home')}">
                    <span class="material-symbols-outlined">home</span>
                </button>
                
                <button id="lb-home-btn-mobile" class="nav-btn-wide">
                    <span class="material-symbols-outlined">home</span>
                    <span id="txt-pr-home">${i18n.t('player_result.home')}</span>
                </button>
                
                <button id="lb-stats-btn-mobile" class="nav-btn-wide">
                    <span class="material-symbols-outlined">analytics</span>
                    <span id="txt-pr-stats">${i18n.t('player_result.stats')}</span>
                </button>

                <button id="lb-stats-btn" class="nav-btn btn-right" title="${i18n.t('player_result.title_stats')}">
                    <span class="material-symbols-outlined">analytics</span>
                </button>
            </div>
        `;

        GlobalBackground.startCharacterSpawner('result');
        this.attachListeners();
    }

    private getCharacterVisuals(player: RankingEntry) {
        const humanPath = '/assets/characters/Human/IDLE';
        const base = `background-image: url('${humanPath}/base_idle_strip9.png'); background-size: 864px 64px;`;
        const tools = `background-image: url('${humanPath}/tools_idle_strip9.png'); background-size: 864px 64px;`;
        let hair = '';
        if (player.hairId && player.hairId > 0) {
            const hairFiles: Record<number, string> = {
                1: 'bowlhair', 2: 'curlyhair', 3: 'longhair', 4: 'mophair', 5: 'shorthair', 6: 'spikeyhair'
            };
            const key = hairFiles[player.hairId];
            if (key) {
                hair = `background-image: url('${humanPath}/${key}_idle_strip9.png'); background-size: 864px 64px;`;
            }
        }
        return { base, tools, hair };
    }

    private attachListeners() {
        setTimeout(() => {
            const homeBtn = document.getElementById('lb-home-btn');
            const statsBtn = document.getElementById('lb-stats-btn');

            if (homeBtn) homeBtn.onclick = () => {
                TransitionManager.transitionTo(() => {
                    this.cleanup();
                    if (this.room) this.room.leave();
                    window.location.href = '/';
                });
            };

            const homeBtnMobile = document.getElementById('lb-home-btn-mobile');
            if (homeBtnMobile) homeBtnMobile.onclick = () => {
                TransitionManager.transitionTo(() => {
                    this.cleanup();
                    if (this.room) this.room.leave();
                    window.location.href = '/';
                });
            };

            if (statsBtn) {
                statsBtn.onclick = () => this.openStats();
            }

            const statsBtnMobile = document.getElementById('lb-stats-btn-mobile');
            if (statsBtnMobile) statsBtnMobile.onclick = () => this.openStats();
        }, 50);
    }

    private openStats() {
        const sid = this.supabaseSessionId || localStorage.getItem('supabaseSessionId');
        if (sid) {
            window.open(`https://gameforsmartnewui.vercel.app/stat/${sid}`, '_blank');
        } else {
            alert(i18n.t('player_result.no_session'));
        }
    }

    cleanup() {
        GlobalBackground.stopCharacterSpawner('result');
        if (this.container) this.container.remove();
        const style = document.getElementById('result-styles');
        if (style) style.remove();
        OrientationManager.disable();
        window.removeEventListener('languageChanged', this.handleLangChange);
    }
    
    private handleLangChange = () => {
        const hRank = document.getElementById('txt-pr-rank');
        if (hRank) hRank.innerText = i18n.t('player_result.rank');
        const hScore = document.getElementById('txt-pr-score');
        if (hScore) hScore.innerText = i18n.t('player_result.score');
        const hCorrect = document.getElementById('txt-pr-correct');
        if (hCorrect) hCorrect.innerText = i18n.t('player_result.correct');
        const hTime = document.getElementById('txt-pr-time');
        if (hTime) hTime.innerText = i18n.t('player_result.time');

        const btnHome = document.getElementById('lb-home-btn');
        if (btnHome) btnHome.title = i18n.t('player_result.title_home');
        const btnStats = document.getElementById('lb-stats-btn');
        if (btnStats) btnStats.title = i18n.t('player_result.title_stats');

        const txtHome = document.getElementById('txt-pr-home');
        if (txtHome) txtHome.innerText = i18n.t('player_result.home');
        const txtStats = document.getElementById('txt-pr-stats');
        if (txtStats) txtStats.innerText = i18n.t('player_result.stats');
    };

}
