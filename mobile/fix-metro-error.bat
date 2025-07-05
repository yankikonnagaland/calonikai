@echo off
echo Fixing Metro bundler compatibility issue...
echo.

echo Step 1: Clearing npm cache...
npm cache clean --force

echo.
echo Step 2: Removing node_modules and package-lock.json...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json

echo.
echo Step 3: Reinstalling dependencies...
npm install

echo.
echo Step 4: Installing compatible Expo CLI...
npm install -g @expo/cli@latest

echo.
echo Fix complete! Now try running: npm start
echo.
pause