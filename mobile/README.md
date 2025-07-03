# Calonik Mobile App

A React Native mobile application for the Calonik nutrition tracking platform, built with Expo.

## Features

- **Food Tracking**: Search and add foods to your daily meal tracker
- **AI Food Scanner**: Use camera to analyze food images and estimate nutrition
- **Profile Management**: Set up personal information and nutrition goals
- **Exercise Tracking**: Log workouts with built-in timer and calorie estimation
- **Dashboard**: View daily nutrition summary and progress insights
- **Nutrition Goals**: BMR/TDEE calculation with personalized calorie targets

## Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: React Navigation v6
- **State Management**: TanStack Query (React Query)
- **UI Library**: React Native Paper
- **Camera**: Expo Camera & Image Picker
- **Security**: Expo SecureStore
- **Backend**: Node.js/Express API (shared with web app)

## Project Structure

```
mobile/
├── src/
│   ├── components/       # Reusable UI components
│   │   └── FoodCamera.tsx
│   ├── screens/          # Main app screens
│   │   ├── TrackerScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   ├── ExerciseScreen.tsx
│   │   └── DashboardScreen.tsx
│   ├── services/         # API service layer
│   │   └── api.ts
│   └── utils/            # Utility functions
│       └── session.ts
├── App.tsx              # Root component
├── app.json             # Expo configuration
├── package.json         # Dependencies
└── babel.config.js      # Babel configuration
```

## Setup Instructions

### Quick Setup
```bash
cd mobile
./setup-eas.sh
```

### Manual Setup
1. **Install EAS CLI**:
   ```bash
   npm install -g @expo/eas-cli
   ```

2. **Login to Expo**:
   ```bash
   eas login
   ```

3. **Initialize Project**:
   ```bash
   eas init --id
   ```

4. **Install Dependencies**:
   ```bash
   npm install
   ```

5. **Start Development Server**:
   ```bash
   npm start
   ```

### Building for iOS
```bash
# Preview build for TestFlight
npm run preview:ios

# Production build for App Store
eas build --platform ios --profile production
```

See `QUICK_COMMANDS.md` for all available commands.

## Development Setup

### Prerequisites
- Node.js 18+
- Expo CLI
- iOS Simulator (for iOS development)
- Android Studio & Android SDK (for Android development)

### Backend Connection
The mobile app connects to the same backend as the web application:
- Base URL: `https://951c9b0b-a7e6-4243-ad92-b80de619ea52-00-2w9g548p0tyi.worf.replit.dev/api`
- Shared API endpoints for food search, meal tracking, profile management

## Key Components

### TrackerScreen
- Food search with real-time suggestions
- AI camera integration for food analysis
- Current meal management with add/remove functionality
- Calorie calculation with portion multipliers

### ProfileScreen  
- Personal information input (age, gender, height, weight)
- Activity level selection
- Weight goal configuration (lose/maintain/gain)
- BMR/TDEE/target calorie calculations

### ExerciseScreen
- Built-in workout timer
- Quick exercise selection grid
- Manual duration input
- Calorie burn estimation
- Exercise history tracking

### DashboardScreen
- Daily nutrition progress visualization
- Macro breakdown (calories, protein, carbs, fat)
- Today's meal items display
- Health insights and recommendations
- Quick action buttons

### FoodCamera Component
- Camera permission handling
- Photo capture and gallery selection
- Image analysis via backend AI service
- Food detection results processing

## App Store Deployment Requirements

### iOS App Store
- Apple Developer Account ($99/year)
- Replace Razorpay with Apple In-App Purchase
- Configure camera permissions in Info.plist
- Health data usage description
- Privacy policy for App Store review

### Google Play Store
- Google Play Developer Account ($25 one-time)
- Camera and storage permissions
- Privacy policy URL
- App signing key management

## Authentication Integration
Currently uses simple session management. For production:
- Integrate with Firebase Auth (matching web app)
- Secure token storage with Expo SecureStore
- User registration/login flows

## Subscription Integration
For App Store compliance:
- iOS: Implement Apple In-App Purchase
- Android: Use Google Play Billing
- Server-side receipt verification
- Subscription status synchronization

## Build & Release

### Development Build
```bash
expo build:android
expo build:ios
```

### Production Release
```bash
expo publish
eas build --platform all
eas submit --platform all
```

## API Integration

The mobile app shares the same API with the web application:
- Food search and nutrition data
- Meal tracking and daily summaries
- User profile management
- Exercise logging
- AI food image analysis

All API calls are handled through the `apiService` in `src/services/api.ts`.