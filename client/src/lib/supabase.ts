import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://humhaknetazvqkovlxdn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1bWhha25ldGF6dnFrb3ZseGRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxOTY0ODUsImV4cCI6MjA3NDc3MjQ4NX0.LU9j-zyUOihFE-MAgXY9-cOBPiVJDGFArH5sLpmOTxw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
