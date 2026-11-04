' ==============================================================
' Foodsys Local - Detener Servidores Locales
' ==============================================================
Option Explicit
Dim WshShell
Set WshShell = CreateObject("WScript.Shell")

' Terminar procesos locales de Node
WshShell.Run "taskkill /f /im node.exe", 0, True
WshShell.Popup "Los servidores locales de Foodsys han sido detenidos.", 3, "Foodsys Local", 64
