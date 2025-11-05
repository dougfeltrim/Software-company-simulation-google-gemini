@echo off
REM Stop script for AI Software Company (Windows)

echo ==========================================
echo Stopping AI Software Company
echo ==========================================
echo.

REM Stop both possible configurations
docker-compose -f docker-compose.yml down 2>nul
docker-compose -f docker-compose.cpu.yml down 2>nul

echo.
echo [OK] Services stopped
echo.
echo To start again, run: start.bat
echo.
pause
