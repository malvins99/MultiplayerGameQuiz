import Phaser from 'phaser';
import { Client } from 'colyseus.js';
import { TransitionManager } from '../../../utils/TransitionManager';
import { Router } from '../../../utils/Router';
import { RoomService } from '../../../services/room/RoomService';
import { LeaderboardUI } from './ui';
import type { RankingEntry } from './ui';

export class HostLeaderboardScene extends Phaser.Scene {
    private container!: HTMLDivElement;
    private client!: Client;
    private rankings: RankingEntry[] = [];

    constructor() {
        super({ key: 'HostLeaderboardScene' });
    }

    create() {
        this.initializeClient();
        TransitionManager.ensureClosed();

        this.rankings = this.registry.get('leaderboardData') || [];
        this.rankings.sort((a, b) => a.rank - b.rank);

        this.container = document.createElement('div');
        this.container.id = 'leaderboard-ui';
        // Force 'Retro Gaming' font family on the container and all children
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
        // Add the local styles
        const styleId = 'leaderboard-local-styles';
        if (!document.getElementById(styleId)) {
            const s = document.createElement('style');
            s.id = styleId;
            s.innerHTML = LeaderboardUI.getGlobalStyles();
            document.head.appendChild(s);
        }

        Router.navigate('/host/leaderboard');

        this.container.innerHTML = LeaderboardUI.generateHTML(this.rankings);

        this.attachListeners();
    }

    private attachListeners() {
        const homeBtn = document.getElementById('lb-home-btn');
        const restartBtn = document.getElementById('lb-restart-btn');
        const statsBtn = document.getElementById('lb-stats-btn');

        if (statsBtn) {
            statsBtn.onclick = () => {
                alert("Fitur Statistik lengkap akan segera hadir!");
            };
        }

        if (homeBtn) {
            homeBtn.onclick = () => TransitionManager.transitionTo(() => {
                this.cleanup();
                const r = this.registry.get('room'); if (r) r.leave();
                window.history.pushState({}, '', '/');
                this.scene.start('LobbyScene');
            });
        }

        if (restartBtn) {
            restartBtn.onclick = async () => {
                const opts = this.registry.get('lastGameOptions');
                const q = this.registry.get('lastSelectedQuiz');
                if (opts && q) {
                    TransitionManager.close(async () => {
                        try {
                            const { room, options } = await RoomService.createRoom(this.client, { ...opts, quiz: q });
                            this.registry.set('lastGameOptions', options);
                            this.cleanup();
                            this.scene.start('HostWaitingRoomScene', { room, isHost: true });
                            setTimeout(() => TransitionManager.open(), 600);
                        } catch (e) {
                            alert("Restart error. Returning to lobby.");
                            this.cleanup();
                            this.scene.start('LobbyScene');
                        }
                    });
                }
            };
        }
    }

    cleanup() {
        if (this.container) this.container.remove();
        const s = document.getElementById('leaderboard-local-styles'); if (s) s.remove();
    }
}
