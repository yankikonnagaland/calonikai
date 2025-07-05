# Calonik Mobile App - Local Setup Guide

This guide will help you run the Calonik mobile app locally using Expo.

## Prerequisites

1. **Node.js** (v18 or later)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version`

2. **Expo CLI**
   ```bash
   npm install -g @expo/cli
   ```

3. **Expo Go App** on your phone
   - iOS: Download from App Store
   - Android: Download from Google Play Store

## Setup Steps

### 1. Navigate to Mobile Directory
```bash
cd mobile
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start the Development Server
```bash
npm start
```
or
```bash
expo start
```

### 4. Connect Your Device

#### Option A: QR Code (Recommended)
1. After running `expo start`, a QR code will appear in your terminal
2. Open Expo Go app on your phone
3. Scan the QR code
4. The app will load on your device

#### Option B: Same Network
1. Make sure your computer and phone are on the same WiFi network
2. In Expo Go app, tap "Enter URL manually"
3. Enter the URL shown in terminal (usually `exp://192.168.x.x:8081`)

#### Option C: Tunnel Mode (if network issues)
```bash
expo start --tunnel
```

## Available Commands

```bash
# Start development server
npm start

# Start with specific platform
expo start --ios      # iOS simulator (requires Xcode)
expo start --android  # Android emulator (requires Android Studio)
expo start --web      # Web browser

# Start with tunnel (for network issues)
expo start --tunnel
```

## Troubleshooting

### Common Issues

1. **"Cannot connect to Metro"**
   - Ensure your phone and computer are on same WiFi
   - Try tunnel mode: `expo start --tunnel`
   - Check firewall settings

2. **"Module not found" errors**
   ```bash
   rm -rf node_modules
   npm install
   expo start --clear
   ```

3. **QR Code not working**
   - Make sure Expo Go app is updated
   - Try entering URL manually in Expo Go
   - Use tunnel mode if on restricted network

4. **App crashes on startup**
   ```bash
   expo start --clear
   ```

### Network Configuration

If you're on a corporate network or have firewall issues:

1. Use tunnel mode:
   ```bash
   expo start --tunnel
   ```

2. Or configure your firewall to allow:
   - Port 8081 (Metro bundler)
   - Port 19000-19001 (Expo CLI)

## App Features

The mobile app includes:
- Food tracking with camera
- Calorie counting
- Exercise logging
- Progress dashboard
- User profiles

## Development Notes

- The app connects to your local development server
- Hot reload is enabled for instant updates
- Shake your device to open developer menu
- Use React Native debugger for advanced debugging

## Next Steps

1. **For iOS App Store**: Follow `APP_STORE_DEPLOYMENT.md`
2. **For Android Play Store**: Follow `EAS_SETUP_GUIDE.md`
3. **For Production Build**: Use `expo build` or EAS Build

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Expo documentation: https://docs.expo.dev/
3. Check React Native documentation for component issues

---

Happy coding! 🚀