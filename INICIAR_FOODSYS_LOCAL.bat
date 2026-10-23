@echo off
chcp 65001 > nul
title Iniciando Foodsys Local - SENA La Granja

echo ==========================================================
echo           INICIANDO FOODSYS - SISTEMA LOCAL
echo            Centro Agropecuario La Granja (SENA)
echo ==========================================================
echo.

cd /d "c:\Foodsys\Foodsys"

echo [1/3] Iniciando Servidor Backend (Node.js en puerto 8000)...
start "Foodsys - Servidor Backend (Node.js)" cmd /k "cd /d c:\Foodsys\Foodsys\Node && node App.js"

echo [2/3] Esperando 3 segundos para inicializar base de datos...
timeout /t 3 /nobreak > nul

echo [3/3] Iniciando Frontend (Vite en puerto 5173)...
start "Foodsys - Cliente Web (Vite)" cmd /k "cd /d c:\Foodsys\Foodsys\Frontend && pnpm run dev"

echo.
echo ==========================================================
echo  ✅ Foodsys Local iniciado con exito!
echo  Abriendo http://localhost:5173 en tu navegador...
echo ==========================================================
timeout /t 3 /nobreak > nul

start http://localhost:5173

exit
