-- Node/Database/migration_v6_bolsa_solidaria.sql
-- Ampliacion de Est_Reserva para soportar estado Liberado de la Bolsa Solidaria Bienestar

ALTER TABLE reservas MODIFY COLUMN Est_Reserva VARCHAR(30) NOT NULL DEFAULT 'Generado';

-- Recuperar reservas que hayan quedado vacias por restriccion del enum anterior
UPDATE reservas 
SET Est_Reserva = 'Liberado' 
WHERE motivo_cesion LIKE 'BOLSA_SOLIDARIA%' AND (Est_Reserva = '' OR Est_Reserva = 'Cancelado');
