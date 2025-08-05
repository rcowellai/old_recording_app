#!/bin/bash

# Love Retold Recording App - Deployment Script
# This script handles the complete deployment process

set -e # Exit on any error

echo "🚀 Starting Love Retold Recording App Deployment"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    print_error "Firebase CLI is not installed. Please install it first:"
    print_error "npm install -g firebase-tools"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Check for environment variables
if [ -z "$REACT_APP_FIREBASE_PROJECT_ID" ]; then
    print_warning "Environment variables not set. Using .env.production file."
fi

print_status "Environment check passed"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm ci
print_status "Dependencies installed"

# Run tests
echo ""
echo "🧪 Running tests..."
npm run test -- --coverage --watchAll=false
if [ $? -ne 0 ]; then
    print_error "Tests failed. Deployment aborted."
    exit 1
fi
print_status "All tests passed"

# Build the application
echo ""
echo "🏗️  Building application..."
npm run build
if [ $? -ne 0 ]; then
    print_error "Build failed. Deployment aborted."
    exit 1
fi
print_status "Application built successfully"

# Check build size
BUILD_SIZE=$(du -sh build | cut -f1)
print_status "Build size: $BUILD_SIZE"

# Validate build output
if [ ! -f "build/index.html" ]; then
    print_error "Build output is invalid. index.html not found."
    exit 1
fi

if [ ! -d "build/static" ]; then
    print_error "Build output is invalid. static directory not found."
    exit 1
fi

print_status "Build validation passed"

# Firebase login check
echo ""
echo "🔐 Checking Firebase authentication..."
firebase auth:token &> /dev/null
if [ $? -ne 0 ]; then
    print_warning "Not logged into Firebase. Please login:"
    firebase login
fi
print_status "Firebase authentication verified"

# Deploy to Firebase
echo ""
echo "🚀 Deploying to Firebase..."
firebase deploy --only hosting
if [ $? -ne 0 ]; then
    print_error "Firebase deployment failed."
    exit 1
fi

print_status "Deployment completed successfully!"

# Get the hosting URL
PROJECT_ID=$(firebase list | grep '✓' | awk '{print $1}' | head -1)
if [ ! -z "$PROJECT_ID" ]; then
    echo ""
    echo "🌐 Application deployed to:"
    echo "   https://$PROJECT_ID.web.app"
    echo "   https://$PROJECT_ID.firebaseapp.com"
else
    echo ""
    echo "🌐 Application deployed successfully!"
    echo "   Check the Firebase console for the URL"
fi

echo ""
echo "✨ Deployment process completed!"
echo "=================================================="