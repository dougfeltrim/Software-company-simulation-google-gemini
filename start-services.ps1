# Script to start all services for Software Company Simulation

Write-Host "Starting Software Company Simulation Services..." -ForegroundColor Green

# 1. Start Python Service (LangGraph/CrewAI)
Write-Host "Launching Python Service (Port 3002)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "& {
    $host.UI.RawUI.WindowTitle = 'Python Service - Port 3002';
    Set-Location 'crewai-service';
    if (Test-Path 'venv') {
        Write-Host 'Activating virtual environment...' -ForegroundColor Yellow;
        try {
            . .\venv\Scripts\Activate.ps1
        } catch {
            Write-Warning 'Could not activate venv via script. Trying direct python call related to venv if possible, or system python.'
        }
    } else {
        Write-Warning 'No venv directory found. Using global python.';
    }
    
    # Check if dependencies are installed or just run
    Write-Host 'Starting Server...' -ForegroundColor Green;
    python server.py
}"

# 2. Start Node.js Services (Frontend & Backend)
Write-Host "Launching Node.js Services (Frontend: 3000, Backend: 3001)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "& {
    $host.UI.RawUI.WindowTitle = 'Node Services (Frontend + Backend)';
    npm run dev
}"

Write-Host "All services launch commands issued." -ForegroundColor Green
Write-Host "Check the new windows for status."
