# Replit.md - All Food Calorie Tracker

## Overview

This is a full-stack All Food Calorie Tracker web application built with React/TypeScript frontend and Express.js backend. The application helps users track their daily calorie intake through all foods, manage their meal plans, monitor exercise routines, and get personalized nutrition recommendations based on their profile.

## System Architecture

The application follows a client-server architecture with clear separation of concerns:

**Frontend Architecture:**
- React 18 with TypeScript for type safety
- Vite as the build tool for fast development
- Component-based architecture with shadcn/ui design system
- TanStack Query for efficient server state management
- Wouter for lightweight client-side routing
- React Hook Form with Zod validation for form handling

**Backend Architecture:**
- Express.js server with TypeScript
- RESTful API design
- Session-based user identification using nanoid
- In-memory storage with interface abstraction for future database migration
- Middleware for request logging and error handling

**Database Architecture:**
- Currently uses in-memory storage (MemStorage class)
- Drizzle ORM configured for PostgreSQL migration
- Schema defines tables for foods, meal items, user profiles, and exercises
- Database abstraction through IStorage interface

## Key Components

**Core Data Models:**
- Foods: Comprehensive all food database with nutritional information
- Meal Items: User's selected foods with quantities and units
- User Profiles: Personal information for BMR/TDEE calculations
- Exercises: Activity tracking for calorie burn calculations

**Frontend Components:**
- Navigation: Tab-based navigation between tracker, profile, and exercise
- FoodSearch: Autocomplete search with smart unit selection
- MealSummary: Real-time meal tracking with nutritional totals
- UserProfile: BMR/TDEE calculator with animated results
- ExerciseTracker: Timer-based exercise tracking
- HealthyAlternatives: AI-powered food swap suggestions

**Backend Services:**
- Storage abstraction layer (IStorage interface)
- RESTful route handlers for all CRUD operations
- Validation using Zod schemas
- Session management for user data isolation

## Data Flow

1. **User Session**: Each user gets a unique session ID stored in localStorage
2. **Food Search**: Real-time search queries to backend with debouncing
3. **Meal Building**: Selected foods added to session-specific meal collection
4. **Profile Calculation**: BMR/TDEE computed based on user inputs
5. **Exercise Tracking**: Timer-based activity logging with calorie burn calculation
6. **Data Persistence**: All user data tied to session ID for temporary storage

## External Dependencies

