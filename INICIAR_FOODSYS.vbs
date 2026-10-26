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

' 2.5. Esperar a que el backend responda (revisa tablas de MySQL antes de abrir el puerto).
'      Se consulta http://127.0.0.1:8000/ cada 2 segundos, maximo 120 segundos.
'      Sin esta espera el navegador abre antes de tiempo y el login responde error 500.
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
Do While Not BackendListo() And intentos < 60
    WScript.Sleep 2000
    intentos = intentos + 1
Loop

' 3. Iniciar Cliente Frontend (Vite en puerto 5173) de forma completamente oculta
WshShell.CurrentDirectory = "c:\Foodsys\Foodsys\Frontend"
WshShell.Run "cmd.exe /c pnpm run dev", 0, False

' 4. Esperar 5 segundos a que Vite este escuchando
WScript.Sleep 5000

' 5. Abrir la aplicacion Foodsys en el navegador predeterminado
WshShell.Run "https://localhost:5173", 1, False
