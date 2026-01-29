# Panduan Deployment: Legends of Learning

Game ini terdiri dari dua bagian yang harus di-deploy secara terpisah:
1.  **Frontend (Client)**: Di-deploy ke **Vercel**.
2.  **Backend (Server)**: Di-deploy ke **Render**.

---

## Bagian 1: Deploy Server ke Render

Server harus di-deploy terlebih dahulu agar kita mendapatkan URL WebSocket untuk Client.

1.  **Push kode Anda ke GitHub** (pastikan file `render.yaml` yang baru dibuat sudah masuk).
2.  Buka [Dashboard Render](https://dashboard.render.com/).
3.  Klik **New +** dan pilih **Blueprints**.
4.  Hubungkan akun GitHub Anda dan pilih repositori `Legends of Learning`.
5.  Render akan mendeteksi file `render.yaml`.
6.  Klik **Apply** / **Create Service**.
7.  Tunggu hingga proses deploy selesai (bisa memakan waktu beberapa menit).
8.  Setelah selesai, salin URL server Anda (contoh: `https://lol-server-xxxx.onrender.com`).
    *   **Penting:** Hapus `https://` dan ganti dengan `wss://` untuk penggunaan di Client nanti (atau biarkan client yang mengurusnya, tapi kita butuh URL ini).

---

## Bagian 2: Deploy Client ke Vercel

Setelah Server aktif, sekarang kita deploy Client.

1.  Buka [Dashboard Vercel](https://vercel.com/dashboard).
2.  Klik **Add New...** > **Project**.
3.  Import repositori `Legends of Learning`.
4.  **PENTING: Konfigurasi Project**
    *   **Framework Preset**: Pilih `Vite` (biasanya otomatis terdeteksi).
    *   **Root Directory**: Klik `Edit` dan pilih folder `client`. **(Jangan gunakan root folder, harus folder 'client')**
    *   **Environment Variables**:
        *   Klik menu ini untuk membuka.
        *   Masukkan Key: `VITE_SERVER_URL`
        *   Masukkan Value: URL server Render Anda (contoh: `wss://lol-server-xxxx.onrender.com`). **Pastikan menggunakan wss://**.
5.  Klik **Deploy**.
6.  Tunggu hingga selesai.

---

## Cek Hasil

1.  Buka URL Vercel yang sudah jadi (contoh: `https://lol-client.vercel.app`).
2.  Buka Console Browser (F12) untuk memastikan client berhasil terhubung ke server (`Connecting to Colyseus server: wss://...`).
3.  Coba buat Room.

**Catatan:** Render Free Tier akan "tidur" jika tidak digunakan selama 15 menit. Saat pertama kali akses setelah tidur, mungkin perlu waktu 30-50 detik agar server bangun kembali.
