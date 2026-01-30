import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [],
    build: {
        outDir: '../server/public',
        emptyOutDir: true
    },
    server: {
        host: '0.0.0.0',
        port: 5173,
    },
    clearScreen: false,
});
