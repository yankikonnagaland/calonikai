#!/bin/bash

echo "Starting Expo development server..."
echo "This will generate a QR code you can scan with Expo Go app"

# Navigate to mobile directory
cd "$(dirname "$0")"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Start Expo development server
# Use --tunnel for external access (works better on Replit)
npx expo start --tunnel --non-interactive

echo "Expo server started!"
echo "Scan the QR code with Expo Go app on your phone"