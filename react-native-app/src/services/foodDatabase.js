// Mock food database for demonstration
const FOOD_DATABASE = [
  // Grains & Cereals
  {
    id: 1,
    name: 'Basmati Rice (cooked)',
    calories: 121,
    protein: 2.9,
    carbs: 25,
    fat: 0.4,
    category: 'grains',
    defaultUnit: 'cup',
  },
  {
    id: 2,
    name: 'Chapati (whole wheat)',
    calories: 71,
    protein: 2.6,
    carbs: 15.6,
    fat: 0.4,
    category: 'grains',
    defaultUnit: 'piece',
  },
  {
    id: 3,
    name: 'Brown Rice (cooked)',
    calories: 111,
    protein: 2.6,
    carbs: 23,
    fat: 0.9,
    category: 'grains',
    defaultUnit: 'cup',
  },

  // Proteins
  {
    id: 4,
    name: 'Chicken Breast (grilled)',
    calories: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
    category: 'protein',
    defaultUnit: 'piece',
  },
  {
    id: 5,
    name: 'Paneer',
    calories: 265,
    protein: 18.3,
    carbs: 1.2,
    fat: 20.8,
    category: 'protein',
    defaultUnit: 'cup',
  },
  {
    id: 6,
    name: 'Dal (cooked)',
    calories: 116,
    protein: 9,
    carbs: 20,
    fat: 0.4,
    category: 'protein',
    defaultUnit: 'cup',
  },

  // Vegetables
  {
    id: 7,
    name: 'Spinach (cooked)',
    calories: 23,
    protein: 2.9,
    carbs: 3.6,
    fat: 0.4,
    category: 'vegetables',
    defaultUnit: 'cup',
  },
  {
    id: 8,
    name: 'Broccoli (steamed)',
    calories: 55,
    protein: 3.7,
    carbs: 11.2,
    fat: 0.6,
    category: 'vegetables',
    defaultUnit: 'cup',
  },
  {
    id: 9,
    name: 'Cauliflower (cooked)',
    calories: 25,
    protein: 1.9,
    carbs: 5,
    fat: 0.3,
    category: 'vegetables',
    defaultUnit: 'cup',
  },

  // Fruits
  {
    id: 10,
    name: 'Apple',
    calories: 52,
    protein: 0.3,
    carbs: 14,
    fat: 0.2,
    category: 'fruits',
    defaultUnit: 'piece',
  },
  {
    id: 11,
    name: 'Banana',
    calories: 89,
    protein: 1.1,
    carbs: 23,
    fat: 0.3,
    category: 'fruits',
    defaultUnit: 'piece',
  },
  {
    id: 12,
    name: 'Orange',
    calories: 47,
    protein: 0.9,
    carbs: 12,
    fat: 0.1,
    category: 'fruits',
    defaultUnit: 'piece',
  },

  // Dairy
  {
    id: 13,
    name: 'Whole Milk',
    calories: 42,
    protein: 3.4,
    carbs: 5,
    fat: 1,
    category: 'dairy',
    defaultUnit: 'cup',
  },
  {
    id: 14,
    name: 'Greek Yogurt',
    calories: 59,
    protein: 10,
    carbs: 3.6,
    fat: 0.4,
    category: 'dairy',
    defaultUnit: 'cup',
  },

  // Nuts & Seeds
  {
    id: 15,
    name: 'Almonds',
    calories: 579,
    protein: 21,
    carbs: 22,
    fat: 50,
    category: 'nuts',
    defaultUnit: 'handful',
  },
  {
    id: 16,
    name: 'Walnuts',
    calories: 654,
    protein: 15,
    carbs: 14,
    fat: 65,
    category: 'nuts',
    defaultUnit: 'handful',
  },

  // Indian Dishes
  {
    id: 17,
    name: 'Chicken Curry',
    calories: 135,
    protein: 12,
    carbs: 9,
    fat: 6,
    category: 'curry',
    defaultUnit: 'cup',
  },
  {
    id: 18,
    name: 'Vegetable Biryani',
    calories: 165,
    protein: 4,
    carbs: 30,
    fat: 4,
    category: 'rice',
    defaultUnit: 'cup',
  },
  {
    id: 19,
    name: 'Samosa',
    calories: 262,
    protein: 3.5,
    carbs: 24,
    fat: 17,
    category: 'snacks',
    defaultUnit: 'piece',
  },
  {
    id: 20,
    name: 'Idli',
    calories: 39,
    protein: 2,
    carbs: 8,
    fat: 0.2,
    category: 'south_indian',
    defaultUnit: 'piece',
  },

  // Beverages
  {
    id: 21,
    name: 'Chai Tea',
    calories: 40,
    protein: 1.6,
    carbs: 8,
    fat: 0.7,
    category: 'beverages',
    defaultUnit: 'cup',
  },
  {
    id: 22,
    name: 'Lassi (sweet)',
    calories: 108,
    protein: 3.2,
    carbs: 13,
    fat: 4.8,
    category: 'beverages',
    defaultUnit: 'cup',
  },

  // More proteins for variety
  {
    id: 23,
    name: 'Fish (grilled)',
    calories: 206,
    protein: 22,
    carbs: 0,
    fat: 12,
    category: 'protein',
    defaultUnit: 'piece',
  },
  {
    id: 24,
    name: 'Eggs (boiled)',
    calories: 155,
    protein: 13,
    carbs: 1.1,
    fat: 11,
    category: 'protein',
    defaultUnit: 'piece',
  },
  {
    id: 25,
    name: 'Tofu',
    calories: 70,
    protein: 8,
    carbs: 1.9,
    fat: 4,
    category: 'protein',
    defaultUnit: 'cup',
  },

  // More vegetables
  {
    id: 26,
    name: 'Okra (bhindi)',
    calories: 33,
    protein: 1.9,
    carbs: 7,
    fat: 0.2,
    category: 'vegetables',
    defaultUnit: 'cup',
  },
  {
    id: 27,
    name: 'Eggplant (baingan)',
    calories: 25,
    protein: 1,
    carbs: 6,
    fat: 0.2,
    category: 'vegetables',
    defaultUnit: 'cup',
  },

  // More fruits
  {
    id: 28,
    name: 'Mango',
    calories: 60,
    protein: 0.8,
    carbs: 15,
    fat: 0.4,
    category: 'fruits',
    defaultUnit: 'piece',
  },
  {
    id: 29,
    name: 'Grapes',
    calories: 62,
    protein: 0.6,
    carbs: 16,
    fat: 0.2,
    category: 'fruits',
    defaultUnit: 'cup',
  },

  // Snacks & Street Food
  {
    id: 30,
    name: 'Pakora',
    calories: 315,
    protein: 4.9,
    carbs: 27,
    fat: 21,
    category: 'snacks',
    defaultUnit: 'piece',
  },
  {
    id: 31,
    name: 'Dosa (plain)',
    calories: 168,
    protein: 4,
    carbs: 25,
    fat: 6,
    category: 'south_indian',
    defaultUnit: 'piece',
  },
  {
    id: 32,
    name: 'Paratha (stuffed)',
    calories: 210,
    protein: 5.5,
    carbs: 26,
    fat: 9.5,
    category: 'grains',
    defaultUnit: 'piece',
  },

  // More Indian curries
  {
    id: 33,
    name: 'Palak Paneer',
    calories: 170,
    protein: 8,
    carbs: 6,
    fat: 14,
    category: 'curry',
    defaultUnit: 'cup',
  },
  {
    id: 34,
    name: 'Rajma (kidney beans)',
    calories: 127,
    protein: 8.7,
    carbs: 23,
    fat: 0.5,
    category: 'curry',
    defaultUnit: 'cup',
  },
  {
    id: 35,
    name: 'Chole (chickpeas)',
    calories: 134,
    protein: 7.3,
    carbs: 22,
    fat: 2.1,
    category: 'curry',
    defaultUnit: 'cup',
  },

  // Sweets & Desserts
  {
    id: 36,
    name: 'Gulab Jamun',
    calories: 387,
    protein: 4,
    carbs: 60,
    fat: 15,
    category: 'sweets',
    defaultUnit: 'piece',
  },
  {
    id: 37,
    name: 'Rasgulla',
    calories: 186,
    protein: 4,
    carbs: 27,
    fat: 7,
    category: 'sweets',
    defaultUnit: 'piece',
  },

  // Oils & Condiments
  {
    id: 38,
    name: 'Coconut Oil',
    calories: 862,
    protein: 0,
    carbs: 0,
    fat: 100,
    category: 'oils',
    defaultUnit: 'serving',
  },
  {
    id: 39,
    name: 'Ghee',
    calories: 902,
    protein: 0,
    carbs: 0,
    fat: 100,
    category: 'oils',
    defaultUnit: 'serving',
  },

  // Compound dishes
  {
    id: 40,
    name: 'Chicken Fried Rice',
    calories: 228,
    protein: 12,
    carbs: 25,
    fat: 8.8,
    category: 'rice',
    defaultUnit: 'cup',
  },
];

export async function searchFoodsDatabase(query) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  if (!query.trim()) {
    return [];
  }

  const lowercaseQuery = query.toLowerCase();
  
  // Filter foods that match the query
  const results = FOOD_DATABASE.filter(food => 
    food.name.toLowerCase().includes(lowercaseQuery) ||
    food.category.toLowerCase().includes(lowercaseQuery)
  );

  // Sort by relevance (exact matches first, then partial matches)
  results.sort((a, b) => {
    const aName = a.name.toLowerCase();
    const bName = b.name.toLowerCase();
    
    // Exact matches first
    if (aName === lowercaseQuery && bName !== lowercaseQuery) return -1;
    if (bName === lowercaseQuery && aName !== lowercaseQuery) return 1;
    
    // Starts with query second
    if (aName.startsWith(lowercaseQuery) && !bName.startsWith(lowercaseQuery)) return -1;
    if (bName.startsWith(lowercaseQuery) && !aName.startsWith(lowercaseQuery)) return 1;
    
    // Sort by name length (shorter first)
    return aName.length - bName.length;
  });

  return results.slice(0, 10); // Return top 10 results
}

export async function getFoodById(id) {
  return FOOD_DATABASE.find(food => food.id === id);
}