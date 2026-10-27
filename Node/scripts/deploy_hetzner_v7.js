// Node/scripts/deploy_hetzner_v7.js
// Script de despliegue y actualizacion de Hetzner Cloud a version Foodsys V7
// (Internado Temporal, Sopa y Bebida Caliente/Fria, Notificaciones Emergentes y Fix Tab 4)

import { execSync } from "child_process";
import fs from "fs";

console.log("=================================================================");
console.log("🚀 DESPLIEGUE A HETZNER CLOUD (foodsyslagranja.com) - FOODSYS V7");
console.log("=================================================================\n");

try {
  // 1. Probar conexion SSH
  console.log("1. Verificando conexion SSH con Hetzner...");
  const sshTest = execSync('ssh -n root@foodsyslagranja.com "echo SSH_CONECTADO"', { encoding: "utf8" });
  console.log("   ->", sshTest.trim());

  // 2. Ejecutar Git Pull en Hetzner
  console.log("\n2. Ejecutando Git Pull en /var/www/Foodsys...");
  const gitPull = execSync('ssh -n root@foodsyslagranja.com "cd /var/www/Foodsys && git checkout . && git pull origin main"', { encoding: "utf8" });
  console.log("   ->", gitPull.trim());

  // 3. Aplicar migracion v7 en la base de datos de Hetzner
  console.log("\n3. Aplicando migracion V7 en MySQL de Hetzner...");
  const sqlV7Path = "./Node/Database/migration_v7_internado_temporal_sopa_bebida.sql";
  if (fs.existsSync(sqlV7Path)) {
    console.log("   -> Copiando migration_v7_internado_temporal_sopa_bebida.sql...");
    execSync(`scp ${sqlV7Path} root@foodsyslagranja.com:/root/migration_v7.sql`);
    const migV7Res = execSync('ssh -n root@foodsyslagranja.com "mysql -u root foodsys_db < /root/migration_v7.sql && echo MIGRACION_V7_APLICADA"', { encoding: "utf8" });
    console.log("   ->", migV7Res.trim());
  }

  // 4. Instalar dependencias si se requiere y compilar frontend
  console.log("\n4. Compilando Frontend en Hetzner...");
  try {
    execSync('ssh -n root@foodsyslagranja.com "cd /var/www/Foodsys/Frontend && npm run build"', { encoding: "utf8", stdio: "inherit" });
  } catch (errBuild) {
    console.log("   -> Fallback con pnpm build...");
    execSync('ssh -n root@foodsyslagranja.com "cd /var/www/Foodsys/Frontend && pnpm run build"', { encoding: "utf8", stdio: "inherit" });
  }
  console.log("   -> Frontend compilado con exito en Hetzner.");

  // 5. Reiniciar backend con PM2
  console.log("\n5. Reiniciando servicio PM2 en Hetzner...");
  const pm2Res = execSync('ssh -n root@foodsyslagranja.com "pm2 reload foodsys-backend --update-env || pm2 restart foodsys-backend"', { encoding: "utf8" });
  console.log("   ->", pm2Res.trim());

  // 6. Recargar Nginx
  console.log("\n6. Recargando Nginx...");
  execSync('ssh -n root@foodsyslagranja.com "nginx -t && systemctl reload nginx"', { encoding: "utf8" });
  console.log("   -> Nginx recargado con exito.");

  // 7. Health check
  console.log("\n7. Verificando API Health...");
  const healthCheck = execSync('curl -s https://foodsyslagranja.com/api/Sync/health || echo FALLBACK', { encoding: "utf8" });
  console.log("   -> Health respuesta:", healthCheck.trim());

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
