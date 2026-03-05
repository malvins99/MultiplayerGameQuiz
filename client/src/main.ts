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

import { LoginUI } from './scenes/login/ui';
import { LobbyUI } from './scenes/lobby/ui';
import { CreateRoomUI } from './scenes/lobby/create-room-ui';
import { QuizSelectionUI } from './scenes/host/selectquiz/ui';
import { QuizSettingsUI } from './scenes/host/quizsetting/ui';
import { WaitingRoomUI } from './scenes/host/lobby/ui';
import { AuthLoadingUI } from './scenes/login/auth-loading-ui';
import { GameOverlayUI } from './scenes/player/game/ui';

// Pre-render all global UIs to replace the ones removed from index.html
LoginUI.render();
LobbyUI.render();
CreateRoomUI.render();
QuizSelectionUI.render();
QuizSettingsUI.render();
WaitingRoomUI.render();
AuthLoadingUI.render();
GameOverlayUI.render();

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
