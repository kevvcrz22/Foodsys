// Node/scripts/sincronizar_platos_ambos_nodos.js
// Sincroniza y fusiona los platos creados en local y en la nube (Hetzner)
// garantizando que ambos servidores tengan exactamente los mismos 24 platos.

import db from "../Database/db.js";
import { execSync } from "child_process";
import fs from "fs";

async function main() {
  console.log("=== INICIANDO UNIFICACION DE PLATOS LOCAL Y CLOUD ===");

  // 1. Obtener los 10 platos creados en local
  const [localPlatos] = await db.query(
    "SELECT Nom_Plato, Des_Plato, Img_Plato, Tip_Plato FROM platos ORDER BY Id_Plato ASC"
  );
  console.log(`[Local] Platos leidos: ${localPlatos.length}`);

  // 2. Obtener los 14 platos creados en Hetzner
  const hetznerRaw = execSync(
    `ssh -o StrictHostKeyChecking=no root@foodsyslagranja.com "mysql -u foodsys_user -ptu_contraseña_segura foodsys_db -e 'SELECT Nom_Plato, Des_Plato, Img_Plato, Tip_Plato FROM platos ORDER BY Id_Plato ASC;' -B"`,
    { encoding: "utf8" }
  );

  const lineas = hetznerRaw.trim().split("\n").filter(l => !l.startsWith("mysql:") && !l.startsWith("Nom_Plato"));
  const hetznerPlatos = lineas.map(l => {
    const [Nom_Plato, Des_Plato, Img_Plato, Tip_Plato] = l.split("\t");
    return { Nom_Plato, Des_Plato, Img_Plato, Tip_Plato };
  });
  console.log(`[Hetzner] Platos leidos: ${hetznerPlatos.length}`);

  // 3. Fusionar sin duplicados por Nom_Plato
  const listaUnificada = [...hetznerPlatos];
  for (const lp of localPlatos) {
    const yaExiste = listaUnificada.some(
      p => p.Nom_Plato.trim().toLowerCase() === lp.Nom_Plato.trim().toLowerCase()
    );
    if (!yaExiste) {
      listaUnificada.push(lp);
    }
  }

  console.log(`[Total Unificado] Platos a sincronizar en ambos lados: ${listaUnificada.length}`);

  // 4. Actualizar base de datos Local
  await db.query("SET FOREIGN_KEY_CHECKS = 0;");
  await db.query("TRUNCATE TABLE platos;");
  for (let i = 0; i < listaUnificada.length; i++) {
    const p = listaUnificada[i];
    await db.query(
      "INSERT INTO platos (Id_Plato, Nom_Plato, Des_Plato, Img_Plato, Tip_Plato, createdat, updatedat) VALUES (?, ?, ?, ?, ?, NOW(), NOW())",
      {
        replacements: [i + 1, p.Nom_Plato, p.Des_Plato, p.Img_Plato, p.Tip_Plato]
      }
    );
  }
  await db.query("SET FOREIGN_KEY_CHECKS = 1;");
  console.log("[Local] Base de datos local actualizada con exito.");

  // 5. Generar script SQL para actualizar Hetzner
  let sqlHetzner = "SET FOREIGN_KEY_CHECKS = 0;\nTRUNCATE TABLE platos;\n";
  for (let i = 0; i < listaUnificada.length; i++) {
    const p = listaUnificada[i];
    const nom = (p.Nom_Plato || "").replace(/'/g, "''");
    const des = (p.Des_Plato || "").replace(/'/g, "''");
    const img = (p.Img_Plato || "").replace(/'/g, "''");
    const tip = (p.Tip_Plato || "Almuerzo").replace(/'/g, "''");
    sqlHetzner += `INSERT INTO platos (Id_Plato, Nom_Plato, Des_Plato, Img_Plato, Tip_Plato, createdat, updatedat) VALUES (${i + 1}, '${nom}', '${des}', '${img}', '${tip}', NOW(), NOW());\n`;
  }
  sqlHetzner += "SET FOREIGN_KEY_CHECKS = 1;\n";

  fs.writeFileSync("./Node/scripts/sync_platos.sql", sqlHetzner, "utf8");

  // Subir y ejecutar en Hetzner
  execSync(
    `scp -o StrictHostKeyChecking=no ./Node/scripts/sync_platos.sql root@foodsyslagranja.com:/root/sync_platos.sql`
  );
  execSync(
    `ssh -o StrictHostKeyChecking=no root@foodsyslagranja.com "mysql -u foodsys_user -ptu_contraseña_segura foodsys_db < /root/sync_platos.sql"`
  );
  console.log("[Hetzner] Base de datos en Hetzner actualizada con exito.");

  console.log("=== SINCRONIZACION COMPLETADA CON EXITO ===");
  process.exit(0);
}

main().catch(err => {
  console.error("Error al sincronizar:", err);
  process.exit(1);
});
