@echo off
echo Setting up Calonik Mobile App...

echo Installing Expo dependencies...
npm install expo@~51.0.8 expo-status-bar@~1.12.1 react@18.2.0 react-native@0.74.5

echo Fixing package versions...
npx expo install --fix

echo Starting EAS build...
eas build --platform ios --profile production

echo Setup complete!
pause