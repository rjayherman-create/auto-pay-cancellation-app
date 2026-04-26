@echo off
REM CardHugs Docker Container Startup Script for Windows

echo.
echo ========================================
echo   CardHugs - Docker Container Startup
echo ========================================
echo.

REM Check if .env file exists
if not exist .env (
    echo WARNING: .env file not found. Creating one...
    copy .env.example .env 2>nul || (
        echo Please create a .env file
        exit /b 1
    )
)

REM Start containers
echo Building and starting containers...
echo.
docker-compose up -d

echo.
echo Waiting for services to be ready...
timeout /t 5 /nobreak

echo.
docker-compose ps

echo.
echo ========================================
echo SUCCESS: CardHugs is starting up!
echo ========================================
echo.
echo ACCESS POINTS:
echo   Frontend (UI):  http://localhost
echo   Backend (API):  http://localhost:8000
echo   Database:       localhost:5432
echo.
echo USEFUL COMMANDS:
echo   View logs:      docker-compose logs -f
echo   Stop services:  docker-compose stop
echo   Restart:        docker-compose restart
echo   Remove all:     docker-compose down -v
echo.
pause
