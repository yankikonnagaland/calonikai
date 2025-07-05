@echo off
echo Upgrading to Expo SDK 53...
echo.

echo Step 1: Clearing npm cache...
npm cache clean --force

echo.
echo Step 2: Removing node_modules and package-lock.json...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json

echo.
echo Step 3: Installing latest Expo CLI...
npm install -g @expo/cli@latest

echo.
echo Step 4: Installing SDK 53 dependencies...
npm install

echo.
echo Step 5: Running Expo doctor to check setup...
npx expo doctor

echo.
echo SDK 53 upgrade complete! Now try running: npm start
echo If you still get errors, try: npx expo start --clear
echo.
pause