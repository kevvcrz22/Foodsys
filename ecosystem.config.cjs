// ecosystem.config.cjs
// Configuración robusta y de alta concurrencia de PM2 para Foodsys
// Garantiza compatibilidad 100% con Socket.IO, tareas cron y carga segura de variables .env

module.exports = {
  apps: [
    {
      name: 'foodsys-backend',
      cwd: './Node',
      script: 'App.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '650M',
      env: {
        NODE_ENV: 'production',
        PORT: 8000
      }
    }
  ]
};
