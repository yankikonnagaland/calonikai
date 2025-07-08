// Mock AI service for food image analysis
export async function analyzeFoodImage(imageUri) {
  // Simulate API processing time
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Mock AI analysis result
  // In a real implementation, this would send the image to your AI service
  const mockAnalysisResults = [
    {
      foods: [
        {
          name: 'Grilled Chicken Breast',
          quantity: 1,
          unit: 'piece',
          calories: 231,
          protein: 43.5,
          carbs: 0,
          fat: 5.0,
          confidence: 0.95,
        },
        {
          name: 'Steamed Rice',
          quantity: 1,
          unit: 'cup',
          calories: 205,
          protein: 4.3,
          carbs: 44.5,
          fat: 0.4,
          confidence: 0.88,
        },
      ],
      totalCalories: 436,
      confidence: 0.92,
    },
    {
      foods: [
        {
          name: 'Dal (Lentil Curry)',
          quantity: 1,
          unit: 'cup',
          calories: 116,
          protein: 9,
          carbs: 20,
          fat: 0.4,
          confidence: 0.91,
        },
        {
          name: 'Chapati',
          quantity: 2,
          unit: 'piece',
          calories: 142,
          protein: 5.2,
          carbs: 31.2,
          fat: 0.8,
          confidence: 0.87,
        },
      ],
      totalCalories: 258,
      confidence: 0.89,
    },
    {
      foods: [
        {
          name: 'Vegetable Biryani',
          quantity: 1,
          unit: 'cup',
          calories: 165,
          protein: 4,
          carbs: 30,
          fat: 4,
          confidence: 0.93,
        },
        {
          name: 'Raita (Yogurt Salad)',
          quantity: 0.5,
          unit: 'cup',
          calories: 39,
          protein: 2.5,
          carbs: 4,
          fat: 1.2,
          confidence: 0.82,
        },
      ],
      totalCalories: 204,
      confidence: 0.88,
    },
  ];

  // Return a random result for demo purposes
  const randomIndex = Math.floor(Math.random() * mockAnalysisResults.length);
  return mockAnalysisResults[randomIndex];
}

export async function getSmartPortionRecommendation(foodName) {
  // Mock smart portion recommendations
  const portionMap = {
    rice: { quantity: 1, unit: 'cup', grams: 150 },
    chicken: { quantity: 1, unit: 'piece', grams: 100 },
    dal: { quantity: 1, unit: 'cup', grams: 200 },
    chapati: { quantity: 2, unit: 'piece', grams: 60 },
    curry: { quantity: 1, unit: 'cup', grams: 150 },
    vegetables: { quantity: 1, unit: 'cup', grams: 100 },
    fruit: { quantity: 1, unit: 'piece', grams: 120 },
    nuts: { quantity: 1, unit: 'handful', grams: 30 },
  };

  const lowercaseName = foodName.toLowerCase();
  
  // Find matching portion recommendation
  for (const [key, portion] of Object.entries(portionMap)) {
    if (lowercaseName.includes(key)) {
      return portion;
    }
  }

  // Default portion
  return { quantity: 1, unit: 'serving', grams: 100 };
}