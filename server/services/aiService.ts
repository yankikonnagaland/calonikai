// Use Google Gemini for AI analysis
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function analyzeWithAI(foodQuery: string) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  const prompt = `Analyze this food item and provide accurate nutritional information:
    Food: "${foodQuery}"
    
    Return ONLY a valid JSON object (no markdown, no extra text) with these exact fields:
    {
      "name": "Proper name of the food",
      "category": "Choose ONE from: Hot Beverage, Cold Beverage, Fruit, Vegetable, Grain, Protein, Dairy, Snack, Dessert, Main Dish, Side Dish, Sauce, Nuts, Fast Food",
      "calories": number per 100g or 100ml,
      "protein": number in grams per 100g/100ml,
      "carbs": number in grams per 100g/100ml,
      "fat": number in grams per 100g/100ml,
      "smartUnit": "Most common serving unit like 'cup (240ml)' or 'piece (100g)'",
      "smartQuantity": typical quantity as number,
      "portionExplanation": "Brief explanation of typical portion",
      "realisticCalories": calories for the smart portion,
      "alternativeUnits": ["array", "of", "other", "common", "units"]
    }
    
    Important rules:
    - For beverages like plain tea/coffee without milk: calories should be 0-5
    - For water: calories must be 0
    - Be accurate with nutritional values based on real food data
    - Smart portions should reflect how people actually consume this food`;
  
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean the response to ensure valid JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Invalid AI response");
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("AI analysis error:", error);
    throw error;
  }
}

// Cache AI results to reduce API calls
const aiCache = new Map<string, any>();

export async function getCachedOrAnalyze(query: string) {
  const cacheKey = query.toLowerCase().trim();
  
  if (aiCache.has(cacheKey)) {
    return aiCache.get(cacheKey);
  }
  
  const result = await analyzeWithAI(query);
  aiCache.set(cacheKey, result);
  
  return result;
}