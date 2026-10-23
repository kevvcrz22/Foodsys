' ==============================================================
' Foodsys Local - Lanzador 100% Silencioso (Sin ventanas CMD)
' Centro Agropecuario La Granja (SENA)
' ==============================================================
Option Explicit
Dim WshShell, fso

Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' 1. Asegurar que MySQL local (XAMPP) este iniciado en segundo plano
If fso.FileExists("C:\xampp\mysql\bin\mysqld.exe") Then
    WshShell.Run """C:\xampp\mysql\bin\mysqld.exe"" --defaults-file=""C:\xampp\mysql\bin\my.ini"" --standalone", 0, False
End If

' Pequeña pausa de 1 segundo para asegurar conexion a la base de datos
WScript.Sleep 1000

' 1.5. Terminar instancias previas de Node para evitar conflictos de puertos
WshShell.Run "taskkill /f /im node.exe", 0, True
WScript.Sleep 500

' 2. Iniciar Servidor Backend (Node.js en puerto 8000) de forma completamente oculta
WshShell.CurrentDirectory = "c:\Foodsys\Foodsys\Node"
WshShell.Run "node.exe App.js", 0, False

' 3. Iniciar Cliente Frontend (Vite en puerto 5173) de forma completamente oculta
WshShell.CurrentDirectory = "c:\Foodsys\Foodsys\Frontend"
WshShell.Run "cmd.exe /c pnpm run dev", 0, False

' 4. Esperar 3.5 segundos a que ambos servidores esten escuchando
WScript.Sleep 3500

' 5. Abrir la aplicacion Foodsys en el navegador predeterminado
WshShell.Run "https://localhost:5173", 1, False
