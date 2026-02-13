
import { createClient } from '@supabase/supabase-js';

// Second Supabase configuration (for Sessions & Participants)
// In Vite, use import.meta.env. process.env might cause ReferenceError.
// Also note: Vite usually requires VITE_ prefix, but we'll use the hardcoded values as fallback since the user provided them.
const supabaseUrl = import.meta.env?.VITE_B_SUPABASE_URL || 'https://ctmvusliphqmoprxgpto.supabase.co';
const supabaseAnonKey = import.meta.env?.VITE_B_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0bXZ1c2xpcGhxbW9wcnhncHRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4NDc2MDcsImV4cCI6MjA4NjQyMzYwN30.KmW-LWg_2PwjkR_AP6Wsk3vOfBuGkP_WoILUCKg-d04';

// Create a separate client instance
export const supabaseB = createClient(supabaseUrl, supabaseAnonKey);

export const SESSION_TABLE = 'sessions';
export const PARTICIPANT_TABLE = 'participants';
