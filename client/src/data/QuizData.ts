import { supabase } from '../lib/supabase';

export interface Quiz {
    id: string;
    title: string;
    description: string;
    category: string;
    language: string;
    image_url: string | null;
    cover_image: string | null;
    is_public: boolean;
    creator_id: string;
    questions: any[];
    created_at: string;
    updated_at: string;
    favorite: any[];
    status: string;
    played: number;
    questionCount?: number; // Computed from questions array length
}

// --- SUPABASE FUNCTIONS ---

/**
 * Fetch a single quiz by ID from Supabase.
 */
export async function fetchQuizById(id: string): Promise<Quiz | null> {
    try {
        const { data, error } = await supabase
            .from('quizzes')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) {
            console.error('Error fetching quiz by ID:', error);
            return null;
        }

        return {
            id: data.id,
            title: data.title || 'Untitled Quiz',
            description: data.description || '',
            category: formatCategory(data.category || 'general'),
            language: data.language || 'id',
            image_url: data.image_url || null,
            cover_image: data.cover_image || null,
            is_public: data.is_public ?? true,
            creator_id: data.creator_id,
            questions: data.questions || [],
            created_at: data.created_at,
            updated_at: data.updated_at,
            favorite: data.favorite || [],
            status: data.status || 'active',
            played: data.played || 0,
            questionCount: Array.isArray(data.questions) ? data.questions.length : 0,
        };
    } catch (err) {
        console.error('Unexpected error fetching quiz:', err);
        return null;
    }
}

/**
 * Fetch all quizzes from Supabase `quizzes` table.
 * Only fetches public, non-hidden, non-deleted, active quizzes.
 */
export async function fetchQuizzesFromSupabase(): Promise<Quiz[]> {
    try {
        const { data, error } = await supabase
            .from('quizzes')
            .select('id, title, description, category, language, image_url, cover_image, is_public, creator_id, questions, created_at, updated_at, favorite, status, played')
            .eq('is_public', true)
            .eq('is_hidden', false)
            .eq('status', 'active')
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching quizzes from Supabase:', error);
            return [];
        }

        if (!data || data.length === 0) {
            console.warn('No quizzes found in Supabase.');
            return [];
        }

        // Map Supabase data to Quiz interface
        const quizzes: Quiz[] = data.map((row: any) => ({
            id: row.id,
            title: row.title || 'Untitled Quiz',
            description: row.description || '',
            category: formatCategory(row.category || 'general'),
            language: row.language || 'id',
            image_url: row.image_url || null,
            cover_image: row.cover_image || null,
            is_public: row.is_public ?? true,
            creator_id: row.creator_id,
            questions: row.questions || [],
            created_at: row.created_at,
            updated_at: row.updated_at,
            favorite: row.favorite || [],
            status: row.status || 'active',
            played: row.played || 0,
            questionCount: Array.isArray(row.questions) ? row.questions.length : 0,
        }));

        console.log(`Loaded ${quizzes.length} quizzes from Supabase`);
        return quizzes;

    } catch (err) {
        console.error('Unexpected error fetching quizzes:', err);
        return [];
    }
}

/**
 * Options for server-side paginated quiz fetching.
 */
export interface PaginatedQuizOptions {
    page: number;
    limit: number;
    search?: string;
    category?: string;
    favoriteIds?: string[];
    creatorId?: string;
}

/**
 * Result from a paginated quiz fetch.
 */
