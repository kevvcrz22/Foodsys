-- =============================================================================
-- Node/Database/foodsys_canonical_schema.sql
-- ESQUEMA CANONICO UNIFICADO E IDEMPOTENTE — PROYECTO FOODSYS (SENA LA GRANJA)
-- Zona Horaria Oficial: America/Bogota (UTC-5)
-- Consolida todas las versiones previas (v1 a v7 + indices + optimizaciones)
-- =============================================================================

SET NAMES utf8mb4;
SET time_zone = '-05:00';

-- 1. TABLAS BASE E INSTITUCIONALES
CREATE TABLE IF NOT EXISTS programas (
  Id_Programa INT AUTO_INCREMENT PRIMARY KEY,
  Nom_Programa VARCHAR(255) NOT NULL,
  NivFor_Programa VARCHAR(100) NULL DEFAULT 'TECNOLOGO',
  Are_Programa VARCHAR(100) NULL DEFAULT 'AGROPECUARIA',
  Est_Programa VARCHAR(20) NOT NULL DEFAULT 'Activo',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS fichas (
  Id_Ficha INT AUTO_INCREMENT PRIMARY KEY,
  Num_Ficha BIGINT NOT NULL UNIQUE,
  FecIniLec_Ficha DATE NOT NULL,
  FecFinLec_Ficha DATE NOT NULL,
  FecIniPra_Ficha DATE NOT NULL,
  FecFinPra_Ficha DATE NOT NULL,
  Id_Programa INT NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_fichas_programa FOREIGN KEY (Id_Programa) REFERENCES programas(Id_Programa) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS roles (
  Id_Rol INT AUTO_INCREMENT PRIMARY KEY,
  Nom_Rol VARCHAR(60) NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS usuarios (
  Id_Usuario INT AUTO_INCREMENT PRIMARY KEY,
  Nom_Usuario VARCHAR(100) NULL,
  Ape_Usuario VARCHAR(100) NULL,
  Cor_Usuario VARCHAR(100) NULL,
  Tel_Usuario VARCHAR(20) NULL DEFAULT NULL,
  TipDoc_Usuario VARCHAR(20) NULL DEFAULT 'CC',
  NumDoc_Usuario BIGINT NOT NULL UNIQUE,
  Con_Usuario VARCHAR(255) NOT NULL,
  Gen_Usuario VARCHAR(50) NULL DEFAULT 'No especificado',
  CenCon_Usuario VARCHAR(20) NULL DEFAULT 'No',
  Est_Usuario VARCHAR(50) NOT NULL DEFAULT 'Formación',
  San_Usuario VARCHAR(20) NULL DEFAULT 'No',
  Pol_Usuario VARCHAR(20) NULL DEFAULT 'No',
  Fec_Desancion DATETIME NULL,
  FecIni_Pasantia DATE NULL,
  FecFin_Pasantia DATE NULL,
  tokenVersion INT NOT NULL DEFAULT 1,
  Id_Ficha INT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS UsuariosRol (
  Id_UsuariosRol INT AUTO_INCREMENT PRIMARY KEY,
  Id_Usuario INT NOT NULL,
  Id_Rol INT NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS platos (
  Id_Plato INT AUTO_INCREMENT PRIMARY KEY,
  Nom_Plato VARCHAR(150) NOT NULL,
  Des_Plato TEXT NULL,
  Tip_Plato VARCHAR(30) NOT NULL DEFAULT 'Almuerzo',
  Tipo_Item ENUM('PLATO', 'BEBIDA') NOT NULL DEFAULT 'PLATO',
  Subtipo_Bebida ENUM('FRIA', 'CALIENTE', 'NINGUNA') NOT NULL DEFAULT 'NINGUNA',
  Tip_Comida_Item ENUM('Desayuno', 'Almuerzo', 'Cena', 'Todas') NOT NULL DEFAULT 'Todas',
  Img_Plato VARCHAR(255) NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS menus (
  Id_Menu INT AUTO_INCREMENT PRIMARY KEY,
  Fec_Menu DATE NOT NULL,
  Tip_Menu VARCHAR(30) NOT NULL,
  Id_Plato INT NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS reservas (
  Id_Reserva INT AUTO_INCREMENT PRIMARY KEY,
  uuid_reserva CHAR(36) NULL UNIQUE,
  nodo_origen ENUM('LOCAL', 'CLOUD') NOT NULL DEFAULT 'CLOUD',
  Tip_Reserva VARCHAR(30) NOT NULL,
  Fec_Reserva DATE NOT NULL,
  Hor_Reserva TIME NOT NULL,
  Est_Reserva VARCHAR(30) NOT NULL DEFAULT 'Generado',
  Qr_Reserva TEXT NULL,
  Vec_Reserva DATETIME NULL,
  Exc_Reserva VARCHAR(10) NOT NULL DEFAULT 'No',
  Mot_Reserva VARCHAR(255) NULL,
  Id_Usuario INT NOT NULL,
  Id_Plato INT NOT NULL,
  Id_Bebida INT NULL,
  Tipo_Bebida ENUM('FRIA', 'CALIENTE', 'NINGUNA') NOT NULL DEFAULT 'FRIA',
  Lleva_Sopa TINYINT(1) NOT NULL DEFAULT 1,
  Id_Usuario_Cedente INT NULL,
  Id_Usuario_Receptor_Pendiente INT NULL,
  Estado_Cesion ENUM('NINGUNA', 'PENDIENTE_ACEPTACION', 'ACEPTADA', 'RECHAZADA') NOT NULL DEFAULT 'NINGUNA',
  Token_Aceptacion_Cesion VARCHAR(64) NULL,
  Fec_Cesion DATETIME NULL,
  motivo_cesion VARCHAR(180) NULL,
  Es_Guardado_Campo TINYINT(1) NOT NULL DEFAULT 0,
  Id_Solicitud_Campo INT NULL,
  Hora_Limite_Extendida TIME NULL,
  Justificacion_Campo VARCHAR(255) NULL,
  Unidad_Productiva_Campo VARCHAR(80) NULL,
  sync_status ENUM('PENDING', 'SYNCED') NOT NULL DEFAULT 'PENDING',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS turnos (
  Id_Turno INT AUTO_INCREMENT PRIMARY KEY,
  Id_Supervisor INT NOT NULL,
  Nom_Supervisor VARCHAR(120) NOT NULL,
  Tip_Comida VARCHAR(30) NOT NULL DEFAULT 'Almuerzo',
  Fecha_Inicio DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  Fecha_Fin DATETIME NULL,
  Estado ENUM('Activo', 'Finalizado') NOT NULL DEFAULT 'Activo',
  Total_Consumidos INT NOT NULL DEFAULT 0,
  Observaciones VARCHAR(255) NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notificaciones (
  Id_Notificacion INT AUTO_INCREMENT PRIMARY KEY,
  Id_Usuario INT NOT NULL,
  Titulo VARCHAR(150) NOT NULL,
  Mensaje TEXT NOT NULL,
  Tipo VARCHAR(30) NOT NULL DEFAULT 'info',
  Leido TINYINT(1) NOT NULL DEFAULT 0,
  Metadata TEXT NULL,
  Fecha_Creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pqrsf (
  Id_Pqrsf INT AUTO_INCREMENT PRIMARY KEY,
  Radicado VARCHAR(30) NOT NULL UNIQUE,
  Id_Usuario INT NOT NULL,
  Nom_Usuario VARCHAR(120) NOT NULL,
  NumDoc_Usuario BIGINT NOT NULL,
  Rol_Usuario VARCHAR(50) NOT NULL,
  Tipo_Solicitud ENUM('PETICION', 'QUEJA', 'RECLAMO', 'SUGERENCIA', 'FELICITACION', 'REPORTE_CALIDAD_ALIMENTO') NOT NULL DEFAULT 'SUGERENCIA',
  Categoria_Calidad ENUM('TEMPERATURA', 'HIGIENE_INOCUIDAD', 'PORCION_GRAMAJE', 'ATENCION_PERSONAL', 'INFRAESTRUCTURA_COMEDOR', 'SISTEMA_QR', 'OTRO') NOT NULL DEFAULT 'OTRO',
  Tip_Comida_Afectada ENUM('Desayuno', 'Almuerzo', 'Cena', 'General') NOT NULL DEFAULT 'General',
  Calificacion_Estrellas INT NOT NULL DEFAULT 5,
  Asunto VARCHAR(180) NOT NULL,
  Descripcion TEXT NOT NULL,
  Estado ENUM('RADICADO', 'EN_REVISION_INTERVENTORIA', 'RESUELTO', 'ARCHIVADO') NOT NULL DEFAULT 'RADICADO',
  Respuesta_Oficial TEXT NULL,
  Respondido_Por VARCHAR(120) NULL,
  Fecha_Respuesta DATETIME NULL,
  Es_Anonimo TINYINT(1) NOT NULL DEFAULT 0,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS centros_sena_config (
  Id_Centro INT AUTO_INCREMENT PRIMARY KEY,
  Codigo_Centro_Sena VARCHAR(20) NOT NULL UNIQUE,
  Nombre_Centro VARCHAR(180) NOT NULL,
  Regional VARCHAR(100) NOT NULL,
  Tiene_Internado TINYINT(1) NOT NULL DEFAULT 1,
  Cupo_Max_Desayuno INT NOT NULL DEFAULT 250,
  Cupo_Max_Almuerzo INT NOT NULL DEFAULT 450,
  Cupo_Max_Cena INT NOT NULL DEFAULT 250,
  Porcentaje_Cupo_Local_Offline INT NOT NULL DEFAULT 75,
  Hora_Inicio_Almuerzo TIME NOT NULL DEFAULT '11:30:00',
  Hora_Fin_Almuerzo TIME NOT NULL DEFAULT '13:30:00',
  Horas_Antelacion_Reserva INT NOT NULL DEFAULT 8,
  Horas_Antelacion_Cancelacion INT NOT NULL DEFAULT 9,
  Horas_Antelacion_Cesion INT NOT NULL DEFAULT 2,
  Max_Inasistencias_Semana INT NOT NULL DEFAULT 3,
  Valor_Unitario_Racion_COP DECIMAL(10,2) NOT NULL DEFAULT 12500.00,
  Estado_Nodo_Local ENUM('ONLINE', 'OFFLINE_CONTINGENCIA', 'SINCRONIZANDO') NOT NULL DEFAULT 'ONLINE',
  Ultima_Sincronizacion DATETIME NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS configuracion_raciones (
  Id_Config INT AUTO_INCREMENT PRIMARY KEY,
  Tip_Racion ENUM('Desayuno', 'Almuerzo', 'Cena') NOT NULL UNIQUE,
  Habilitado TINYINT(1) NOT NULL DEFAULT 1,
  Cupo_Maximo INT NOT NULL DEFAULT 450,
  Hora_Inicio_Servicio TIME NOT NULL,
  Hora_Fin_Servicio TIME NOT NULL,
  Hora_Inicio_Reserva_Dia_Anterior TIME NOT NULL DEFAULT '06:00:00',
  Hora_Limite_Reserva_Normal TIME NOT NULL DEFAULT '22:30:00',
  Hora_Limite_Cancelacion TIME NOT NULL DEFAULT '22:30:00',
  Hora_Limite_Excepcional TIME NOT NULL DEFAULT '09:00:00',
  Hora_Limite_Cesion TIME NOT NULL DEFAULT '10:30:00',
  Mensaje_Deshabilitado VARCHAR(255) NULL DEFAULT 'Este servicio de alimentacion se encuentra temporalmente inhabilitado por administracion.',
  Actualizado_Por VARCHAR(120) NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

CREATE TABLE IF NOT EXISTS sync_outbox (
  event_id CHAR(36) PRIMARY KEY,
  source_node ENUM('LOCAL', 'CLOUD') NOT NULL DEFAULT 'LOCAL',
  entidad VARCHAR(40) NOT NULL,
  operacion VARCHAR(30) NOT NULL,
  entity_uuid VARCHAR(64) NOT NULL,
  payload JSON NOT NULL,
  sync_status ENUM('PENDING', 'SYNCED', 'CONFLICT', 'ERROR') NOT NULL DEFAULT 'PENDING',
  attempts INT NOT NULL DEFAULT 0,
  last_error TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  synced_at DATETIME NULL,
  INDEX idx_sync_pending (sync_status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sync_inbox_processed (
  event_id CHAR(36) PRIMARY KEY,
  source_node ENUM('LOCAL', 'CLOUD') NOT NULL,
  processed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS solicitudes_guardado_campo (
  Id_Solicitud_Campo INT AUTO_INCREMENT PRIMARY KEY,
  uuid_solicitud CHAR(36) NOT NULL UNIQUE,
  Codigo_Acta VARCHAR(30) NOT NULL UNIQUE,
  Id_Ficha INT NOT NULL,
  Num_Ficha VARCHAR(30) NOT NULL,
  Nom_Programa VARCHAR(180) NOT NULL,
  Fec_Servicio DATE NOT NULL,
  Tip_Comida ENUM('Almuerzo') NOT NULL DEFAULT 'Almuerzo',
  Unidad_Productiva VARCHAR(60) NOT NULL DEFAULT 'SENA_EMPRESA_GENERAL',
  Detalle_Lugar_Practica VARCHAR(180) NOT NULL,
  Justificacion TEXT NOT NULL,
  Hora_Estimada_Llegada TIME NOT NULL DEFAULT '14:00:00',
  Modalidad_Guardado ENUM('GUARDAR_EN_COMEDOR', 'EMPACA_PARA_LLEVAR') NOT NULL DEFAULT 'GUARDAR_EN_COMEDOR',
  Total_Aprendices_Guardados INT NOT NULL DEFAULT 0,
  Total_Almuerzos_Entregados INT NOT NULL DEFAULT 0,
  Id_Usuario_Solicitante INT NOT NULL,
  Rol_Solicitante VARCHAR(50) NOT NULL,
  Id_Usuario_Aval_SenaEmpresa INT NULL,
  Estado_Solicitud ENUM('ACTIVA_GUARDADA', 'ENTREGADA_COMPLETA', 'ENTREGADA_PARCIAL', 'VENCIDA', 'CANCELADA') NOT NULL DEFAULT 'ACTIVA_GUARDADA',
  Observaciones_Cocina TEXT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_campo_fecha_ficha (Fec_Servicio, Id_Ficha),
  INDEX idx_campo_unidad (Unidad_Productiva, Fec_Servicio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS internado_temporal_sena_empresa (
  Id_Internado INT AUTO_INCREMENT PRIMARY KEY,
  Id_Usuario INT NOT NULL,
  NumDoc_Usuario BIGINT NOT NULL,
  Nom_Usuario VARCHAR(100) NULL,
  Ape_Usuario VARCHAR(100) NULL,
  Num_Ficha VARCHAR(30) NULL,
  Unidad_Productiva VARCHAR(120) NOT NULL DEFAULT 'SENA Empresa',
  Fecha_Inicio DATE NOT NULL,
  Fecha_Fin DATE NOT NULL,
  Rol_Original VARCHAR(50) NOT NULL DEFAULT 'Aprendiz Externo',
  Estado_Original_CenCon VARCHAR(10) NOT NULL DEFAULT 'No',
  Estado_Periodo ENUM('PROGRAMADO', 'ACTIVO', 'VENCIDO', 'CANCELADO') NOT NULL DEFAULT 'PROGRAMADO',
  Observaciones VARCHAR(255) NULL,
  Id_Usuario_Registro INT NULL,
  Rol_Usuario_Registro VARCHAR(50) NULL,
  Origen_Registro ENUM('EXCEL', 'MANUAL') NOT NULL DEFAULT 'EXCEL',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_internado_usuario_fechas (Id_Usuario, Fecha_Inicio, Fecha_Fin),
  INDEX idx_internado_estado_fin (Estado_Periodo, Fecha_Fin),
  INDEX idx_internado_numdoc (NumDoc_Usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. PROCEDIMIENTO IDEMPOTENTE DE ACTUALIZACION, INDICES Y LIMPIEZA DE ROLES
DROP PROCEDURE IF EXISTS sp_foodsys_canonical_upgrade;
DELIMITER $$
CREATE PROCEDURE sp_foodsys_canonical_upgrade()
BEGIN
  -- 2.1 Columnas de usuarios (FecIni_Pasantia, FecFin_Pasantia, Fec_Desancion, tokenVersion)
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'FecIni_Pasantia') THEN
    ALTER TABLE usuarios ADD COLUMN FecIni_Pasantia DATE NULL AFTER Fec_Desancion;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'FecFin_Pasantia') THEN
    ALTER TABLE usuarios ADD COLUMN FecFin_Pasantia DATE NULL AFTER FecIni_Pasantia;
  END IF;

  -- 2.2 Columnas de reservas (Tipo_Bebida, Lleva_Sopa, Es_Guardado_Campo, etc.)
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'reservas' AND COLUMN_NAME = 'Tipo_Bebida') THEN
    ALTER TABLE reservas ADD COLUMN Tipo_Bebida ENUM('FRIA','CALIENTE','NINGUNA') NOT NULL DEFAULT 'FRIA';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'reservas' AND COLUMN_NAME = 'Lleva_Sopa') THEN
    ALTER TABLE reservas ADD COLUMN Lleva_Sopa TINYINT(1) NOT NULL DEFAULT 1;
  END IF;
  ALTER TABLE reservas MODIFY COLUMN Est_Reserva VARCHAR(30) NOT NULL DEFAULT 'Generado';

  -- 2.3 Ampliar entity_uuid en sync_outbox para soportar documentos y UUIDs
  IF EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sync_outbox' AND COLUMN_NAME = 'entity_uuid') THEN
    ALTER TABLE sync_outbox MODIFY COLUMN entity_uuid VARCHAR(64) NOT NULL;
  END IF;

  -- 2.4 Indices compuestos de alto rendimiento (>500 concurrentes)
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'reservas' AND INDEX_NAME = 'idx_reservas_usuario_fecha_tipo') THEN
    CREATE INDEX idx_reservas_usuario_fecha_tipo ON reservas (Id_Usuario, Fec_Reserva, Tip_Reserva);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'reservas' AND INDEX_NAME = 'idx_reservas_estado_fecha') THEN
    CREATE INDEX idx_reservas_estado_fecha ON reservas (Est_Reserva, Fec_Reserva);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'menus' AND INDEX_NAME = 'idx_menus_fecha_tipo') THEN
    CREATE INDEX idx_menus_fecha_tipo ON menus (Fec_Menu, Tip_Menu);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND INDEX_NAME = 'idx_usuarios_estado') THEN
    CREATE INDEX idx_usuarios_estado ON usuarios (Est_Usuario);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notificaciones' AND INDEX_NAME = 'idx_notif_usuario_leido') THEN
    CREATE INDEX idx_notif_usuario_leido ON notificaciones (Id_Usuario, Leido);
  END IF;
END$$
DELIMITER ;
CALL sp_foodsys_canonical_upgrade();
DROP PROCEDURE IF EXISTS sp_foodsys_canonical_upgrade;

-- 3. DEDUPLICACION DE ROLES Y CATALOGO OFICIAL RBAC
-- Reasignar asignaciones en UsuariosRol hacia el menor Id_Rol de cada Nom_Rol antes de borrar duplicados
UPDATE UsuariosRol ur
INNER JOIN roles r_dup ON ur.Id_Rol = r_dup.Id_Rol
INNER JOIN (
  SELECT Nom_Rol, MIN(Id_Rol) AS min_id
  FROM roles
  GROUP BY Nom_Rol
) r_canon ON r_dup.Nom_Rol = r_canon.Nom_Rol
SET ur.Id_Rol = r_canon.min_id
WHERE ur.Id_Rol <> r_canon.min_id;

-- Eliminar filas duplicadas en UsuariosRol (mismo Id_Usuario y mismo Id_Rol)
DELETE ur1 FROM UsuariosRol ur1
INNER JOIN UsuariosRol ur2
  ON ur1.Id_Usuario = ur2.Id_Usuario
 AND ur1.Id_Rol = ur2.Id_Rol
 AND ur1.Id_UsuariosRol > ur2.Id_UsuariosRol;

-- Eliminar roles duplicados conservando el menor Id_Rol por nombre
DELETE r1 FROM roles r1
INNER JOIN roles r2
  ON r1.Nom_Rol = r2.Nom_Rol
 AND r1.Id_Rol > r2.Id_Rol;

-- Asegurar indice unico sobre Nom_Rol y sembrar todos los roles oficiales
DROP PROCEDURE IF EXISTS sp_seed_roles;
DELIMITER $$
CREATE PROCEDURE sp_seed_roles()
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'roles' AND INDEX_NAME = 'uk_nom_rol') THEN
    CREATE UNIQUE INDEX uk_nom_rol ON roles (Nom_Rol);
  END IF;
END$$
DELIMITER ;
CALL sp_seed_roles();
DROP PROCEDURE IF EXISTS sp_seed_roles;

INSERT IGNORE INTO roles (Nom_Rol, createdAt, updatedAt) VALUES
('Administrador', NOW(), NOW()),
('Coordinador', NOW(), NOW()),
('Supervisor', NOW(), NOW()),
('Monitor', NOW(), NOW()),
('Supervisor de Contrato', NOW(), NOW()),
('Cocina', NOW(), NOW()),
('Bienestar', NOW(), NOW()),
('Aprendiz Interno', NOW(), NOW()),
('Aprendiz Externo', NOW(), NOW()),
('Pasante Interno', NOW(), NOW()),
('Pasante Externo', NOW(), NOW()),
('Instructor', NOW(), NOW()),
('Vocero', NOW(), NOW()),
('SENA Empresa', NOW(), NOW()),
('Visitante', NOW(), NOW());

-- 4. NORMALIZACION DEL CATALOGO DE ESTADOS DE USUARIO (ELIMINACION DE 'Inactivo')
UPDATE usuarios SET Est_Usuario = 'Cancelado' WHERE Est_Usuario IN ('Inactivo', 'INACTIVO', 'inactivo');
UPDATE usuarios SET Est_Usuario = 'Formación' WHERE Est_Usuario IN ('En Formacion', 'EN FORMACION', 'EN FORMACIÓN', 'Activo', 'activo');
UPDATE usuarios SET Est_Usuario = 'Inducción' WHERE Est_Usuario IN ('En Induccion', 'EN INDUCCION', 'EN INDUCCIÓN');
UPDATE usuarios SET Est_Usuario = 'Etapa productiva' WHERE Est_Usuario IN ('Etapa Productiva', 'ETAPA PRODUCTIVA');
UPDATE usuarios SET Est_Usuario = 'Apoyo de sostenimiento' WHERE Est_Usuario IN ('Apoyo de Sostenimiento', 'APOYO DE SOSTENIMIENTO');
UPDATE usuarios SET Est_Usuario = 'Retiro voluntario' WHERE Est_Usuario IN ('Retiro Voluntario', 'RETIRO VOLUNTARIO');
UPDATE usuarios SET Est_Usuario = 'SENA empresa' WHERE Est_Usuario IN ('Sena Empresa', 'SENA EMPRESA');
UPDATE usuarios SET Est_Usuario = 'Turnos en SENA empresa' WHERE Est_Usuario IN ('Turno Sena Empresa', 'TURNO SENA EMPRESA');

-- 5. HORARIOS OFICIALES DE RACIONES (COLOMBIA UTC-5)
INSERT INTO configuracion_raciones (Tip_Racion, Habilitado, Cupo_Maximo, Hora_Inicio_Servicio, Hora_Fin_Servicio, Hora_Inicio_Reserva_Dia_Anterior, Hora_Limite_Reserva_Normal, Hora_Limite_Cancelacion, Hora_Limite_Excepcional, Hora_Limite_Cesion)
VALUES
('Desayuno', 1, 250, '06:00:00', '07:00:00', '06:00:00', '22:30:00', '22:30:00', '06:00:00', '05:30:00'),
('Almuerzo', 1, 450, '11:30:00', '13:30:00', '06:00:00', '22:30:00', '22:30:00', '09:00:00', '10:30:00'),
('Cena', 1, 250, '18:00:00', '19:00:00', '06:00:00', '22:30:00', '22:30:00', '17:00:00', '17:00:00')
ON DUPLICATE KEY UPDATE
  Hora_Inicio_Servicio = VALUES(Hora_Inicio_Servicio),
  Hora_Fin_Servicio = VALUES(Hora_Fin_Servicio),
  Hora_Limite_Excepcional = VALUES(Hora_Limite_Excepcional);

-- 6. MIGRACION HISTORICA DE RESERVAS VENCIDAS / CANCELADAS A CONSUMIDO (SIN ALTERAR GENERADO)
UPDATE reservas
SET Est_Reserva = 'Consumido'
WHERE Fec_Reserva < CURDATE()
  AND Est_Reserva IN ('Vencida', 'Vencido', 'Cancelada', 'Cancelado');
