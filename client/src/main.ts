import Phaser from 'phaser';
import { LoginScene } from './scenes/LoginScene';
import { LobbyScene } from './scenes/LobbyScene';
import { HostWaitingRoomScene } from './scenes/HostWaitingRoomScene';
import { PlayerWaitingRoomScene } from './scenes/PlayerWaitingRoomScene';
import { GameScene } from './scenes/GameScene';
import { UIScene } from './scenes/UIScene';
import { WaitingResultsScene } from './scenes/WaitingResultsScene';
import { LeaderboardScene } from './scenes/LeaderboardScene';
import { QuizSettingScene } from './scenes/QuizSettingScene';
import { SelectQuizScene } from './scenes/SelectQuizScene';

import { HostProgressScene } from './scenes/HostProgressScene';
import { HostSpectatorScene } from './scenes/HostSpectatorScene';

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
<<<<<<< HEAD
    scene: [LobbyScene, HostWaitingRoomScene, PlayerWaitingRoomScene, GameScene, UIScene, WaitingResultsScene, LeaderboardScene, HostProgressScene, HostSpectatorScene],
=======
    scene: [LoginScene, LobbyScene, SelectQuizScene, QuizSettingScene, WaitingRoomScene, GameScene, UIScene, WaitingResultsScene, LeaderboardScene],
>>>>>>> 99150af7b23f79aa6a6e15f5c7817e89b98ef515
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    dom: {
        createContainer: true
    }
};

new Phaser.Game(config);
