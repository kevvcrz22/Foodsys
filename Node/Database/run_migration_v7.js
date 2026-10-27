import db from "./db.js";

async function run() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS internado_temporal_sena_empresa (
        Id_Registro INT AUTO_INCREMENT PRIMARY KEY,
        Id_Usuario INT NOT NULL,
        NumDoc_Usuario BIGINT NOT NULL,
        Nom_Usuario VARCHAR(100) NOT NULL,
        Ape_Usuario VARCHAR(100) NOT NULL,
        Num_Ficha VARCHAR(30) NULL,
        Unidad_Productiva VARCHAR(120) NOT NULL DEFAULT 'SENA Empresa' COMMENT 'Ej: Gestor de apicultura, Gestor de ganaderia, etc.',
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
        INDEX idx_it_doc_fechas (NumDoc_Usuario, Fecha_Inicio, Fecha_Fin),
        INDEX idx_it_estado_fin (Estado_Periodo, Fecha_Fin),
        INDEX idx_it_usuario (Id_Usuario)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("Table internado_temporal_sena_empresa created");

    const [cols] = await db.query(`
      SELECT COLUMN_NAME FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'reservas' AND COLUMN_NAME IN ('Tipo_Bebida', 'Lleva_Sopa')
    `);
    const colNames = cols.map((c) => c.COLUMN_NAME);

    if (!colNames.includes("Tipo_Bebida")) {
      await db.query(`
        ALTER TABLE reservas 
        ADD COLUMN Tipo_Bebida ENUM('FRIA', 'CALIENTE', 'NINGUNA') NOT NULL DEFAULT 'FRIA' COMMENT 'Tipo de bebida elegida: fria o caliente'
      `);
      console.log("Column Tipo_Bebida added to reservas");
    }

    if (!colNames.includes("Lleva_Sopa")) {
      await db.query(`
        ALTER TABLE reservas 
        ADD COLUMN Lleva_Sopa TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1 si el usuario desea sopa, 0 si no'
      `);
      console.log("Column Lleva_Sopa added to reservas");
    }

    console.log("Migration v7 executed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Migration v7 error:", err);
    process.exit(1);
  }
}

run();
