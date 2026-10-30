@echo off
setlocal enabledelayedexpansion
title Consend — Web3 Document Consent System

:: Ensure current working directory is the repository root
cd /d "%~dp0"

echo =====================================================================
echo                        CONSEND LAUNCHER
echo   Privacy-First Document Consent with MST Blockchain Audit Trail
echo =====================================================================
echo.

:: 1. Verify Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not found in system PATH.
    echo Please install Node.js (v18 or higher) from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: 2. Verify npm is installed
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed or not found in system PATH.
    echo.
    pause
    exit /b 1
)

:: Display Node.js version
for /f "tokens=*" %%v in ('node -v') do set NODE_VER=%%v
echo [OK] Node.js detected: !NODE_VER!

:: 3. Check for .env.local; create from .env.example if missing
if not exist ".env.local" (
    if exist ".env.example" (
        echo [INFO] .env.local not found. Initializing from .env.example...
        copy ".env.example" ".env.local" >nul
        echo [OK] Created .env.local.
    ) else (
        echo [WARNING] Neither .env.local nor .env.example found.
    )
) else (
    echo [OK] Environment configuration file (.env.local) found.
)

:: 4. Check dependencies (node_modules)
if not exist "node_modules\" (
    echo [INFO] Dependencies not found. Running 'npm install'...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install project dependencies.
        pause
        exit /b 1
    )
)

echo.
echo =====================================================================
echo Starting Next.js development server...
echo URL: http://localhost:3000
echo Network: MST Coral Testnet (Chain ID: 54635)
echo.
echo Press Ctrl + C to stop the server anytime.
echo =====================================================================
echo.

:: Start Next.js development server
call npm run dev

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Server terminated with an error (Code: %errorlevel%).
    pause
)

