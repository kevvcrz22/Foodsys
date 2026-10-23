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
echo [1/3] Iniciando Servidor Backend (Node.js en puerto 8000)...
start "Foodsys Backend (Puerto 8000)" cmd /k "cd /d c:\Foodsys\Foodsys\Node && node App.js"
echo [2/3] Iniciando Frontend (Vite en puerto 5173)...
start "Foodsys Frontend (Puerto 5173)" cmd /k "cd /d c:\Foodsys\Foodsys\Frontend && pnpm run dev"
echo [3/3] Esperando a que los servidores inicien...
ping 127.0.0.1 -n 5 > nul
echo.
echo ==========================================================
echo  Foodsys Local iniciado con exito!
echo  Abriendo http://localhost:5173 en tu navegador...
echo ==========================================================
start http://localhost:5173
exit
