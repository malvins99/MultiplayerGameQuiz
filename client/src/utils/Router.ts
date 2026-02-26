
/**
 * Router — Custom client-side router untuk Phaser SPA
 * Mirip Next.js App Router, tapi ringan dan tanpa framework.
 *
 * Contoh pattern dinamis: '/host/settings/:quizId', '/host/:roomCode/leaderboard'
 */
export class Router {

    // ─────────────────────────────────────────────
    // Navigasi dasar
    // ─────────────────────────────────────────────

    /** Navigasi ke path baru (push ke history) */
    static navigate(path: string): void {
        window.history.pushState({}, '', path);
    }

    /** Ganti URL saat ini tanpa menambah history (cocok untuk redirect awal) */
    static replace(path: string): void {
        window.history.replaceState({}, '', path);
    }

    /** Ambil path URL saat ini, e.g. "/host/settings/ABC123" */
    static getPath(): string {
        return window.location.pathname;
    }

    // ─────────────────────────────────────────────
    // Dynamic route matching (seperti Next.js)
    // ─────────────────────────────────────────────

    /**
     * Cocokkan path saat ini dengan pattern.
     * Kembalikan object params jika cocok, atau null jika tidak cocok.
     *
     * @example
     * // URL saat ini: /host/settings/ABC123
     * Router.match('/host/settings/:quizId')
     * // → { quizId: 'ABC123' }
     *
     * @example
     * // URL saat ini: /host/XYZ/leaderboard
     * Router.match('/host/:roomCode/leaderboard')
     * // → { roomCode: 'XYZ' }
     */
    static match(pattern: string, path?: string): Record<string, string> | null {
        const currentPath = this.normalize(path ?? window.location.pathname);
        const normPattern = this.normalize(pattern);

        const patternParts = normPattern.split('/').filter(p => p.length > 0);
        const pathParts = currentPath.split('/').filter(p => p.length > 0);

        // Harus jumlah segmen sama
        if (patternParts.length !== pathParts.length) return null;

        const params: Record<string, string> = {};

        for (let i = 0; i < patternParts.length; i++) {
            const patternSeg = patternParts[i];
            const pathSeg = pathParts[i];

            if (patternSeg.startsWith(':')) {
                // Segmen dinamis → simpan sebagai param
                const key = patternSeg.slice(1);
                params[key] = decodeURIComponent(pathSeg); // already decoded by normalize, but safe to repeat
            } else if (patternSeg !== pathSeg) {
                // Segmen statis tidak cocok
                return null;
            }
        }

        return params;
    }

    /**
     * Ambil params dari pattern yang diketahui cocok.
     * Shorthand dari match() — kembalikan {} jika tidak cocok.
     *
     * @example
     * const { quizId } = Router.getParams('/host/settings/:quizId');
     */
    static getParams(pattern: string): Record<string, string> {
        return this.match(pattern) ?? {};
    }

    /**
     * Cek apakah URL saat ini tepat sama dengan path (tanpa parameter).
     *
     * @example
     * Router.is('/host/select-quiz') // → true / false
     */
    /**
     * Helper: Hapus trailing slash agar '/host/select-quiz/' cocok dengan '/host/select-quiz'
     * Juga men-decode URL encoded characters (misal spasi)
     */
    private static normalize(path: string): string {
        try {
            path = decodeURIComponent(path);
        } catch (e) {
            // ignore error
        }
        if (path === '/') return path;
        return path.replace(/\/+$/, '');
    }

    /**
     * Cek apakah URL saat ini tepat sama dengan path (tanpa parameter).
     *
     * @example
     * Router.is('/host/select-quiz') // → true / false
     */
    static is(path: string): boolean {
        const current = this.normalize(window.location.pathname);
        const target = this.normalize(path);
        return current === target;
    }

    /**
     * Cek apakah URL saat ini diawali dengan prefix tertentu.
     *
     * @example
     * Router.startsWith('/host') // → true untuk semua /host/...
     */
    static startsWith(prefix: string): boolean {
        const current = this.normalize(window.location.pathname);
        const target = this.normalize(prefix);
        return current.startsWith(target);
    }

    // ─────────────────────────────────────────────
    // URL Builder (kebalikan dari match)
    // ─────────────────────────────────────────────

    /**
     * Buat URL dari pattern dan params.
     *
     * @example
     * Router.build('/host/settings/:quizId', { quizId: 'ABC123' })
     * // → '/host/settings/ABC123'
     *
     * @example
     * Router.build('/host/:roomCode/leaderboard', { roomCode: 'XYZ99' })
     * // → '/host/XYZ99/leaderboard'
     */
    static build(pattern: string, params: Record<string, string> = {}): string {
        return pattern
            .split('/')
            .map(part => {
                if (part.startsWith(':')) {
                    const key = part.slice(1);
                    return encodeURIComponent(params[key] ?? '');
                }
                return part;
            })
            .join('/');
    }

    /**
     * Navigasi ke URL yang dibangun dari pattern + params.
     *
     * @example
     * Router.navigateTo('/host/settings/:quizId', { quizId: 'ABC123' })
     * // → navigasi ke /host/settings/ABC123
     */
    static navigateTo(pattern: string, params: Record<string, string> = {}): void {
        const url = this.build(pattern, params);
        this.navigate(url);
    }
}
