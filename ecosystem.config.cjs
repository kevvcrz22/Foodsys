// ecosystem.config.cjs
// Configuración de PM2 en Modo Cluster para Foodsys
// Multiplica la capacidad del servidor aprovechando todos los núcleos de CPU de Hetzner

module.exports = {
  apps: [
    {
      name: 'foodsys-backend',
      script: './Node/App.js',
      instances: 'max', // Crea 1 proceso por cada núcleo vCPU del servidor
      exec_mode: 'cluster', // Balanceo de carga nativo entre hilos
      watch: false,
      max_memory_restart: '600M', // Si un proceso supera 600MB se reinicia limpiamente
      env: {
        NODE_ENV: 'production',
        PORT: 8000
      }
    }
  ]
};
