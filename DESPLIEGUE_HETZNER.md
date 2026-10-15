# Guía Maestra de Despliegue de Foodsys en Hetzner Cloud

Esta guía explica **paso a paso, desde cero**, cómo desplegar y poner en producción el sistema **Foodsys** en un servidor VPS de **Hetzner Cloud** con Ubuntu 24.04 / 22.04 LTS, Nginx, MySQL 8, Node.js 22, PM2 y Certificado SSL (HTTPS) gratuito con Let's Encrypt.

---

## 📋 1. Especificaciones Recomendadas en Hetzner Cloud

En la consola de [Hetzner Cloud Console](https://console.hetzner.cloud/):

| Parámetro | Valor Recomendado | Notas |
|---|---|---|
| **Ubicación** | Ashburn, VA (USA) o Falkenstein (Alemania) | Ashburn tiene menor latencia hacia Colombia (~80ms) |
| **Tipo de Servidor** | **CX22** (2 vCPU, 4 GB RAM, 40 GB NVMe) o **CX32** (4 vCPU, 8 GB RAM, 80 GB NVMe) | CX22 soporta 500+ usuarios concurrentes con Node en cluster |
| **Sistema Operativo** | **Ubuntu 24.04 LTS** (o 22.04 LTS) | x86 (Intel / AMD) |
| **Clave SSH** | Agrega tu clave pública SSH local (`~/.ssh/id_rsa.pub` o `id_ed25519.pub`) | Recomendado para acceso sin contraseña |
| **Firewalls (Hetzner Cloud)** | Permitir puertos: `22` (SSH), `80` (HTTP), `443` (HTTPS) | Bloquear todo lo demás |

---

## 🛠️ 2. Primer Acceso y Endurecimiento del Servidor

Conéctate por SSH al servidor recién creado (reemplaza `IP_DEL_SERVIDOR` con tu IP pública):

```bash
ssh root@IP_DEL_SERVIDOR
```

### 2.1. Actualizar el sistema operativo
```bash
apt update && apt upgrade -y
```

### 2.2. Crear un usuario de despliegue no-root con privilegios sudo
```bash
adduser deployer
usermod -aG sudo deployer

# Copiar las claves SSH de root al nuevo usuario
mkdir -p /home/deployer/.ssh
cp /root/.ssh/authorized_keys /home/deployer/.ssh/
chown -R deployer:deployer /home/deployer/.ssh
chmod 700 /home/deployer/.ssh
chmod 600 /home/deployer/.ssh/authorized_keys
```

### 2.3. Configurar el Firewall Local (UFW)
```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp      # SSH
ufw allow 80/tcp      # HTTP
ufw allow 443/tcp     # HTTPS
ufw --force enable
ufw status
```

---

## 📦 3. Instalación del Stack de Software

Inicia sesión como el usuario `deployer`:
```bash
su - deployer
```

### 3.1. Instalar Node.js 22 LTS y pnpm
```bash
# Instalar curl y dependencias base
sudo apt install -y curl git build-essential htop fail2ban

# Instalar Node.js 22 LTS desde NodeSource
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Habilitar pnpm y PM2 globalmente
sudo npm install -g pnpm pm2
```

Verifica las versiones instaladas:
```bash
node -v   # Debe ser v22.x.x
pnpm -v   # Debe ser v9.x o v10+
pm2 -v
```

### 3.2. Instalar y Configurar MySQL Server 8
```bash
sudo apt install -y mysql-server

# Iniciar y habilitar el servicio en arranque
sudo systemctl start mysql
sudo systemctl enable mysql
```

Ejecuta el asistente de seguridad de MySQL:
```bash
sudo mysql_secure_installation
```
*(Responde `Y` a habilitar validación de contraseñas, define contraseña para root, elimina usuarios anónimos, deshabilita login remoto de root y elimina la base de datos de test).*

#### Crear la Base de Datos y el Usuario de Foodsys
Entra a la consola de MySQL como root:
```bash
sudo mysql
```

Ejecuta las siguientes instrucciones SQL dentro de MySQL (reemplaza `TU_CONTRASENA_SEGURA` por una contraseña fuerte):
```sql
CREATE DATABASE foodsys CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER 'foodsys_user'@'localhost' IDENTIFIED BY 'TU_CONTRASENA_SEGURA';

GRANT ALL PRIVILEGES ON foodsys.* TO 'foodsys_user'@'localhost';

FLUSH PRIVILEGES;
EXIT;
```

> [!NOTE]
> Si tienes un volcado inicial de datos (`dump.sql`), impórtalo con:
> `mysql -u foodsys_user -p foodsys < dump.sql`

### 3.3. Instalar Nginx y Certbot (SSL)
```bash
sudo apt install -y nginx certbot python3-certbot-nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

## 📂 4. Clonar el Proyecto y Preparar Directorios

```bash
# Crear directorio web
sudo mkdir -p /var/www/foodsys
sudo chown -R deployer:www-data /var/www/foodsys
sudo chmod -R 775 /var/www/foodsys

# Clonar el repositorio
cd /var/www
git clone https://github.com/kevvcrz22/Foodsys.git foodsys
cd /var/www/foodsys

# Crear carpetas necesarias
mkdir -p logs
mkdir -p Node/uploads
```

---

## 🔑 5. Configurar Variables de Entorno (.env)

### 5.1. Generar claves criptográficas seguras
Ejecuta estos dos comandos en la terminal del servidor para generar tus claves secretas:
```bash
# Para JWT_SECRET:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Para QR_ENCRYPTION_KEY:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5.2. Configurar el Backend (`/var/www/foodsys/Node/.env`)
Crea o edita el archivo:
```bash
nano /var/www/foodsys/Node/.env
```

Pega la siguiente configuración reemplazando tus datos reales:
```env
NODE_ENV=production
PORT=8000

# Base de datos MySQL
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=foodsys
DB_USER=foodsys_user
DB_PASS=TU_CONTRASENA_SEGURA

# Claves criptográficas generadas
JWT_SECRET=pega_aqui_el_secreto_hex_de_128_caracteres
QR_ENCRYPTION_KEY=pega_aqui_el_secreto_hex_de_64_caracteres

# Orígenes CORS permitidos (tu dominio de producción)
CORS_ORIGIN=https://foodsyslagranja.com

# Notificaciones y correo SMTP (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=fierrokkevin@gmail.com
SMTP_PASS=tu_app_password_de_16_caracteres
EMAIL_PASS=tu_app_password_de_16_caracteres
CONTACT_EMAIL=fierrokkevin@gmail.com

# URL pública del Frontend (para enlaces de recuperación de clave)
FRONTEND_URL=https://foodsyslagranja.com
```

### 5.3. Configurar el Frontend (`/var/www/foodsys/Frontend/.env.production`)
```bash
nano /var/www/foodsys/Frontend/.env.production
```

Contenido:
```env
VITE_API_URL=https://foodsyslagranja.com
VITE_ENCRYPTION_KEY=pega_aqui_el_secreto_hex_de_64_caracteres
```

---

## 🚀 6. Compilar Frontend e Instalar Dependencias

```bash
cd /var/www/foodsys/Node
pnpm install --frozen-lockfile

cd /var/www/foodsys/Frontend
pnpm install --frozen-lockfile
pnpm run build
```

---

## ⚙️ 7. Configuración de PM2 para el Backend

Inicia el backend utilizando la configuración optimizada para cluster:

```bash
cd /var/www/foodsys
pm2 start ecosystem.config.cjs
pm2 save

# Configurar autoarranque en reinicio del servidor:
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u deployer --hp /home/deployer
```

Para verificar que el backend está corriendo correctamente:
```bash
pm2 status
pm2 logs foodsys-backend --lines 20
```

---

## 🌐 8. Configuración de Nginx y Dominio

Copia la configuración de Nginx proporcionada en el repositorio:
```bash
sudo cp /var/www/foodsys/nginx.conf /etc/nginx/sites-available/foodsys.conf

# Si tu dominio es diferente a foodsyslagranja.com, edita el archivo:
sudo nano /etc/nginx/sites-available/foodsys.conf

# Habilita el sitio eliminando el default y creando el enlace simbólico:
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -s /etc/nginx/sites-available/foodsys.conf /etc/nginx/sites-enabled/

# Verifica la sintaxis de Nginx
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔒 9. Certificado SSL Gratis con Certbot (HTTPS)

Asegúrate de que tus registros DNS tipo `A` en tu proveedor de dominio apunten a la IP pública de tu servidor Hetzner:
- `foodsyslagranja.com` -> `IP_DEL_SERVIDOR`
- `www.foodsyslagranja.com` -> `IP_DEL_SERVIDOR`

Ejecuta Certbot:
```bash
sudo certbot --nginx -d foodsyslagranja.com -d www.foodsyslagranja.com
```
Certbot configurará automáticamente la renovación automática y los certificados SSL en Nginx.

---

## ⏰ 10. Automatización de Tareas (Cron)

### 10.1. Permisos de ejecución para los scripts
```bash
chmod +x /var/www/foodsys/deploy.sh
chmod +x /var/www/foodsys/backup-db.sh
```

### 10.2. Programar Backup Diario de Base de Datos
Edita las tareas programadas:
```bash
crontab -e
```
Agrega la siguiente línea al final para respaldar la base de datos todas las madrugadas a las 3:00 AM:
```cron
0 3 * * * /var/www/foodsys/backup-db.sh > /dev/null 2>&1
```

---

## 🔄 11. Cómo Actualizar el Proyecto en el Futuro (Zero-Downtime)

Cada vez que subas cambios a GitHub (`git push origin main`), solo necesitas conectarte al servidor y ejecutar:

```bash
cd /var/www/foodsys
./deploy.sh
```

El script automáticamente:
1. Descarga los cambios con `git pull`
2. Instala dependencias nuevas si las hay
3. Compila el frontend para producción
4. Recarga el cluster de PM2 sin desconectar a los usuarios (`zero downtime reload`)
5. Recarga Nginx

---

## 🔍 12. Monitoreo y Diagnóstico

- **Ver estado del backend:** `pm2 status`
- **Ver logs en tiempo real:** `pm2 logs foodsys-backend`
- **Monitoreo de CPU y Memoria interactivo:** `pm2 monit` o `htop`
- **Ver logs de acceso Nginx:** `sudo tail -f /var/log/nginx/access.log`
- **Ver logs de error Nginx:** `sudo tail -f /var/log/nginx/error.log`
- **Reiniciar servicio MySQL:** `sudo systemctl restart mysql`
- **Reiniciar Nginx:** `sudo systemctl reload nginx`
