@echo off
REM Love Retold Recording App - Windows Deployment Script
REM This script handles the complete deployment process on Windows

echo.
echo 🚀 Starting Love Retold Recording App Deployment
echo ==================================================

REM Check if Firebase CLI is installed
firebase --version >nul 2>&1
if errorlevel 1 (
    echo ✗ Firebase CLI is not installed. Please install it first:
    echo npm install -g firebase-tools
    exit /b 1
)

REM Check if we're in the right directory
if not exist "package.json" (
    echo ✗ package.json not found. Please run this script from the project root.
    exit /b 1
)

echo ✓ Environment check passed

REM Install dependencies
echo.
echo 📦 Installing dependencies...
call npm ci
if errorlevel 1 (
    echo ✗ Failed to install dependencies
    exit /b 1
)
echo ✓ Dependencies installed

REM Run tests
echo.
echo 🧪 Running tests...
call npm run test -- --coverage --watchAll=false
if errorlevel 1 (
    echo ✗ Tests failed. Deployment aborted.
    exit /b 1
)
echo ✓ All tests passed

REM Build the application
echo.
echo 🏗️  Building application...
call npm run build
if errorlevel 1 (
    echo ✗ Build failed. Deployment aborted.
    exit /b 1
)
echo ✓ Application built successfully

REM Validate build output
if not exist "build\index.html" (
    echo ✗ Build output is invalid. index.html not found.
    exit /b 1
)

if not exist "build\static" (
    echo ✗ Build output is invalid. static directory not found.
    exit /b 1
)

echo ✓ Build validation passed

REM Firebase login check
echo.
echo 🔐 Checking Firebase authentication...
firebase auth:token >nul 2>&1
if errorlevel 1 (
    echo ⚠ Not logged into Firebase. Please login:
    call firebase login
)
echo ✓ Firebase authentication verified

REM Deploy to Firebase
echo.
echo 🚀 Deploying to Firebase...
call firebase deploy --only hosting
if errorlevel 1 (
    echo ✗ Firebase deployment failed.
    exit /b 1
)

echo ✓ Deployment completed successfully!
echo.
echo 🌐 Application deployed successfully!
echo    Check the Firebase console for the URL
echo.
echo ✨ Deployment process completed!
echo ==================================================
pause