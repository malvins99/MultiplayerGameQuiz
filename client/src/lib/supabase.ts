import { createClient } from '@supabase/supabase-js';

/**
 * Simpan access_token + refresh_token ke shared cookie (.gameforsmart.com)
 * Format: access_token|refresh_token (~1.5KB, aman di bawah batas 4KB)
 */
export function syncSessionCookie(tokens: { access_token: string; refresh_token: string } | null) {
    if (typeof document === 'undefined') return;
    const hostname = window.location.hostname;
    const isGfs = hostname.endsWith('gameforsmart.com');
    const isHttps = window.location.protocol === 'https:';

    if (!tokens) {
        // Hapus cookie
        let cookieStr = `gfs-session=; path=/; max-age=0`;
        if (isGfs) cookieStr += `; domain=.gameforsmart.com`;
        document.cookie = cookieStr;
        return;
    }

    const value = `${tokens.access_token}|${tokens.refresh_token}`;
    const parts = [
        `gfs-session=${encodeURIComponent(value)}`,
        `path=/`,
        `max-age=${60 * 60 * 24 * 365}`,
        `SameSite=Lax`,
    ];
    if (isGfs) parts.push(`domain=.gameforsmart.com`);
    if (isHttps) parts.push(`Secure`);
    document.cookie = parts.join('; ');
}

/**
 * Baca access_token + refresh_token dari shared cookie
 */
export function getSessionFromCookie(): { access_token: string; refresh_token: string } | null {
    if (typeof document === 'undefined') return null;
    const cookies = document.cookie.split('; ');
    const found = cookies.find(c => c.startsWith('gfs-session='));
    if (!found) return null;
    try {
        const eqIndex = found.indexOf('=');
        const value = decodeURIComponent(found.substring(eqIndex + 1));
        const pipeIndex = value.indexOf('|');
        if (pipeIndex === -1) return null;
        const access_token = value.substring(0, pipeIndex);
        const refresh_token = value.substring(pipeIndex + 1);
        if (!access_token || !refresh_token) return null;
        return { access_token, refresh_token };
    } catch {
        return null;
    }
}

// Supabase configuration
const supabaseUrl = import.meta.env.NEXT_PUBLIC_SUPABASE_URL || 'https://humhaknetazvqkovlxdn.supabase.co';
const supabaseAnonKey = import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1bWhha25ldGF6dnFrb3ZseGRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxOTY0ODUsImV4cCI6MjA3NDc3MjQ4NX0.LU9j-zyUOihFE-MAgXY9-cOBPiVJDGFArH5sLpmOTxw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storageKey: 'gfs-auth-token',
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
    }
});


// Profile interface based on the schema
export interface Profile {
    id: string;
    auth_user_id: string;
    username: string;
    email: string;
    fullname: string | null;
    avatar_url: string | null;
    phone: string | null;
    organization: string | null;
    birthdate: string | null;
    language: string;
    role: string;
    notifications: any;
    last_active: string;
    created_at: string;
    updated_at: string;
    favorite_quiz: any;
    is_profile_public: boolean;
    is_blocked: boolean;
    blocked_at: string | null;
    nickname: string | null;
    country_id: number | null;
    state_id: number | null;
    city_id: number | null;
    deleted_at: string | null;
    grade: string | null;
    gender: string | null;
    admin_since: string | null;
}

// User session storage key
export const USER_SESSION_KEY = 'game_user_session';
export const USER_PROFILE_KEY = 'game_user_profile';
