import { Client } from 'colyseus.js';
import { TransitionManager } from '../../../utils/TransitionManager';
import { Router } from '../../../utils/Router';
import { RoomService } from '../../../services/room/RoomService';
import { LeaderboardUI } from './ui';
import type { RankingEntry } from './ui';
import { LobbyManager } from '../../../scenes/lobby/page';
import { initializeGame } from '../../../game';
import { OrientationManager } from '../../../utils/OrientationManager';
import { GlobalBackground } from '../../../ui/shared/GlobalBackground';

export class HostLeaderboardManager {
    private container!: HTMLDivElement;
    private client!: Client;
    private rankings: RankingEntry[] = [];
    private opts: any;
    private q: any;
    private sessionId: string | null = null;
    private isHost: boolean = true;

    start(data?: { rankings?: any[], isHost?: boolean, lastGameOptions?: any, lastSelectedQuiz?: any, mySessionId?: string }) {
        this.initializeClient();
        TransitionManager.ensureClosed();
        OrientationManager.requirePortrait('MODE PORTRAIT DIPERLUKAN', 'mode potrait di perlukan');

        // Data passing via args or localStorage backup
        let rankingsData = data?.rankings;
        if (!rankingsData || rankingsData.length === 0) {
            const stored = localStorage.getItem('hostLeaderboardData');
            if (stored) {
                try { rankingsData = JSON.parse(stored); } catch (e) { }
            }
        } else {
            localStorage.setItem('hostLeaderboardData', JSON.stringify(rankingsData));
        }
        this.rankings = rankingsData || [];
        this.rankings.sort((a, b) => a.rank - b.rank);

        this.isHost = data?.isHost !== undefined ? data.isHost : true;

        this.opts = data?.lastGameOptions;
        if (this.opts) {
            localStorage.setItem('hostLastGameOptions', JSON.stringify(this.opts));
        } else {
            const stored = localStorage.getItem('hostLastGameOptions');
            if (stored) try { this.opts = JSON.parse(stored); } catch (e) { }
        }

        this.q = data?.lastSelectedQuiz;
        if (this.q) {
            localStorage.setItem('hostLastSelectedQuiz', JSON.stringify(this.q));
        } else {
            const stored = localStorage.getItem('hostLastSelectedQuiz');
            if (stored) try { this.q = JSON.parse(stored); } catch (e) { }
        }

        this.sessionId = data?.mySessionId || null;
        if (!this.sessionId) {
            this.sessionId = localStorage.getItem('hostLastSessionId');
        } else if (this.sessionId) {
            localStorage.setItem('hostLastSessionId', this.sessionId);
        }

        this.container = document.createElement('div');
        this.container.id = 'leaderboard-ui';
        this.container.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; z-index:1000; font-family: "Retro Gaming", monospace !important;';
        document.body.appendChild(this.container);

        this.renderLeaderboard();
        setTimeout(() => TransitionManager.open(), 100);
    }

    private initializeClient() {
        const envServerUrl = import.meta.env.VITE_SERVER_URL;
        let host = envServerUrl;
        if (!host) {
            const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
            host = `${protocol}://${window.location.host}`;
            if (window.location.hostname === 'localhost') host = `${protocol}://localhost:2567`;
        }
        this.client = new Client(host);
    }

    private renderLeaderboard() {
        const styleId = 'leaderboard-local-styles';
        if (!document.getElementById(styleId)) {
            const s = document.createElement('style');
            s.id = styleId;
            s.innerHTML = LeaderboardUI.getGlobalStyles();
            document.head.appendChild(s);
        }

        Router.navigate('/host/leaderboard');
        this.container.innerHTML = LeaderboardUI.generateHTML(this.rankings);

        GlobalBackground.startCharacterSpawner('leaderboard');

        this.attachListeners();
    }

    private attachListeners() {
        const homeBtn = document.getElementById('lb-home-btn');
        const restartBtn = document.getElementById('lb-restart-btn');
        const statsBtn = document.getElementById('lb-stats-btn');

        const homeBtnMobile = document.getElementById('lb-home-btn-mobile');
        const restartBtnMobile = document.getElementById('lb-restart-btn-mobile');
        const statsBtnMobile = document.getElementById('lb-stats-btn-mobile');

        const handleStats = () => {
            let sid = this.opts?.sessionId || localStorage.getItem('supabaseSessionId');
            if (!sid && this.rankings.length > 0) sid = this.rankings[0].sessionId;
            if (!sid) {
                sid = localStorage.getItem('lastGameOptions')?.match(/"sessionId":"([^"]+)"/)?.[1] ||
                      localStorage.getItem('hostLastGameOptions')?.match(/"sessionId":"([^"]+)"/)?.[1];
            }
            if (sid && sid !== "undefined" && sid !== "null") {
                window.open(`https://gameforsmartnewui.vercel.app/stat/${sid}`, '_blank');
            } else {
                alert("ID Sesi tidak ditemukan. Tidak dapat membuka statistik.");
            }
        };

        if (statsBtn) statsBtn.onclick = handleStats;
        if (statsBtnMobile) statsBtnMobile.onclick = handleStats;

        const handleHome = () => {
            TransitionManager.transitionTo(() => {
                this.cleanup();
                window.location.href = '/';
            });
        };

        if (homeBtn) homeBtn.onclick = handleHome;
        if (homeBtnMobile) homeBtnMobile.onclick = handleHome;

        const handleRestart = async () => {
                if (this.opts && !this.q && this.opts.quizId) {
                    try {
                        this.q = await import('../../../data/QuizData').then(m => m.fetchQuizById(this.opts.quizId));
                        if (this.q) {
                            localStorage.setItem('hostLastSelectedQuiz', JSON.stringify(this.q));
                        }
                    } catch (err) {
                        console.error("Failed to fetch quiz for restart:", err);
                    }
                }

                if (this.opts && this.q) {
                    TransitionManager.close(async () => {
                        try {
                            const { room, options } = await RoomService.createRoom(this.client, { ...this.opts, quiz: this.q });
                            this.cleanup();
                            Router.navigate(`/host/${options.roomCode}/lobby`);
                            // Start Phaser Engine directly onto HostWaitingRoomScene
                            initializeGame('HostWaitingRoomScene', { room, isHost: true });
                            setTimeout(() => TransitionManager.open(), 600);
                        } catch (e) {
                            console.error(e);
                            alert("Restart error. Returning to lobby.");
                            this.cleanup();
                            const manager = new LobbyManager();
                            manager.init();
                        }
                    });
                } else {
                    alert("Tidak dapat menemukan data kuis untuk mengulang permainan. Silakan kembali ke Lobby.");
                }
            };
        
        if (restartBtn) {
            restartBtn.onclick = handleRestart;
        }
        if (restartBtnMobile) {
            restartBtnMobile.onclick = handleRestart;
        }
    }

    cleanup() {
        GlobalBackground.stopCharacterSpawner('leaderboard');
        if (this.container) {
            if (this.container.parentNode) this.container.parentNode.removeChild(this.container);
            this.container.remove();
        }
        const s = document.getElementById('leaderboard-local-styles'); 
        if (s) {
            if(s.parentNode) s.parentNode.removeChild(s);
            s.remove();
        }
        OrientationManager.disable();
    }

}
