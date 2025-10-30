@echo off
REM Start script for AI Software Company (Windows)

echo ==========================================
echo Starting AI Software Company
echo ==========================================
echo.

REM Auto-detect - Windows typically doesn't have nvidia-smi in PATH easily
echo Mode: CPU (Windows defaults to CPU mode)
echo.

echo Starting services...
docker-compose -f docker-compose.cpu.yml up -d

echo.
echo Waiting for services to be ready...
timeout /t 5 /nobreak >nul

REM Check if Ollama is ready
echo Checking Ollama status...
:check_ollama
timeout /t 2 /nobreak >nul
curl -s http://localhost:11434/ >nul 2>&1
if errorlevel 1 (
    goto check_ollama
)

echo [OK] Ollama is ready

echo.
echo ==========================================
echo [OK] Services Started!
echo ==========================================
echo.
echo Ollama API: http://localhost:11434
echo Web Interface: http://localhost:7860
echo.
echo To view logs:
echo   docker-compose -f docker-compose.cpu.yml logs -f
echo.
echo To stop services:
echo   stop.bat
echo.
echo IMPORTANT: You need to pull at least one model first!
echo Run: pull-model.bat llama3:3b
echo.
pause
