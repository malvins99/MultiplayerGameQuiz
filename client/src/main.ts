import { LoginManager } from './scenes/login/page';
import { LobbyManager } from './scenes/lobby/page';
import { authService } from './services/auth/AuthService';
import { LoginUI } from './scenes/login/ui';
import { LobbyUI } from './scenes/lobby/ui';
import { CreateRoomUI } from './scenes/lobby/create-room-ui';
import { QuizSelectionUI } from './scenes/host/selectquiz/ui';
import { QuizSettingsUI } from './scenes/host/quizsetting/ui';
import { WaitingRoomUI } from './scenes/host/lobby/ui';
import { AuthLoadingUI } from './scenes/login/auth-loading-ui';
import { GameOverlayUI } from './scenes/player/game/ui';

import { TestLabManager } from './scenes/TestLabManager';

async function bootstrap() {
    // Pre-render all global UIs
    LoginUI.render();
    LobbyUI.render();
    CreateRoomUI.render();
    QuizSelectionUI.render();
    QuizSettingsUI.render();
    WaitingRoomUI.render();
    AuthLoadingUI.render();
    GameOverlayUI.render();

    const currentPath = window.location.pathname;

    // ROUTE KHUSUS: Laboratorium Eksperimen
    if (currentPath === '/tes-dasar') {
        const testLabManager = new TestLabManager();
        testLabManager.init();
        return;
    }

    if (currentPath === '/login' || currentPath.startsWith('/login')) {
        const loginManager = new LoginManager();
        loginManager.init();
        return;
    }

    const isAuth = await authService.isAuthenticated();

    if (!isAuth) {
        const loginManager = new LoginManager();
        loginManager.init();
    } else {
        const lobbyManager = new LobbyManager();
        lobbyManager.init();
    }
}

bootstrap();

