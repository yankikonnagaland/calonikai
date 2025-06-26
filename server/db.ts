import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws;
neonConfig.useSecureWebSocket = true;

// Use AWS database if available, otherwise fall back to Replit database
const databaseUrl = process.env.AWS_DATABASE_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL or AWS_DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

console.log(`Using database: ${databaseUrl.includes('amazonaws.com') ? 'AWS Aurora' : 'Replit PostgreSQL'}`);
console.log(`Database host: ${new URL(databaseUrl).hostname}`);

// Create pool with optimized settings for stability
export const pool = new Pool({ 
  connectionString: databaseUrl,
  max: 5, // Further reduced connection pool size
  idleTimeoutMillis: 10000, // Shorter idle timeout
  connectionTimeoutMillis: 15000, // Shorter connection timeout
  maxUses: 1000, // Reduce max uses per connection
  allowExitOnIdle: true,
  statement_timeout: 15000, // Shorter statement timeout
  query_timeout: 15000 // Shorter query timeout
});

// Add error handling for pool events
pool.on('error', (err) => {
  console.error('Database pool error:', err);
});

pool.on('connect', () => {
  console.log('Database connection established');
});

export const db = drizzle({ client: pool, schema });

// Test database connectivity on startup
export async function testDatabaseConnection() {
  try {
    const result = await pool.query('SELECT 1 as test');
    console.log('Database connection test successful');
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}
