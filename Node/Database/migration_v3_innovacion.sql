-- ==============================================================================
-- Migracion Foodsys v3: Sincronizacion Offline, Cesion de Reserva, PQRSF y Multi-Sede
-- Compatible con MySQL 8.0+, 8.4+ y MariaDB (Nodo Local La Granja + Nodo Web Hetzner)
-- ==============================================================================

DROP PROCEDURE IF EXISTS upgrade_foodsys_v3;

DELIMITER $$
CREATE PROCEDURE upgrade_foodsys_v3()
BEGIN
  -- 1. Ampliar tabla reservas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'reservas' AND COLUMN_NAME = 'uuid_reserva'
  ) THEN
    ALTER TABLE reservas ADD COLUMN uuid_reserva CHAR(36) NULL AFTER Id_Reserva;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'reservas' AND COLUMN_NAME = 'nodo_origen'
  ) THEN
    ALTER TABLE reservas ADD COLUMN nodo_origen ENUM('LOCAL', 'CLOUD') NOT NULL DEFAULT 'CLOUD';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'reservas' AND COLUMN_NAME = 'Id_Usuario_Cedente'
  ) THEN
    ALTER TABLE reservas ADD COLUMN Id_Usuario_Cedente INT NULL COMMENT 'ID del aprendiz original si la reserva fue cedida';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'reservas' AND COLUMN_NAME = 'Fec_Cesion'
  ) THEN
    ALTER TABLE reservas ADD COLUMN Fec_Cesion DATETIME NULL COMMENT 'Fecha y hora exacta en que se cedio la reserva';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'reservas' AND COLUMN_NAME = 'motivo_cesion'
  ) THEN
    ALTER TABLE reservas ADD COLUMN motivo_cesion VARCHAR(180) NULL COMMENT 'Motivo o nota de la cesion solidaria';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'reservas' AND COLUMN_NAME = 'sync_status'
  ) THEN
    ALTER TABLE reservas ADD COLUMN sync_status ENUM('PENDING', 'SYNCED') NOT NULL DEFAULT 'PENDING';
  END IF;

  -- Asignar UUID a reservas existentes que no lo tengan
  UPDATE reservas SET uuid_reserva = UUID() WHERE uuid_reserva IS NULL;

  -- Crear indices en reservas si no existen
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'reservas' AND INDEX_NAME = 'idx_reservas_uuid'
  ) THEN
    ALTER TABLE reservas ADD UNIQUE INDEX idx_reservas_uuid (uuid_reserva);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'reservas' AND INDEX_NAME = 'idx_reservas_usuario_fecha_tipo'
  ) THEN
    ALTER TABLE reservas ADD INDEX idx_reservas_usuario_fecha_tipo (Id_Usuario, Fec_Reserva, Tip_Reserva, Est_Reserva);
  END IF;

END$$
DELIMITER ;

CALL upgrade_foodsys_v3();
DROP PROCEDURE IF EXISTS upgrade_foodsys_v3;