export interface PaginatedQuizResult {
    quizzes: Quiz[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
}

/**
 * Fetch quizzes with server-side offset pagination.
 * Data is fetched per page from Supabase using `.range()`.
 */
export async function fetchQuizzesPaginated(options: PaginatedQuizOptions): Promise<PaginatedQuizResult> {
    const { page, limit, search, category, favoriteIds, creatorId } = options;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    try {
        // Build the query with count
        let query = supabase
            .from('quizzes')
            .select('id, title, description, category, language, image_url, cover_image, is_public, creator_id, questions, created_at, updated_at, favorite, status, played', { count: 'exact' })
            .eq('is_public', true)
            .eq('is_hidden', false)
            .eq('status', 'active')
            .is('deleted_at', null);

        // Apply search filter (case-insensitive via ilike)
        if (search && search.trim()) {
            query = query.ilike('title', `%${search.trim()}%`);
        }

        // Apply category filter (match raw category from DB)
        if (category && category.trim()) {
            query = query.ilike('category', category.trim());
        }

        // Apply favorite filter (only show quizzes in the favorite list)
        if (favoriteIds && favoriteIds.length > 0) {
            query = query.in('id', favoriteIds);
        }

        // Apply creator filter (my quizzes)
        if (creatorId) {
            query = query.eq('creator_id', creatorId);
        }

        // Order and paginate
        query = query.order('created_at', { ascending: false }).range(from, to);

        const { data, error, count } = await query;

        if (error) {
            console.error('Error fetching paginated quizzes:', error);
            return { quizzes: [], totalCount: 0, totalPages: 0, currentPage: page };
        }

        const totalCount = count || 0;
        const totalPages = Math.ceil(totalCount / limit);

        const quizzes: Quiz[] = (data || []).map((row: any) => ({
            id: row.id,
            title: row.title || 'Untitled Quiz',
            description: row.description || '',
            category: formatCategory(row.category || 'general'),
            language: row.language || 'id',
            image_url: row.image_url || null,
            cover_image: row.cover_image || null,
            is_public: row.is_public ?? true,
            creator_id: row.creator_id,
            questions: row.questions || [],
            created_at: row.created_at,
            updated_at: row.updated_at,
            favorite: row.favorite || [],
            status: row.status || 'active',
            played: row.played || 0,
            questionCount: Array.isArray(row.questions) ? row.questions.length : 0,
        }));

        console.log(`[Paginated] Page ${page}/${totalPages}, showing ${quizzes.length} of ${totalCount} quizzes`);
        return { quizzes, totalCount, totalPages, currentPage: page };

    } catch (err) {
        console.error('Unexpected error fetching paginated quizzes:', err);
        return { quizzes: [], totalCount: 0, totalPages: 0, currentPage: page };
    }
}

/**
 * Fetch distinct categories from Supabase `quizzes` table.
 * Only considers public, non-hidden, non-deleted, active quizzes.
 */
export async function fetchCategoriesFromSupabase(): Promise<string[]> {
    try {
        const { data, error } = await supabase
            .from('quizzes')
            .select('category')
            .eq('is_public', true)
            .eq('is_hidden', false)
            .eq('status', 'active')
            .is('deleted_at', null);

        if (error || !data) {
            console.error('Error fetching categories:', error);
            return [];
        }

        const categories = new Set(
            data
                .map((row: any) => formatCategory(row.category || 'general'))
                .filter((cat: string) => cat.length > 0)
        );

        return Array.from(categories).sort();

    } catch (err) {
        console.error('Unexpected error fetching categories:', err);
        return [];
    }
}

/**
 * Fetch categories with both raw DB value and display label.
 * Returns array of { raw: 'math', display: 'Matematika' }.
 */
export async function fetchCategoriesWithRaw(): Promise<{ raw: string; display: string }[]> {
    try {
        const { data, error } = await supabase
            .from('quizzes')
            .select('category')
            .eq('is_public', true)
            .eq('is_hidden', false)
            .eq('status', 'active')
            .is('deleted_at', null);

        if (error || !data) {
            console.error('Error fetching categories:', error);
            return [];
        }

        const uniqueRaw = new Set(
            data.map((row: any) => (row.category || 'general').toLowerCase())
        );

        return Array.from(uniqueRaw)
            .map(raw => ({ raw, display: formatCategory(raw) }))
            .sort((a, b) => a.display.localeCompare(b.display));

    } catch (err) {
        console.error('Unexpected error fetching categories:', err);
        return [];
    }
}

/**
 * Format category string from Supabase (lowercase English) to display label (Indonesian).
 * e.g., "math" -> "Matematika", "technology" -> "Teknologi"
 */
function formatCategory(category: string): string {
    const categoryMap: Record<string, string> = {
        'math': 'Matematika',
        'technology': 'Teknologi',
        'science': 'Sains',
        'general': 'Umum',
        'history': 'Sejarah',
        'sports': 'Olahraga',
        'business': 'Bisnis',
    };

    const lower = category.toLowerCase();
    if (categoryMap[lower]) {
        return categoryMap[lower];
    }

    // Capitalize first letter for unknown categories
    return category.charAt(0).toUpperCase() + category.slice(1);
}


/**
 * Toggle favorite quiz for a user.
 * Adds or removes the quiz ID from the user's `favorite_quiz` JSONB array in `profiles` table.
 * Supports JSON structure: {"favorites": ["id1", "id2"]}
 */
export async function toggleFavoriteInSupabase(quizId: string, userId: string): Promise<string[]> {
    try {
        // 1. Fetch current user profile favorites
        const { data: profile, error: fetchError } = await supabase
            .from('profiles')
            .select('favorite_quiz')
            .eq('id', userId)
            .single();

        if (fetchError || !profile) {
            console.error('Error fetching user profile favorites:', fetchError);
            return [];
        }

        // Handle JSON structure: {"favorites": []} or direct array []
        let favorites: string[] = [];
        let isObjectStructure = false;

        if (profile.favorite_quiz && !Array.isArray(profile.favorite_quiz) && typeof profile.favorite_quiz === 'object' && Array.isArray(profile.favorite_quiz.favorites)) {
            favorites = profile.favorite_quiz.favorites;
            isObjectStructure = true;
        } else if (Array.isArray(profile.favorite_quiz)) {
            favorites = profile.favorite_quiz;
        }

        // 2. Toggle: add or remove quizId
        if (favorites.includes(quizId)) {
            favorites = favorites.filter(id => id !== quizId);
        } else {
            favorites.push(quizId);
        }

        // 3. Prepare update data
        const updateData = isObjectStructure ? { favorites: favorites } : favorites;

        // If it was null/empty initially, we default to the object structure as seen in your screenshot
        if (!profile.favorite_quiz) {
            // Defaulting to object structure as per user data evidence
            // updateData = { favorites: favorites }; -> actually let's stick to what we found or default to object
        }

        // CORRECTION: Based on screenshot, all users seem to have {"favorites": []}.
        // So we should enforce this structure to be safe and consistent.
        const finalUpdateData = { favorites: favorites };

        // 4. Update in Supabase
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ favorite_quiz: finalUpdateData })
            .eq('id', userId);

        if (updateError) {
            console.error('Error updating profile favorites:', updateError);
            return [];
        }

        console.log(`Toggled favorite quiz ${quizId} for user ${userId}. New favorites:`, favorites);
        return favorites;

    } catch (err) {
        console.error('Unexpected error toggling favorite:', err);
        return [];
    }
}

/**
 * Fetch favorite quiz IDs for a specific user from `profiles` table.
 * Handles {"favorites": ["id", ...]} structure.
 */
export async function fetchUserFavorites(userId: string): Promise<string[]> {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('favorite_quiz')
            .eq('id', userId)
            .single();

        if (error || !data) {
            console.error('Error fetching user favorites:', error);
            return [];
        }

        // Check for object structure {"favorites": []}
        if (data.favorite_quiz && !Array.isArray(data.favorite_quiz) && typeof data.favorite_quiz === 'object' && Array.isArray(data.favorite_quiz.favorites)) {
            return data.favorite_quiz.favorites;
        }

        // Fallback for direct array
        return Array.isArray(data.favorite_quiz) ? data.favorite_quiz : [];
    } catch (err) {
        console.error('Unexpected error fetching user favorites:', err);
        return [];
    }
}
