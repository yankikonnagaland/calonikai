# Calonik.ai - All Food Calorie Tracker

A comprehensive full-stack nutrition tracking application built with React, TypeScript, and Express.js. Track your daily calorie intake, monitor exercise routines, and get personalized nutrition recommendations.

## Features

### 🍽️ Food Tracking
- **AI-Powered Camera Analysis**: Take photos of your meals for instant nutritional analysis
- **Smart Food Search**: Intelligent autocomplete with over 100+ Indian and international foods
- **Unit Intelligence**: Automatic smart unit selection (cups, pieces, portions) based on food type
- **Real-time Nutrition**: Instant calorie, protein, carbs, and fat calculations

### 💪 Exercise Tracking
- **AI Exercise Detection**: Natural language input ("45 minutes intense cardio")
- **Quick Exercise Selection**: Pre-defined exercise types with intensity levels
- **Calorie Burn Calculation**: Accurate calorie burn estimates based on duration and intensity
- **Progress Tracking**: View completed exercises with timestamps

### 📊 Dashboard & Analytics
- **Calendar View**: Day-by-day nutrition tracking with visual indicators
- **Monthly Totals**: Comprehensive monthly statistics and averages
- **Progress Visualization**: Calories in vs out with target tracking
- **Weight Goal Monitoring**: Track progress toward weight loss/gain goals

### 👤 Profile Management
- **BMR/TDEE Calculator**: Personalized metabolic rate calculations
- **Height Input**: Separate feet and inches dropdowns for accurate measurements
- **Goal Setting**: Weight loss, gain, or maintenance targets
- **Profile Persistence**: Data saved across login sessions

### 🔗 Social Sharing
- **Dashboard Sharing**: Share daily progress on social media
- **Multi-platform Support**: Twitter, Facebook, WhatsApp, LinkedIn
- **Custom Messages**: Branded sharing content with nutrition summaries

### 🔐 Authentication
- **Firebase Authentication**: Secure Google OAuth integration
- **User Data Persistence**: Individual user tracking with calendar-based storage
- **Session Management**: Seamless authenticated and guest experiences

## Technology Stack

### Frontend
- **React 18** with TypeScript for type safety
- **Vite** for fast development and building
- **TanStack Query** for efficient server state management
- **Wouter** for lightweight client-side routing
- **shadcn/ui** with Tailwind CSS for modern design
- **React Hook Form** with Zod validation

### Backend
- **Express.js** with TypeScript
- **Firebase Admin SDK** for authentication
- **Drizzle ORM** for database operations
- **PostgreSQL** for data persistence
- **OpenAI GPT-4o** for AI-powered food and exercise analysis

### Infrastructure
- **Replit** for development and hosting
- **Firebase** for authentication services
- **PostgreSQL** database for user data storage

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/calonik-ai.git
cd calonik-ai
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_APP_ID=your_app_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY=your_private_key

# Database
DATABASE_URL=your_postgresql_url

# OpenAI
OPENAI_API_KEY=your_openai_api_key
```

4. Run database migrations:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

## Usage

### Getting Started
1. **Sign Up**: Use Google authentication to create your account
2. **Set Profile**: Complete your basic information for personalized recommendations
3. **Track Food**: Search for foods or use the camera to analyze meals
4. **Log Exercise**: Add workouts using natural language or quick selection
5. **Monitor Progress**: View your daily and monthly nutrition statistics

### AI Features
- **Food Analysis**: Take photos of meals for automatic nutritional breakdown
- **Exercise Recognition**: Describe workouts naturally ("30 min running")
- **Smart Suggestions**: Get personalized food and exercise recommendations

### Data Export
- **Social Sharing**: Share progress summaries on social platforms
- **Calendar View**: Access historical data by date
- **Monthly Reports**: View comprehensive monthly statistics

## API Documentation

### Authentication Endpoints
- `GET /api/auth/user` - Get current user information
- `POST /api/login` - Initiate Google OAuth login
- `POST /api/logout` - Sign out user

### Food Tracking
- `GET /api/foods/search?q={query}` - Search food database
- `POST /api/ai-food-analysis` - Analyze food photos with AI
- `POST /api/meal` - Add food item to daily meal
- `GET /api/meal/{sessionId}` - Get current meal items

### Exercise Tracking
- `POST /api/exercise` - Log exercise activity
- `GET /api/exercise/{sessionId}` - Get user exercises
- `POST /api/ai-exercise-analysis` - AI exercise recognition

### Profile & Analytics
- `POST /api/profile/calculate` - Calculate BMR/TDEE
- `GET /api/profile/{sessionId}` - Get user profile
- `GET /api/daily-summary/{sessionId}/{date}` - Get daily summary
- `GET /api/daily-summaries/{sessionId}` - Get all summaries

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@calonik.ai or join our community discussions.

## Acknowledgments

- OpenAI for GPT-4o model capabilities
- Firebase for authentication services
- Indian food database contributors
- shadcn/ui for component library