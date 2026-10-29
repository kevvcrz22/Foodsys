# Guia de Solucion Definitiva Local, GitHub y Despliegue en Hetzner — Foodsys ("La Granja" SENA)

## 1. Diagnostico y Solucion del Error Local (500 y AggregateError [ECONNREFUSED])

En las capturas de pantalla y terminal se combinaban cuatro causas tecnicas que quedaron resueltas de raiz en el codigo:

1. **Resolucion IPv4 directa (`127.0.0.1:8000`) en lugar de `localhost`:**
   - En Windows con Node 20+, `http://localhost:8000` intenta conectarse primero por IPv6 (`::1:8000`) mediante `internalConnectMultiple`, mientras que `Node/App.js` escuchaba en IPv4 (`0.0.0.0:8000`).
   - Al recibir `ECONNREFUSED`, el proxy interno de Vite devolvia automaticamente un HTTP 500 vacio, provocando el mensaje en ingles `Request failed with status code 500`.
   - **Solucion aplicada:** `Frontend/vite.config.js` y la conexion MySQL en `Node/Database/db.js` apuntan directamente a `127.0.0.1` y `Node/App.js` prioriza resolucion IPv4 (`dns.setDefaultResultOrder('ipv4first')`).

2. **Auto-arranque automatico del Backend y MySQL desde Vite (`autoIniciarBackendFoodsys`):**
   - Al detener `node App.js` para ejecutar `pnpm run dev` o `vite` en la misma ventana de terminal en `Frontend/`, el puerto 8000 quedaba apagado.
   - **Solucion aplicada:** Se integro el plugin supervisor `autoIniciarBackendFoodsys()` dentro de `Frontend/vite.config.js`. Aunque se abra una sola terminal en `Frontend/` y se ejecute unicamente `pnpm run dev`, Vite verifica si MySQL (3306) y el Backend (8000) estan activos; si no lo estan, inicia automaticamente MySQL de XAMPP y `Node/App.js` en segundo plano en esa misma terminal.

3. **Soporte CORS para HTTPS local (`https://localhost:5173`):**
   - Como Vite utiliza `basicSsl()` (`https: true`), el navegador envia el origen con `https://`.
   - **Solucion aplicada:** Se habilitaron `https://localhost:5173`, `https://127.0.0.1:5173` y cualquier direccion IP de la red local LAN/Wi-Fi (`https://192.168.x.x:5173`) en `Node/App.js`.

4. **Login resiliente y `.env` autogenerado:**
   - `Node/App.js` genera automaticamente `Node/.env` a partir de `Node/.env.example` si falta en el equipo local.
   - Asegura un `JWT_SECRET` de respaldo y verifica las columnas `uuid`, `token`, `tokenVersion` y `Fec_Desancion` en la tabla `usuarios`.
   - En `UsuariosService.Login`, permite iniciar sesion buscando por `NumDoc_Usuario` incluso si el aprendiz fue registrado en SOFIA Plus con TI en lugar de CC.

---

## 2. Unificacion Visual de Notificaciones y Confirmaciones (`notificacionesFoodsys.jsx`)

Se eliminaron los `window.alert()`, `window.confirm()` y `Swal.fire()` dispersos y se unificaron bajo `Frontend/src/utils/notificacionesFoodsys.jsx`:

- **Tarjetas interactivas de confirmacion (`confirmarAccionFoodsys`):** Con cabecera institucional *Foodsys • SENA La Granja*, icono contextual, borde lateral semantico (#2E5792 azul institucional, #e11d48 peligro/eliminar, #d97706 advertencia, #059669 exito) y botones redondeados.
- **Notificaciones Toast unificadas:** `notificarExito`, `notificarError`, `notificarInfo`.
- **Zona Horaria Colombia (`America/Bogota`):** Funcion centralizada `obtenerFechaHoyColombia()` para evitar que despues de las 7:00 PM el navegador salte al dia siguiente por diferencias UTC.

---

## 3. Pasos para Ejecutar en Local (Windows / La Granja)

1. Abre tu terminal en `Frontend/` y ejecuta:
   ```bash
   pnpm run dev
   ```
   *(Vite verificara y encendera automaticamente el Backend en el puerto 8000 y MySQL de XAMPP en el puerto 3306 si estan apagados).*

2. Para habilitar acceso desde celulares de aprendices por Wi-Fi local:
   - Ejecuta `HABILITAR_ACCESO_RED_LOCAL.bat` como Administrador una sola vez.

---

## 4. Pasos para Subir a GitHub y Desplegar en Hetzner (`foodsyslagranja.com`)

### En tu PC Local:
```bash
git add .
git commit -m "fix(prod): proxy IPv4 con auto-backend, login resiliente, notificaciones Foodsys unificadas y sincronizacion bidireccional"
git push origin main
```

### En el Servidor Hetzner:
```bash
cd /var/www/Foodsys
git pull origin main

# 1. Aplicar migracion SQL canonica idempotente
mysql -u root foodsys < Node/Database/foodsys_canonical_schema.sql

# 2. Instalar dependencias y compilar Frontend
cd /var/www/Foodsys/Node && pnpm install
cd /var/www/Foodsys/Frontend && pnpm install && pnpm run build

# 3. Reiniciar PM2 y verificar estado
pm2 reload foodsys-backend
pm2 status
```
