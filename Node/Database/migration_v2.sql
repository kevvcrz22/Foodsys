-- ==============================================================================
-- Migración de Base de Datos para Actualización Foodsys v2
-- Ejecutar en la base de datos de producción en Hetzner:
-- mysql -u root -p foodsys_db < migration_v2.sql
-- ==============================================================================

-- Aplica directamente sobre la base de datos seleccionada en el comando mysql
-- (ejemplo: foodsys_db)

-- 1. Columna de fecha de desanción en usuarios (si no existe)
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS Fec_Desancion DATETIME NULL;

-- 2. Columna de sesión única en usuarios (si no existe)
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS tokenVersion INT NOT NULL DEFAULT 1;

-- 3. Columna de estado en programas (si no existe)
ALTER TABLE programas 
ADD COLUMN IF NOT EXISTS Est_Programa VARCHAR(20) DEFAULT 'Activo';

UPDATE programas 
SET Est_Programa = 'Activo' 
WHERE Est_Programa IS NULL;

-- 4. Tabla de turnos de supervisor
CREATE TABLE IF NOT EXISTS turnos (
  Id_Turno INT AUTO_INCREMENT PRIMARY KEY,
  Id_Usuario INT NOT NULL,
  Fecha_Inicio DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  Fecha_Fin DATETIME NULL,
  Estado ENUM('Activo', 'Finalizado') NOT NULL DEFAULT 'Activo',
  Total_Consumos_Registrados INT NOT NULL DEFAULT 0,
  Observaciones TEXT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_turnos_usuario FOREIGN KEY (Id_Usuario) REFERENCES usuarios(Id_Usuario) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Tabla de notificaciones del sistema
CREATE TABLE IF NOT EXISTS notificaciones (
  Id_Notificacion INT AUTO_INCREMENT PRIMARY KEY,
  Id_Usuario INT NULL,
  Rol_Destino VARCHAR(50) NULL DEFAULT 'Todos',
  Titulo VARCHAR(200) NOT NULL,
  Mensaje TEXT NOT NULL,
  Tipo VARCHAR(30) NOT NULL DEFAULT 'info',
  Leido TINYINT(1) NOT NULL DEFAULT 0,
  Fecha_Creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notificaciones_usuario FOREIGN KEY (Id_Usuario) REFERENCES usuarios(Id_Usuario) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT '✅ Migración v2 ejecutada con éxito!' AS Resultado;
