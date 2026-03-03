import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Create connection to Supabase Utama (Main Data Center)
const mainUrl = process.env.SUPABASE_UTAMA_URL || process.env.SUPABASE_URL || '';
const mainKey = process.env.SUPABASE_UTAMA_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!mainUrl || !mainKey) {
    console.warn("⚠️ SUPABASE_UTAMA_URL or SUPABASE_UTAMA_KEY is not defined in .env! Backend Sync to Main Supabase might fail.");
}

export const supabaseUtama = createClient(mainUrl, mainKey);

// Create connection to Supabase B (Sessions & Participants)
const bUrl = process.env.SUPABASE_B_URL || '';
const bKey = process.env.SUPABASE_B_KEY || '';

if (!bUrl || !bKey) {
    console.warn("⚠️ SUPABASE_B_URL or SUPABASE_B_KEY is not defined in .env! Backend Sync to Supabase B might fail.");
}

export const supabaseB = createClient(bUrl, bKey);
