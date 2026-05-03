@echo off
REM Online Voting System startup script (MongoDB Atlas – no local mongod)

set PROJECT_DIR=%~dp0
set NODE_PORT=3000

cd /d "%PROJECT_DIR%"

if exist "node_modules" (
  echo Node modules already installed.
) else (
  echo Installing Node dependencies...
  npm install
  if errorlevel 1 (
    echo npm install failed. Press any key to exit.
    pause
    exit /b 1
  )
)

echo.
echo Starting Node.js backend on port %NODE_PORT%...
echo.
start "Node.js Server" cmd /k "node backend/server.js"

echo.
echo Opening browser to login page...
start "" "http://localhost:%NODE_PORT%/login-otp.html"

echo.
echo Voting system is running:
echo - Backend: http://localhost:%NODE_PORT%
echo - Login: http://localhost:%NODE_PORT%/login-otp.html
pause