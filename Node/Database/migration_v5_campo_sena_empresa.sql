-- Node/Database/migration_v5_campo_sena_empresa.sql
-- Migracion V5.0: Nuevos Roles (Instructor, Vocero, SENA Empresa, Coordinacion),
-- Solicitudes de Guardar Almuerzo por Jornada de Campo, Extension de Horarios y Soporte de Cocina.

-- 1. Insertar nuevos roles de forma segura (sin duplicar Coordinador)
INSERT IGNORE INTO roles (Nom_Rol, createdat, updatedat) VALUES
('Instructor', NOW(), NOW()),
('Vocero', NOW(), NOW()),
('SENA Empresa', NOW(), NOW());

-- Unificar en caso de que exista el rol duplicado Coordinacion (compatible con Windows y Linux)
SET @tabla_rol = (SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = 'usuariosrol' LIMIT 1);
SET @sql_update = CONCAT('UPDATE IGNORE ', IFNULL(@tabla_rol, 'usuariosrol'), ' SET Id_Rol = (SELECT Id_Rol FROM roles WHERE Nom_Rol = \'Coordinador\' LIMIT 1) WHERE Id_Rol IN (SELECT Id_Rol FROM roles WHERE Nom_Rol = \'Coordinacion\')');
PREPARE stmt1 FROM @sql_update;
EXECUTE stmt1;
DEALLOCATE PREPARE stmt1;

SET @sql_delete = CONCAT('DELETE FROM ', IFNULL(@tabla_rol, 'usuariosrol'), ' WHERE Id_Rol IN (SELECT Id_Rol FROM roles WHERE Nom_Rol = \'Coordinacion\')');
PREPARE stmt2 FROM @sql_delete;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

DELETE FROM roles WHERE Nom_Rol = 'Coordinacion';

