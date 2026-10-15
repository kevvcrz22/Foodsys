#!/bin/bash
# ==============================================================================
# Script de Despliegue y Actualización Automática de Foodsys en Hetzner
# Uso: ./deploy.sh
# ==============================================================================

set -e # Detener ante cualquier error

echo "=========================================="
echo "🚀 Iniciando despliegue de Foodsys..."
echo "=========================================="

# Directorio del proyecto
PROJECT_DIR="/var/www/foodsys"
cd "$PROJECT_DIR"

echo "📥 1. Obteniendo últimos cambios de Git..."
git pull origin main

echo "📦 2. Instalando dependencias de Node.js (pnpm)..."
cd "$PROJECT_DIR/Node"
pnpm install --frozen-lockfile

cd "$PROJECT_DIR/Frontend"
pnpm install --frozen-lockfile

echo "🔨 3. Compilando Frontend de Producción (Vite)..."
pnpm run build

echo "🔄 4. Reiniciando procesos en PM2 (Zero-Downtime Reload)..."
cd "$PROJECT_DIR"
# Crea directorio de logs si no existe
mkdir -p logs

if pm2 describe foodsys-backend > /dev/null 2>&1; then
    echo "Recargando PM2..."
    pm2 reload ecosystem.config.cjs --update-env
else
    echo "Iniciando PM2..."
    pm2 start ecosystem.config.cjs
fi

pm2 save

echo "🌐 5. Verificando y recargando Nginx..."
sudo nginx -t && sudo systemctl reload nginx

echo "=========================================="
echo "✅ Despliegue de Foodsys completado con éxito!"
echo "=========================================="
