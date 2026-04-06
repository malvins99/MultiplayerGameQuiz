import Phaser from 'phaser';

/**
 * TEST LAB: Collision Dasar (Praktek Langsung)
 * 
 * Scene ini dibuat khusus untuk mempraktekkan logika barrier 
 * yang paling sederhana tanpa fitur ribet lainnya.
 */
export class TestLab extends Phaser.Scene {
    private player!: Phaser.GameObjects.Rectangle;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private barriers: { x: number, y: number, w: number, h: number }[] = [];
    private speed: number = 1; // Kecepatan gerak (pixel per frame)

    constructor() {
        super('TestLab');
    }

    preload() {
        // 1. Muat file map JSON yang sudah kita siapkan
        // Gunakan path relatif dari index.html
        this.load.tilemapTiledJSON('map-lab', 'assets/maps/test_lab.json');

        // 2. Muat gambar tileset
        this.load.image('tileset-img', 'assets/tileset/spr_tileset_sunnysideworld_16px.png');
    }

    create() {
        // SETUP MAP
        const map = this.make.tilemap({ key: 'map-lab' });
        const tileset = map.addTilesetImage('spr_tileset_sunnysideworld_16px', 'tileset-img');

        if (tileset) {
            map.createLayer('Tile Layer 1', tileset, 0, 0);
        }

        // BACA BARRIER DARI MAP
        // Kita ambil semua objek dari layer "barrier" di Tiled
        const barrierLayer = map.getObjectLayer('barrier');
        if (barrierLayer) {
            barrierLayer.objects.forEach(obj => {
                this.barriers.push({
                    x: obj.x || 0,
                    y: obj.y || 0,
                    w: obj.width || 50,
                    h: obj.height || 50
                });
            });
        }

        // BUAT KARAKTER (Kotak Merah Simpel)
        // Kita taruh di koordinat (20, 20)
        this.player = this.add.rectangle(32, 32, 12, 12, 0xff0000);
        this.player.setOrigin(0.5);

        // SETUP INPUT KEYBOARD
        if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
        }

        // KETERANGAN DI LAYAR
        this.add.text(10, 170, 'Gunakan Panah Keyboard\nBuka Console (F12) untuk Log', {
            fontSize: '10px',
            color: '#ffffff',
            backgroundColor: '#000000'
        });

        console.log("Laboratorium Eksperimen Siap!");
        console.log("Daftar Barrier Terdeteksi:", this.barriers);
    }

    update() {
        // Tentukan posisi tujuan (dimana pemain MAU pindah)
        let targetX = this.player.x;
        let targetY = this.player.y;

        if (this.cursors.left.isDown) targetX -= this.speed;
        if (this.cursors.right.isDown) targetX += this.speed;
        if (this.cursors.up.isDown) targetY -= this.speed;
        if (this.cursors.down.isDown) targetY += this.speed;

        // --- LOGIKA BARRIER PALING SIMPEL ---

        let nabrak = false;

        // Cek ke semua daftar barrier satu per satu
        for (let b of this.barriers) {
            
            if (targetX > b.x + - 10 && //sisi kiri
                targetX < b.x + b.w + 10 && //sisi kanan
                targetY > b.y + - 10 && //sisi atas
                targetY < b.y + b.h + 10) { //sisi bawah

                nabrak = true;
                console.log(`Barrier Hit! Nabrak objek di (${b.x}, ${b.y})`);
                break; // Berhenti cek kalau sudah ketemu satu yang nabrak
            }
        }

        // --- EKSEKUSI PERGERAKAN ---

        if (!nabrak) {
            // Hanya pindahkan pemain jika TIDAK nabrak
            this.player.x = targetX;
            this.player.y = targetY;
        } else {
            // Efek visual kalau nabrak (opsional: bikin kotak bergetar sedikit)
            this.player.setFillStyle(0xffff00); // Berubah jadi kuning saat nabrak
        }

        if (!nabrak && this.player.fillColor !== 0xff0000) {
            this.player.setFillStyle(0xff0000); // Balik jadi merah kalau aman
        }
    }
}
