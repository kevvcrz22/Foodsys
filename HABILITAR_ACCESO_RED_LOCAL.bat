@echo off
title Habilitar Acceso en Red Local - Foodsys
color 0A

:: 1. Comprobar y solicitar permisos de Administrador automaticamente
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ==============================================================
    echo  Solicitando permisos de Administrador para configurar el Firewall...
    echo ==============================================================
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

echo ==============================================================
echo    FOODSYS - CONFIGURACION INTELIGENTE DE RED LOCAL (LAN / WI-FI)
echo    Centro Agropecuario La Granja - SENA
echo ==============================================================
echo.

echo [1/4] Creando reglas de entrada en el Firewall de Windows (Puertos 5173 y 8000)...
netsh advfirewall firewall delete rule name="Foodsys_Frontend_5173" >nul 2>&1
netsh advfirewall firewall add rule name="Foodsys_Frontend_5173" dir=in action=allow protocol=TCP localport=5173 profile=any >nul

netsh advfirewall firewall delete rule name="Foodsys_Backend_8000" >nul 2>&1
netsh advfirewall firewall add rule name="Foodsys_Backend_8000" dir=in action=allow protocol=TCP localport=8000 profile=any >nul

netsh advfirewall firewall delete rule name="Foodsys_Node_App" >nul 2>&1
netsh advfirewall firewall add rule name="Foodsys_Node_App" dir=in action=allow program="%ProgramFiles%\nodejs\node.exe" profile=any >nul
echo       -> Reglas de Firewall aplicadas correctamente (PERMITIR TCP 5173, 8000 y Node.exe).

echo.
echo [2/4] Configurando adaptador de red como Red Privada (permite trafico entrante)...
powershell -Command "Get-NetConnectionProfile | Set-NetConnectionProfile -NetworkCategory Private -ErrorAction SilentlyContinue" >nul 2>&1
echo       -> Perfil de red establecido en Privado correctamente.

echo.
echo [3/4] Generando Codigo QR y detectando IP dinamica...
cd /d "c:\Foodsys\Foodsys\Node"
node scripts\generar_qr_red.js

echo.
echo [4/4] Verificando servidores activos...
netstat -ano | findstr ":5173" >nul
if %errorLevel% equ 0 (
    echo       -> Frontend Vite [ACTIVO en puerto 5173]
) else (
    echo       -> AVISO: Frontend no detectado en 5173. Ejecuta INICIAR_FOODSYS_LOCAL.bat
)

netstat -ano | findstr ":8000" >nul
if %errorLevel% equ 0 (
    echo       -> Backend Node [ACTIVO en puerto 8000]
) else (
    echo       -> AVISO: Backend no detectado en 8000. Ejecuta INICIAR_FOODSYS_LOCAL.bat
)

echo.
echo ==============================================================
echo    TODO LISTO! TU SERVIDOR LOCAL YA ACEPTA CONEXIONES EN RED
echo ==============================================================
echo.
echo   >> ENLACE DIRECTO: Revisa la IP mostrada arriba en el reporte del QR.
echo   >> Puedes abrir o proyectar la imagen:
echo      c:\Foodsys\Foodsys\QR_Acceso_Foodsys.png
echo.
echo   >> NOTA IMPORTANTE SOBRE MCAFEE:
echo      En McAfee (como se observa en tu pantalla):
echo      1. Asegurate de que 'Proteccion Web' no este bloqueando puertos locales.
echo      2. O anade como exclusion tu navegador o el puerto 5173.
echo.
echo ==============================================================
echo.
pause
