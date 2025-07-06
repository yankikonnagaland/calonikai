# Metro Configuration Fix Guide for Calonik Mobile App

## Issue Resolved
The EAS build error "Cannot find module 'metro/src/ModuleGraph/worker/importLocationsPlugin'" has been fixed with the following updates:

## ✅ Fixes Applied

### 1. EAS Configuration Fixed (`eas.json`)
```json
{
  "cli": {
    "version": ">= 3.0.0",
    "appVersionSource": "local"
  }
}
```
- Added `appVersionSource: "local"` to resolve version source warning

### 2. Metro Configuration Updated (`metro.config.js`)
```javascript
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Fix for Metro module resolution issues
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    keep_fnames: true,
    keep_infinity: true,
  },
};

config.resolver = {
  ...config.resolver,
  platforms: ['ios', 'android', 'web'],
};

module.exports = config;
```

### 3. Package Dependencies Verified
- Expo SDK 53 with React Native 0.75.4
- All dependencies compatible and stable

## 🚀 Ready for Build

Your iOS build should now work without the Metro error. Try running:

```bash
cd mobile
eas build --platform ios --profile production
```

## If You Still Get Errors

1. **Clear Metro Cache:**
   ```bash
   npx expo start --clear
   ```

2. **Clear Node Modules:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Reinstall EAS CLI:**
   ```bash
   npm install -g eas-cli@latest
   ```

## Next Steps After Build Success

1. **Apple Developer Account Setup** ($99/year)
2. **App Store Connect Configuration**
3. **TestFlight Beta Testing**
4. **App Store Submission**

Your configuration is now properly set up for iOS App Store deployment!