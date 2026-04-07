import Phaser from 'phaser';
import { TestLab } from './TestLab';

/**
 * Manager untuk menginisialisasi game khusus di halaman Test Lab.
 */
export class TestLabManager {
    private game: Phaser.Game | null = null;

    init() {
        // 1. Sembunyikan semua UI global (Login, Lobby, dll) agar bersih
        const uis = ['login-ui', 'lobby-ui', 'create-room-overlay', 'quiz-selection-overlay', 'waiting-room-overlay'];
        uis.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add('hidden');
        });

        // 2. Buat container untuk game jika belum ada
        let gameContainer = document.getElementById('game-container');
        if (!gameContainer) {
            gameContainer = document.createElement('div');
            gameContainer.id = 'game-container';
            document.body.appendChild(gameContainer);
        }
        gameContainer.classList.remove('hidden');

        // 3. Konfigurasi Phaser Minimalis
        const config: Phaser.Types.Core.GameConfig = {
            type: Phaser.AUTO,
            width: 160,  // Ukuran kecil sesuai map 10x10 tile (160px)
            height: 200, // Dilebihkan sedikit untuk teks bantuan
            parent: 'game-container',
            pixelArt: true,
            backgroundColor: '#222222',
            scene: [TestLab],
            scale: {
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH
            }
        };

        // 4. Jalankan Game
        this.game = new Phaser.Game(config);
        
        console.log("🚀 Test Lab Manager Berhasil dijalankan!");
    }
}
