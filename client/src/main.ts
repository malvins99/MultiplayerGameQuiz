import Phaser from 'phaser';
import { LoginScene } from './scenes/login/page';
import { LobbyScene } from './scenes/lobby/page';
import { HostWaitingRoomScene } from './scenes/hostwaitingroom/page';
import { PlayerWaitingRoomScene } from './scenes/playerwaitingroom/page';
import { GameScene } from './scenes/game/page';
import { UIScene } from './scenes/ui/page';
import { WaitingResultsScene } from './scenes/waitingresults/page';
import { LeaderboardScene } from './scenes/leaderboard/page';
import { QuizSettingScene } from './scenes/quizsetting/page';
import { SelectQuizScene } from './scenes/selectquiz/page';

import { HostProgressScene } from './scenes/hostprogress/page';
import { HostLeaderboardScene } from './scenes/hostleaderboard/page';

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
    scene: [
        LoginScene,
        LobbyScene,
        SelectQuizScene,
        QuizSettingScene,
        HostWaitingRoomScene,
        PlayerWaitingRoomScene,
        GameScene,
        UIScene,
        WaitingResultsScene,
        LeaderboardScene,
        HostLeaderboardScene,
        HostProgressScene
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
