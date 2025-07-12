#!/bin/bash

# Calonik.ai Android Studio Quick Start Script

echo "🚀 Starting Calonik.ai Mobile App Development Setup..."

# Check if we're in the mobile directory
if [ ! -f "app.json" ]; then
    echo "❌ Please run this script from the mobile directory"
    echo "📁 cd mobile && ./start-android-studio.sh"
    exit 1
fi

echo "📦 Installing dependencies with legacy peer deps..."
npm install --legacy-peer-deps

echo "🔧 Checking Expo CLI installation..."
if ! command -v expo &> /dev/null; then
    echo "📥 Installing Expo CLI..."
    npm install -g @expo/cli
fi

echo "🔧 Checking EAS CLI installation..."
if ! command -v eas &> /dev/null; then
    echo "📥 Installing EAS CLI..."
    npm install -g eas-cli
fi

echo "✅ Setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Start your backend server: npm run dev (from main project folder)"
echo "2. Start Expo dev server: npx expo start"
echo "3. Press 'a' to launch on Android emulator"
echo "4. Or scan QR code with Expo Go app on your phone"
echo ""
echo "📱 For APK build: eas build --platform android --profile apk"
echo "📖 Full guide: See ANDROID_STUDIO_SETUP.md"