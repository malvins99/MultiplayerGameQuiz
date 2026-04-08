module.exports = {
  apps: [
    {
      name: "MindVenture-Server",
      // Path ke file server.js yang sudah di-build (JS bukan TS)
      script: "./server/build/server.js", 
      cwd: "./",
      
      /* 
         PENTING: Untuk Game Server (Colyseus), sangat disarankan menggunakan 'fork' 
         dengan 1 instance jika Anda tidak menggunakan Redis Presence. 
         Cluster mode tanpa Redis akan menyebabkan error 'Session Not Found' 
         saat player mencoba masuk ke room.
      */
      instances: 1, 
      exec_mode: "fork", 
      
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      
      // Environment variables
      env: {
        NODE_ENV: "production",
        PORT: 2567,
        // Tambahkan variabel env lain di sini jika diperlukan
      },

      // Logging (Sangat penting di lingkungan produksi aaPanel)
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      log_date_format: "YYYY-MM-DD HH:mm Z",
      
      // Integrasi dengan sistem monitoring aaPanel
      merge_logs: true,
      kill_timeout: 3000,
      wait_ready: true,
      listen_timeout: 10000
    }
  ]
};
