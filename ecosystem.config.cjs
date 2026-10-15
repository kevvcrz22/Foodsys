// ecosystem.config.cjs
// Configuración de PM2 para el backend de Foodsys en servidores Linux (Hetzner)
module.exports = {
  apps: [
    {
      name: "foodsys-backend",
      cwd: "./Node",
      script: "App.js",
      instances: "max",       // Aprovecha todos los cores de CPU en Hetzner
      exec_mode: "cluster",   // Modo cluster para alta disponibilidad
      autorestart: true,
      watch: false,
      max_memory_restart: "600M",
      env: {
        NODE_ENV: "production",
        PORT: 8000
      },
      error_file: "../logs/pm2-error.log",
      out_file: "../logs/pm2-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 8000
    }
  ]
};
