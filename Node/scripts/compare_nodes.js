import { execSync } from "child_process";
import db from "../Database/db.js";

async function main() {
  const tables = [
    { name: "programas", linuxName: "programas" },
    { name: "fichas", linuxName: "fichas" },
    { name: "usuarios", linuxName: "usuarios" },
    { name: "usuariosrol", linuxName: "UsuariosRol" },
    { name: "platos", linuxName: "platos" },
    { name: "menus", linuxName: "menus" },
    { name: "reservas", linuxName: "reservas" },
    { name: "turnos", linuxName: "turnos" },
    { name: "pqrsf", linuxName: "pqrsf" },
  ];

  console.log("=== COMPARANDO BASE DE DATOS LOCAL vs HETZNER CLOUD ===");
  const results = [];

  for (const t of tables) {
    const [localRow] = await db.query(`SELECT COUNT(*) as count FROM ${t.name}`);
    const localCount = localRow[0]?.count ?? 0;

    let hetznerCount = "ERROR";
    try {
      const sshOut = execSync(
        `ssh -n root@foodsyslagranja.com "mysql -u root foodsys_db -N -e \\"SELECT COUNT(*) FROM ${t.linuxName};\\""`,
        { timeout: 10000, encoding: "utf8" }
      ).trim();
      hetznerCount = parseInt(sshOut, 10);
    } catch (err) {
      hetznerCount = `ERR: ${err.message}`;
    }

    results.push({
      Tabla: t.name,
      Local: localCount,
      Hetzner: hetznerCount,
      Sincronizado: localCount === hetznerCount ? "SI" : "NO"
    });
  }

  console.table(results);

  console.log("\n--- DETALLE DE TURNOS ---");
  const sshTurnos = execSync(
    'ssh -n root@foodsyslagranja.com "mysql -u root foodsys_db -e \\"SELECT Id_Turno, Id_Usuario, Fecha_Inicio, Estado FROM turnos ORDER BY Id_Turno;\\""',
    { encoding: "utf8" }
  );
  console.log("HETZNER:\n" + sshTurnos);

  const [localTurnos] = await db.query("SELECT Id_Turno, Id_Usuario, Fecha_Inicio, Estado FROM turnos ORDER BY Id_Turno");
  console.log("LOCAL:\n", localTurnos);

  process.exit(0);
}

main().catch(err => {
  console.error("Error en compare_nodes:", err);
  process.exit(1);
});
