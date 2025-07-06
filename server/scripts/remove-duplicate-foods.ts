import { db } from '../db';
import { foods } from '../../shared/schema';
import { sql } from 'drizzle-orm';

async function removeDuplicateFoods() {
  console.log('Checking for duplicate foods...');
  
  try {
    // Find duplicates
    const duplicates = await db.execute(sql`
      SELECT name, category, COUNT(*) as count
      FROM foods
      GROUP BY name, category
      HAVING COUNT(*) > 1
    `);

    if (duplicates.length === 0) {
      console.log('No duplicates found!');
      return;
    }

    console.log(`Found ${duplicates.length} duplicate food entries`);

    // Keep only one of each duplicate
    for (const dup of duplicates as any[]) {
      const duplicateFoods = await db
        .select()
        .from(foods)
        .where(sql`${foods.name} = ${dup.name} AND ${foods.category} = ${dup.category}`)
        .orderBy(foods.id);

      // Keep the first one, delete the rest
      if (duplicateFoods.length > 1) {
        const idsToDelete = duplicateFoods.slice(1).map(f => f.id);
        
        for (const id of idsToDelete) {
          await db.delete(foods).where(sql`${foods.id} = ${id}`);
        }
        
        console.log(`Removed ${idsToDelete.length} duplicates of "${dup.name}"`);
      }
    }

    console.log('Duplicate removal complete!');
  } catch (error) {
    console.error('Error removing duplicates:', error);
  }
}

// Add unique constraint to prevent future duplicates
async function addUniqueConstraint() {
  try {
    await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_foods_name_category 
      ON foods(name, category)
    `);
    console.log('Added unique constraint on (name, category)');
  } catch (error) {
    console.log('Unique constraint may already exist:', (error as any).message);
  }
}

async function main() {
  try {
    console.log('Starting duplicate food cleanup...');
    await removeDuplicateFoods();
    await addUniqueConstraint();
    console.log('Cleanup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Auto-run the main function when script is executed directly
main();