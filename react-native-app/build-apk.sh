#!/bin/bash

# Calonik AI - APK Build Script
# This script helps build the Android APK for the React Native app

echo "🚀 Calonik AI - APK Build Script"
echo "=================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the react-native-app directory"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if Expo CLI is available
if ! command -v npx &> /dev/null; then
    echo "❌ Error: npm/npx is not available"
    exit 1
fi

echo "✅ Environment checks passed"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Error: Failed to install dependencies"
        exit 1
    fi
fi

echo "✅ Dependencies ready"

# Check EAS login status
echo "🔐 Checking Expo authentication..."
if npx eas whoami &> /dev/null; then
    USER=$(npx eas whoami)
    echo "✅ Logged in as: $USER"
else
    echo "❌ Not logged in to Expo. Please run: npx eas login"
    echo "💡 You need a free Expo account to build APKs"
    echo "📝 Register at: https://expo.dev"
    exit 1
fi

# Configure EAS build if not already configured
if [ ! -f ".eas.json" ] && [ ! -f "eas.json" ]; then
    echo "⚙️ Configuring EAS build..."
    npx eas build:configure
fi

echo "🔨 Starting APK build..."
echo "📱 Building Android APK (preview profile)..."

# Build the APK
npx eas build --platform android --profile preview --non-interactive

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 APK build completed successfully!"
    echo "📱 Check your Expo dashboard for download link"
    echo "🌐 Dashboard: https://expo.dev/accounts/$(npx eas whoami)/projects"
    echo ""
    echo "📋 Next steps:"
    echo "1. Download the APK from the provided link"
    echo "2. Enable 'Unknown Sources' on your Android device"
    echo "3. Install the APK and grant camera permissions"
    echo "4. Enjoy testing Calonik AI!"
else
    echo ""
    echo "❌ APK build failed"
    echo "💡 Common solutions:"
    echo "1. Check your internet connection"
    echo "2. Verify Expo account is in good standing"
    echo "3. Try: npx eas build:configure --force"
    echo "4. Check build logs on expo.dev dashboard"
fi