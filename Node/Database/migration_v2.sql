-- ==============================================================================
-- Migración de Base de Datos para Actualización Foodsys v2
-- Compatible con MySQL 8.0, 8.4 y MariaDB
-- Ejecutar: mysql -u root -p foodsys_db < Node/Database/migration_v2.sql
-- ==============================================================================

DROP PROCEDURE IF EXISTS upgrade_foodsys_v2;

DELIMITER $$
CREATE PROCEDURE upgrade_foodsys_v2()
BEGIN
  -- 1. Columna Fec_Desancion en usuarios
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'Fec_Desancion'
  ) THEN
    ALTER TABLE usuarios ADD COLUMN Fec_Desancion DATETIME NULL;
  END IF;

  -- 2. Columna tokenVersion en usuarios
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'tokenVersion'
  ) THEN
    ALTER TABLE usuarios ADD COLUMN tokenVersion INT NOT NULL DEFAULT 1;
  END IF;

  -- 3. Columna Est_Programa en programas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'programas' AND COLUMN_NAME = 'Est_Programa'
  ) THEN
    ALTER TABLE programas ADD COLUMN Est_Programa VARCHAR(20) DEFAULT 'Activo';
  END IF;

  UPDATE programas SET Est_Programa = 'Activo' WHERE Est_Programa IS NULL;
END$$
DELIMITER ;

-- Ejecutar la verificación e inserción de columnas
CALL upgrade_foodsys_v2();
DROP PROCEDURE IF EXISTS upgrade_foodsys_v2;

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
