#!/bin/bash

# Calonik AI - TestFlight Deployment Commands
# Run these commands to build and deploy to TestFlight

echo "🚀 Calonik AI TestFlight Deployment"
echo "=================================="

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "❌ EAS CLI not found. Installing..."
    npm install -g @expo/eas-cli
fi

# Navigate to React Native app directory
cd "$(dirname "$0")"

echo "📱 Current directory: $(pwd)"
echo "📋 App configuration:"
echo "   - Bundle ID: ai.calonik.app"
echo "   - Version: 1.0.0"
echo "   - Platform: iOS"

# Login to EAS (if not already logged in)
echo "🔐 Checking EAS authentication..."
eas whoami || eas login

# Build for iOS TestFlight
echo "🔨 Building iOS app for TestFlight..."
echo "⏳ This process may take 10-20 minutes..."
eas build --platform ios --profile production

# Ask if user wants to submit immediately
echo ""
read -p "🚀 Build complete! Submit to TestFlight now? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📤 Submitting to App Store Connect..."
    eas submit --platform ios --profile production
    echo "✅ Submission complete!"
    echo "📱 Check App Store Connect for processing status"
    echo "🧪 TestFlight will be available in 5-30 minutes"
else
    echo "⏸️  Build ready for manual submission"
    echo "📝 Download .ipa from: https://expo.dev/yanpvuo/calonik-ai/builds"
    echo "📤 Upload manually via Xcode or Transporter"
fi

echo ""
echo "🎉 TestFlight Deployment Complete!"
echo "📖 See TESTFLIGHT_DEPLOYMENT.md for detailed instructions"