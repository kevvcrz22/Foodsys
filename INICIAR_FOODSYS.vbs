' ==============================================================
' Foodsys Local - Lanzador 100% Silencioso (Funciona CON y SIN Internet)
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

WScript.Sleep 1000

' 1.5. Terminar instancias previas de Node y pnpm para evitar conflictos de puertos
WshShell.Run "taskkill /f /im pnpm.exe", 0, True
WshShell.Run "taskkill /f /im node.exe", 0, True
WScript.Sleep 500

' 2. Iniciar Servidor Backend (Node.js en puerto 8000) de forma completamente oculta
WshShell.CurrentDirectory = "c:\Foodsys\Foodsys\Node"
WshShell.Run "node.exe App.js", 0, False

' 2.5. Esperar a que el backend responda en http://127.0.0.1:8000/
Function BackendListo()
    Dim http
    BackendListo = False
    On Error Resume Next
    Set http = CreateObject("MSXML2.ServerXMLHTTP.6.0")
    http.setTimeouts 1000, 1000, 1000, 1000
    http.Open "GET", "http://127.0.0.1:8000/", False
    http.Send
    If Err.Number = 0 Then
        If http.Status = 200 Then BackendListo = True
    End If
    Err.Clear
    On Error GoTo 0
End Function

Dim intentos
intentos = 0
Do While Not BackendListo() And intentos < 40
    WScript.Sleep 1000
    intentos = intentos + 1
Loop

' 3. Iniciar Cliente Frontend (Vite en puerto 5173) directamente con node.exe (100% inmune a falta de internet)
WshShell.CurrentDirectory = "c:\Foodsys\Foodsys\Frontend"
WshShell.Run "node.exe .\node_modules\vite\bin\vite.js", 0, False

' 4. Esperar 3 segundos a que Vite este escuchando en 5173
WScript.Sleep 3000

' 5. Abrir la aplicacion Foodsys en el navegador predeterminado
WshShell.Run "https://localhost:5173", 1, False
