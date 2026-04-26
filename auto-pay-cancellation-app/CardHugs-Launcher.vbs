' CardHugs Application Launcher
' This script starts Docker containers and opens the app in your browser

Set objShell = CreateObject("WScript.Shell")
Set objFSO = CreateObject("Scripting.FileSystemObject")

' Get the directory where this script is located
scriptPath = objShell.CurrentDirectory
projectPath = objFSO.GetParentFolderName(WScript.ScriptFullName)

' Show status message
objShell.Popup "Starting CardHugs...", 2, "CardHugs Launcher", 64

' Start Docker containers
objShell.Run "cmd /c cd /d " & projectPath & " && docker-compose up -d", 0, False

' Wait for services to be ready (10 seconds)
WScript.Sleep 10000

' Open application in default browser
objShell.Run "http://localhost", 1

' Show success message
objShell.Popup "CardHugs is ready! Opening in your browser..." & vbCrLf & vbCrLf & "Frontend: http://localhost" & vbCrLf & "Backend API: http://localhost:8000" & vbCrLf & "Database: localhost:5432", 0, "CardHugs Started", 64