-- 2. Tabla de control local de QR consumidos (Bloquea doble escaneo y fraudes offline)
CREATE TABLE IF NOT EXISTS qr_consumidos_control (
  uuid_reserva CHAR(36) PRIMARY KEY,
  NumDoc_Usuario BIGINT NOT NULL,
  Fec_Reserva DATE NOT NULL,
  Tip_Reserva VARCHAR(20) NOT NULL,
  Fecha_Consumo DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  Id_Supervisor INT NULL,
  nodo_consumo ENUM('LOCAL', 'CLOUD') NOT NULL DEFAULT 'LOCAL',
  UNIQUE INDEX uk_consumo_unico_aprendiz (NumDoc_Usuario, Fec_Reserva, Tip_Reserva)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabla de Cola de Sincronizacion (Patron Transactional Outbox tipo OneDrive)
CREATE TABLE IF NOT EXISTS sync_outbox (
  event_id CHAR(36) PRIMARY KEY,
  source_node ENUM('LOCAL', 'CLOUD') NOT NULL DEFAULT 'LOCAL',
  entidad VARCHAR(40) NOT NULL COMMENT 'RESERVA | CONSUMO | CESION | PQRSF | USUARIO | FICHA',
  operacion VARCHAR(30) NOT NULL COMMENT 'CREATE | VERIFY | CONSUME | CANCEL | TRANSFER | UPSERT',
  entity_uuid CHAR(36) NOT NULL,
  payload JSON NOT NULL,
  sync_status ENUM('PENDING', 'SYNCED', 'CONFLICT', 'ERROR') NOT NULL DEFAULT 'PENDING',
  attempts INT NOT NULL DEFAULT 0,
  last_error TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  synced_at DATETIME NULL,
  INDEX idx_sync_pending (sync_status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tabla de eventos ya procesados (Garantiza Idempotencia si se corta el internet a mitad de envio)
CREATE TABLE IF NOT EXISTS sync_inbox_processed (
  event_id CHAR(36) PRIMARY KEY,
  source_node ENUM('LOCAL', 'CLOUD') NOT NULL,
  processed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Tabla Maestra de PQRSF con Criterio de Prioridad, Categoria Estandarizada, SLA y Ranking
CREATE TABLE IF NOT EXISTS pqrsf (
  Id_Pqrsf INT AUTO_INCREMENT PRIMARY KEY,
  uuid_pqrsf CHAR(36) NOT NULL UNIQUE,
  Radicado VARCHAR(30) NOT NULL UNIQUE COMMENT 'Ej: PQRS-202610-0042',
  Id_Usuario INT NULL COMMENT 'NULL si el aprendiz decide enviarla de forma anonima o desde vista publica',
  Id_Reserva INT NULL COMMENT 'Reserva asociada al turno si aplica',
  Nombre_Reportante VARCHAR(120) NULL,
  Correo_Reportante VARCHAR(120) NULL,
  Rol_Reportante VARCHAR(50) NULL DEFAULT 'Aprendiz',
  Tipo_Solicitud ENUM('Felicitacion', 'Sugerencia', 'Peticion', 'Queja', 'Reclamo') NOT NULL,
  Categoria_Estandar ENUM(
    'CALIDAD_ALIMENTACION',
    'ESTADO_PLATO_MENAJE',
    'MOBILIARIO_MESAS_SILLAS',
    'ATENCION_SERVICIO',
    'PLATAFORMA_RESERVAS',
    'RECONOCIMIENTO',
    'OTRO'
  ) NOT NULL DEFAULT 'CALIDAD_ALIMENTACION',
  Subcategoria VARCHAR(120) NOT NULL COMMENT 'Ej: Comida fria, Plato mal lavado, Silla en mal estado, Mala atencion en fila',
  Persona_Servicio_Ref VARCHAR(120) NULL COMMENT 'Referencia opcional si hubo mal o excelente trato de una persona del servicio',
  Fec_Hecho DATE NOT NULL,
  Tip_Comida ENUM('Desayuno', 'Almuerzo', 'Cena', 'General') NOT NULL DEFAULT 'Almuerzo',
  Id_Plato_Relacionado INT NULL,
  Nivel_Prioridad ENUM('CRITICA', 'ALTA', 'MEDIA', 'BAJA', 'POSITIVA') NOT NULL DEFAULT 'MEDIA',
  Puntaje_Prioridad INT NOT NULL DEFAULT 50 COMMENT 'Escala 1-100: 98=Critica, 80=Alta, 65=Media, 35=Baja, 20=Positiva',
  Sla_Horas INT NOT NULL DEFAULT 48,
  Calificacion_Servicio TINYINT NULL COMMENT '1 a 5 estrellas',
  Descripcion TEXT NOT NULL,
  Archivo_Evidencia VARCHAR(255) NULL,
  Estado_Pqrsf ENUM('Abierta', 'En Revision', 'Respondida', 'Cerrada') NOT NULL DEFAULT 'Abierta',
  Respuesta_Administracion TEXT NULL,
  Id_Responsable_Respuesta INT NULL,
  Fecha_Respuesta DATETIME NULL,
  Fecha_Limite_SLA DATETIME NOT NULL,
  nodo_origen ENUM('LOCAL', 'CLOUD') NOT NULL DEFAULT 'LOCAL',
  sync_status ENUM('PENDING', 'SYNCED') NOT NULL DEFAULT 'PENDING',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_pqrsf_usuario FOREIGN KEY (Id_Usuario) REFERENCES usuarios(Id_Usuario) ON DELETE SET NULL,
  CONSTRAINT fk_pqrsf_plato FOREIGN KEY (Id_Plato_Relacionado) REFERENCES platos(Id_Plato) ON DELETE SET NULL,
  INDEX idx_pqrsf_ranking (Categoria_Estandar, Subcategoria, Tipo_Solicitud, Fec_Hecho),
  INDEX idx_pqrsf_prioridad (Estado_Pqrsf, Puntaje_Prioridad DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Tabla de Parametrizacion Multi-Sede para Escalabilidad Nacional (117 Centros SENA)
CREATE TABLE IF NOT EXISTS centros_sena_config (
  Id_Centro INT AUTO_INCREMENT PRIMARY KEY,
  Codigo_Centro_Sena VARCHAR(10) NOT NULL UNIQUE DEFAULT '9121' COMMENT '9121 - Centro Agropecuario La Granja',
  Nombre_Centro VARCHAR(150) NOT NULL DEFAULT 'Centro Agropecuario "La Granja" del Espinal-Tolima',
  Regional VARCHAR(80) NOT NULL DEFAULT 'Regional Tolima',
  Tiene_Internado TINYINT(1) NOT NULL DEFAULT 1,
  Cupo_Max_Desayuno INT NOT NULL DEFAULT 250,
  Cupo_Max_Almuerzo INT NOT NULL DEFAULT 450,
  Cupo_Max_Cena INT NOT NULL DEFAULT 250,
  Porcentaje_Cupo_Local_Offline INT NOT NULL DEFAULT 75 COMMENT '75% reservado para LAN local en contingencia sin internet',
  Hora_Inicio_Almuerzo TIME NOT NULL DEFAULT '11:30:00',
  Hora_Fin_Almuerzo TIME NOT NULL DEFAULT '13:30:00',
  Horas_Antelacion_Reserva INT NOT NULL DEFAULT 8,
  Horas_Antelacion_Cancelacion INT NOT NULL DEFAULT 9,
  Horas_Antelacion_Cesion INT NOT NULL DEFAULT 2,
  Max_Inasistencias_Semana INT NOT NULL DEFAULT 3,
  Valor_Unitario_Racion_COP INT NOT NULL DEFAULT 12500,
  Public_Key_Ed25519 TEXT NULL,
  Ultima_Sincronizacion DATETIME NULL,
  Estado_Nodo_Local ENUM('ONLINE', 'OFFLINE_CONTINGENCIA') NOT NULL DEFAULT 'ONLINE'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar configuracion por defecto si la tabla esta vacia
INSERT INTO centros_sena_config (Codigo_Centro_Sena, Nombre_Centro, Regional)
SELECT '9121', 'Centro Agropecuario "La Granja" del Espinal-Tolima', 'Regional Tolima'
WHERE NOT EXISTS (SELECT 1 FROM centros_sena_config WHERE Codigo_Centro_Sena = '9121');

SELECT 'Migracion v3 ejecutada con exito!' AS Resultado;
