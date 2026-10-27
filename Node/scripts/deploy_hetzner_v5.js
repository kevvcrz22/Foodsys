// Node/scripts/deploy_hetzner_v5.js
// Script de despliegue y actualizacion de Hetzner Cloud a version Foodsys V5.1

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

console.log("=== DESPLIEGUE A HETZNER CLOUD (foodsyslagranja.com) ===");

try {
  // 1. Probar conexion SSH
  console.log("1. Verificando conexion SSH...");
  const sshTest = execSync('ssh -n root@foodsyslagranja.com "echo SSH_CONECTADO"', { encoding: "utf8" });
  console.log("   ->", sshTest.trim());

  // 2. Ejecutar Git Pull en Hetzner
  console.log("2. Ejecutando Git Pull en /var/www/Foodsys...");
  const gitPull = execSync('ssh -n root@foodsyslagranja.com "cd /var/www/Foodsys && git checkout . && git pull origin main"', { encoding: "utf8" });
  console.log("   ->", gitPull.trim());

  // 3. Ejecutar migracion SQL V5 en la base de datos de Hetzner
  console.log("3. Aplicando migracion V5 en MySQL de Hetzner...");
  const sqlV5Path = "./Node/Database/migration_v5_campo_sena_empresa.sql";
  if (fs.existsSync(sqlV5Path)) {
    execSync(`scp ${sqlV5Path} root@foodsyslagranja.com:/root/migration_v5.sql`);
    const migResult = execSync('ssh -n root@foodsyslagranja.com "mysql -u root foodsys_db < /root/migration_v5.sql && echo MIGRACION_EXITOSA"', { encoding: "utf8" });
    console.log("   ->", migResult.trim());
  }

  // 4. Instalar dependencias si hubieran cambiado
  console.log("4. Verificando dependencias en Node y Frontend...");
  execSync('ssh -n root@foodsyslagranja.com "cd /var/www/Foodsys/Frontend && pnpm run build"', { encoding: "utf8", stdio: "inherit" });
  console.log("   -> Frontend compilado con exito en Hetzner.");

  // 5. Reiniciar backend con PM2
  console.log("5. Reiniciando servicio PM2 en Hetzner...");
  const pm2Res = execSync('ssh -n root@foodsyslagranja.com "pm2 reload foodsys-backend --update-env"', { encoding: "utf8" });
  console.log("   ->", pm2Res.trim());

  // 6. Recargar Nginx
  console.log("6. Recargando Nginx...");
  execSync('ssh -n root@foodsyslagranja.com "nginx -t && systemctl reload nginx"', { encoding: "utf8" });
  console.log("   -> Nginx recargado con exito.");

  console.log("\n=======================================================");
  console.log("✅ DESPLIEGUE A HETZNER CLOUD COMPLETADO EXITOSAMENTE!");
  console.log("   URL: https://foodsyslagranja.com");
  console.log("=======================================================");
} catch (err) {
  console.error("ERROR en despliegue a Hetzner:", err.message);
  if (err.stdout) console.log("STDOUT:", err.stdout.toString());
  if (err.stderr) console.error("STDERR:", err.stderr.toString());
  process.exit(1);
}