**Frontend Dependencies:**
- @tanstack/react-query: Server state management
- @radix-ui/*: Headless UI primitives
- react-hook-form + @hookform/resolvers: Form handling
- zod: Runtime type validation
- wouter: Client-side routing
- tailwindcss: Utility-first CSS framework
- lucide-react: Icon library

**Backend Dependencies:**
- express: Web framework
- drizzle-orm: Type-safe ORM
- @neondatabase/serverless: Database driver
- nanoid: Unique ID generation
- tsx: TypeScript execution

**Development Dependencies:**
- vite: Build tool and dev server
- typescript: Type checking
- esbuild: Bundle optimization

## Deployment Strategy

**Development Environment:**
- Vite dev server for frontend hot reloading
- tsx for backend TypeScript execution
- Concurrent development with proxy setup

**Production Build:**
- Frontend: Vite builds optimized React bundle
- Backend: esbuild bundles Express server
- Static files served from Express in production

**Database Migration Path:**
- Current: In-memory storage for development
- Future: PostgreSQL with Drizzle ORM migrations
- Database URL configuration through environment variables

**Replit Configuration:**
- Node.js 20 runtime environment
- PostgreSQL module for future database integration
- Auto-deployment with build/start scripts
- Port 5000 mapped to external port 80

## Changelog

## User Preferences

**Domain Configuration:**
- User prefers clean custom domain (calonik.ai) over default Replit domain for production
- Google OAuth should use custom domain for professional appearance
- Custom domain setup in progress: calonik.ai
- DNS configuration required at domain registrar after Replit deployment setup

**Database Configuration:**
- Currently using Replit's built-in PostgreSQL database (Neon-backed)
- User interested in migrating to AWS database services for production scalability
- Database migration consideration: AWS RDS PostgreSQL or AWS Aurora Serverless

## Recent Changes

**June 22, 2025 - Admin Testing Access & Simplified Subscription Modal:**
- Created special admin login URL (/admin) with unlimited access for testing purposes
- Admin key authentication bypasses all usage limits and subscription checks through Firebase middleware
- Admin users get automatic premium status with unlimited photo analysis and meal tracking
- Added admin mode indicator in navigation showing "Admin Mode - Unlimited Access"
- Admin session uses "admin_testing_user" UID for consistent authentication across all routes
- Environment variable ADMIN_SECRET controls admin access (default: "calonik_admin_2025")
- Updated both DatabaseStorage and FallbackStorage to bypass limits for admin users
- Admin requests include x-admin-key header for server-side authentication
- Simplified subscription modal design with clean pricing display (₹399/- Only)
- Single "Subscribe" button leading directly to Razorpay payment link
- Removed complex feature lists for cleaner, focused user experience

**June 22, 2025 - Premium Subscription Payment Flow Implementation:**
- Completed Razorpay payment verification and premium activation system
- Added /api/create-razorpay-order and /api/verify-razorpay-payment endpoints for secure payment processing
- Implemented activatePremiumSubscription method in both DatabaseStorage and FallbackStorage
- Premium users automatically get upgraded limits: 5 AI photo scans and 20 food searches daily
- Payment signature verification using HMAC-SHA256 ensures secure transaction validation
- Database stores Razorpay payment IDs and subscription details for audit trail
- Premium status persists across sessions with automatic limit enforcement
- Free users limited to 2 photo scans and 1 food search daily before subscription prompt
- Payment success updates user subscription_status to 'premium' with activation timestamp
- Complete end-to-end payment flow from modal to database premium activation

**June 21, 2025 - Enhanced Dashboard UX, Advanced Sharing & AI Camera Reset:**
- Moved calorie goal progress section to top of dashboard above nutrition summary for better UX
- Updated sharing button text from "Share Dashboard" to "Share Today's Progress" 
- Created advanced visual sharing templates with HTML and Instagram Story formats
- Added Instagram Story sharing option with custom 1080x1920 canvas-generated images
- Enhanced sharing text with better formatting, goal progress percentage, and branded hashtags
- Implemented downloadable HTML template with gradient backgrounds and modern design
- Added automatic AI food camera reset after analysis completion with 1.5-second success message delay
- Camera now returns to initial state after food detection and meal addition are complete
- Improved user experience by clearing captured images, analysis results, and camera streams automatically
- Fixed daily summary to add new meals instead of replacing existing data for the same date
- New food items now properly append to existing daily totals (calories, protein, carbs, fat)
- Combined meal data preserves all meals throughout the day in chronological order
- Fixed continuous calculation loop in profile page by implementing manual calculation approach
- Resolved string-to-number validation errors in profile form with proper Zod transformations
- Fixed critical Dashboard "calories out" calculation bug - exercise data now properly displays
- Exercise tracking now uses `createdAt` field instead of missing `completedAt` field for date filtering
- Dashboard correctly shows exercise calories burned from completed workouts
- Complete exercise data integration between Exercise Tracker and Dashboard components
- All calorie tracking (in/out/net) now functions correctly with proper data accumulation

**June 21, 2025 - Complete UI/UX Redesign & Enhanced Exercise Features:**
- Completely redesigned profile page with clean, minimal layout using three-column grid design
- Added AI-powered motivational quotes with daily inspiration and personalized encouragement
- Enhanced profile form with streamlined inputs, gradient backgrounds, and modern visual design
- Moved results display to dedicated right sidebar with compact metrics cards
- Added visual goal selection with interactive cards for weight loss/gain objectives
- Implemented comprehensive exercise intensity selection for both AI and quick exercise tracking
- Enhanced intensity options with emoji indicators (😌 Low, 💪 Moderate, 🔥 High) and multiplier display
- Added gradient-styled intensity buttons with hover effects and real-time calorie updates
- Fixed calendar date selection to show selected date's data instead of always displaying today's information
- Calendar now displays proper date headers ("Jun 20 Food Items" vs "Today's Food Items")
- Enhanced exercise tracking interface with gradient backgrounds and improved visual hierarchy
- All profile calculation results now display immediately with proper data persistence
- Complete modern UI overhaul maintaining functionality while improving user experience and visual appeal

**June 20, 2025 - Complete User Data Persistence & Calonik.ai Branding:**
- Implemented Firebase-based user data persistence using Firebase user UID as session identifier
- Each authenticated user's data now properly saved by calendar date and persists across login sessions
- Updated all API endpoints (meals, profile, exercises, daily summaries) to use Firebase authentication
- Fixed "Calculate my profile" display issue with proper query invalidation and result showing
- Updated app branding from "All Food Calorie Tracker" to "Calonik.ai" across all components
- Created custom Calonik.ai favicon with gradient design and app icon matching the brand
- Enhanced session management to prioritize Firebase user ID over localStorage session ID
- Implemented optionalAuth middleware for seamless authenticated and guest user experience
- User data now accurately reflects in dashboard after logout/login with proper calendar date persistence
- Complete authentication integration ensures data integrity and user-specific tracking

**June 23, 2025 - Daily Nudges & Weight Tracking Implementation:**
- Implemented daily email nudges for calorie and exercise logging using SendGrid integration
- Created WeightUpdateModal for morning weight check-ins with goal progress congratulations
- Added dailyWeights table to schema for tracking daily weight measurements
- Implemented morning popup (6-11 AM) reminder for users to log their daily weight
- Enhanced weight modal with motivational messages based on user's weight goals (lose/gain/maintain)
- Added weight progress tracking with previous day comparison and achievement celebration
- Created email service with branded templates for daily reminders and weight congratulations
- Replaced Razorpay payment integration with direct link to subscription page (https://rzp.io/rzp/PzQuvY87)
- Added nudge scheduler framework for automated daily reminders at 9 AM and 6 PM
- Enhanced storage interfaces with daily weight CRUD operations for both database and fallback storage
- Added today's weight display prominently in Dashboard nutrition summary as 4th card alongside calories in/out/net
- Implemented interactive chart showing daily calories vs weight correlation using Recharts
- Chart displays 14-day trend with dual Y-axis for calories and weight tracking
- Added target calorie line and comprehensive legend for better data visualization
- Added calendar date picker in Food Tracker for selecting specific dates to track meals
- Modified all meal operations to save data against selected date instead of only today
- Updated Dashboard to display nutrition summary and weight for selected calendar date
- Enhanced backend storage to support date-specific meal tracking and retrieval
- Dashboard shows "Today's" labels only when current date is selected, otherwise shows selected date
- Daily nudge scheduler now actively running and checking for users at 9 AM and 6 PM for email reminders
- Implemented comprehensive date-specific weight tracking system with inline weight logging in TrackerNutritionSummary
- Weight data now properly saves per date and displays selected date's specific weight instead of just profile weight

**June 23, 2025 - SEO Optimization & Legal Footer Implementation:**
- Comprehensive SEO optimization with meta tags, Open Graph, Twitter Cards, and structured data
- Added descriptive title: "Calonik.ai - Smart Calorie Tracker & Weight Management App"
- Enhanced meta description highlighting AI-powered food recognition and personalized nutrition insights
- Implemented relevant keywords for calorie tracking, weight loss, nutrition app, and fitness tracking
- Added structured data markup for WebApplication schema with pricing and category information
- Created comprehensive Footer component with brand section, feature links, and legal navigation
- Implemented Privacy Policy page with detailed data collection, usage, and security information
- Created Terms & Conditions page covering acceptable use, premium services, and health disclaimers
- Added Refund Policy page with clear eligibility criteria and 7-day refund window
- Integrated footer and policy pages into main App router with proper navigation
- Enhanced Landing page meta description for better search engine optimization

**June 23, 2025 - Complete Date-Specific Exercise Storage & Display Fix:**
- Fixed critical bug where exercises weren't storing with the correct selected date
- Updated exercises schema to include date and exerciseName fields with proper database migration
- Modified ExerciseTracker to receive and use selectedDate prop from home component
- Enhanced exercise mutations to include date parameter when storing exercises
- Fixed exercise API validation and logging for better debugging
- Updated cache invalidation to refresh both general and date-specific exercise queries
- Exercises now properly store and display based on selected calendar date (June 22 exercises only show on June 22)
- Dashboard calories out calculation correctly uses exercises from the selected date only
- Complete historical exercise tracking functionality working across all dates

**June 23, 2025 - Fixed Date-Specific Meal Clearing & Enhanced Exercise Calendar:**
- Fixed meal clearing to work with specific selected dates instead of clearing all meals
- Updated API endpoint to support date-specific meal clearing (/api/meal/clear/:sessionId/:date)
- Enhanced fallback storage to filter meals by date when clearing
- Current meal now properly clears only for the selected date after submission
- Added prominent calendar date picker to exercise page matching food tracker interface
- Exercise entries now save with specific dates instead of always using today's date
- Updated exercise schema to include date field for proper historical tracking
- Enhanced fallback storage to handle date-specific exercise filtering
- Dashboard now correctly displays exercises for selected calendar dates
- Calendar picker appears at top of exercise tab for easy date selection
- Removed redundant internal calendar picker from ExerciseTracker component

**June 23, 2025 - Fixed Calendar Date Selection & Meal Storage:**
- Fixed critical bug where meals added on selected dates were saving to today's date instead
- Updated MealSummary component to use selected date instead of hardcoded today's date
- Fixed daily summary submission to save data against the selected calendar date
- Enhanced toast messages to show correct date when submitting or clearing meals
- Calendar date selection now works properly for historical meal tracking
- Meals added on June 21st now save to June 21st instead of defaulting to today

**June 23, 2025 - Fixed Current Meal Display & Session Synchronization:**
- Fixed critical bug where meals weren't appearing in Current Meal component
- Resolved session ID mismatch between authenticated user ID and meal storage
- Updated home component to use authenticated user ID as primary session identifier
- Fixed database schema to include date field for meal items with proper migration
- Enhanced fallback storage to handle date-specific meal filtering and missing foods
- Added comprehensive logging for meal operations debugging
- Modified API routes to maintain session consistency between add and retrieve operations
- Meals now properly store and display for selected calendar dates

**June 25, 2025 - Integrated Subscription System & Google OAuth Configuration:**
- Completely integrated Razorpay payment system within the app, removing all external payment links
- Enhanced backend order creation with detailed user information and subscription metadata
- Updated subscription modal to use only integrated Razorpay checkout with proper error handling
- Removed external payment buttons from Footer and subscription modal for streamlined user experience
- Fixed Google OAuth for production site calonik.ai with automatic domain detection
- Enhanced session security with HTTPS-enabled cookies and proper sameSite policy for OAuth flows
- Created payment success page with automatic redirect to tracker after 3 seconds
- Enhanced webhook response to include proper redirect URL for payment completion flow
- Added comprehensive health disclaimer in Footer component above copyright section
- Fixed height display precision to show clean 2-decimal values (167.64 cm vs 167.64000000000001)
- Fixed weight update API errors by correcting FallbackStorage memoryDailyWeights implementation

**June 25, 2025 - Fixed AI Camera Date-Specific Meal Storage:**
- Fixed critical bug where AI camera detected foods were saving to today's date instead of selected calendar date
- Updated FoodCamera component to properly pass selectedDate parameter when adding AI-detected foods to meals
- Enhanced cache invalidation to use date-specific query keys for proper meal data refresh
- AI camera now correctly saves foods to the selected date (June 24th foods save to June 24th, not today)
- Fixed addMealMutation to include date parameter for accurate historical meal tracking
- Date-specific meal storage now works consistently across manual food search and AI camera detection

**June 25, 2025 - Optimized Razorpay Payment Modal Performance:**
- Fixed long loading times for Razorpay payment options page
- Implemented requestIdleCallback for non-blocking script loading 
- Added defer attribute to reduce main thread blocking
- Reduced timeout from 5 minutes to 3 minutes for better UX
- Added loading timeout protection (8 seconds) with user feedback
- Used performance-optimized modal opening with delayed initialization
- Added visual loading spinner for better user experience
- Fixed forced reflow violations causing 250ms+ delays

**June 25, 2025 - Fixed AI Camera Meal Item Removal Bug:**
- Fixed critical bug where AI camera detected foods couldn't be removed from Current Meal
- Corrected apiRequest function call format in MealSummary component (DELETE method parameter)
- Error was: `'/api/meal/ID' is not a valid HTTP method` due to incorrect parameter order
- Now properly uses apiRequest("DELETE", `/api/meal/${id}`) format for meal item removal
- AI camera workflow now complete: detect food → add to meal → remove if needed

**June 25, 2025 - Enhanced Profile System with Persistent Display:**
- Implemented persistent profile display in both Profile tab and Dashboard
- Added profile save state detection with green visual indicators when profile is active
- Created comprehensive profile overview in Dashboard showing personal stats, nutrition targets, and weight goals
- Added "Update Profile" functionality with edit mode toggle for existing profiles
- Profile data now displays prominently with BMR, TDEE, and target calories always visible
- Added profile setup prompt in Dashboard for users without saved profiles
- Enhanced profile form to pre-populate with existing data when editing
- Added navigation link from Dashboard to Profile tab for easy profile completion
- Profile persistence ensures user data is maintained across sessions with proper visual feedback

**June 24, 2025 - AWS Aurora Serverless v2 Migration Setup:**
- Prepared complete migration from Replit PostgreSQL to AWS Aurora Serverless v2
- Created comprehensive migration guide with step-by-step AWS setup instructions
- Implemented automatic database detection (AWS_DATABASE_URL takes precedence over DATABASE_URL)
- Added migration scripts for data export/import and verification
- Updated application code to seamlessly work with both Replit and AWS databases
- Cost-effective serverless scaling with automatic pause/resume functionality
- Maintains full PostgreSQL compatibility with existing Drizzle ORM schema
- Migration scripts include data verification and rollback capabilities

**June 24, 2025 - Google OAuth Authentication Implementation:**
- Implemented popup-based Google OAuth authentication using passport-google-oauth20
- Added proper OAuth callback handling with popup window management
- Updated user schema to support Google authentication with googleId and provider fields
- Created seamless authentication flow without X-Frame-Options restrictions
- Users can now sign in with Google accounts for persistent data across sessions
- OAuth popup automatically closes and refreshes authentication state on success
- Current configuration uses Replit domain with plan to migrate to calonik.ai custom domain

**June 23, 2025 - Razorpay Payment Widget Integration & Legal Updates:**
- Integrated native Razorpay subscription widget (pl_Qkc4Kzc43T8zue) in SubscriptionModal for seamless payment flow
- Updated all legal pages (Privacy Policy, Terms & Conditions, Refund Policy) to use support@calonik.ai contact email
- Added subscription buttons in both Footer and SubscriptionModal components with direct Razorpay payment links
- Replaced custom payment buttons with official Razorpay subscription widget for better user experience
- Fixed Razorpay subscription period from 1 year to 1 month for monthly billing cycle
- Updated activatePremiumSubscription methods in both DatabaseStorage and FallbackStorage
- Subscription now correctly expires 1 month from activation date instead of 1 year
- Added human verification (math CAPTCHA) to registration form to prevent bot registrations
- Updated Badge component styling with dark theme background (bg-[#1b2027])
- Disabled healthy meal recommendations feature completely for all users
- Verified webhook payment.captured event handling works correctly for premium activation

**June 22, 2025 - Email/Password Authentication & Razorpay Webhook Integration:**
- Replaced Replit OAuth with custom email/password authentication system
- Implemented secure registration/login modal with form validation and bcrypt password hashing
- Added user display in navigation showing welcome message and premium badge for premium users
- Enhanced usage limits: Free users (2 photos, 1 search daily), Premium users (5 photos, 20 searches daily)  
- Improved limit enforcement with proper upgrade prompts for free users and limit notifications for premium users
- Cleaned database and reset all existing users for fresh start
- Updated landing page with "Get Started" button opening custom authentication modal
- Database schema updated to support password field and subscription status tracking
- Session-based authentication with PostgreSQL session store for data persistence
- Premium users display crown badge and get enhanced daily limits with proper tracking
- Implemented Razorpay webhook integration for automatic premium activation on payment completion
- Webhook URL: https://951c9b0b-a7e6-4243-ad92-b80de619ea52-00-2w9g548p0tyi.worf.replit.dev/api/razorpay-webhook
- Automatic user upgrade to premium status with monthly subscription period upon successful payment verification

**June 20, 2025 - Simplified Tracker Interface & Enhanced Profile Management:**
- Removed daily progress section from Tracker home for cleaner, focused meal tracking interface
- Enhanced user profile with age field that clears placeholder completely when clicked
- Changed height measurement from cm to feet with decimal support (e.g., 5.6 feet)
- Added weight loss target field: "How many KGs do you want to lose?"
- Profile automatically saves to database after clicking "Calculate my profile"
- Height converts from feet to cm for backend calculations while maintaining feet display
- Completed exercise removal functionality with individual remove buttons and clear all option
- Implemented AI-powered motivational messages in Dashboard with personalized feedback
- Messages analyze calorie balance, weight goals, and provide actionable tips based on user progress
- Daily progress functionality consolidated in Dashboard tab for comprehensive tracking

**June 20, 2025 - Profile Persistence & Weight Goal Dashboard Integration:**
- Enhanced user profile to save last entered values to PostgreSQL database instead of just localStorage
- Added comprehensive weight goal tracking display in dashboard with visual indicators
- Weight goal section shows current weight, goal type (lose/gain/maintain), and daily calorie target
- Added intelligent "Weight Goal Status" indicator showing if user is on track based on calorie intake vs goal
- Color-coded badges show calorie strategy: deficit for weight loss, surplus for gain, balanced for maintenance
- Enhanced profile calculation to properly invalidate cache and update dashboard immediately
- Dashboard now displays personalized weight goal guidance with specific recommendations
- Profile data persistence ensures user preferences are maintained across sessions

**June 20, 2025 - Enhanced Camera Functionality & Error Handling:**
- Fixed camera initialization with comprehensive error handling and user feedback
- Added visual indicators showing "Camera Active" status and initialization progress
- Enhanced state management to prevent conflicts between camera and upload modes
- Improved capture photo functionality with proper readiness checks and validation
- Added loading states and disabled buttons during camera initialization for better UX
- Enhanced error reporting for camera access issues with clear fallback suggestions

**June 20, 2025 - Complete Exercise Tracker Redesign with Simple Quick Selection & Dashboard Integration:**
- Completely redesigned Exercise Tracker with AI-powered exercise detection using OpenAI GPT-4o
- Added separate AI-powered exercise input box for natural language descriptions ("45 minutes intense cardio")
- Implemented intelligent intensity levels (low/moderate/high) with dynamic calorie multipliers
- Redesigned Quick Exercise Selection to be simple and minimal with grid layout
- Exercise types displayed as compact buttons (2x3 grid) with icons and names
- Enhanced manual time input with bigger, more prominent design (h-12, text-lg)
- Removed Yoga from exercise types list as requested by user
- Added "Today's Completed Exercises" section showing all completed exercises with timestamps
- Integrated exercises with Dashboard to display alongside food tracking
- AI analyzes exercise descriptions and provides calorie burn estimates with scientific reasoning
- Added comprehensive local fallback analysis for running, walking, swimming, cycling, and strength training
- Enhanced UI with gradient backgrounds, exercise categories, and real-time calorie calculations
- Dashboard now shows completed exercises in side-by-side layout with food items
- Exercise data properly cached and immediately visible after completion
- Fixed exercise API endpoint to ensure proper logging to both completed exercises and dashboard
- Redesigned Food Search with intelligent unit and quantity detection system
- Implemented AI-powered food analysis using OpenAI GPT-4o for smart serving suggestions
- Enhanced nutrition display with real-time calorie calculation and visual improvements
- Added smart reasoning display explaining recommended portions for each food type
- Beverages automatically default to "cup" with appropriate multipliers for realistic calorie counts
- Snacks intelligently suggest quantity based on calorie density (1 vs 2 pieces)
- Rice/curry dishes default to "medium portion" with portion-based unit options
- Countable items (fruits, bread, eggs) automatically suggest "piece" measurements
- Enhanced search suggestions show intelligent unit recommendations with color-coded badges
- Improved nutrition cards with gradient backgrounds and better visual hierarchy
- Added loading animations and enhanced "Add to Meal" button with dynamic text
- Fixed unit field validation issue that was preventing food additions to meals
- Complete intelligent food and exercise analysis systems with both AI and local fallback algorithms

**June 20, 2025 - AI-Powered Healthy Meal Suggestions & Dashboard Food Items Fix:**
- Implemented comprehensive AI-powered healthy meal suggestions using OpenAI GPT-4o model
- AI analyzes current meal composition and provides personalized nutrition recommendations
- Intelligent suggestions include specific food additions with calorie impact and health reasoning
- Enhanced API endpoint to accept sessionId parameter for meal-specific analysis
- Replaced static healthy alternatives with dynamic AI-generated suggestions
- Fixed critical Dashboard bug: "Today's Food Items" now correctly displays submitted meals
- Resolved variable scoping issue where todayMealItems referenced wrong summary data
- Dashboard now properly shows foods from daily summary instead of current meal tracker
- AI suggestions provide fallback recommendations when OpenAI API is unavailable
- Complete meal-to-dashboard workflow now functions seamlessly with AI camera integration

**June 20, 2025 - Smart Unit-Based Nutrition Adjustment & Performance Fixes:**
- Implemented intelligent unit-based calorie and nutrient adjustment system
- Different units now properly adjust nutrition values: slice (0.6x), piece (0.8x), small portion (0.7x), large portion (1.5x)
- Added food-specific adjustments: cake slice (0.8x), pizza slice (0.3x), snack pieces (0.5x)
- Consistent nutrition calculations across FoodSearch, MealSummary, and ExerciseTracker components
- Fixed food search auto-suggestions: corrected parameter mismatch between frontend and backend
- Updated TanStack Query implementation to use proper queryFn with fetch for search functionality
- Fixed critical AI camera bug: Foods now appear immediately in Current Meal after photo analysis
- Resolved database storage issue: AI foods with hash IDs now properly stored and retrieved
- Enhanced cache invalidation strategy for immediate UI updates after food detection
- Optimized food search performance with 300ms debouncing to eliminate browser violations

**June 19, 2025 - Dashboard Redesign & Testing Improvements:**
- Redesigned dashboard with daily summary prominently displayed at top
- Added calories in/out progress bar with color-coded visual indicators
- Moved calendar to smaller side position for better space utilization
- Enhanced UX with gradient backgrounds and improved visual hierarchy
- Removed photo credit limits for testing phase to enable unlimited AI camera usage
- Prepared automatic dashboard redirect after meal submission for better user flow
- Dashboard now shows net calories calculation (calories in minus calories out)
- Added quick stats card showing days tracked and average daily calories
- Improved responsive design for mobile and desktop viewing

**June 19, 2025 - AI-Powered Smart Unit Selection & Critical Bug Fixes:**
- Implemented AI-powered smart unit selection system using OpenAI for intelligent unit suggestions
- Rice/curry automatically suggests "medium portion", beverages suggest "cups", countable items suggest "pieces"
- Enhanced UX with sleek, responsive animations and gradient designs
- Added real-time AI unit suggestions with loading indicators and smooth transitions
- Fixed critical server crash: Replaced Passport.js authentication check with custom auth middleware
- Resolved "req.isAuthenticated is not a function" error that prevented app startup
- Fixed usage limit blocking basic meal tracking: Removed usage restrictions from meal addition
- Maintained usage limits only for premium features (AI photo analysis)
- Fixed food item mismatch: Replaced sequential AI food IDs with deterministic hash-based IDs
- Eliminated wrong food items appearing in meals (sausage showing as "Gal", dal as "horlicks", etc)
- App now fully functional with both Supabase OAuth and device fingerprint authentication
- Users can now add meals without hitting daily credit limits for basic functionality

**June 19, 2025 - Supabase Authentication Implementation:**
- Replaced Firebase with Supabase for Google OAuth authentication
- Implemented secure device fingerprint authentication as primary authentication method
- Fixed security vulnerability: prevented users from bypassing daily limits by clearing browser cache
- Daily credits now tied to device hardware fingerprint instead of browser sessions
- Removed OpenAI API notification from food search for cleaner user experience
- Updated all backend routes to handle both Supabase JWT tokens and device fingerprint authentication
- Enhanced security: Daily usage tracking now secure and exploit-proof through hardware fingerprinting
- Device fingerprint authentication prevents cache clearing exploits by using browser/hardware characteristics
- Updated branding from "Indian Calorie Tracker" to "All Food Calorie Tracker"
- Implemented daily credit system: Users get 1 free meal tracking + 1 free AI photo analysis per day
- Configured Razorpay as payment gateway for premium subscriptions (Rs.999/year)
- Made payment gateway configuration optional for development without keys
- Fixed quantity input to only accept integers instead of decimals

**June 19, 2025 - Complete Feature Implementation & User Experience Enhancements:**
- Auto-unit selection: Rice/curry defaults to "medium portion", countable items to "pieces"
- Enhanced AR camera with dual options: "Open Camera" and "Upload Photo" buttons
- Profile memory: Automatically saves and restores last entered user information
- Exercise time tracking: Added manual time input option alongside timer functionality
- Daily summary progress bars: Visual calorie target tracking with over/under indicators
- Enhanced pieces unit support for items like sausage, samosa, apple, pizza slice
- Created AR camera feature for food analysis using OpenAI vision API
- Moved healthy alternatives to bottom with meal-based suggestions instead of individual food suggestions
- Added submit meal button that saves current meal to daily summary database
- Implemented comprehensive dashboard with calendar tracking showing daily calorie consumption
- Added color-coded calendar view (green/yellow/red) based on daily calorie levels
- Created detailed daily summary view with nutrition breakdown and meal history
- Enhanced navigation with 4 tabs: Tracker, Profile, Exercise, Dashboard

**June 19, 2025 - Enhanced Progress Bar & AI Food Search:**
- Enhanced daily progress bar with target calorie tracking from user profile
- Added animated red progress bar when exceeding daily calorie target
- Integrated exercise tracking showing calories burned in progress section
- Added net calorie calculation (consumed - burned) with color-coded status
- Implemented OpenAI-powered food search for unknown foods not in database
- Added Pork Curry (Normal), various sandwiches, and comprehensive Chinese-Indian fusion foods
- Enhanced progress bar with interactive animations and exercise summaries
- Added visual indicators for remaining calories vs over-target status

**June 19, 2025 - Enhanced Food Database & Auto-Suggestions:**
- Expanded food database to 250+ items with comprehensive international and diverse cuisine
- Enhanced auto-suggestion feature with real-time search (starts from 1 character)
- Added authentic Naga foods: Smoked Pork Curry, Bamboo Shoot Curry, Axone, Galho, Jadoh
- Included regional specialties: Bengali, Gujarati, Rajasthani, Kerala, Maharashtrian cuisines
- Added Chinese fusion foods: Hakka Noodles, Manchurian, Chilli Chicken, Momos
- Fixed search validation issues for smooth user experience
- Improved search responsiveness and result filtering

**June 19, 2025 - Initial Setup:**
- Complete All Food Calorie Tracker application built
- Dark theme with Replit-inspired design
- Session-based meal tracking and user profiles
- Exercise timer with calorie burn calculations

## User Preferences

Preferred communication style: Simple, everyday language.