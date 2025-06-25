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
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 60000,
  maxUses: 7500,
  allowExitOnIdle: false
});

export const db = drizzle({ client: pool, schema });
