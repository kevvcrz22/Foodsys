#!/bin/bash
# ==============================================================================
# Script de Respaldo Diario de Base de Datos MySQL para Foodsys
# Uso: agregar a crontab: 0 3 * * * /var/www/foodsys/backup-db.sh > /dev/null 2>&1
# ==============================================================================

BACKUP_DIR="/var/backups/foodsys"
FECHA=$(date +"%Y%m%d_%H%M%S")
DB_NAME="foodsys"
DB_USER="foodsys_user"

# Crear directorio de respaldos si no existe
mkdir -p "$BACKUP_DIR"

# Cargar contraseña desde variable o archivo de configuración seguro
echo "📦 Generando backup de $DB_NAME ($FECHA)..."
mysqldump -u "$DB_USER" -p "$DB_NAME" | gzip > "$BACKUP_DIR/${DB_NAME}_${FECHA}.sql.gz"

# Eliminar respaldos de más de 14 días para ahorrar espacio
find "$BACKUP_DIR" -type f -name "${DB_NAME}_*.sql.gz" -mtime +14 -exec rm {} \;

echo "✅ Respaldo completado en $BACKUP_DIR/${DB_NAME}_${FECHA}.sql.gz"
