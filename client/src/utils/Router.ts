
export class Router {
    /**
     * Navigate to a new path (updates URL properly)
     * @param path e.g., '/waiting', '/game', '/'
     */
    static navigate(path: string) {
        window.history.pushState({}, '', path);
    }

    /**
     * Replace current path (good for initial redirects)
     */
    static replace(path: string) {
        window.history.replaceState({}, '', path);
    }

    /**
     * Get current clean path
     */
    static getPath(): string {
        return window.location.pathname;
    }
}
