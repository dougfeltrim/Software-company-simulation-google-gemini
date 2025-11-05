@echo off
REM Script to pull Ollama models (Windows)

set MODEL=%1
if "%MODEL%"=="" set MODEL=llama3:3b

echo ==========================================
echo Pulling Ollama Model: %MODEL%
echo ==========================================
echo.

docker ps | findstr ollama >nul
if errorlevel 1 (
    echo X Ollama container is not running.
    echo Please start the services first: start.bat
    exit /b 1
)

echo Pulling model... This may take a while depending on model size.
echo.

docker exec -it ollama ollama pull %MODEL%

echo.
echo ==========================================
echo [OK] Model %MODEL% pulled successfully!
echo ==========================================
echo.
echo You can now use this model in the web interface.
echo Access the interface at: http://localhost:7860
echo.
pause
