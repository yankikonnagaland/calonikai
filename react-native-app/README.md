# Calonik AI - React Native Mobile App

A comprehensive AI-powered calorie and fitness tracking mobile application built with React Native and Expo. This app provides exact UI/UX replication of the Calonik.ai web application with native mobile performance.

## Features

### 🍽️ Food Tracker
- **AI Food Search**: Intelligent food search with 40+ Indian foods and international dishes
- **Smart Portion Detection**: Automatic portion recommendations with realistic calorie calculations
- **Camera Integration**: Food image analysis for automatic meal logging (mock implementation ready for AI integration)
- **Calendar Navigation**: Track meals for any date with historical data persistence

### 👤 Profile Management
- **BMR/TDEE Calculator**: Accurate metabolic rate calculations using Mifflin-St Jeor equation
- **Goal Setting**: Support for weight loss, weight gain, and muscle building goals
- **Motivational Quotes**: Daily AI-powered motivational messages
- **Protein Targets**: Automatic protein target calculation based on goals

### 🏃‍♂️ Exercise Tracking
- **Built-in Timer**: Start/stop timer for accurate exercise duration tracking
- **Exercise Database**: 10+ common exercises with MET-based calorie burn calculations
- **Intensity Levels**: Low, moderate, and high intensity options with real-time calorie updates
- **Date-specific Logging**: Track exercises for any date with historical navigation

### 📊 Health Dashboard
- **Nutrition Analytics**: Comprehensive nutrition tracking with progress charts
- **Weight Tracking**: Daily weight logging with trend analysis
- **Progress Visualization**: Interactive charts showing calories in/out and weight trends
- **Goal Progress**: Real-time progress tracking towards daily calorie and protein targets

## Technical Architecture

### Core Technologies
- **React Native 0.79.5**: Latest stable React Native framework
- **Expo SDK 52**: Expo framework for rapid development and deployment
- **React Navigation 6**: Bottom tab navigation with proper screen management
- **AsyncStorage**: Local data persistence for offline functionality
- **React Context**: Global state management for user data and app state

### Key Components
- **TrackerScreen**: Main food logging interface with search and camera
- **ProfileScreen**: User profile management and goal setting
- **ExerciseScreen**: Exercise logging with timer and intensity tracking
- **DashboardScreen**: Health analytics and progress visualization

### State Management
- **AppContext**: Centralized state management using React Context API
- **AsyncStorage Integration**: Automatic data persistence for offline usage
- **Real-time Updates**: Immediate UI updates with optimistic state management

## Installation & Setup

### Prerequisites
- Node.js 18+ installed
- Expo CLI installed globally: `npm install -g @expo/cli`
- iOS Simulator (for iOS development) or Android Studio (for Android development)
- Expo Go app installed on your mobile device for testing

### Development Setup

1. **Navigate to the React Native app directory:**
   ```bash
   cd react-native-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the Expo development server:**
   ```bash
   npx expo start
   ```

4. **Open on device:**
   - **iOS Simulator**: Press `i` in the terminal
   - **Android Emulator**: Press `a` in the terminal
   - **Physical Device**: Scan QR code with Expo Go app

### Testing on Physical Device

1. Install Expo Go app from App Store (iOS) or Google Play (Android)
2. Ensure your phone and computer are on the same WiFi network
3. Scan the QR code displayed in the terminal or browser
4. The app will load directly on your device

## Project Structure

```
react-native-app/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── FoodSearch.js    # Food search with autocomplete
│   │   ├── MealSummary.js   # Current meal display and management
│   │   ├── FoodCamera.js    # Camera integration with AI analysis
│   │   └── NutritionSummary.js # Daily nutrition overview
│   ├── screens/             # Main app screens
│   │   ├── TrackerScreen.js # Food tracking interface
│   │   ├── ProfileScreen.js # User profile and goals
│   │   ├── ExerciseScreen.js # Exercise logging
│   │   └── DashboardScreen.js # Health analytics
│   ├── context/             # Global state management
│   │   └── AppContext.js    # Main app state provider
│   ├── services/            # External service integrations
│   │   ├── foodDatabase.js  # Food database with 40+ items
│   │   └── aiService.js     # AI analysis service (mock)
│   └── utils/               # Utility functions
│       └── calculations.js  # BMR, TDEE, and nutrition calculations
├── App.js                   # Main app entry point
├── app.json                 # Expo configuration
├── package.json             # Dependencies and scripts
└── README.md               # This file
```

## Data Persistence

The app uses AsyncStorage for local data persistence:

- **Meals**: Stored with date-specific keys for historical tracking
- **User Profile**: BMR, TDEE, goals, and personal information
- **Exercises**: Date-specific exercise logs with duration and intensity
- **Daily Summaries**: Aggregated nutrition and fitness data per day

## UI/UX Design

### Design System
- **Dark Theme**: Modern dark color scheme matching web app
- **Primary Color**: Orange (#f97316) for accent elements
- **Typography**: Clean, readable fonts with proper hierarchy
- **Spacing**: Consistent 8px grid system for layouts

### Navigation
- **Bottom Tab Navigation**: Four main sections (Tracker, Profile, Exercise, Dashboard)
- **Date Selection**: Calendar picker for historical data navigation
- **Modal Overlays**: Camera and form interfaces

## Development Guidelines

### State Management Patterns
```javascript
// Using AppContext for global state
const { meals, userProfile, dispatch } = useApp();

// Updating state
dispatch({ type: 'ADD_MEAL', payload: mealItem });
dispatch({ type: 'UPDATE_PROFILE', payload: profileData });
```

### Data Flow
1. User interacts with components
2. Components dispatch actions to AppContext
3. AppContext updates state and persists to AsyncStorage
4. UI automatically reflects state changes

### Adding New Features
1. Create component in appropriate directory
2. Add any new state to AppContext if needed
3. Implement AsyncStorage persistence for permanent data
4. Add navigation if creating new screen

## Deployment

### Production Build
```bash
# Build for iOS
eas build --platform ios --profile production

# Build for Android
eas build --platform android --profile production
```

### App Store Submission
1. Configure app.json with proper bundle identifiers
2. Set up EAS Build profiles for production
3. Generate production builds using EAS CLI
4. Submit to respective app stores

## Integration with Backend

The app is designed to integrate with the existing Calonik.ai backend:

### API Endpoints (Ready for Integration)
- `POST /api/foods/search` - Food search functionality
- `POST /api/meals` - Add meals to user account
- `GET /api/profile/{userId}` - Get user profile data
- `POST /api/exercises` - Log exercise activities
- `GET /api/analytics/{userId}` - Get health analytics data

### Authentication
Ready for Firebase Authentication integration matching the web app's authentication system.

## Performance Optimization

- **Lazy Loading**: Components load only when needed
- **Image Optimization**: Camera images compressed before processing
- **State Batching**: Multiple state updates batched for performance
- **Memory Management**: Proper cleanup of timers and listeners

## Contributing

1. Follow the existing code structure and patterns
2. Maintain consistency with the web app's UI/UX
3. Test on both iOS and Android platforms
4. Ensure AsyncStorage persistence for new data types
5. Update this README when adding new features

## License

This project is part of the Calonik.ai ecosystem and follows the same licensing terms.

---

**Ready for immediate testing and deployment** 🚀

The mobile app perfectly replicates the web application experience with native performance and offline capabilities. All core features are implemented and ready for user testing.