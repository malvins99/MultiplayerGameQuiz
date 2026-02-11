import Phaser from 'phaser';
import { Router } from '../utils/Router';
import { TransitionManager } from '../utils/TransitionManager';
import { authService } from '../services/AuthService';

export class LoginScene extends Phaser.Scene {
    loginUI: HTMLElement | null = null;
    isLoading: boolean = false;

    constructor() {
        super('LoginScene');
    }

    async create() {
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
                this.hideLoginUI();
                this.hideAuthLoading();
                this.scene.start('LobbyScene');
                return;
            }
        }

        // Not authenticated - always show login
        Router.navigate('/login');
        this.showLoginUI();

        // Listen for route changes
        window.addEventListener('popstate', () => this.handleRouting());
    }

    initializeUI() {
        this.loginUI = document.getElementById('login-ui');
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
    }

    async handleLogin() {
        if (this.isLoading) return;

        const emailInput = document.getElementById('login-email') as HTMLInputElement;
        const passwordInput = document.getElementById('login-password') as HTMLInputElement;

        const identifier = emailInput?.value?.trim();
        const password = passwordInput?.value;

        if (!identifier || !password) {
            this.showError('Please fill in all fields');
            return;
        }

        // Validate email format or username (alphanumeric)
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
        const isUsername = /^[a-zA-Z0-9_]{3,20}$/.test(identifier);

        if (!isEmail && !isUsername) {
            this.showError('Please enter a valid email or username');
            return;
        }

        if (password.length < 6) {
            this.showError('Password must be at least 6 characters');
            return;
        }

        // Show loading state
        this.setLoadingState(true, 'Logging in...');

        // Attempt login with Supabase
        const result = await authService.loginWithEmailOrUsername(identifier, password);

        this.setLoadingState(false);

        if (result.success && result.profile) {
            console.log('Login successful:', result.profile.username);

            // Navigate to lobby
            this.navigateToLobby();
        } else {
            this.showError(result.error || 'Login failed');
        }
    }

    async handleGoogleLogin() {
        if (this.isLoading) return;

        console.log('Google Login initiated');

        this.setLoadingState(true, 'Redirecting to Google...');

        const result = await authService.loginWithGoogle();

        if (!result.success) {
            this.setLoadingState(false);
            this.showError(result.error || 'Google login failed');
        }
        // If successful, the page will redirect to Google
    }

    setLoadingState(loading: boolean, message?: string) {
        this.isLoading = loading;

        const loginBtn = document.getElementById('login-btn');
        const googleLoginBtn = document.getElementById('google-login-btn');
        const emailInput = document.getElementById('login-email') as HTMLInputElement;
        const passwordInput = document.getElementById('login-password') as HTMLInputElement;

        if (loading) {
            if (loginBtn) {
                loginBtn.innerHTML = `
                    <span class="animate-pulse">${message || 'LOGGING IN...'}</span>
                `;
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
                loginBtn.innerHTML = `
                    <span class="material-symbols-outlined">login</span>
                    LOGIN
                `;
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

    navigateToLobby() {
        TransitionManager.transitionTo(() => {
            Router.navigate('/');
            this.hideLoginUI();
            this.scene.start('LobbyScene');
        });
    }

    showError(message: string) {
        const errorEl = document.getElementById('login-error');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.classList.remove('hidden');
            setTimeout(() => {
                errorEl.classList.add('hidden');
            }, 5000);
        }
    }

    handleRouting() {
        const path = Router.getPath();

        if (path === '/login') {
            this.showLoginUI();
            this.scene.start('LoginScene');
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

        // Sembunyikan error message jika ada
        const errorEl = document.getElementById('login-error');
        if (errorEl) errorEl.classList.add('hidden');
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
