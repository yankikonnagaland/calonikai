// BMR and calorie calculation utilities

export const calculateBMR = (weight, height, age, gender) => {
  if (!weight || !height || !age) return 0;
  
  // Mifflin-St Jeor Equation
  if (gender === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
};

export const calculateTDEE = (bmr, activityLevel) => {
  const activityMultipliers = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
    extremely_active: 1.9,
  };
  
  return bmr * (activityMultipliers[activityLevel] || 1.2);
};

export const calculateTargetCalories = (tdee, goal) => {
  switch (goal) {
    case 'lose_weight':
      return tdee - 500; // 500 calorie deficit
    case 'gain_weight':
      return tdee + 500; // 500 calorie surplus
    case 'build_muscle':
      return tdee + 300; // 300 calorie surplus for lean bulk
    default:
      return tdee; // maintenance
  }
};

export const calculateProteinTarget = (weight, goal) => {
  switch (goal) {
    case 'build_muscle':
      return weight * 2.0; // 2.0g per kg for muscle building
    case 'lose_weight':
      return weight * 1.2; // Higher protein for weight loss
    default:
      return weight * 0.8; // General recommendation
  }
};

export const calculateMealNutrition = (meals) => {
  return meals.reduce(
    (total, meal) => ({
      calories: total.calories + (meal.calories || 0),
      protein: total.protein + (meal.protein || 0),
      carbs: total.carbs + (meal.carbs || 0),
      fat: total.fat + (meal.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
};

export const calculateExerciseCalories = (exercises) => {
  return exercises.reduce((total, exercise) => {
    return total + (exercise.caloriesBurned || 0);
  }, 0);
};

export const calculateNetCalories = (caloriesIn, caloriesOut) => {
  return caloriesIn - caloriesOut;
};

// Unit conversion utilities
export const convertToGrams = (quantity, unit) => {
  const unitConversions = {
    // Volume conversions (assuming water density for approximation)
    'ml': 1,
    'cup': 240,
    'glass': 250,
    'bowl': 150,
    'small_bowl': 110,
    'large_bowl': 200,
    
    // Weight conversions
    'g': 1,
    'gram': 1,
    'grams': 1,
    'kg': 1000,
    
    // Piece conversions (approximate)
    'piece': 50,
    'pieces': 50,
    'slice': 30,
    'slices': 30,
    'serving': 100,
    
    // Common food portions
    'medium': 100,
    'small': 70,
    'large': 150,
    'handful': 30,
  };
  
  return quantity * (unitConversions[unit] || 1);
};

export const calculatePortionNutrition = (food, quantity, unit) => {
  const gramsEquivalent = convertToGrams(quantity, unit);
  const multiplier = gramsEquivalent / 100; // Food data is per 100g
  
  return {
    calories: (food.calories || 0) * multiplier,
    protein: (food.protein || 0) * multiplier,
    carbs: (food.carbs || 0) * multiplier,
    fat: (food.fat || 0) * multiplier,
  };
};

export const formatDate = (date) => {
  if (typeof date === 'string') {
    return date;
  }
  return date.toISOString().split('T')[0];
};

export const isToday = (date) => {
  const today = new Date().toISOString().split('T')[0];
  const checkDate = typeof date === 'string' ? date : formatDate(date);
  return today === checkDate;
};