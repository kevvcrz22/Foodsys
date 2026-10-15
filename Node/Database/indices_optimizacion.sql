-- =====================================================================
-- Foodsys - Script de Optimización e Índices de Alto Rendimiento (MySQL 8)
-- Objetivo: Reducir tiempos de consulta de 200ms a < 2ms bajo carga de 500+ usuarios concurrentes.
-- Idempotente: Si el índice ya existe, no produce error.
-- =====================================================================

USE foodsys_db;

DELIMITER $$

DROP PROCEDURE IF EXISTS CrearIndiceSiNoExiste$$
CREATE PROCEDURE CrearIndiceSiNoExiste(
    IN p_tabla VARCHAR(64),
    IN p_nombre_indice VARCHAR(64),
    IN p_columnas VARCHAR(255)
)
BEGIN
    DECLARE v_existe INT DEFAULT 0;

    SELECT COUNT(1) INTO v_existe
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = p_tabla
      AND INDEX_NAME = p_nombre_indice;

    IF v_existe = 0 THEN
        SET @sql = CONCAT('CREATE INDEX ', p_nombre_indice, ' ON ', p_tabla, ' (', p_columnas, ');');
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
        SELECT CONCAT('Índice ', p_nombre_indice, ' creado exitosamente en ', p_tabla) AS Resultado;
    ELSE
        SELECT CONCAT('El índice ', p_nombre_indice, ' ya existía en ', p_tabla) AS Resultado;
    END IF;
END$$

DELIMITER ;

-- 1. Índices para la tabla `reservas` (Consultas críticas concurrentes a las 6:30 PM)
CALL CrearIndiceSiNoExiste('reservas', 'idx_reservas_fecha_estado', 'Fec_Reserva, Est_Reserva');
CALL CrearIndiceSiNoExiste('reservas', 'idx_reservas_usuario_fecha', 'Id_Usuario, Fec_Reserva');
CALL CrearIndiceSiNoExiste('reservas', 'idx_reservas_tipo_fecha', 'Tip_Reserva, Fec_Reserva');

-- 2. Índices para la tabla `usuarios` (Búsquedas rápidas en login y validación QR)
CALL CrearIndiceSiNoExiste('usuarios', 'idx_usuarios_numdoc', 'NumDoc_Usuario');
CALL CrearIndiceSiNoExiste('usuarios', 'idx_usuarios_estado', 'Est_Usuario');

-- 3. Índices para la tabla `menus` (Consulta instantánea de menú del día)
CALL CrearIndiceSiNoExiste('menus', 'idx_menus_fecha_tipo', 'Fec_Menu, Tip_Menu');

-- 4. Índices para la tabla `turnos` (Verificación rápida de turno activo de Supervisor)
CALL CrearIndiceSiNoExiste('turnos', 'idx_turnos_estado', 'Estado, Fecha_Inicio');

-- 5. Índices para la tabla `notificaciones` (Campana de avisos en tiempo real)
CALL CrearIndiceSiNoExiste('notificaciones', 'idx_notificaciones_usuario_leido', 'Id_Usuario, Leido');

-- Limpiar procedimiento auxiliar
DROP PROCEDURE IF EXISTS CrearIndiceSiNoExiste;

-- Confirmar optimización
SELECT 'Optimización de índices completada con éxito para Foodsys' AS Estado_Optimizacion;
