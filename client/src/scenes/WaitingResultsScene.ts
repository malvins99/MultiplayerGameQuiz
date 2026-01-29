import Phaser from 'phaser';

export class WaitingResultsScene extends Phaser.Scene {
    private container!: HTMLDivElement;
    private dots: string = '';
    private dotInterval!: number;

    constructor() {
        super({ key: 'WaitingResultsScene' });
    }

    create() {
        // Create dark overlay
        this.container = document.createElement('div');
        this.container.id = 'waiting-results-overlay';
        this.container.innerHTML = `
            <style>
                #waiting-results-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.9);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                    font-family: 'Press Start 2P', monospace;
                    color: #00ff88;
                }
                .waiting-spinner {
                    width: 64px;
                    height: 64px;
                    border: 6px solid #333;
                    border-top-color: #00ff88;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin-bottom: 32px;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                .waiting-text {
                    font-size: 16px;
                    text-align: center;
                }
                .waiting-subtext {
                    font-size: 10px;
                    color: #666;
                    margin-top: 16px;
                }
            </style>
            <div class="waiting-spinner"></div>
            <div class="waiting-text">Menunggu pemain lain<span id="waiting-dots">...</span></div>
            <div class="waiting-subtext">Permainan akan berakhir setelah semua selesai atau waktu habis</div>
        `;
        document.body.appendChild(this.container);

        // Animate dots
        this.dotInterval = window.setInterval(() => {
            this.dots = this.dots.length >= 3 ? '' : this.dots + '.';
            const dotsEl = document.getElementById('waiting-dots');
            if (dotsEl) dotsEl.textContent = this.dots;
        }, 500);

        // Listen for gameEnded event from server (passed via registry)
        const room = this.registry.get('room');
        if (room) {
            room.onMessage('gameEnded', (data: any) => {
                // Add minimum delay for system to process all players
                setTimeout(() => {
                    this.cleanup();
                    this.registry.set('leaderboardData', data.rankings);
                    this.scene.start('LeaderboardScene');
                }, 2000); // 2 second delay for safety
            });
        }
    }

    cleanup() {
        if (this.dotInterval) {
            clearInterval(this.dotInterval);
        }
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }

    shutdown() {
        this.cleanup();
    }
}
