import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, and, gt, sql } from 'drizzle-orm';
import session from 'express-session';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import * as schema from '../shared/schema.js';
import ConnectPgSimple from 'connect-pg-simple';
import pkg from 'pg';
const { Pool } = pkg;

// Add timeout settings for serverless environment
const CONNECT_TIMEOUT = 30000; // 30 seconds
const IDLE_TIMEOUT = 10000; // 10 seconds

class PostgresStorage {
  private static instance: PostgresStorage;
  private db!: ReturnType<typeof drizzle>;
  private pool: pkg.Pool;
  private connected: boolean = false;
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
        rejectUnauthorized: false // Required for Render PostgreSQL
      },
      idleTimeoutMillis: IDLE_TIMEOUT,
      connectionTimeoutMillis: CONNECT_TIMEOUT,
      max: 1 // Limit connections for serverless
    });

    // Add error handler for the pool
    this.pool.on('error', (err) => {
      console.error('Database pool error:', err);
      this.connected = false;
    });
  }

  public async init(): Promise<void> {
    try {
      console.log('Initializing database connection...');
      
      // Initialize drizzle with the pool
      this.db = drizzle(this.pool);

      // Initialize session store
      const PgStore = ConnectPgSimple(session);
      this.sessionStore = new PgStore({
        pool: this.pool,
        createTableIfMissing: true,
        ttl: 24 * 60 * 60 // 1 day session timeout
      });

      // Test database connection
      console.log('Testing database connection...');
      const result = await this.pool.query('SELECT NOW()');
      console.log('Database connection successful:', result.rows[0].now);
      this.connected = true;

      // Initialize session table
      console.log('Initializing session table...');
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS "session" (
          "sid" varchar NOT NULL COLLATE "default",
          "sess" json NOT NULL,
          "expire" timestamp(6) NOT NULL,
          CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
        )`);
      console.log('Session table initialized');
    } catch (error) {
      console.error('Database initialization failed:', error);
      this.connected = false;
      throw error;
    }
  }

  public isConnected(): boolean {
    return this.connected;
  }

  public static getInstance(): PostgresStorage {
    if (!PostgresStorage.instance) {
      PostgresStorage.instance = new PostgresStorage();
    }
    return PostgresStorage.instance;
  }

  // User methods
  async getUser(id: number): Promise<schema.User | undefined> {
    const result = await this.db.select().from(schema.users).where(eq(schema.users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<schema.User | undefined> {
    const result = await this.db.select().from(schema.users).where(eq(schema.users.username, username));
    return result[0];
  }

  async createUser(userData: schema.InsertUser): Promise<schema.User> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const [user] = await this.db.insert(schema.users)
      .values({ ...userData, password: hashedPassword })
      .returning();
    return user;
  }

  async updateUserPassword(userId: number, password: string): Promise<schema.User> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [user] = await this.db.update(schema.users)
      .set({ password: hashedPassword })
      .where(eq(schema.users.id, userId))
      .returning();
    return user;
  }

  // Product methods
  async getProducts(): Promise<schema.Product[]> {
    return await this.db.select().from(schema.products);
  }

  async getProduct(id: number): Promise<schema.Product | undefined> {
    const result = await this.db.select().from(schema.products).where(eq(schema.products.id, id));
    return result[0];
  }

  async createProduct(productData: schema.InsertProduct): Promise<schema.Product> {
    const [product] = await this.db.insert(schema.products)
      .values({
        ...productData,
        price: typeof productData.price === 'string' ? parseFloat(productData.price) : productData.price
      })
      .returning();
    return product;
  }

  // Rating methods
  async getRatings(productId: number): Promise<schema.Rating[]> {
    return await this.db.select().from(schema.ratings).where(eq(schema.ratings.productId, productId));
  }

  async createRating(ratingData: schema.InsertRating): Promise<schema.Rating> {
    const [rating] = await this.db.insert(schema.ratings)
      .values(ratingData)
      .returning();
    return rating;
  }

  // Giveaway methods
  async createGiveawayEntry(entryData: schema.InsertGiveaway): Promise<schema.GiveawayEntry> {
    const now = new Date().toISOString();
    const [entry] = await this.db.insert(schema.giveawayEntries)
      .values({
        ...entryData,
        createdAt: now,
        submittedAt: now,
        status: entryData.status || 'pending',
        emailSent: false,
        orderID: null,
        ipAddress: null,
        productLink: null,
        orderScreenshot: null,
        receiptImage: null
      })
      .returning();
    return entry;
  }

  async getRecentGiveawayEntriesCount(ipAddress: string, minutes: number): Promise<number> {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000).toISOString();
    const entries = await this.db.select().from(schema.giveawayEntries)
      .where(
        and(
          eq(schema.giveawayEntries.ipAddress, ipAddress),
          gt(schema.giveawayEntries.createdAt, sql`${cutoff}`)
        )
      );
    return entries.length;
  }

  async updateGiveawayEntryStatus(id: number, status: string): Promise<schema.GiveawayEntry> {
    const [entry] = await this.db.update(schema.giveawayEntries)
      .set({ status })
      .where(eq(schema.giveawayEntries.id, id))
      .returning();
    return entry;
  }

  async getGiveawayEntries(): Promise<schema.GiveawayEntry[]> {
    const entries = await this.db.select({
      id: schema.giveawayEntries.id,
      email: schema.giveawayEntries.email,
      orderID: schema.giveawayEntries.orderID,
      createdAt: schema.giveawayEntries.createdAt,
      submittedAt: schema.giveawayEntries.submittedAt,
      ipAddress: schema.giveawayEntries.ipAddress,
      productLink: schema.giveawayEntries.productLink,
      emailSent: schema.giveawayEntries.emailSent,
      orderScreenshot: schema.giveawayEntries.orderScreenshot,
      receiptImage: schema.giveawayEntries.receiptImage,
      status: schema.giveawayEntries.status
    }).from(schema.giveawayEntries);
    return entries;
  }

  // Additional methods needed by routes
  async updateUser(id: number, data: Partial<schema.User>): Promise<schema.User> {
    const [user] = await this.db.update(schema.users)
      .set(data)
      .where(eq(schema.users.id, id))
      .returning();
    return user;
  }

  async updateProduct(id: number, data: Partial<schema.Product>): Promise<schema.Product> {
    const [product] = await this.db.update(schema.products)
      .set(data)
      .where(eq(schema.products.id, id))
      .returning();
    return product;
  }

  async deleteProduct(id: number): Promise<void> {
    await this.db.delete(schema.products).where(eq(schema.products.id, id));
  }

  async getWishlist(userId: number): Promise<schema.Product[]> {
    const result = await this.db.select({
      id: schema.products.id,
      name: schema.products.name,
      description: schema.products.description,
      price: schema.products.price,
      imageUrl: schema.products.imageUrl,
      affiliateLink: schema.products.affiliateLink,
      category: schema.products.category,
      averageRating: schema.products.averageRating,
      ratingCount: schema.products.ratingCount
    })
    .from(schema.products)
    .innerJoin(schema.wishlist, eq(schema.products.id, schema.wishlist.productId))
    .where(eq(schema.wishlist.userId, userId));
    return result;
  }

  async addToWishlist(data: { userId: number; productId: number }): Promise<void> {
    await this.db.insert(schema.wishlist).values(data);
  }

  async removeFromWishlist(userId: number, productId: number): Promise<void> {
    await this.db.delete(schema.wishlist)
      .where(and(
        eq(schema.wishlist.userId, userId),
        eq(schema.wishlist.productId, productId)
      ));
  }

  async getUserRating(userId: number, productId: number): Promise<schema.Rating | undefined> {
    const result = await this.db.select()
      .from(schema.ratings)
      .where(and(
        eq(schema.ratings.userId, userId),
        eq(schema.ratings.productId, productId)
      ));
    return result[0];
  }

  async rateProduct(data: schema.InsertRating): Promise<schema.Product> {
    const [rating] = await this.db.insert(schema.ratings).values(data).returning();
    const [product] = await this.db.select()
      .from(schema.products)
      .where(eq(schema.products.id, rating.productId));
    return product;
  }

  async updateRating(id: number, rating: number): Promise<schema.Product> {
    const [updated] = await this.db.update(schema.ratings)
      .set({ rating })
      .where(eq(schema.ratings.id, id))
      .returning();
    const [product] = await this.db.select()
      .from(schema.products)
      .where(eq(schema.products.id, updated.productId));
    return product;
  }

  async deleteRating(id: number): Promise<schema.Product> {
    const [rating] = await this.db.delete(schema.ratings)
      .where(eq(schema.ratings.id, id))
      .returning();
    const [product] = await this.db.select()
      .from(schema.products)
      .where(eq(schema.products.id, rating.productId));
    return product;
  }

  async checkRecentGiveawayEntriesByIP(ipAddress: string, minutes: number): Promise<number> {
    return this.getRecentGiveawayEntriesCount(ipAddress, minutes);
  }

  async updateGiveawayEntryEmailStatus(id: number, emailSent: boolean): Promise<void> {
    await this.db.update(schema.giveawayEntries)
      .set({ emailSent })
      .where(eq(schema.giveawayEntries.id, id));
  }
}

export default PostgresStorage;