@echo off
title Foodsys Local - SENA La Granja
color 0A
cls
echo ==========================================================
echo           INICIANDO FOODSYS - SISTEMA LOCAL
echo            Centro Agropecuario La Granja (SENA)
echo ==========================================================
echo.

cd /d "c:\Foodsys\Foodsys"

:: 1. Comprobar si MySQL esta activo en puerto 3306
netstat -ano | findstr ":3306" >nul
if %errorLevel% neq 0 (
    echo [0/4] Verificando Base de Datos MySQL...
    if exist "C:\xampp\mysql\bin\mysqld.exe" (
        echo       -> Iniciando MySQL de XAMPP en segundo plano...
        start "" "C:\xampp\mysql\bin\mysqld.exe" --defaults-file="C:\xampp\mysql\bin\my.ini" --standalone
        ping 127.0.0.1 -n 3 > nul
    ) else (
        echo       -> AVISO: MySQL no parece estar corriendo en el puerto 3306.
        echo                 Asegurate de encender MySQL en XAMPP.
    )
)

:: 2. Limpiar procesos antiguos o huerfanos en puertos 8000 y 5173
echo [1/4] Limpiando procesos previos en puertos 8000 y 5173...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 8000, 5173 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" >nul 2>&1

:: 3. Iniciar Backend
echo [2/4] Iniciando Servidor Backend (Node.js en puerto 8000)...
start "Foodsys Backend (Puerto 8000)" cmd /k "cd /d c:\Foodsys\Foodsys\Node && node App.js"

:: 3.1 Esperar a que el backend abra el puerto 8000 (revisa tablas de MySQL antes de escuchar)
::     Maximo 120 segundos. Asi el login no falla con error 500 por entrar demasiado pronto.
echo       -^> Esperando a que el backend termine de revisar la base de datos...
set /a INTENTOS=0
:ESPERAR_BACKEND
netstat -ano | findstr "LISTENING" | findstr ":8000 " >nul
if %errorLevel% equ 0 goto BACKEND_LISTO
set /a INTENTOS+=1
if %INTENTOS% geq 60 (
    echo       -^> AVISO: El backend no abrio el puerto 8000 en 120 s. Revisa la ventana "Foodsys Backend".
    goto BACKEND_LISTO
)
ping 127.0.0.1 -n 3 > nul
goto ESPERAR_BACKEND
:BACKEND_LISTO
echo       -^> Backend listo en el puerto 8000.

:: 4. Iniciar Frontend
echo [3/4] Iniciando Frontend (Vite en puerto 5173)...
start "Foodsys Frontend (Puerto 5173)" cmd /k "cd /d c:\Foodsys\Foodsys\Frontend && pnpm run dev"

:: 5. Esperar a que los servidores inicien
echo [4/4] Esperando inicio de servicios y generando QR de red...
ping 127.0.0.1 -n 6 > nul

cd /d "c:\Foodsys\Foodsys\Node"
node scripts\generar_qr_red.js

echo.
echo ==========================================================
echo  Foodsys Local iniciado con exito!
echo.
echo  >> ACCESO EN ESTE EQUIPO:
echo     https://localhost:5173
echo.
echo  >> ACCESO DESDE CELULARES O TABLETS EN LA RED:
echo     Abre o proyecta la imagen: c:\Foodsys\Foodsys\QR_Acceso_Foodsys.png
echo ==========================================================
echo.
start https://localhost:5173
exit
