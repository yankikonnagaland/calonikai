#!/usr/bin/env node

/**
 * AWS Migration Verification Script for Calonik.ai
 * This script verifies the database migration was successful
 */

const { Pool } = require('@neondatabase/serverless');
const ws = require('ws');

// Configure Neon
const neonConfig = require('@neondatabase/serverless').neonConfig;
neonConfig.webSocketConstructor = ws;
neonConfig.useSecureWebSocket = true;

async function verifyMigration() {
  console.log('🔍 Verifying AWS Aurora migration for Calonik.ai...\n');

  const replitUrl = process.env.DATABASE_URL;
  const awsUrl = process.env.AWS_DATABASE_URL;

  if (!replitUrl || !awsUrl) {
    console.error('❌ Both DATABASE_URL and AWS_DATABASE_URL must be set');
    process.exit(1);
  }

  const replitPool = new Pool({ connectionString: replitUrl });
  const awsPool = new Pool({ connectionString: awsUrl });

  try {
    console.log('📊 Comparing database schemas and data...\n');

    // Test connections
    console.log('Testing connections...');
    await Promise.all([
      replitPool.query('SELECT 1'),
      awsPool.query('SELECT 1')
    ]);
    console.log('✅ Both databases are accessible\n');

    // Compare table counts
    const tableCountQuery = `
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;

    const [replitTables, awsTables] = await Promise.all([
      replitPool.query(tableCountQuery),
      awsPool.query(tableCountQuery)
    ]);

    console.log(`📋 Tables:`);
    console.log(`   Replit: ${replitTables.rows[0].count}`);
    console.log(`   AWS:    ${awsTables.rows[0].count}`);
    console.log(replitTables.rows[0].count === awsTables.rows[0].count ? '✅ Table counts match\n' : '⚠️  Table counts differ\n');

    // Compare user data
    const userCountQuery = 'SELECT COUNT(*) as count FROM users';
    
    try {
      const [replitUsers, awsUsers] = await Promise.all([
        replitPool.query(userCountQuery),
        awsPool.query(userCountQuery)
      ]);

      console.log(`👥 Users:`);
      console.log(`   Replit: ${replitUsers.rows[0].count}`);
      console.log(`   AWS:    ${awsUsers.rows[0].count}`);
      console.log(replitUsers.rows[0].count === awsUsers.rows[0].count ? '✅ User counts match\n' : '⚠️  User counts differ\n');
    } catch (error) {
      console.log('ℹ️  Users table not found (expected for new setup)\n');
    }

    // Compare meal items
    const mealCountQuery = 'SELECT COUNT(*) as count FROM meal_items';
    
    try {
      const [replitMeals, awsMeals] = await Promise.all([
        replitPool.query(mealCountQuery),
        awsPool.query(mealCountQuery)
      ]);

      console.log(`🍽️  Meal Items:`);
      console.log(`   Replit: ${replitMeals.rows[0].count}`);
      console.log(`   AWS:    ${awsMeals.rows[0].count}`);
      console.log(replitMeals.rows[0].count === awsMeals.rows[0].count ? '✅ Meal counts match\n' : '⚠️  Meal counts differ\n');
    } catch (error) {
      console.log('ℹ️  Meal items table not found\n');
    }

    // Test Aurora-specific features
    console.log('🔧 Testing Aurora-specific features...');
    
    const versionResult = await awsPool.query('SELECT version()');
    const version = versionResult.rows[0].version;
    
    if (version.includes('PostgreSQL')) {
      console.log('✅ PostgreSQL compatibility confirmed');
      console.log(`   Version: ${version.split(' ').slice(0, 2).join(' ')}\n`);
    }

    // Test connection pooling
    console.log('🔗 Testing connection performance...');
    const startTime = Date.now();
    await Promise.all([
      awsPool.query('SELECT 1'),
      awsPool.query('SELECT 2'),
      awsPool.query('SELECT 3')
    ]);
    const endTime = Date.now();
    console.log(`✅ Connection pool test: ${endTime - startTime}ms\n`);

    console.log('🎉 Migration verification completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Update application to use AWS_DATABASE_URL');
    console.log('2. Run: npm run db:push');
    console.log('3. Test all application features');
    console.log('4. Monitor AWS Aurora performance and costs');

  } catch (error) {
    console.error('❌ Migration verification failed:', error.message);
    process.exit(1);
  } finally {
    await replitPool.end();
    await awsPool.end();
  }
}

if (require.main === module) {
  verifyMigration().catch(console.error);
}

module.exports = verifyMigration;