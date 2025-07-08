// Local food database for offline functionality
export const commonIndianFoods = [
  // Rice dishes
  { id: 1, name: 'White Rice', calories: 130, protein: 2.7, carbs: 28, fat: 0.3, category: 'grains' },
  { id: 2, name: 'Brown Rice', calories: 111, protein: 2.6, carbs: 23, fat: 0.9, category: 'grains' },
  { id: 3, name: 'Basmati Rice', calories: 121, protein: 3.5, carbs: 25, fat: 0.4, category: 'grains' },
  { id: 4, name: 'Biryani', calories: 200, protein: 8, carbs: 35, fat: 4, category: 'rice_dishes' },
  { id: 5, name: 'Jeera Rice', calories: 150, protein: 3, carbs: 28, fat: 3, category: 'rice_dishes' },
  
  // Dal and legumes
  { id: 6, name: 'Moong Dal', calories: 347, protein: 24, carbs: 59, fat: 1.2, category: 'legumes' },
  { id: 7, name: 'Toor Dal', calories: 343, protein: 22, carbs: 62, fat: 1.5, category: 'legumes' },
  { id: 8, name: 'Chana Dal', calories: 364, protein: 19, carbs: 61, fat: 6.2, category: 'legumes' },
  { id: 9, name: 'Masoor Dal', calories: 353, protein: 25, carbs: 60, fat: 1.1, category: 'legumes' },
  { id: 10, name: 'Rajma', calories: 333, protein: 23, carbs: 60, fat: 0.8, category: 'legumes' },
  
  // Breads
  { id: 11, name: 'Roti', calories: 106, protein: 4, carbs: 18, fat: 2.5, category: 'breads' },
  { id: 12, name: 'Chapati', calories: 104, protein: 3.1, carbs: 18, fat: 2.4, category: 'breads' },
  { id: 13, name: 'Naan', calories: 262, protein: 9, carbs: 45, fat: 5, category: 'breads' },
  { id: 14, name: 'Paratha', calories: 320, protein: 8, carbs: 39, fat: 15, category: 'breads' },
  { id: 15, name: 'Puri', calories: 408, protein: 8, carbs: 45, fat: 22, category: 'breads' },
  
  // Vegetables
  { id: 16, name: 'Aloo Sabzi', calories: 87, protein: 2, carbs: 20, fat: 0.1, category: 'vegetables' },
  { id: 17, name: 'Bhindi', calories: 33, protein: 1.9, carbs: 7, fat: 0.2, category: 'vegetables' },
  { id: 18, name: 'Palak', calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, category: 'vegetables' },
  { id: 19, name: 'Gobi', calories: 25, protein: 1.9, carbs: 5, fat: 0.3, category: 'vegetables' },
  { id: 20, name: 'Baingan', calories: 25, protein: 1, carbs: 6, fat: 0.2, category: 'vegetables' },
  
  // Meats
  { id: 21, name: 'Chicken Curry', calories: 165, protein: 31, carbs: 0, fat: 3.6, category: 'meat' },
  { id: 22, name: 'Mutton Curry', calories: 294, protein: 25, carbs: 0, fat: 21, category: 'meat' },
  { id: 23, name: 'Fish Curry', calories: 206, protein: 22, carbs: 0, fat: 12, category: 'meat' },
  { id: 24, name: 'Tandoori Chicken', calories: 150, protein: 30, carbs: 1, fat: 3, category: 'meat' },
  
  // Dairy
  { id: 25, name: 'Whole Milk', calories: 42, protein: 3.4, carbs: 4.8, fat: 1, category: 'dairy' },
  { id: 26, name: 'Paneer', calories: 321, protein: 25, carbs: 1.2, fat: 25, category: 'dairy' },
  { id: 27, name: 'Dahi', calories: 59, protein: 3.5, carbs: 4.7, fat: 3.3, category: 'dairy' },
  { id: 28, name: 'Lassi', calories: 59, protein: 3, carbs: 4.7, fat: 3.3, category: 'dairy' },
  
  // Snacks
  { id: 29, name: 'Samosa', calories: 308, protein: 4.6, carbs: 27, fat: 20, category: 'snacks' },
  { id: 30, name: 'Pakora', calories: 253, protein: 8, carbs: 20, fat: 16, category: 'snacks' },
  { id: 31, name: 'Dhokla', calories: 206, protein: 8, carbs: 36, fat: 3, category: 'snacks' },
  { id: 32, name: 'Poha', calories: 76, protein: 2, carbs: 17, fat: 0.2, category: 'snacks' },
  
  // Fruits
  { id: 33, name: 'Banana', calories: 89, protein: 1.1, carbs: 23, fat: 0.3, category: 'fruits' },
  { id: 34, name: 'Apple', calories: 52, protein: 0.3, carbs: 14, fat: 0.2, category: 'fruits' },
  { id: 35, name: 'Mango', calories: 60, protein: 0.8, carbs: 15, fat: 0.4, category: 'fruits' },
  { id: 36, name: 'Orange', calories: 47, protein: 0.9, carbs: 12, fat: 0.1, category: 'fruits' },
  
  // Beverages
  { id: 37, name: 'Chai', calories: 37, protein: 1.6, carbs: 6, fat: 1.2, category: 'beverages' },
  { id: 38, name: 'Coffee', calories: 2, protein: 0.3, carbs: 0, fat: 0, category: 'beverages' },
  { id: 39, name: 'Fresh Lime Water', calories: 22, protein: 0.4, carbs: 6, fat: 0.2, category: 'beverages' },
  { id: 40, name: 'Coconut Water', calories: 19, protein: 0.7, carbs: 3.7, fat: 0.2, category: 'beverages' },
];

export const searchFoods = (query) => {
  if (!query || query.length < 2) return [];
  
  const normalizedQuery = query.toLowerCase().trim();
  
  return commonIndianFoods
    .filter(food => 
      food.name.toLowerCase().includes(normalizedQuery) ||
      food.category.toLowerCase().includes(normalizedQuery)
    )
    .sort((a, b) => {
      // Prioritize exact matches at the beginning
      const aStartsWith = a.name.toLowerCase().startsWith(normalizedQuery);
      const bStartsWith = b.name.toLowerCase().startsWith(normalizedQuery);
      
      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;
      
      return a.name.localeCompare(b.name);
    })
    .slice(0, 10); // Limit to 10 results
};

export const getFoodById = (id) => {
  return commonIndianFoods.find(food => food.id === id);
};

export const getFoodsByCategory = (category) => {
  return commonIndianFoods.filter(food => food.category === category);
};

export const getAvailableUnits = (food) => {
  const baseUnits = ['grams', 'serving'];
  
  switch (food.category) {
    case 'beverages':
    case 'dairy':
      return [...baseUnits, 'ml', 'cup', 'glass'];
    case 'breads':
      return [...baseUnits, 'piece', 'pieces'];
    case 'fruits':
      return [...baseUnits, 'piece', 'pieces', 'medium', 'small', 'large'];
    case 'vegetables':
      return [...baseUnits, 'bowl', 'small_bowl', 'large_bowl'];
    case 'rice_dishes':
    case 'legumes':
      return [...baseUnits, 'bowl', 'small_bowl', 'large_bowl', 'cup'];
    case 'snacks':
      return [...baseUnits, 'piece', 'pieces'];
    default:
      return baseUnits;
  }
};