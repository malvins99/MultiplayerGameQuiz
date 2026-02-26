import Phaser from 'phaser';
import { LoginScene } from './scenes/LoginScene';
import { LobbyScene } from './scenes/LobbyScene';
import { HostWaitingRoomScene } from './scenes/HostWaitingRoomScene';
import { PlayerWaitingRoomScene } from './scenes/PlayerWaitingRoomScene';
import { GameScene } from './scenes/GameScene';
import { UIScene } from './scenes/UIScene';
import { LeaderboardScene } from './scenes/LeaderboardScene';
import { ResultScene } from './scenes/ResultScene';
import { QuizSettingScene } from './scenes/QuizSettingScene';
import { SelectQuizScene } from './scenes/SelectQuizScene';

import { HostSpectatorScene } from './scenes/HostSpectatorScene';

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    pixelArt: true,
    roundPixels: true,
    antialias: false,
    antialiasGL: false,
    render: {
        pixelArt: true,
        antialias: false,
        roundPixels: true,
        powerPreference: 'high-performance',
        batchSize: 2000
    },
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
    scene: [
        LoginScene,
        LobbyScene,
        SelectQuizScene,
        QuizSettingScene,
        HostWaitingRoomScene,
        PlayerWaitingRoomScene,
        GameScene,
        UIScene,
        LeaderboardScene,
        ResultScene,
        HostSpectatorScene
    ],
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    dom: {
        createContainer: true
    }
};

new Phaser.Game(config);
