#!/bin/bash

# Calonik.ai Android APK Build Script
echo "🤖 Building Calonik.ai Android APK..."

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "📦 Installing EAS CLI..."
    npm install -g eas-cli
fi

# Navigate to mobile directory
cd "$(dirname "$0")"

echo "📱 Current directory: $(pwd)"
echo "📋 Checking project configuration..."

# Display current configuration
echo "🔧 EAS Configuration:"
cat eas.json

echo ""
echo "📱 App Configuration:"
cat app.json | grep -A 10 "android"

echo ""
echo "🚀 Starting Android APK build..."
echo "ℹ️  This will create an APK file for direct installation on Android devices"

# Build APK using the apk profile
echo "⏳ Building APK (this may take 5-15 minutes)..."
eas build --platform android --profile apk --non-interactive

echo ""
echo "✅ Build command executed!"
echo "📥 Check the build status and download link above"
echo "💡 You can also check build status with: eas build:list"