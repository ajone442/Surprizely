import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';
import { neon, neonConfig } from '@neondatabase/serverless';
import session from 'express-session';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import * as schema from '../shared/schema.js';
import ConnectPgSimple from 'connect-pg-simple';
import { Pool } from 'pg';

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Configure neon to work in serverless environments
neonConfig.fetchConnectionCache = true;

const sql_client = neon(process.env.DATABASE_URL);
const db = drizzle(sql_client);

// Create a PostgreSQL pool for session store
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

interface PgStoreConfig {
  pool: any;
  tableName?: string;
  schemaName?: string;
  ttl?: number;
  createTableIfMissing?: boolean;
  errorLog?: (error: Error) => void;
}

class PostgresStorage {
  private static instance: PostgresStorage;
  sessionStore: session.Store;

  private constructor() {
    const PgStore = ConnectPgSimple(session);
    this.sessionStore = new PgStore({
      pool,
      tableName: 'session',
      createTableIfMissing: true
    } as PgStoreConfig);
  }

  public static getInstance(): PostgresStorage {
    if (!PostgresStorage.instance) {
      PostgresStorage.instance = new PostgresStorage();
    }
    return PostgresStorage.instance;
  }

  async init(): Promise<void> {
    try {
      // Test database connection
      const result = await sql_client`SELECT NOW()`;
      console.log('Successfully connected to PostgreSQL database');
    } catch (error) {
      console.error('Failed to connect to database:', error);
      throw error;
    }
  }

  isConnected(): boolean {
    return true; // Connection is managed by neon client
  }

  // User methods
  async getUser(id: number): Promise<schema.User | undefined> {
    const users = await db.select().from(schema.users).where(sql`${schema.users.id} = ${id}`).limit(1);
    return users[0];
  }

  async getUserByUsername(username: string): Promise<schema.User | undefined> {
    const users = await db.select().from(schema.users).where(sql`${schema.users.username} = ${username}`).limit(1);
    return users[0];
  }

  async createUser(userData: schema.InsertUser): Promise<schema.User> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const [user] = await db.insert(schema.users).values({
      username: userData.username,
      password: hashedPassword,
      isAdmin: false,
    }).returning();
    return user;
  }

  async verifyUserPassword(userId: number, password: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) return false;
    return await bcrypt.compare(password, user.password);
  }

  async updateUserPassword(userId: number, password: string): Promise<schema.User | undefined> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [user] = await db.update(schema.users)
      .set({ password: hashedPassword })
      .where(sql`${schema.users.id} = ${userId}`)
      .returning();
    return user;
  }

  // Product methods
  async getProducts(): Promise<schema.Product[]> {
    return await db.select().from(schema.products);
  }

  async getProduct(id: number): Promise<schema.Product | undefined> {
    const products = await db.select().from(schema.products).where(sql`${schema.products.id} = ${id}`).limit(1);
    return products[0];
  }

  async createProduct(productData: schema.InsertProduct): Promise<schema.Product> {
    const [product] = await db.insert(schema.products).values({
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
    return await db.select().from(schema.ratings).where(sql`${schema.ratings.productId} = ${productId}`);
  }

  async createRating(ratingData: schema.InsertRating): Promise<schema.Rating> {
    const [rating] = await db.insert(schema.ratings).values({
      userId: ratingData.userId,
      productId: ratingData.productId,
      rating: ratingData.rating,
      createdAt: new Date().toISOString(),
    }).returning();
    return rating;
  }

  // Giveaway methods
  async createGiveawayEntry(entryData: schema.InsertGiveaway): Promise<schema.GiveawayEntryType> {
    const [entry] = await db.insert(schema.giveawayEntries).values({
      email: entryData.email,
      receiptImage: entryData.receiptImage,
      status: entryData.status || 'pending',
      createdAt: new Date().toISOString(),
    }).returning();
    return entry;
  }

  async getRecentGiveawayEntriesCount(ipAddress: string, minutes: number): Promise<number> {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000).toISOString();
    const entries = await db.select().from(schema.giveawayEntries)
      .where(sql`${schema.giveawayEntries.ipAddress} = ${ipAddress} AND ${schema.giveawayEntries.createdAt} > ${cutoff}`);
    return entries.length;
  }

  async updateGiveawayEntryStatus(id: number, status: 'pending' | 'approved' | 'rejected'): Promise<schema.GiveawayEntryType | undefined> {
    const [entry] = await db.update(schema.giveawayEntries)
      .set({ status })
      .where(sql`${schema.giveawayEntries.id} = ${id}`)
      .returning();
    return entry;
  }

  async getGiveawayEntries(): Promise<schema.GiveawayEntryType[]> {
    return await db.select().from(schema.giveawayEntries);
  }
}

export const storage = PostgresStorage.getInstance();