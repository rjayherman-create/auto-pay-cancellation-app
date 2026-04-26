@echo off
REM CardHugs Application Launcher (Batch Version)
REM This script starts Docker containers and opens the app in your browser

title CardHugs Launcher
color 0A

echo.
echo ========================================
echo   CARDHUGS APPLICATION LAUNCHER
echo ========================================
echo.

REM Check if Docker is running
docker ps >nul 2>&1
if errorlevel 1 (
    color 0C
    echo ERROR: Docker is not running!
    echo.
    echo Please start Docker Desktop and run this script again.
    pause
    exit /b 1
)

color 0A
echo [OK] Docker is running

REM Get project directory (one level up from this script)
for %%I in ("%~dp0.") do set "PROJECT_DIR=%%~fI"

echo [*] Project directory: %PROJECT_DIR%
echo.
echo [*] Starting containers...

cd /d "%PROJECT_DIR%"
docker-compose up -d

if errorlevel 1 (
    color 0C
    echo.
    echo ERROR: Failed to start containers!
    pause
    exit /b 1
)

color 0A
echo [OK] Containers started
echo.
echo [*] Waiting for services to be ready (10 seconds)...
timeout /t 10 /nobreak

echo.
echo [*] Checking service status...
docker-compose ps

echo.
color 0B
echo ========================================
echo   CARDHUGS IS READY!
echo ========================================
echo.
echo Access Points:
echo   Frontend:  http://localhost
echo   Backend:   http://localhost:8000
echo   Database:  localhost:5432
echo.
echo Opening application in browser...
echo ========================================
echo.

REM Open in default browser
start http://localhost

echo.
echo Useful Commands:
echo   View logs:     docker-compose logs -f
echo   Stop all:      docker-compose stop
echo   View status:   docker-compose ps
echo.
pause
