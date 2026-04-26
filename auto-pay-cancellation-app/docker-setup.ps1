# Setup script for CardHugs Docker environment (Windows)
# Usage: powershell -ExecutionPolicy Bypass -File docker-setup.ps1

Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║    CardHugs Docker Environment Setup    ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check Docker installation
Write-Host "Checking Docker installation..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "✓ Docker found: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not installed" -ForegroundColor Red
    Write-Host "   Please install Docker Desktop from https://www.docker.com/products/docker-desktop" -ForegroundColor Red
    exit 1
}

# Check Docker Compose
try {
    docker compose version | Out-Null
    Write-Host "✓ Docker Compose found" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Compose is not installed" -ForegroundColor Red
    exit 1
}

# Create .env if not exists
if (-not (Test-Path ".env")) {
    Write-Host ""
    Write-Host "Creating .env file from template..." -ForegroundColor Yellow
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "✓ .env created (edit with your settings)" -ForegroundColor Green
    } else {
        Write-Host "⚠ .env.example not found, skipping" -ForegroundColor Yellow
    }
}

# Generate JWT secret if not set
Write-Host ""
Write-Host "Configuring security settings..." -ForegroundColor Yellow
$envContent = Get-Content ".env"
if ($envContent -match "JWT_SECRET=your-secret") {
    # Generate random JWT secret
    $bytes = New-Object byte[] 32
    $random = New-Object Security.Cryptography.RNGCryptoServiceProvider
    $random.GetBytes($bytes)
    $jwtSecret = [Convert]::ToBase64String($bytes)
    
    # Replace in .env
    $envContent = $envContent -replace "JWT_SECRET=your-secret.*", "JWT_SECRET=$jwtSecret"
    Set-Content ".env" $envContent
    Write-Host "✓ JWT_SECRET generated" -ForegroundColor Green
}

# Create database directory if it doesn't exist
Write-Host ""
Write-Host "Setting up volumes..." -ForegroundColor Yellow
if (-not (Test-Path "database\data")) {
    New-Item -ItemType Directory -Path "database\data" -Force | Out-Null
    Write-Host "✓ Database data directory created" -ForegroundColor Green
}

# Build images
Write-Host ""
Write-Host "Building Docker images..." -ForegroundColor Yellow
Write-Host "This may take a few minutes on first run..." -ForegroundColor Cyan
docker compose build

Write-Host ""
Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║        Setup Complete! 🎉              ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Green
Write-Host "1. Review and customize .env file"
Write-Host "2. Start the application:"
Write-Host "   docker compose up"
Write-Host ""
Write-Host "3. Initialize the database (in another terminal):"
Write-Host "   docker compose exec backend npm run setup"
Write-Host ""
Write-Host "4. Access the application:"
Write-Host "   Frontend: http://localhost"
Write-Host "   Backend:  http://localhost:8000"
Write-Host "   API Health: http://localhost:8000/health"
Write-Host ""
Write-Host "For more information, see DOCKER_DEPLOYMENT_GUIDE.md" -ForegroundColor Yellow
