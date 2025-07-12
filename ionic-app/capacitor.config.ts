import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ai.calonik.app',
  appName: 'Calonik',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    Camera: {
      permissions: {
        camera: 'granted',
        photos: 'granted'
      }
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#111827',
      showSpinner: false
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#111827'
    },
    Preferences: {
      group: 'calonik_data'
    }
  }
};

export default config;