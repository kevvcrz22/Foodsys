-- Node/Database/migration_v4_platos_bebidas_horarios.sql
-- Migracion Foodsys v4: Platos y Bebidas, Menus Ilimitados, Horarios Dinamicos y Cesion con Aceptacion
-- Compatible con MySQL 8.0+, 8.4+ y MariaDB

DROP PROCEDURE IF EXISTS upgrade_foodsys_v4;

DELIMITER $$
CREATE PROCEDURE upgrade_foodsys_v4()
BEGIN
  -- 1. Ampliar tabla platos
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'platos' AND COLUMN_NAME = 'Tipo_Item'
  ) THEN
    ALTER TABLE platos ADD COLUMN Tipo_Item ENUM('PLATO', 'BEBIDA') NOT NULL DEFAULT 'PLATO' COMMENT 'Identifica si el registro es un plato fuerte o una bebida';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'platos' AND COLUMN_NAME = 'Subtipo_Bebida'
  ) THEN
    ALTER TABLE platos ADD COLUMN Subtipo_Bebida ENUM('NINGUNA', 'FRIA', 'CALIENTE') NOT NULL DEFAULT 'NINGUNA' COMMENT 'Para bebidas: fria o caliente';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'platos' AND COLUMN_NAME = 'Tip_Comida_Item'
  ) THEN
    ALTER TABLE platos ADD COLUMN Tip_Comida_Item ENUM('Desayuno', 'Almuerzo', 'Cena', 'Todas') NOT NULL DEFAULT 'Todas' COMMENT 'Turno de comida asociado';
  END IF;

  -- 2. Ampliar tabla reservas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'reservas' AND COLUMN_NAME = 'Id_Bebida'
  ) THEN
    ALTER TABLE reservas ADD COLUMN Id_Bebida INT NULL COMMENT 'ID de la bebida seleccionada por el usuario';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'reservas' AND COLUMN_NAME = 'Id_Usuario_Receptor_Pendiente'
  ) THEN
    ALTER TABLE reservas ADD COLUMN Id_Usuario_Receptor_Pendiente INT NULL COMMENT 'ID del usuario al que se ofrecio ceder la reserva';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'reservas' AND COLUMN_NAME = 'Estado_Cesion'
  ) THEN
    ALTER TABLE reservas ADD COLUMN Estado_Cesion ENUM('NINGUNA', 'PENDIENTE_ACEPTACION', 'ACEPTADA', 'RECHAZADA') NOT NULL DEFAULT 'NINGUNA';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'reservas' AND COLUMN_NAME = 'Token_Aceptacion_Cesion'
  ) THEN
    ALTER TABLE reservas ADD COLUMN Token_Aceptacion_Cesion VARCHAR(80) NULL;
  END IF;

  -- 3. Crear tabla configuracion_raciones
  CREATE TABLE IF NOT EXISTS configuracion_raciones (
    Id_Config INT AUTO_INCREMENT PRIMARY KEY,
    Tip_Racion ENUM('Desayuno', 'Almuerzo', 'Cena') NOT NULL UNIQUE,
    Racion_Activa TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1 = ON, 0 = OFF',
    Hora_Inicio_Servicio TIME NOT NULL,
    Hora_Fin_Servicio TIME NOT NULL,
    Hora_Inicio_Reserva_Dia_Anterior TIME NOT NULL DEFAULT '06:00:00',
    Hora_Limite_Reserva_Normal TIME NOT NULL DEFAULT '22:30:00',
    Hora_Limite_Cancelacion TIME NOT NULL DEFAULT '21:00:00',
    Hora_Limite_Excepcional TIME NOT NULL DEFAULT '09:00:00',
    Hora_Limite_Cesion TIME NOT NULL DEFAULT '10:30:00',
    Fecha_Excepcion_Temporal DATE NULL DEFAULT '2026-10-27',
    Hora_Limite_Excepcion_Temporal TIME NULL DEFAULT '08:00:00',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

  -- Sembrar turnos base si no existen
  INSERT IGNORE INTO configuracion_raciones 
    (Tip_Racion, Racion_Activa, Hora_Inicio_Servicio, Hora_Fin_Servicio, Hora_Inicio_Reserva_Dia_Anterior, Hora_Limite_Reserva_Normal, Hora_Limite_Cancelacion, Hora_Limite_Excepcional, Hora_Limite_Cesion, Fecha_Excepcion_Temporal, Hora_Limite_Excepcion_Temporal)
  VALUES
    ('Desayuno', 1, '06:00:00', '08:00:00', '06:00:00', '22:30:00', '21:00:00', '09:00:00', '05:00:00', '2026-10-27', '08:00:00'),
    ('Almuerzo', 1, '11:30:00', '13:30:00', '06:00:00', '22:30:00', '21:00:00', '09:00:00', '10:30:00', '2026-10-27', '08:00:00'),
    ('Cena', 1, '18:00:00', '20:00:00', '06:00:00', '22:30:00', '21:00:00', '09:00:00', '17:00:00', '2026-10-27', '08:00:00');

END $$
DELIMITER ;

CALL upgrade_foodsys_v4();
DROP PROCEDURE IF EXISTS upgrade_foodsys_v4;
