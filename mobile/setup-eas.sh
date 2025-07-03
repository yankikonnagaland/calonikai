#!/bin/bash

# Calonik Mobile App - EAS Setup Script
# This script helps configure EAS for iOS app building

echo "🚀 Setting up EAS for Calonik Mobile App"
echo "========================================="

# Check if we're in the mobile directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the mobile directory"
    exit 1
fi

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "📦 Installing EAS CLI..."
    npm install -g @expo/eas-cli
else
    echo "✅ EAS CLI already installed"
fi

# Check if user is logged in to Expo
echo "🔐 Checking Expo login status..."
if ! eas whoami &> /dev/null; then
    echo "📝 Please login to Expo:"
    eas login
else
    echo "✅ Already logged in to Expo"
fi

# Initialize EAS project
echo "🏗️  Initializing EAS project..."
if [ ! -f "eas.json" ]; then
    eas init --id
else
    echo "✅ EAS project already initialized"
fi

# Check for required assets
echo "🎨 Checking for required assets..."
missing_assets=()

if [ ! -f "assets/icon.png" ]; then
    missing_assets+=("assets/icon.png (1024x1024px)")
fi

if [ ! -f "assets/splash.png" ]; then
    missing_assets+=("assets/splash.png (1284x2778px)")
fi

if [ ! -f "assets/adaptive-icon.png" ]; then
    missing_assets+=("assets/adaptive-icon.png (1024x1024px)")
fi

if [ ${#missing_assets[@]} -gt 0 ]; then
    echo "⚠️  Missing required assets:"
    for asset in "${missing_assets[@]}"; do
        echo "   - $asset"
    done
    echo ""
    echo "📖 Please check mobile/assets/README.md for asset requirements"
else
    echo "✅ All required assets found"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Display next steps
echo ""
echo "🎉 EAS setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Create app assets (see assets/README.md)"
echo "2. Update app.json with your Expo project ID"
echo "3. Update eas.json with your Apple Developer details"
echo "4. Run your first build:"
echo "   npm run preview:ios"
echo ""
echo "📖 For detailed instructions, see EAS_SETUP_GUIDE.md"