import Phaser from 'phaser';
import { LoginScene } from './scenes/login/page';
import { LobbyScene } from './scenes/lobby/page';
import { HostWaitingRoomScene } from './scenes/host/lobby/page';
import { PlayerWaitingRoomScene } from './scenes/player/waitingroom/page';
import { GameScene } from './scenes/player/game/page';
import { UIScene } from './scenes/player/ui/page';
import { ResultScene } from './scenes/player/results/page';
import { LeaderboardScene } from './scenes/player/leaderboard/page';
import { QuizSettingScene } from './scenes/host/quizsetting/page';
import { SelectQuizScene } from './scenes/host/selectquiz/page';

import { HostProgressScene } from './scenes/host/progress/page';
import { HostLeaderboardScene } from './scenes/host/leaderboard/page';

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
        HostLeaderboardScene,
        HostProgressScene,
        ResultScene
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
