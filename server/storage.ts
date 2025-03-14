import { drizzle } from 'drizzle-orm/neon-http';
import { neon, neonConfig } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';
import session from 'express-session';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import * as schema from '../shared/schema.js';
import ConnectPgSimple from 'connect-pg-simple';
import pkg from 'pg';
const { Pool } = pkg;

// Configure neon with robust settings for serverless environment
neonConfig.fetchConnectionCache = true;
neonConfig.wsProxy = (host) => `wss://${host}`;
neonConfig.useSecureWebSocket = true;
neonConfig.pipelineTLS = true;
neonConfig.pipelineConnect = true;

// Add timeout settings for serverless environment
const CONNECT_TIMEOUT = 30000; // 30 seconds
const IDLE_TIMEOUT = 10000; // 10 seconds for serverless

class PostgresStorage {
  private static instance: PostgresStorage;
  private db!: ReturnType<typeof drizzle>;
  private pool: pkg.Pool;
  private sqlClient: any;
  sessionStore!: session.Store;

  private constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is required");
    }

    // Log database URL format (without credentials)
    const dbUrl = new URL(process.env.DATABASE_URL);
    console.log('Database host:', dbUrl.hostname);
    console.log('Database protocol:', dbUrl.protocol);

    // Create PostgreSQL pool optimized for serverless
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: true // Enable SSL verification
      },
      idleTimeoutMillis: IDLE_TIMEOUT,
      connectionTimeoutMillis: CONNECT_TIMEOUT,
      max: 1, // Limit connections for serverless
      allowExitOnIdle: true
    });

    // Add error handler for the pool
    this.pool.on('error', (err) => {
      console.error('Database pool error:', err);
      // Don't throw, just log - let the query retry logic handle reconnection
    });
  }

  public async init(): Promise<void> {
    try {
      console.log('Initializing database connection...');
      this.sqlClient = await this.createNeonClient();
      this.db = drizzle(this.sqlClient, { logger: true });

      // Initialize session store with shorter timeout
      const PgStore = ConnectPgSimple(session);
      this.sessionStore = new PgStore({
        pool: this.pool,
        createTableIfMissing: true,
        ttl: 24 * 60 * 60 // 1 day session timeout
      });

      // Verify database connection
      console.log('Testing database connection...');
      const result = await this.sqlClient`SELECT NOW()`;
      console.log('Database connection successful:', result[0].now);

      // Initialize session table
      console.log('Initializing session table...');
      await this.sqlClient`
        CREATE TABLE IF NOT EXISTS "session" (
          "sid" varchar NOT NULL COLLATE "default",
          "sess" json NOT NULL,
          "expire" timestamp(6) NOT NULL,
          CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
        )`;
      console.log('Session table initialized');
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  private async createNeonClient(retries = 3, delay = 2000): Promise<any> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
        console.log(`Database connection attempt ${attempt}...`);
        
        // Create the client with explicit SSL configuration
        const client = neon(process.env.DATABASE_URL);
        
        // Test the connection with a timeout
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Connection test timeout')), 5000);
        });
        
        const testPromise = client`SELECT 1`;
        await Promise.race([testPromise, timeoutPromise]);
        
        console.log('Database client created successfully');
        return client;
      } catch (error) {
        console.error(`Database connection attempt ${attempt} failed:`, error);
        if (attempt === retries) throw error;
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw new Error('Failed to connect to database after multiple attempts');
  }

  public static getInstance(): PostgresStorage {
    if (!PostgresStorage.instance) {
      PostgresStorage.instance = new PostgresStorage();
    }
    return PostgresStorage.instance;
  }

  isConnected(): boolean {
    return true; // Connection is managed by neon client
  }

  // User methods
  async getUser(id: number): Promise<schema.User | undefined> {
    const result = await this.db.select().from(schema.users).where(sql`${schema.users.id} = ${id}`);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<schema.User | undefined> {
    const result = await this.db.select().from(schema.users).where(sql`${schema.users.username} = ${username}`);
    return result[0];
  }

  async createUser(userData: schema.InsertUser): Promise<schema.User> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const [user] = await this.db.insert(schema.users).values({
      username: userData.username,
      password: hashedPassword,
      isAdmin: false,
    }).returning();
    return user;
  }

  async verifyUserPassword(userId: number, password: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) return false;
    try {
      return await bcrypt.compare(password, user.password);
    } catch (error) {
      console.error('Password verification error:', error);
      return false;
    }
  }

  async updateUserPassword(userId: number, password: string): Promise<schema.User | undefined> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [user] = await this.db.update(schema.users)
      .set({ password: hashedPassword })
      .where(sql`${schema.users.id} = ${userId}`)
      .returning();
    return user;
  }

  // Product methods
  async getProducts(): Promise<schema.Product[]> {
    return await this.db.select().from(schema.products);
  }

  async getProduct(id: number): Promise<schema.Product | undefined> {
    const result = await this.db.select().from(schema.products).where(sql`${schema.products.id} = ${id}`);
    return result[0];
  }

  async createProduct(productData: schema.InsertProduct): Promise<schema.Product> {
    const [product] = await this.db.insert(schema.products).values({
      name: productData.name,
      description: productData.description,
      price: typeof productData.price === 'string' ? parseInt(productData.price, 10) : productData.price,
      imageUrl: productData.imageUrl,
      category: productData.category,
      affiliateLink: productData.affiliateLink,
    }).returning();
    return product;
  }

  // Rating methods
  async getRatings(productId: number): Promise<schema.Rating[]> {
    return await this.db.select().from(schema.ratings).where(sql`${schema.ratings.productId} = ${productId}`);
  }

  async createRating(ratingData: schema.InsertRating): Promise<schema.Rating> {
    const [rating] = await this.db.insert(schema.ratings).values({
      userId: ratingData.userId,
      productId: ratingData.productId,
      rating: ratingData.rating,
      createdAt: new Date().toISOString(),
    }).returning();
    return rating;
  }

  // Giveaway methods
  async createGiveawayEntry(entryData: schema.InsertGiveaway): Promise<schema.GiveawayEntryType> {
    const [entry] = await this.db.insert(schema.giveawayEntries).values({
      email: entryData.email,
      receiptImage: entryData.receiptImage,
      status: entryData.status || 'pending',
      createdAt: new Date().toISOString(),
    }).returning();
    return entry;
  }

  async getRecentGiveawayEntriesCount(ipAddress: string, minutes: number): Promise<number> {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000).toISOString();
    const entries = await this.db.select().from(schema.giveawayEntries)
      .where(sql`${schema.giveawayEntries.ipAddress} = ${ipAddress} AND ${schema.giveawayEntries.createdAt} > ${cutoff}`);
    return entries.length;
  }

  async updateGiveawayEntryStatus(id: number, status: 'pending' | 'approved' | 'rejected'): Promise<schema.GiveawayEntryType | undefined> {
    const [entry] = await this.db.update(schema.giveawayEntries)
      .set({ status })
      .where(sql`${schema.giveawayEntries.id} = ${id}`)
      .returning();
    return entry;
  }

  async getGiveawayEntries(): Promise<schema.GiveawayEntryType[]> {
    return await this.db.select().from(schema.giveawayEntries);
  }
}

export const storage = PostgresStorage.getInstance();