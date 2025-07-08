# Calonik AI - Native Mobile App

A truly native React Native + Expo mobile application for AI-powered calorie and fitness tracking. This app replicates the exact UI/UX of the web application using native components.

## Features

- **Native React Navigation** with bottom tab navigation
- **React Context** for global state management
- **AsyncStorage** for local data persistence
- **Expo Camera** integration for food scanning
- **React Native Charts** for nutrition visualization
- **Calendar-based** meal and exercise tracking
- **Dark theme** UI matching the web app design

## Tech Stack

- **React Native** 0.74.5
- **Expo** ~51.0.28
- **React Navigation** 6.x with bottom tabs
- **React Context API** for state management
- **AsyncStorage** for local persistence
- **Expo Camera** for food scanning
- **React Native Charts** for data visualization
- **React Native Calendars** for date selection

## Project Structure

```
mobile-native/
├── App.js                      # Main app component with navigation
├── src/
│   ├── context/
│   │   └── AppContext.js       # Global state management
│   ├── screens/
│   │   ├── TrackerScreen.js    # Food tracking screen
│   │   ├── ProfileScreen.js    # User profile screen
│   │   ├── ExerciseScreen.js   # Exercise tracking screen
│   │   └── DashboardScreen.js  # Analytics dashboard
│   ├── components/
│   │   ├── NutritionSummary.js # Nutrition display component
│   │   └── FoodCamera.js       # Camera interface
│   ├── utils/
│   │   └── calculations.js     # BMR/TDEE calculations
│   └── services/
│       └── foodDatabase.js     # Local food database
├── assets/                     # App icons and images
├── package.json               # Dependencies
├── app.json                   # Expo configuration
├── babel.config.js            # Babel configuration
└── metro.config.js            # Metro bundler config
```

## Key Components

### App Context (State Management)
- User profile and session management
- Meals and exercises tracking
- Date-specific data storage
- Automatic AsyncStorage persistence

### Screen Components
- **TrackerScreen**: Food search, meal logging, camera integration
- **ProfileScreen**: BMR/TDEE calculator, goal setting
- **ExerciseScreen**: Exercise tracking with timer
- **DashboardScreen**: Progress charts and analytics

### Utility Functions
- BMR/TDEE calculations matching web app
- Unit conversions and nutrition calculations
- Date formatting and validation

## Installation

1. **Install dependencies:**
```bash
cd mobile-native
npm install
```

2. **Add required assets:**
   - Copy app icons to `assets/` directory
   - icon.png (1024x1024)
   - adaptive-icon.png (1024x1024)
   - splash.png (1284x2778)
   - favicon.png (32x32)

3. **Start development server:**
```bash
npm start
```

4. **Run on device:**
   - Install Expo Go app on your mobile device
   - Scan QR code from terminal/browser
   - Or use simulator: `npm run ios` / `npm run android`

## Development

### State Management
The app uses React Context for global state management with automatic AsyncStorage persistence:

```javascript
const { state, actions } = useAppContext();

// Add meal
actions.addMeal(meal);

// Set user profile
actions.setUserProfile(profile);

// Change selected date
actions.setSelectedDate(date);
```

### Data Persistence
All user data is automatically saved to AsyncStorage:
- Meals are stored per date: `meals_${sessionId}_${date}`
- Exercises per date: `exercises_${sessionId}_${date}`
- User profile: `profile_${sessionId}`

### Navigation
Bottom tab navigation with four main screens:
- Tracker (Food tracking)
- Profile (User setup)
- Exercise (Workout logging)
- Dashboard (Analytics)

## Key Features

### Food Tracking
- Real-time food search through local database
- Camera integration for food scanning
- Multiple unit support (grams, pieces, bowls, etc.)
- Date-specific meal logging

### Exercise Tracking
- Built-in timer functionality
- Intensity level selection
- Calorie burn calculations
- Historical exercise data

### User Profile
- BMR/TDEE calculations
- Goal setting (lose/gain/maintain weight, build muscle)
- Activity level configuration
- Custom protein targets

### Dashboard
- Nutrition progress charts
- Weekly calorie trends
- Macro breakdown visualization
- Goal progress tracking

## Camera Integration

The app includes Expo Camera integration for food scanning:
- Take photos or select from gallery
- Mock AI analysis (ready for backend integration)
- Automatic food detection and addition

## Charts and Analytics

Uses React Native Chart Kit for:
- Progress ring charts for daily goals
- Line charts for weekly trends
- Macro breakdown visualization

## Styling

Consistent dark theme matching the web app:
- Primary color: #f97316 (orange)
- Background: #0f172a (dark blue)
- Cards: #1e293b with #334155 borders
- Text: #f8fafc (light) and #64748b (muted)

## Next Steps

1. **Backend Integration**: Connect to existing API endpoints
2. **Authentication**: Implement Firebase auth integration
3. **Real AI**: Connect camera to actual food recognition API
4. **Push Notifications**: Add daily reminders and motivational messages
5. **App Store**: Prepare for iOS/Android store deployment

## Notes

This is a complete native implementation that matches the web app's functionality while being optimized for mobile devices. All calculations, state management, and UI patterns mirror the web application for consistency.