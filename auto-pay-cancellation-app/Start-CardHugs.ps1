# CardHugs Application Launcher (PowerShell Version)
# This script starts Docker containers and opens the app in your browser

param(
    [switch]$NoWait
)

# Get project directory
$projectPath = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "Starting CardHugs..." -ForegroundColor Cyan

# Check if Docker is running
try {
    $null = docker ps -q
    Write-Host "Docker is running ✓" -ForegroundColor Green
}
catch {
    Write-Host "ERROR: Docker is not running!" -ForegroundColor Red
    Write-Host "Please start Docker Desktop and run this script again." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Start containers
Write-Host "Starting containers..." -ForegroundColor Yellow
Set-Location $projectPath
docker-compose up -d

# Wait for services to be ready
if (-not $NoWait) {
    Write-Host "Waiting for services to be ready (10 seconds)..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
}

# Check if containers are healthy
Write-Host "Checking service status..." -ForegroundColor Yellow
$status = docker-compose ps

Write-Host ""
Write-Host "=== CardHugs Status ===" -ForegroundColor Green
Write-Host $status
Write-Host ""

# Open application in browser
Write-Host "Opening application in browser..." -ForegroundColor Cyan
Start-Process "http://localhost"

Write-Host ""
Write-Host "✓ CardHugs is ready!" -ForegroundColor Green
Write-Host ""
Write-Host "Access Points:" -ForegroundColor Cyan
Write-Host "  Frontend:  http://localhost" -ForegroundColor White
Write-Host "  Backend:   http://localhost:8000" -ForegroundColor White
Write-Host "  Database:  localhost:5432" -ForegroundColor White
Write-Host ""
Write-Host "Useful Commands:" -ForegroundColor Cyan
Write-Host "  View logs:     docker-compose logs -f" -ForegroundColor White
Write-Host "  Stop all:      docker-compose stop" -ForegroundColor White
Write-Host "  View status:   docker-compose ps" -ForegroundColor White
Write-Host ""
