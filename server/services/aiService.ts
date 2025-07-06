// Use Google Gemini for AI analysis
import { GoogleGenerativeAI } from "@google/generative-ai";
import { storage } from '../storage';
import type { InsertAiUsageStats } from '@shared/schema';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function analyzeWithAI(foodQuery: string, userId?: string) {
  const startTime = Date.now();
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
    const responseTime = Date.now() - startTime;
    
    // Track AI usage
    await trackAiUsage('Gemini', 'gemini-1.5-flash', 'food_analysis', prompt, text, responseTime, true, null, userId);
    
    // Clean the response to ensure valid JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Invalid AI response");
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    const responseTime = Date.now() - startTime;
    // Track failed AI usage
    await trackAiUsage('Gemini', 'gemini-1.5-flash', 'food_analysis', prompt, '', responseTime, false, error?.toString(), userId);
    
    console.error("AI analysis error:", error);
    throw error;
  }
}

// Cache AI results to reduce API calls
const aiCache = new Map<string, any>();

/**
 * Track AI usage for cost monitoring
 */
async function trackAiUsage(
  serviceType: string,
  endpoint: string,
  requestType: string,
  inputText: string,
  outputText: string,
  responseTime: number,
  success: boolean,
  errorMessage: string | null,
  userId?: string
): Promise<void> {
  try {
    const inputTokens = estimateTokens(inputText);
    const outputTokens = estimateTokens(outputText);
    const totalTokens = inputTokens + outputTokens;
    const estimatedCost = calculateEstimatedCost(serviceType, endpoint, inputTokens, outputTokens);

    const aiUsageData: InsertAiUsageStats = {
      userId: userId || null,
      serviceType,
      endpoint,
      inputTokens,
      outputTokens,
      totalTokens,
      estimatedCost,
      responseTime,
      success,
      errorMessage,
      date: new Date().toISOString().split('T')[0]
    };

    await storage.trackAiUsage(aiUsageData);
  } catch (error) {
    console.error('Failed to track AI usage:', error);
  }
}

/**
 * Calculate estimated cost for AI usage
 */
function calculateEstimatedCost(provider: string, model: string, inputTokens?: number, outputTokens?: number): number {
  // Gemini Flash pricing (as of 2024)
  if (provider === 'Gemini' && model.includes('flash')) {
    const inputCost = (inputTokens || 0) * 0.00000015; // $0.15 per 1M tokens
    const outputCost = (outputTokens || 0) * 0.0000006; // $0.60 per 1M tokens
    return Number((inputCost + outputCost).toFixed(6));
  }
  
  return 0;
}

/**
 * Estimate token count for text
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export async function getCachedOrAnalyze(query: string, userId?: string) {
  const cacheKey = query.toLowerCase().trim();
  
  if (aiCache.has(cacheKey)) {
    return aiCache.get(cacheKey);
  }
  
  const result = await analyzeWithAI(query, userId);
  aiCache.set(cacheKey, result);
  
  return result;
}