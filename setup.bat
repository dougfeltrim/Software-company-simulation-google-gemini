@echo off
REM Setup script for AI Software Company (Windows)

echo ==========================================
echo AI Software Company Setup (Windows)
echo ==========================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo X Docker is not installed. Please install Docker Desktop first.
    echo Visit: https://docs.docker.com/desktop/install/windows-install/
    exit /b 1
)

echo [OK] Docker is installed

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if errorlevel 1 (
    docker compose version >nul 2>&1
    if errorlevel 1 (
        echo X Docker Compose is not installed.
        exit /b 1
    )
)

echo [OK] Docker Compose is installed

REM Create .env file if it doesn't exist
if not exist .env (
    echo.
    echo Creating .env file...
    copy .env.example .env
    echo [OK] .env file created
) else (
    echo [INFO] .env file already exists
)

REM Pull Ollama image
echo.
echo Pulling Ollama Docker image...
docker pull ollama/ollama:latest

REM Build the application
echo.
echo Building application...
docker-compose -f docker-compose.cpu.yml build

echo.
echo ==========================================
echo [OK] Setup Complete!
echo ==========================================
echo.
echo To start the application, run:
echo   start.bat
echo.
echo After starting, you can:
echo   1. Pull models: pull-model.bat model-name
echo   2. Access the web interface at: http://localhost:7860
echo.
pause
