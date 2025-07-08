// BMR Calculation using Mifflin-St Jeor Equation
export function calculateBMR(weight, height, age, gender) {
  const baseBMR = 10 * weight + 6.25 * height - 5 * age;
  
  if (gender === 'male') {
    return baseBMR + 5;
  } else {
    return baseBMR - 161;
  }
}

// TDEE Calculation
export function calculateTDEE(bmr, activityLevel) {
  const activityMultipliers = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
    extremely_active: 1.9,
  };
  
  return bmr * (activityMultipliers[activityLevel] || 1.2);
}

// Target Calories based on goals
export function calculateTargetCalories(tdee, goal) {
  switch (goal) {
    case 'lose':
      return tdee - 500; // 500 calorie deficit for 1 lb/week loss
    case 'gain':
      return tdee + 500; // 500 calorie surplus for 1 lb/week gain
    case 'muscle':
      return tdee + 300; // Moderate surplus for lean muscle gain
    case 'maintain':
    default:
      return tdee;
  }
}

// Exercise Calories Calculation
export function calculateExerciseCalories(exerciseName, durationMinutes, weight, intensity = 'moderate') {
  // MET (Metabolic Equivalent) values for common exercises
  const metValues = {
    'running': { low: 8, moderate: 10, high: 12 },
    'walking': { low: 3, moderate: 4, high: 5 },
    'cycling': { low: 6, moderate: 8, high: 10 },
    'swimming': { low: 6, moderate: 8, high: 11 },
    'weight training': { low: 3, moderate: 5, high: 6 },
    'yoga': { low: 2, moderate: 3, high: 4 },
    'dancing': { low: 3, moderate: 5, high: 7 },
    'basketball': { low: 6, moderate: 8, high: 10 },
    'football': { low: 7, moderate: 9, high: 10 },
    'tennis': { low: 5, moderate: 7, high: 8 },
  };

  // Default MET values if exercise not found
  const defaultMet = { low: 3, moderate: 5, high: 7 };
  
  const exerciseKey = exerciseName.toLowerCase();
  const met = metValues[exerciseKey] || defaultMet;
  const metValue = met[intensity] || met.moderate;
  
  // Calories = MET × weight (kg) × time (hours)
  const hours = durationMinutes / 60;
  return metValue * weight * hours;
}

// Food Nutrition Calculation
export function calculateNutrition(food, quantity, unit) {
  // Unit conversion multipliers (relative to 100g serving)
  const unitMultipliers = {
    'gram': 0.01,
    'piece': 0.3, // Approximate for average food piece
    'serving': 1.0, // Standard 100g serving
    'cup': 1.5, // Approximate 150g
    'bowl': 1.5, // Approximate 150g
    'slice': 0.3, // Approximate 30g
    'handful': 0.6, // Approximate 60g
    'bottle': 5.0, // Approximate 500ml/500g
  };

  const multiplier = unitMultipliers[unit] || 1.0;
  const totalMultiplier = quantity * multiplier;

  return {
    calories: Math.round((food.calories || 0) * totalMultiplier),
    protein: Math.round((food.protein || 0) * totalMultiplier * 10) / 10,
    carbs: Math.round((food.carbs || 0) * totalMultiplier * 10) / 10,
    fat: Math.round((food.fat || 0) * totalMultiplier * 10) / 10,
  };
}