import { Router } from '../../utils/Router';
import { TransitionManager } from '../../utils/TransitionManager';
import { authService } from '../../services/auth/AuthService';
import { LoginUI } from './ui';
import { i18n } from '../../utils/i18n';

export class LoginManager {
    loginUI: HTMLElement | null = null;
    isLoading: boolean = false;

    async init() {
        this.initializeUI();
        this.setupEventListeners();

        // Check for OAuth callback (returning from Google login)
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));

        if (urlParams.has('code') || hashParams.has('access_token')) {
            // Process OAuth callback silently - no loading screen shown
            const result = await authService.handleAuthCallback();

            if (result.success && result.profile) {
                // Clean URL
                window.history.replaceState({}, document.title, window.location.pathname);

                this.navigateToLobby();
                return;
            } else {
                if (result.error) {
                    this.showLoginUI();
                    this.showError(result.error);
                }
            }
        }

        // Check if already authenticated
        const isAuth = await authService.isAuthenticated();
        if (isAuth) {
            const profile = authService.getStoredProfile();
            if (profile) {
                // Already logged in, go to lobby directly
                this.hideAuthLoading();

                // IMPORTANT: Do NOT force navigate to '/' if we are already on a deep link!
                // Let handleRouting in LobbyScene take care of it.
                this.navigateToLobby(false);
                return;
            }
        }

        // Not authenticated

        // 1. Check if we are landing on a Join URL (e.g. from QR Code)
        const currentPath = Router.getPath();

        // Regex to capture /join/CODE
        const joinMatch = currentPath.match(/^\/join\/([a-zA-Z0-9]+)\/?$/);
        if (joinMatch && joinMatch[1]) {
            const code = joinMatch[1];
            console.log("🚀 [LoginScene] Detected entry via Join URL:", code);
            console.log("Saving pending join code to localStorage before login redirect.");
            localStorage.setItem('pendingJoinRoomCode', code);
        }

        // 2. Enforce Redirect to /login
        if (currentPath !== '/login' && !currentPath.startsWith('/login')) {
            console.log("Redirecting unauthenticated user to /login from:", currentPath);
            Router.navigate('/login');
        }

        this.showLoginUI();

        // Listen for route changes
        window.addEventListener('popstate', () => this.handleRouting());

        // Listen for UI re-renders (on language change)
        window.addEventListener('loginUIReRendered', () => {
            const oldEmail = (document.getElementById('login-email') as HTMLInputElement)?.value;
            const oldPass = (document.getElementById('login-password') as HTMLInputElement)?.value;

            this.loginUI = document.getElementById('login-ui');
            this.setupEventListeners();

            // Re-apply values
            const emailInput = document.getElementById('login-email') as HTMLInputElement;
            const passInput = document.getElementById('login-password') as HTMLInputElement;
            if (emailInput && oldEmail) emailInput.value = oldEmail;
            if (passInput && oldPass) passInput.value = oldPass;
        });
    }

    initializeUI() {
        LoginUI.render();
        this.loginUI = document.getElementById('login-ui');

        // Inject shake animation CSS
        if (!document.getElementById('login-shake-style')) {
            const style = document.createElement('style');
            style.id = 'login-shake-style';
            style.innerHTML = `
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    20% { transform: translateX(-6px); }
                    40% { transform: translateX(6px); }
                    60% { transform: translateX(-4px); }
                    80% { transform: translateX(4px); }
                }
            `;
            document.head.appendChild(style);
        }
    }

    setupEventListeners() {
        // Login Form Submit
        const loginForm = document.getElementById('login-form');
        const loginBtn = document.getElementById('login-btn');
        const googleLoginBtn = document.getElementById('google-login-btn');
        const registerLink = document.getElementById('register-link');
        const passwordToggle = document.getElementById('password-toggle');
        const passwordInput = document.getElementById('login-password') as HTMLInputElement;

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        if (loginBtn) {
            loginBtn.onclick = (e) => {
                e.preventDefault();
                this.handleLogin();
            };
        }

        if (googleLoginBtn) {
            googleLoginBtn.onclick = () => {
                this.handleGoogleLogin();
            };
        }

        if (registerLink) {
            registerLink.onclick = (e) => {
                e.preventDefault();
                window.location.href = 'https://gameforsmart2026.vercel.app/auth/register';
            };
        }

        // Password visibility toggle
        if (passwordToggle && passwordInput) {
            passwordToggle.onclick = () => {
                const type = passwordInput.type === 'password' ? 'text' : 'password';
                passwordInput.type = type;
                const icon = passwordToggle.querySelector('span');
                if (icon) {
                    icon.textContent = type === 'password' ? 'visibility_off' : 'visibility';
                }
            };
        }

        // Clear error highlight when user starts typing
        const emailInput = document.getElementById('login-email') as HTMLInputElement;
        if (emailInput) {
            emailInput.addEventListener('input', () => this.clearFieldError('email'));
        }
        if (passwordInput) {
            passwordInput.addEventListener('input', () => this.clearFieldError('password'));
        }

        // Language Switchers
        document.querySelectorAll('.lang-switch-btn').forEach(btn => {
            (btn as HTMLElement).onclick = (e) => {
                e.preventDefault();
                const lang = btn.getAttribute('data-lang') as 'en' | 'id';
                if (lang) i18n.setLanguage(lang);
            };
        });
    }

    async handleLogin() {
        if (this.isLoading) return;

        const emailInput = document.getElementById('login-email') as HTMLInputElement;
        const passwordInput = document.getElementById('login-password') as HTMLInputElement;

        const identifier = emailInput?.value?.trim();
        const password = passwordInput?.value;

        // Reset all errors
        this.clearAllErrors();

        let hasError = false;

        // Validate: email/username
        if (!identifier) {
            this.showFieldError('email', i18n.t('login.errors.required'));
            hasError = true;
        } else if (identifier.includes('@')) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(identifier)) {
                this.showFieldError('email', i18n.t('login.errors.invalid_email'));
                hasError = true;
            }
        }

        // Validate: password
        if (!password) {
            this.showFieldError('password', i18n.t('login.errors.required'));
            hasError = true;
        } else if (password.length < 6) {
            this.showFieldError('password', i18n.t('login.errors.min_password'));
            hasError = true;
        }

        if (hasError) return;

        // Show loading state
        this.setLoadingState(true, i18n.t('login.alerts.logging_in'));

        // Attempt login with Supabase
        const result = await authService.loginWithEmailOrUsername(identifier, password);

        this.setLoadingState(false);

        if (result.success && result.profile) {
            this.showToast(i18n.t('login.alerts.welcome').replace('{name}', result.profile.username || ''), 'success');
            console.log('Login successful:', result.profile.username);
            setTimeout(() => this.navigateToLobby(), 800);
        } else {
            // Map server errors to friendly messages and show as general error
            const friendlyError = this.mapErrorMessage(result.error || 'Login failed');
            this.showGeneralError(friendlyError);
        }
    }

    async handleGoogleLogin() {
        if (this.isLoading) return;
        console.log('Google Login initiated');
        this.showToast(i18n.t('login.alerts.redirecting_google'), 'info');
        this.setLoadingState(true, i18n.t('login.alerts.redirecting_google'));
        const result = await authService.loginWithGoogle();
        if (!result.success) {
            this.setLoadingState(false);
            const friendlyError = this.mapErrorMessage(result.error || 'Google login failed');
            this.showToast(friendlyError, 'error');
        }
    }

    setLoadingState(loading: boolean, message?: string) {
        this.isLoading = loading;
        const loginBtn = document.getElementById('login-btn');
        const googleLoginBtn = document.getElementById('google-login-btn');
        const emailInput = document.getElementById('login-email') as HTMLInputElement;
        const passwordInput = document.getElementById('login-password') as HTMLInputElement;

        if (loading) {
            if (loginBtn) {
                loginBtn.innerHTML = `<span class="animate-pulse">${message || 'LOGGING IN...'}</span>`;
                loginBtn.setAttribute('disabled', 'true');
                loginBtn.classList.add('opacity-50', 'cursor-not-allowed');
            }
            if (googleLoginBtn) {
                googleLoginBtn.setAttribute('disabled', 'true');
                googleLoginBtn.classList.add('opacity-50', 'cursor-not-allowed');
            }
            if (emailInput) emailInput.disabled = true;
            if (passwordInput) passwordInput.disabled = true;
        } else {
            if (loginBtn) {
                loginBtn.innerHTML = `<span class="material-symbols-outlined">login</span> ${i18n.t('login.login_btn')}`;
                loginBtn.removeAttribute('disabled');
                loginBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            }
            if (googleLoginBtn) {
                googleLoginBtn.removeAttribute('disabled');
                googleLoginBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            }
            if (emailInput) emailInput.disabled = false;
            if (passwordInput) passwordInput.disabled = false;
        }
    }

    navigateToLobby(shouldNavigateToRoot: boolean = true) {
        TransitionManager.transitionTo(() => {
            const pendingCode = localStorage.getItem('pendingJoinRoomCode');
            let path = '/';

            if (pendingCode && pendingCode.trim().length > 0) {
                const cleanCode = pendingCode.trim();
                console.log("🚀 [LoginScene] Restoring pending join:", cleanCode);
                path = `/join/${cleanCode}`;
            } else if (!shouldNavigateToRoot) {
                path = Router.getPath();
                if (path === '/login') path = '/';
            }

            this.hideLoginUI();
            
            // Full reload to bootstrap LobbyManager cleanly
            window.location.href = path;
        });
    }

    /** Map Supabase error messages to user-friendly messages using i18n */
    mapErrorMessage(error: string): string {
        if (error.toLowerCase().includes('invalid login credentials')) {
            return i18n.t('login.errors.invalid_login');
        }
        
        const errorMap: Record<string, string> = {
            'Email not confirmed': i18n.getLanguage() === 'id' ? 'Email belum dikonfirmasi, periksa kotak masuk Anda' : 'Email not verified, check your inbox',
            'User not found': i18n.getLanguage() === 'id' ? 'Akun tidak ditemukan' : 'Account not found',
            'Username not found': i18n.getLanguage() === 'id' ? 'Nama pengguna tidak ditemukan' : 'Username not found',
            'Profile not found': i18n.getLanguage() === 'id' ? 'Profil tidak ditemukan, hubungi admin' : 'Profile not found, contact admin',
            'Your account has been blocked': i18n.getLanguage() === 'id' ? 'Akun Anda telah diblokir' : 'Your account has been blocked',
            'Login failed': i18n.getLanguage() === 'id' ? 'Gagal masuk, coba lagi' : 'Login failed, try again',
            'Google login failed': i18n.getLanguage() === 'id' ? 'Gagal masuk dengan Google, coba lagi' : 'Google login failed, try again',
            'No session found': i18n.getLanguage() === 'id' ? 'Sesi berakhir, silakan masuk kembali' : 'Session expired, please login again',
            'An unexpected error occurred': i18n.getLanguage() === 'id' ? 'Terjadi kesalahan, coba lagi nanti' : 'Something went wrong, try again later',
            'Too many requests': i18n.getLanguage() === 'id' ? 'Terlalu banyak percobaan, silakan tunggu' : 'Too many attempts, please wait',
        };

        // Check for partial matches
        for (const [key, value] of Object.entries(errorMap)) {
            if (error.toLowerCase().includes(key.toLowerCase())) {
                return value;
            }
        }

        return error; // Fallback to original message
    }

    /** Show inline error below a specific field */
    showFieldError(field: 'email' | 'password', message: string) {
        const input = document.getElementById(field === 'email' ? 'login-email' : 'login-password') as HTMLInputElement;
        const errorEl = document.getElementById(`${field}-error`);

        if (input) {
            input.classList.add('!border-red-500');
            input.classList.add('animate-[shake_0.4s_ease-in-out]');
            setTimeout(() => input.classList.remove('animate-[shake_0.4s_ease-in-out]'), 400);
        }

        if (errorEl) {
            const textSpan = errorEl.querySelector('span:last-child');
            if (textSpan) textSpan.textContent = message;
            errorEl.classList.remove('hidden');
        }
    }

    /** Clear error from a specific field */
    clearFieldError(field: 'email' | 'password') {
        const input = document.getElementById(field === 'email' ? 'login-email' : 'login-password') as HTMLInputElement;
        const errorEl = document.getElementById(`${field}-error`);

        if (input) {
            input.classList.remove('!border-red-500');
        }
        if (errorEl) {
            errorEl.classList.add('hidden');
        }
    }

    /** Clear all field errors and general error */
    clearAllErrors() {
        this.clearFieldError('email');
        this.clearFieldError('password');
        const generalError = document.getElementById('login-error');
        if (generalError) generalError.classList.add('hidden');
    }

    /** Show general error banner (for server errors) */
    showGeneralError(message: string) {
        const errorEl = document.getElementById('login-error');
        const textEl = document.getElementById('login-error-text');
        if (errorEl && textEl) {
            textEl.textContent = message;
            errorEl.classList.remove('hidden');
        }
    }

    /** Show clean toast notification */
    showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
        // Create or get toast container
        let container = document.getElementById('login-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'login-toast-container';
            container.className = 'fixed top-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-[9999] pointer-events-none';
            document.body.appendChild(container);
        }

        // Config per type
        const config = {
            success: {
                icon: 'check_circle',
                iconColor: 'text-[#FEFF9F]',
                bg: 'bg-[#2d5a30]/95',
                border: 'border-[#A0D683]/50',
            },
            error: {
                icon: 'error',
                iconColor: 'text-red-100',
                bg: 'bg-red-600/90',
                border: 'border-red-400/50',
            },
            info: {
                icon: 'info',
                iconColor: 'text-[#FEFF9F]',
                bg: 'bg-[#5DA563]/95',
                border: 'border-[#D3EE98]/50',
            },
        }[type];

        const toast = document.createElement('div');
        toast.className = `
            flex items-center gap-3 px-5 py-3.5 rounded-xl
            border ${config.bg} ${config.border}
            backdrop-blur-xl
            transform -translate-y-3 opacity-0
            transition-all duration-300 ease-out
            pointer-events-auto cursor-pointer
            max-w-[90vw] md:max-w-[400px]
        `;

        toast.innerHTML = `
            <span class="material-symbols-outlined ${config.iconColor} text-xl shrink-0" style="font-variation-settings: 'FILL' 1;">${config.icon}</span>
            <span class="text-white/90 font-['Retro_Gaming'] text-[9px] md:text-[10px] leading-relaxed flex-1">${message}</span>
        `;

        container.appendChild(toast);

        // Click to dismiss
        toast.onclick = () => dismissToast();

        // Animate in
        requestAnimationFrame(() => {
            toast.classList.remove('-translate-y-3', 'opacity-0');
            toast.classList.add('translate-y-0', 'opacity-100');
        });

        // Auto dismiss
        const dismissToast = () => {
            toast.classList.remove('translate-y-0', 'opacity-100');
            toast.classList.add('-translate-y-3', 'opacity-0');
            setTimeout(() => {
                if (container?.contains(toast)) {
                    container.removeChild(toast);
                }
            }, 300);
        };

        const duration = type === 'success' ? 3000 : type === 'error' ? 5000 : 3000;
        setTimeout(dismissToast, duration);
    }

    /** @deprecated Use showToast instead */
    showError(message: string) {
        this.showToast(message, 'error');
    }

    handleRouting() {
        const path = Router.getPath();

        if (path === '/login') {
            this.showLoginUI();
        }
    }

    showLoginUI() {
        if (this.loginUI) {
            this.loginUI.classList.remove('hidden');
        }
        // Hide lobby UI if visible
        const lobbyUI = document.getElementById('lobby-ui');
        if (lobbyUI) {
            lobbyUI.classList.add('hidden');
        }

        // Kosongkan input form login
        const emailInput = document.getElementById('login-email') as HTMLInputElement;
        const passwordInput = document.getElementById('login-password') as HTMLInputElement;
        if (emailInput) emailInput.value = '';
        if (passwordInput) passwordInput.value = '';

        // Sembunyikan error messages
        this.clearAllErrors();
    }

    hideLoginUI() {
        if (this.loginUI) {
            this.loginUI.classList.add('hidden');
        }
    }

    showAuthLoading(message?: string) {
        // Hide login UI to prevent flash
        this.hideLoginUI();

        const overlay = document.getElementById('auth-loading-overlay');
        if (overlay) {
            overlay.classList.remove('hidden');
        }
        const loadingText = document.getElementById('auth-loading-text');
        if (loadingText && message) {
            loadingText.textContent = message;
        }
    }

    hideAuthLoading() {
        const overlay = document.getElementById('auth-loading-overlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }
    }
}
