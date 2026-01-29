import Phaser from 'phaser';
import { LobbyScene } from './scenes/LobbyScene';
import { WaitingRoomScene } from './scenes/WaitingRoomScene';
import { GameScene } from './scenes/GameScene';
import { UIScene } from './scenes/UIScene';
import { WaitingResultsScene } from './scenes/WaitingResultsScene';
import { LeaderboardScene } from './scenes/LeaderboardScene';

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    pixelArt: true,
    roundPixels: true,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'app',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 0 },
            debug: false
        }
    },
    scene: [LobbyScene, WaitingRoomScene, GameScene, UIScene, WaitingResultsScene, LeaderboardScene],
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    dom: {
        createContainer: true
    }
};

new Phaser.Game(config);
