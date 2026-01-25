import Phaser from 'phaser';

export class LeaderboardScene extends Phaser.Scene {
    constructor() {
        super('LeaderboardScene');
    }

    create() {
        this.add.text(this.scale.width / 2, this.scale.height / 2, 'Leaderboard Placeholder', { fontSize: '32px', color: '#fff' }).setOrigin(0.5);
    }
}
