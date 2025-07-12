# Calonik.ai Ionic Capacitor App

A complete native mobile application for Calonik.ai nutrition tracking built with Ionic Capacitor.

## Features

- **Food Tracking**: Search and add foods with AI-powered nutrition data
- **AI Camera**: Scan food with camera for automatic nutrition detection
- **Exercise Tracking**: Timer-based exercise logging with calorie burn calculations
- **Profile Management**: BMR/TDEE calculations with personalized goals
- **Health Dashboard**: Comprehensive analytics and progress tracking
- **Native Features**: Camera access, offline storage, notifications

## Tech Stack

- **Framework**: Ionic React with Capacitor
- **Frontend**: React 18 + TypeScript
- **State Management**: TanStack Query
- **UI Components**: Ionic UI Components
- **Native APIs**: Capacitor plugins for camera, storage, etc.
- **Backend**: Existing Calonik.ai API

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Android Studio (for Android builds)
- Xcode (for iOS builds - Mac only)

### Installation

1. **Install dependencies**:
   ```bash
   cd ionic-app
   npm install
   ```

2. **Install Capacitor CLI globally**:
   ```bash
   npm install -g @capacitor/cli
   ```

3. **Initialize Capacitor**:
   ```bash
   npx cap init
   ```

4. **Add platforms**:
   ```bash
   npx cap add android
   npx cap add ios
   ```

### Development

1. **Run in browser** (for development):
   ```bash
   npm run dev
   ```

2. **Build and sync**:
   ```bash
   npm run build
   npx cap sync
   ```

3. **Run on Android**:
   ```bash
   npx cap run android
   ```

4. **Run on iOS**:
   ```bash
   npx cap run ios
   ```

### Building for Production

1. **Build the web assets**:
   ```bash
   npm run build
   ```

2. **Sync with native projects**:
   ```bash
   npx cap sync
   ```

3. **Open in native IDE**:
   ```bash
   # For Android
   npx cap open android
   
   # For iOS
   npx cap open ios
   ```

4. **Build APK/App** using Android Studio or Xcode

## Project Structure

```
ionic-app/
├── src/
│   ├── components/          # Reusable UI components
│   │   └── CameraModal.tsx  # AI food camera component
│   ├── pages/               # Main app screens
│   │   ├── TrackerPage.tsx  # Food tracking screen
│   │   ├── ExercisePage.tsx # Exercise logging screen
│   │   ├── ProfilePage.tsx  # User profile management
│   │   └── DashboardPage.tsx # Analytics dashboard
│   ├── services/            # API and authentication services
│   │   ├── AuthService.tsx  # User authentication
│   │   └── ApiService.ts    # Backend API integration
│   ├── theme/               # Ionic theme customization
│   │   └── variables.css    # CSS custom properties
│   ├── App.tsx              # Main app component
│   └── main.tsx             # App entry point
├── public/                  # Static assets
├── capacitor.config.ts      # Capacitor configuration
├── vite.config.ts          # Vite build configuration
└── package.json            # Dependencies and scripts
```

## Key Features Implementation

### 🔍 Food Search & Tracking
- Real-time food search with AI-enhanced results
- Unit selection with smart portion recommendations
- Current meal building with nutrition totals
- Date-specific meal tracking

### 📷 AI Food Camera
- Native camera integration with Capacitor Camera API
- AI-powered food detection and nutrition analysis
- Multi-food detection with individual selection
- Automatic meal addition with calculated nutrition

### 🏃 Exercise Tracking
- Built-in timer with start/stop/reset functionality
- Intensity level selection with calorie multipliers
- Exercise history with date filtering
- Automatic calorie burn calculations

### 👤 Profile Management
- BMR/TDEE calculations based on user data
- Multiple goal types (lose, maintain, gain, muscle)
- Personalized daily targets
- Progress tracking and recommendations

### 📊 Health Dashboard
- Daily nutrition metrics with progress bars
- Calorie in/out/net calculations
- Exercise summary and active minutes
- Weight tracking with goal progress

### 📱 Native Mobile Features
- **Offline Storage**: Capacitor Preferences for user data
- **Native Camera**: Direct camera access for food scanning
- **Push Notifications**: Ready for implementation
- **Native Navigation**: Ionic routing with native feel
- **Cross-Platform**: Single codebase for iOS and Android

## API Integration

The app integrates with the existing Calonik.ai backend API:

- **Food Search**: `/api/food/search`
- **Meal Management**: `/api/meal/*`
- **Exercise Tracking**: `/api/exercise/*`
- **Profile Management**: `/api/profile/*`
- **AI Food Analysis**: `/api/analyze-food`
- **Daily Summaries**: `/api/daily-summary/*`

## Authentication

- Guest user support with local session management
- Firebase authentication integration ready
- Capacitor Preferences for secure token storage
- Automatic session restoration on app launch

## Deployment

### Android (Google Play Store)
1. Build production APK using Android Studio
2. Sign with production keystore
3. Upload to Google Play Console
4. Configure app listing and publish

### iOS (App Store)
1. Build using Xcode with production certificates
2. Archive and upload to App Store Connect
3. Configure app metadata and screenshots
4. Submit for App Store review

## Performance Optimizations

- **Lazy Loading**: Pages loaded on demand
- **Query Caching**: TanStack Query for efficient data management
- **Image Optimization**: Compressed food images for AI analysis
- **Bundle Splitting**: Separate chunks for vendors and features
- **Native Performance**: Direct native API access through Capacitor

## Testing

- **Browser Testing**: Full functionality available in browser
- **Device Testing**: Live reload on connected devices
- **Performance**: Native performance through Capacitor bridge
- **Cross-Platform**: Consistent behavior across iOS and Android

## Status

✅ **Complete Ionic Capacitor Implementation**
- All core features implemented with native mobile experience
- Full API integration with existing backend
- Ready for production builds and app store submission
- Feature parity with web application
- Native camera, storage, and navigation capabilities