import { supabase, Profile, USER_SESSION_KEY, USER_PROFILE_KEY } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

export interface AuthResult {
    success: boolean;
    error?: string;
    user?: User;
    profile?: Profile;
}

export class AuthService {
    private static instance: AuthService;
    private currentUser: User | null = null;
    private currentProfile: Profile | null = null;

    private constructor() {
        // Initialize from stored session
        this.loadStoredSession();

        // Listen for auth state changes
        supabase.auth.onAuthStateChange((event, session) => {
            console.log('Auth state changed:', event, session?.user?.email);
            if (session?.user) {
                this.currentUser = session.user;
                this.saveSession(session);
            } else if (event === 'SIGNED_OUT') {
                this.currentUser = null;
                this.currentProfile = null;
                this.clearSession();
            }
        });
    }

    static getInstance(): AuthService {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }

    private loadStoredSession(): void {
        try {
            const storedProfile = localStorage.getItem(USER_PROFILE_KEY);
            if (storedProfile) {
                this.currentProfile = JSON.parse(storedProfile);
            }
        } catch (error) {
            console.error('Error loading stored session:', error);
        }
    }

    private saveSession(session: Session): void {
        try {
            localStorage.setItem(USER_SESSION_KEY, JSON.stringify({
                access_token: session.access_token,
                refresh_token: session.refresh_token,
                expires_at: session.expires_at
            }));
        } catch (error) {
            console.error('Error saving session:', error);
        }
    }

    private saveProfile(profile: Profile): void {
        try {
            localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
            this.currentProfile = profile;
        } catch (error) {
            console.error('Error saving profile:', error);
        }
    }

    private clearSession(): void {
        localStorage.removeItem(USER_SESSION_KEY);
        localStorage.removeItem(USER_PROFILE_KEY);
    }

    /**
     * Login with email/username and password
     * Supports both email and username login
     */
    async loginWithEmailOrUsername(identifier: string, password: string): Promise<AuthResult> {
        try {
            let email = identifier;

            // Check if identifier is username (not email format)
            const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);

            if (!isEmail) {
                // It's a username, look up the email from profiles table
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('email')
                    .eq('username', identifier.toLowerCase())
                    .is('deleted_at', null)
                    .single();

                if (profileError || !profile) {
                    return {
                        success: false,
                        error: 'Username not found'
                    };
                }

                email = profile.email;
            }

            // Sign in with Supabase Auth
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) {
                console.error('Login error:', error);
                return {
                    success: false,
                    error: error.message
                };
            }

            if (!data.user) {
                return {
                    success: false,
                    error: 'Login failed'
                };
            }

            this.currentUser = data.user;

            // Fetch user profile
            const profile = await this.fetchUserProfile(data.user.id);

            if (!profile) {
                return {
                    success: false,
                    error: 'Profile not found'
                };
            }

            // Check if user is blocked
            if (profile.is_blocked) {
                await this.signOut();
                return {
                    success: false,
                    error: 'Your account has been blocked'
                };
            }

            // Update last_active
            await this.updateLastActive(profile.id);

            return {
                success: true,
                user: data.user,
                profile: profile
            };
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'An unexpected error occurred'
            };
        }
    }

    /**
     * Login with Google OAuth
     */
    async loginWithGoogle(): Promise<AuthResult> {
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin + '/login',
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent'
                    }
                }
            });

            if (error) {
                console.error('Google login error:', error);
                return {
                    success: false,
                    error: error.message
                };
            }

            // The actual auth will be handled by the callback
            // Return success as the redirect will happen
            return {
                success: true
            };
        } catch (error) {
            console.error('Google login error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'An unexpected error occurred'
            };
        }
    }

    /**
     * Handle OAuth callback after redirect
     */
    async handleAuthCallback(): Promise<AuthResult> {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error) {
                console.error('Auth callback error:', error);
                return {
                    success: false,
                    error: error.message
                };
            }

            if (!session?.user) {
                return {
                    success: false,
                    error: 'No session found'
                };
            }

            this.currentUser = session.user;

            // Fetch or create profile
            let profile = await this.fetchUserProfile(session.user.id);

            if (!profile) {
                // Profile doesn't exist yet, it should be created by database trigger
                // Wait a moment and try again
                await new Promise(resolve => setTimeout(resolve, 1000));
                profile = await this.fetchUserProfile(session.user.id);
            }

            if (!profile) {
                return {
                    success: false,
                    error: 'Profile not found. Please contact support.'
                };
            }

            // Check if user is blocked
            if (profile.is_blocked) {
                await this.signOut();
                return {
                    success: false,
                    error: 'Your account has been blocked'
                };
            }

            // Update last_active
            await this.updateLastActive(profile.id);

            return {
                success: true,
                user: session.user,
                profile: profile
            };
        } catch (error) {
            console.error('Auth callback error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'An unexpected error occurred'
            };
        }
    }

    /**
     * Fetch user profile from profiles table
     */
    private async fetchUserProfile(authUserId: string): Promise<Profile | null> {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('auth_user_id', authUserId)
                .is('deleted_at', null)
                .single();

            if (error) {
                console.error('Error fetching profile:', error);
                return null;
            }

            if (data) {
                this.saveProfile(data as Profile);
            }

            return data as Profile;
        } catch (error) {
            console.error('Error fetching profile:', error);
            return null;
        }
    }

    /**
     * Update last_active timestamp
     */
    private async updateLastActive(profileId: string): Promise<void> {
        try {
            await supabase
                .from('profiles')
                .update({ last_active: new Date().toISOString() })
                .eq('id', profileId);
        } catch (error) {
            console.error('Error updating last_active:', error);
        }
    }

    /**
     * Sign out the current user
     */
    async signOut(): Promise<void> {
        try {
            await supabase.auth.signOut();
            this.currentUser = null;
            this.currentProfile = null;
            this.clearSession();
        } catch (error) {
            console.error('Sign out error:', error);
        }
    }

    /**
     * Get current user
     */
    getCurrentUser(): User | null {
        return this.currentUser;
    }

    /**
     * Get current profile
     */
    getCurrentProfile(): Profile | null {
        return this.currentProfile;
    }

    /**
     * Check if user is authenticated
     */
    async isAuthenticated(): Promise<boolean> {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            return !!session;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get stored profile (synchronous)
     */
    getStoredProfile(): Profile | null {
        if (this.currentProfile) {
            return this.currentProfile;
        }

        try {
            const stored = localStorage.getItem(USER_PROFILE_KEY);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (error) {
            console.error('Error getting stored profile:', error);
        }

        return null;
    }
}

// Export singleton instance
export const authService = AuthService.getInstance();
