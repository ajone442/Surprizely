
import { neon, neonConfig } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testConnection() {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    console.error("ERROR: DATABASE_URL environment variable is not defined");
    return;
  }

  console.log("Testing database connection...");
  console.log(`Using DATABASE_URL: ${DATABASE_URL.replace(/:[^:]*@/, ':****@')}`);
  
  try {
    // Configure neon with robust settings
    neonConfig.fetchConnectionCache = true;
    neonConfig.wsProxy = (host) => `wss://${host}`;
    neonConfig.useSecureWebSocket = true;
    neonConfig.pipelineTLS = true;
    neonConfig.pipelineConnect = true;
    neonConfig.forceDisablePgSSL = false;

    const sql = neon(DATABASE_URL);
    
    // Simple query to test connection
    const result = await sql`SELECT NOW()`;
    console.log("Connection successful!");
    console.log("Current database time:", result[0].now);
    
    // Test querying the users table
    console.log("Testing users table...");
    const users = await sql`SELECT COUNT(*) FROM users`;
    console.log(`User count: ${users[0].count}`);

  } catch (error) {
    console.error("ERROR connecting to database:");
    console.error(error);
  }
}

testConnection();
