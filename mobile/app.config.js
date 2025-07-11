const IS_DEV = process.env.APP_VARIANT === 'development';

export default {
  expo: {
    name: IS_DEV ? 'Calonik (Dev)' : 'Calonik - AI Calorie Tracker',
    slug: 'calonik',
    version: '1.0.0',
    appVersionSource: 'local',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    splash: {
      image: './assets/calonik-logo.png',
      resizeMode: 'contain',
      backgroundColor: '#0F172A'
    },
    assetBundlePatterns: [
      '**/*'
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: IS_DEV ? 'ai.calonik.app.dev' : 'ai.calonik.app',
      buildNumber: '1',
      infoPlist: {
        NSCameraUsageDescription: 'Calonik uses camera to analyze food images for nutrition tracking and calorie estimation',
        NSPhotoLibraryUsageDescription: 'Calonik accesses photo library to analyze food images for nutrition information',
        NSHealthShareUsageDescription: 'Calonik can sync with Health app to share your nutrition and fitness data',
        NSHealthUpdateUsageDescription: 'Calonik can update Health app with your nutrition progress and calorie tracking',
        UIViewControllerBasedStatusBarAppearance: false
      },
      entitlements: {
        'com.apple.developer.in-app-payments': true
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/icon.png',
        backgroundColor: '#0F172A'
      },
      package: IS_DEV ? 'ai.calonik.app.dev' : 'ai.calonik.app',
      versionCode: 1,
      permissions: [
        'CAMERA',
        'READ_EXTERNAL_STORAGE',
        'WRITE_EXTERNAL_STORAGE'
      ]
    },
    web: {
      favicon: './assets/favicon.png'
    },
    extra: {
      eas: {
        projectId: '69fbe8d9-3226-4916-a01c-3ac66b4e8da7'
      }
    },
    platforms: [
      'ios',
      'android',
      'web'
    ],
    plugins: [
      [
        'expo-build-properties',
        {
          ios: {
            newArchEnabled: false
          },
          android: {
            newArchEnabled: false
          }
        }
      ]
    ]
  }
};