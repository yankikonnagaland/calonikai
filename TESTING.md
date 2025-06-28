# Calonik.ai Testing Guide

## Overview

This comprehensive test suite was created to prevent regressions during version changes and ensure the stability of all components across Calonik.ai's full-stack nutrition tracking application.

## Test Structure

```
client/src/test/
├── setup.ts                    # Global test configuration
├── components/                 # Component unit tests
│   ├── FoodSearch.test.tsx     # Food search functionality
│   ├── ExerciseTracker.test.tsx # Exercise tracking with enhanced features
│   ├── UserProfile.test.tsx    # Profile calculations (BMR/TDEE/protein)
│   ├── Dashboard.test.tsx      # Dashboard integration and metrics
│   ├── MealSummary.test.tsx    # Meal tracking and nutrition totals
│   └── FoodCamera.test.tsx     # AI camera food detection
├── integration/                # End-to-end workflow tests
│   └── app.test.tsx           # Complete user workflows
├── api/                       # API logic and calculations
│   └── routes.test.ts         # Backend logic validation
└── utils/                     # Test utilities and helpers
    └── testHelpers.ts         # Mock data and utilities
```

## Test Categories

### 1. Component Tests
- **FoodSearch**: Search functionality, unit selection, portion calculations
- **ExerciseTracker**: Exercise selection, enhanced tracker toggle, calorie calculations
- **UserProfile**: BMR/TDEE calculations, protein targets, weight goals
- **Dashboard**: Nutrition summaries, progress tracking, calorie vs weight correlation
- **MealSummary**: Meal item management, nutrition totals, submission workflow
- **FoodCamera**: AI food detection, usage limits, camera functionality

### 2. Integration Tests
- Complete meal tracking workflows
- Profile setup and calculation processes
- Exercise logging with enhanced tracking
- Navigation between application tabs
- Authentication state management
- Error handling across components

### 3. API Logic Tests
- Nutrition calculations and portion adjustments
- BMR/TDEE formula validation
- Exercise calorie calculations with intensity levels
- Unit-based food adjustments
- Date handling and formatting
- Usage limit calculations

### 4. Calculation Validation Tests
- **BMR Calculations**: Mifflin-St Jeor equation for males/females
- **TDEE Calculations**: Activity level multipliers
- **Protein Targets**: 0.8g per kg body weight (customizable)
- **Calorie Goals**: Weight goal adjustments (deficit/surplus)
- **Exercise Calories**: Intensity-based multipliers
- **Portion Calculations**: Unit-based nutrition scaling

## Key Test Scenarios

### Food Search & Nutrition
- Search functionality with debouncing
- Intelligent unit selection (portions, pieces, cups)
- Realistic calorie calculations with portion multipliers
- Beer bottle calculations (330ml, 500ml, 650ml)
- Rice portion calculations (150g medium portion)

### Exercise Tracking
- Enhanced tracker toggle for running/walking/cycling
- Distance, intensity level, heart rate, terrain tracking
- Duration handling from time tracking vs manual input
- Calorie calculations with intensity multipliers
- Date-specific exercise storage and retrieval

### Profile Management
- Height conversion (feet to cm: 5.6 ft → 170.69 cm)
- BMR calculation validation for different genders
- TDEE calculation with activity levels
- Protein target calculation (76kg × 0.8 = 60g)
- Weight goal calorie adjustments

### Dashboard Integration
- Calorie goal progress tracking
- Net calorie calculations (consumed - burned)
- Weight goal status indicators
- Daily nutrition summaries
- Exercise integration with calorie tracking

## Running Tests

### Basic Commands
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test categories
npm run test:components
npm run test:integration
npm run test:api

# Run tests with UI interface
npm run test:ui

# Generate coverage reports
npm run test:coverage
```

### Test-Specific Commands
```bash
# Test specific components
npx vitest run FoodSearch.test.tsx
npx vitest run ExerciseTracker.test.tsx
npx vitest run UserProfile.test.tsx

# Test specific functionality
npx vitest run --grep "BMR calculation"
npx vitest run --grep "enhanced tracker"
npx vitest run --grep "protein target"
```

## Critical Test Validations

### 1. Nutrition Calculations
- **Beer Bottle**: 43 cal/100ml × 6.5 = 280 calories (650ml bottle)
- **Rice Portion**: 130 cal/100g × 1.5 = 195 calories (150g medium portion)
- **Unit Adjustments**: slice (0.6x), piece (0.8x), large portion (1.5x)

### 2. Profile Calculations
- **Male BMR**: 10×weight + 6.25×height - 5×age + 5
- **Female BMR**: 10×weight + 6.25×height - 5×age - 161
- **TDEE**: BMR × activity multiplier (1.2-1.9)
- **Protein**: weight(kg) × 0.8 = daily protein target

### 3. Exercise Calculations
- **Intensity Multipliers**: Low (0.8x), Moderate (1.0x), High (1.3x)
- **Enhanced Tracking**: Distance, heart rate, terrain validation
- **Duration Sources**: Time tracking vs manual input vs enhanced override

### 4. Date Handling
- **Format Validation**: YYYY-MM-DD format consistency
- **Date-Specific Storage**: Meals, exercises, weights per selected date
- **Calendar Navigation**: Proper date filtering and display

## Regression Prevention

### Version Change Checklist
1. **Run Full Test Suite**: Ensure all tests pass before deployment
2. **Validate Calculations**: Check BMR, TDEE, protein, calorie calculations
3. **Test Enhanced Features**: Verify enhanced exercise tracker functionality
4. **Check Date Handling**: Ensure proper date-specific data storage
5. **Verify API Endpoints**: Test all meal, exercise, profile operations
6. **Test Authentication**: Verify user session and premium features

### Critical Business Logic
- **Calorie Calculations**: Must remain accurate for nutrition tracking
- **Profile Calculations**: BMR/TDEE formulas must be consistent
- **Exercise Tracking**: Enhanced tracker data must persist correctly
- **Date Filtering**: Historical data must display for correct dates
- **Usage Limits**: Premium vs free tier limits must be enforced

## Mock Data and Utilities

The test suite includes comprehensive mock data generators for:
- User profiles with realistic BMR/TDEE values
- Food items with accurate nutrition information
- Exercise entries with enhanced tracking data
- Daily summaries and weight entries
- Usage statistics for premium/free users

All mock data follows the same validation rules as production data to ensure test accuracy.

## Test Environment Setup

Tests run in a controlled environment with:
- Mocked API responses for consistent testing
- Isolated component rendering with React Testing Library
- Mocked browser APIs (camera, geolocation, localStorage)
- Predictable date handling for consistent test results

## Continuous Integration

This test suite is designed to:
- Run automatically on code changes
- Prevent deployment of breaking changes
- Validate all critical user workflows
- Ensure calculation accuracy across versions
- Maintain data integrity during updates

## Test Maintenance

- Update tests when adding new features
- Validate calculation formulas when modifying business logic
- Ensure mock data stays current with schema changes
- Review test coverage for new components
- Update integration tests for new user workflows