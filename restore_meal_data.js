const { Client } = require('pg');

async function restoreMealData() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  await client.connect();
  
  try {
    // Get daily summaries with meal data for the affected user
    const summariesResult = await client.query(`
      SELECT date, meal_data 
      FROM daily_summaries 
      WHERE session_id = 'user_1750613905594_3tjtgubmv' 
      AND date >= '2025-07-07'
      ORDER BY date DESC
    `);
    
    console.log(`Found ${summariesResult.rows.length} daily summaries to restore from`);
    
    for (const summary of summariesResult.rows) {
      const { date, meal_data } = summary;
      
      if (!meal_data) {
        console.log(`No meal data for ${date}`);
        continue;
      }
      
      let mealItems;
      try {
        mealItems = JSON.parse(meal_data);
      } catch (e) {
        console.log(`Failed to parse meal data for ${date}:`, e.message);
        continue;
      }
      
      console.log(`Restoring ${mealItems.length} meal items for ${date}`);
      
      // Remove duplicates from the meal data array
      const uniqueMealItems = [];
      const seenIds = new Set();
      
      for (const item of mealItems) {
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          uniqueMealItems.push(item);
        }
      }
      
      for (const mealItem of uniqueMealItems) {
        // Check if this meal item already exists
        const existingResult = await client.query(`
          SELECT id FROM meal_items 
          WHERE session_id = $1 AND food_id = $2 AND date = $3 AND created_at = $4
        `, [
          mealItem.sessionId,
          mealItem.foodId, 
          date,
          mealItem.createdAt
        ]);
        
        if (existingResult.rows.length > 0) {
          console.log(`Meal item ${mealItem.id} already exists, skipping`);
          continue;
        }
        
        // Insert the meal item back
        await client.query(`
          INSERT INTO meal_items (
            session_id, food_id, quantity, unit, created_at, date,
            frontend_calories, frontend_protein, frontend_carbs, frontend_fat, frontend_total_grams
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [
          mealItem.sessionId,
          mealItem.foodId,
          mealItem.quantity,
          mealItem.unit,
          mealItem.createdAt,
          date,
          mealItem.frontendCalories || null,
          mealItem.frontendProtein || null,
          mealItem.frontendCarbs || null,
          mealItem.frontendFat || null,
          mealItem.frontendTotalGrams || null
        ]);
        
        console.log(`Restored meal item: ${mealItem.food?.name || 'Unknown Food'} for ${date}`);
      }
    }
    
    // Verify restoration
    const finalCountResult = await client.query(`
      SELECT COUNT(*) as total_meals 
      FROM meal_items 
      WHERE session_id = 'user_1750613905594_3tjtgubmv'
    `);
    
    console.log(`Total meal items after restoration: ${finalCountResult.rows[0].total_meals}`);
    
  } catch (error) {
    console.error('Error restoring meal data:', error);
  } finally {
    await client.end();
  }
}

restoreMealData();
