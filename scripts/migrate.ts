import { neon, neonConfig } from '@neondatabase/serverless';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Configure neon
neonConfig.fetchConnectionCache = true;
neonConfig.wsProxy = (host) => `wss://${host}`;
neonConfig.useSecureWebSocket = true;

const sql = neon(process.env.DATABASE_URL);

async function testConnection() {
  try {
    console.log('Testing database connection...');
    const result = await sql`SELECT 1`;
    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

async function runMigrations() {
  try {
    console.log('Starting database migrations...');

    // Test connection first
    const connected = await testConnection();
    if (!connected) {
      console.error('Unable to establish database connection. Please check your DATABASE_URL and ensure the database is accessible.');
      process.exit(1);
    }

    // Read migration files in order
    const migrationFiles = await fs.readdir('./migrations');
    const sqlFiles = migrationFiles
      .filter(file => file.endsWith('.sql'))
      .sort((a, b) => a.localeCompare(b));

    // Execute each migration file
    for (const file of sqlFiles) {
      console.log(`Running migration: ${file}`);
      const migration = await fs.readFile(path.join('./migrations', file), 'utf8');
      
      // Split migration into individual statements
      const statements = migration.split(';').filter(stmt => stmt.trim());
      
      // Execute each statement separately
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            // Use template literal to safely execute SQL
            await sql(statement);
          } catch (error) {
            if (error.code === '42P07') {
              // Table already exists, we can continue
              console.log(`Table already exists, continuing...`);
            } else {
              throw error;
            }
          }
        }
      }
      console.log(`Completed migration: ${file}`);
    }

    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Failed to run migrations:', error);
    if (error.sourceError) {
      console.error('Source error:', error.sourceError);
    }
    process.exit(1);
  }
}

runMigrations();
