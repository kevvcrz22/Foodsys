@echo off
title Foodsys Local 100%% Offline - SENA La Granja
color 0A
cls
echo ==========================================================
echo        INICIANDO FOODSYS - MODO LOCAL (CON O SIN INTERNET)
echo            Centro Agropecuario La Granja (SENA)
echo ==========================================================
echo.

cd /d "c:\Foodsys\Foodsys"

:: 1. Comprobar si MySQL esta activo en puerto 3306
netstat -ano | findstr ":3306" >nul
if %errorLevel% neq 0 (
    echo [1/4] Iniciando Base de Datos MySQL de XAMPP en segundo plano...
    if exist "C:\xampp\mysql\bin\mysqld.exe" (
        start "" "C:\xampp\mysql\bin\mysqld.exe" --defaults-file="C:\xampp\mysql\bin\my.ini" --standalone
        ping 127.0.0.1 -n 4 > nul
    ) else (
        echo       -^> AVISO: No se encontro C:\xampp\mysql\bin\mysqld.exe.
        echo                 Asegurate de encender MySQL en el panel de XAMPP.
    )
) else (
    echo [1/4] Base de Datos MySQL [ACTIVA en puerto 3306].
)

:: 2. Limpiar procesos previos en puertos 8000 y 5173 o pnpm colgado
echo [2/4] Limpiando procesos previos en puertos 8000 y 5173...
taskkill /f /im pnpm.exe >nul 2>&1
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 8000, 5173 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" >nul 2>&1

:: 3. Iniciar Backend Node.js directamente con node.exe (sin depender de internet)
echo [3/4] Iniciando Servidor Backend (Node.js en puerto 8000)...
start "Foodsys Backend (Puerto 8000)" cmd /k "cd /d c:\Foodsys\Foodsys\Node && node App.js"

echo       -^> Esperando a que el Backend abra el puerto 8000...
set /a INTENTOS=0
:ESPERAR_BACKEND
netstat -ano | findstr ":8000 " >nul
if %errorLevel% equ 0 goto BACKEND_LISTO
set /a INTENTOS+=1
if %INTENTOS% geq 30 goto BACKEND_LISTO
ping 127.0.0.1 -n 2 > nul
goto ESPERAR_BACKEND
:BACKEND_LISTO
echo       -^> Backend listo en http://127.0.0.1:8000

:: 4. Iniciar Frontend Vite directamente con node.exe (evita bloqueo de pnpm sin internet)
echo [4/4] Iniciando Frontend Vite (HTTPS en puerto 5173, 100%% Offline)...
start "Foodsys Frontend (Puerto 5173)" cmd /k "cd /d c:\Foodsys\Foodsys\Frontend && node .\node_modules\vite\bin\vite.js"

echo       -^> Esperando a que el puerto 5173 este listo...
set /a INTENTOS_F=0
:ESPERAR_FRONTEND
netstat -ano | findstr ":5173 " >nul
if %errorLevel% equ 0 goto FRONTEND_LISTO
set /a INTENTOS_F+=1
if %INTENTOS_F% geq 20 goto FRONTEND_LISTO
ping 127.0.0.1 -n 2 > nul
goto ESPERAR_FRONTEND
:FRONTEND_LISTO

cd /d "c:\Foodsys\Foodsys\Node"
node scripts\generar_qr_red.js >nul 2>&1

echo.
echo ==========================================================
echo  FOODSYS LOCAL INICIADO CON EXITO (MODO CONTINGENCIA LISTO)
echo.
echo  ^>^> ACCESO EN ESTE EQUIPO:
echo     https://localhost:5173
echo.
echo  ^>^> ACCESO EN RED LOCAL (CELULARES / MONITOR):
echo     Abre la imagen: c:\Foodsys\Foodsys\QR_Acceso_Foodsys.png
echo ==========================================================
echo.
start https://localhost:5173
exit
