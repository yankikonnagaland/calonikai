#!/bin/bash

# Calonik AI Mobile App Setup Script
echo "🚀 Setting up Calonik AI Mobile App..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Make sure you're in the mobile-native directory."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create assets directory if it doesn't exist
echo "📁 Setting up assets directory..."
mkdir -p assets

# Copy logo from attached assets if available
if [ -f "../attached_assets/CALONIK LOGO TRANSPARENT_1751559015747.png" ]; then
    echo "🎨 Copying Calonik logo..."
    cp "../attached_assets/CALONIK LOGO TRANSPARENT_1751559015747.png" "assets/icon.png"
    cp "../attached_assets/CALONIK LOGO TRANSPARENT_1751559015747.png" "assets/adaptive-icon.png"
    cp "../attached_assets/CALONIK LOGO TRANSPARENT_1751559015747.png" "assets/splash.png"
    cp "../attached_assets/CALONIK LOGO TRANSPARENT_1751559015747.png" "assets/favicon.png"
    echo "✅ Logo assets copied successfully!"
else
    echo "⚠️  Warning: Calonik logo not found. You'll need to add the following assets manually:"
    echo "   - assets/icon.png (1024x1024)"
    echo "   - assets/adaptive-icon.png (1024x1024)"
    echo "   - assets/splash.png (1284x2778)"
    echo "   - assets/favicon.png (32x32)"
fi

# Check if Expo CLI is available
if ! command -v npx expo &> /dev/null; then
    echo "📱 Installing Expo CLI..."
    npm install -g @expo/cli
fi

echo ""
echo "🎉 Setup complete! You can now:"
echo ""
echo "1. Start the development server:"
echo "   npm start"
echo ""
echo "2. Run on your device:"
echo "   - Install 'Expo Go' app on your phone"
echo "   - Scan the QR code that appears"
echo ""
echo "3. Run on simulator:"
echo "   npm run ios     # for iOS simulator"
echo "   npm run android # for Android emulator"
echo ""
echo "📖 Read the README.md for more detailed instructions."
echo ""

# Check if we can start Expo
echo "🔍 Checking Expo setup..."
if npx expo --version &> /dev/null; then
    echo "✅ Expo CLI is ready!"
    echo ""
    echo "🚀 You can start development with: npm start"
else
    echo "❌ Expo CLI setup failed. Please install manually:"
    echo "   npm install -g @expo/cli"
fi