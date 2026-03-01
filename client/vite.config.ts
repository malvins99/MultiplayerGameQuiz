import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [],
    envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
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