-- 2. Tabla de solicitudes para guardar almuerzos por jornada de campo
CREATE TABLE IF NOT EXISTS solicitudes_guardado_campo (
  Id_Solicitud_Campo INT AUTO_INCREMENT PRIMARY KEY,
  uuid_solicitud CHAR(36) NOT NULL UNIQUE,
  Codigo_Acta VARCHAR(30) NOT NULL UNIQUE COMMENT 'Ej: CAMPO-202610-0015',
  Id_Ficha INT NOT NULL,
  Num_Ficha VARCHAR(30) NOT NULL,
  Nom_Programa VARCHAR(180) NOT NULL,
  Fec_Servicio DATE NOT NULL,
  Tip_Comida ENUM('Almuerzo') NOT NULL DEFAULT 'Almuerzo',
  Unidad_Productiva ENUM(
    'GANADERIA',
    'PISCICULTURA',
    'PORCINOS',
    'AVICULTURA',
    'CULTIVOS_AGRICOLAS',
    'MECANIZACION_AGRICOLA',
    'AGROINDUSTRIA',
    'SENA_EMPRESA_GENERAL',
    'SALIDA_PEDAGOGICA',
    'OTRA_UNIDAD'
  ) NOT NULL DEFAULT 'SENA_EMPRESA_GENERAL',
  Detalle_Lugar_Practica VARCHAR(180) NOT NULL COMMENT 'Nombre especifico del lote, unidad o practica',
  Justificacion TEXT NOT NULL COMMENT 'Motivo por el cual la ficha no alcanza a llegar a tiempo al almuerzo',
  Hora_Estimada_Llegada TIME NOT NULL DEFAULT '14:00:00' COMMENT 'Hora estimada en que pasaran a reclamar el almuerzo guardado (max 15:00)',
  Modalidad_Guardado ENUM('GUARDAR_EN_COMEDOR', 'EMPACA_PARA_LLEVAR') NOT NULL DEFAULT 'GUARDAR_EN_COMEDOR',
  Total_Aprendices_Guardados INT NOT NULL DEFAULT 0,
  Total_Almuerzos_Entregados INT NOT NULL DEFAULT 0,
  Id_Usuario_Solicitante INT NOT NULL COMMENT 'Instructor o Vocero que registra la solicitud',
  Rol_Solicitante VARCHAR(50) NOT NULL COMMENT 'Instructor | Vocero | SENA Empresa | Administrador | Bienestar',
  Id_Usuario_Aval_SenaEmpresa INT NULL COMMENT 'Usuario de SENA Empresa, Coordinacion o Bienestar que cruza/valida',
  Estado_Solicitud ENUM('ACTIVA_GUARDADA', 'ENTREGADA_COMPLETA', 'ENTREGADA_PARCIAL', 'VENCIDA', 'CANCELADA') NOT NULL DEFAULT 'ACTIVA_GUARDADA',
  Observaciones_Cocina TEXT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_campo_fecha_ficha (Fec_Servicio, Id_Ficha),
  INDEX idx_campo_unidad (Unidad_Productiva, Fec_Servicio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Ampliar tabla de reservas para vincular solicitud de campo y hora extendida (Compatible con MySQL 8.0)
DROP PROCEDURE IF EXISTS sp_add_campo_cols;
DELIMITER $$
CREATE PROCEDURE sp_add_campo_cols()
BEGIN
  IF NOT EXISTS (
    SELECT * FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'reservas' AND COLUMN_NAME = 'Es_Guardado_Campo'
  ) THEN
    ALTER TABLE reservas ADD COLUMN Es_Guardado_Campo TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1 si el almuerzo debe guardarse por jornada de campo';
  END IF;

  IF NOT EXISTS (
    SELECT * FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'reservas' AND COLUMN_NAME = 'Id_Solicitud_Campo'
  ) THEN
    ALTER TABLE reservas ADD COLUMN Id_Solicitud_Campo INT NULL COMMENT 'FK a solicitudes_guardado_campo';
  END IF;

  IF NOT EXISTS (
    SELECT * FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'reservas' AND COLUMN_NAME = 'Hora_Limite_Extendida'
  ) THEN
    ALTER TABLE reservas ADD COLUMN Hora_Limite_Extendida TIME NULL COMMENT 'Hora extendida de vencimiento por jornada de campo';
  END IF;

  IF NOT EXISTS (
    SELECT * FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'reservas' AND COLUMN_NAME = 'Justificacion_Campo'
  ) THEN
    ALTER TABLE reservas ADD COLUMN Justificacion_Campo VARCHAR(255) NULL;
  END IF;

  IF NOT EXISTS (
    SELECT * FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'reservas' AND COLUMN_NAME = 'Unidad_Productiva_Campo'
  ) THEN
    ALTER TABLE reservas ADD COLUMN Unidad_Productiva_Campo VARCHAR(80) NULL;
  END IF;
END$$
DELIMITER ;
CALL sp_add_campo_cols();
DROP PROCEDURE IF EXISTS sp_add_campo_cols;

-- 4. Actualizar tabla configuracion_raciones con horarios oficiales V5.0
UPDATE configuracion_raciones SET
  Hora_Inicio_Servicio = '06:00:00',
  Hora_Fin_Servicio = '07:00:00',
  Hora_Inicio_Reserva_Dia_Anterior = '06:00:00',
  Hora_Limite_Reserva_Normal = '22:30:00',
  Hora_Limite_Cancelacion = '22:30:00',
  Hora_Limite_Cesion = '05:30:00'
WHERE Tip_Racion = 'Desayuno';

UPDATE configuracion_raciones SET
  Hora_Inicio_Servicio = '11:30:00',
  Hora_Fin_Servicio = '13:30:00',
  Hora_Inicio_Reserva_Dia_Anterior = '06:00:00',
  Hora_Limite_Reserva_Normal = '22:30:00',
  Hora_Limite_Cancelacion = '22:30:00',
  Hora_Limite_Excepcional = '09:00:00',
  Hora_Limite_Cesion = '10:30:00'
WHERE Tip_Racion = 'Almuerzo';

UPDATE configuracion_raciones SET
  Hora_Inicio_Servicio = '18:00:00',
  Hora_Fin_Servicio = '19:30:00',
  Hora_Inicio_Reserva_Dia_Anterior = '06:00:00',
  Hora_Limite_Reserva_Normal = '22:30:00',
  Hora_Limite_Cancelacion = '22:30:00',
  Hora_Limite_Cesion = '17:00:00'
WHERE Tip_Racion = 'Cena';
