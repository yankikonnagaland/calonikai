import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

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

export const pool = new Pool({ 
  connectionString: databaseUrl,
  max: 10, // Reduced connection pool size
  idleTimeoutMillis: 20000, // Reduced idle timeout
  connectionTimeoutMillis: 30000, // Reduced connection timeout
  maxUses: 5000, // Reduced max uses
  allowExitOnIdle: true, // Allow exit on idle to prevent hanging connections
  statement_timeout: 30000, // Add statement timeout
  query_timeout: 30000 // Add query timeout
});

export const db = drizzle({ client: pool, schema });
