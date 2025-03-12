import path from 'path';
import { fileURLToPath } from 'url';
import fs from "fs";
import { Store } from 'express-session';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Allow configuring data directory through environment variable
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, "products.json");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const RATINGS_FILE = path.join(DATA_DIR, "ratings.json");
const WISHLIST_FILE = path.join(DATA_DIR, "wishlist.json");
const GIVEAWAY_FILE = path.join(DATA_DIR, "giveaway.json");
const SESSIONS_DIR = path.join(DATA_DIR, "sessions");

// Create data directory if it doesn't exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Define schemas
export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  name?: string;
  isAdmin: boolean;
  createdAt: string;
}

export interface InsertUser {
  username: string;
  email: string;
  password: string;
  name?: string;
  isAdmin?: boolean;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  imageUrl?: string;
  category: string;
  createdAt: string;
  averageRating?: number;
  affiliateLink?: string;
}

export interface InsertProduct {
  name: string;
  description: string;
  price: number;
  image: string;
  imageUrl?: string;
  category: string;
  affiliateLink?: string;
}

export interface Rating {
  id: number;
  userId: number;
  productId: number;
  rating: number;
  createdAt: string;
}

export interface InsertRating {
  userId: number;
  productId: number;
  rating: number;
}

export interface GiveawayEntry {
  id: number;
  email: string;
  receiptImage: string;
  ipAddress: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface InsertGiveaway {
  email: string;
  receiptImage: string;
  ipAddress: string;
  status?: 'pending' | 'approved' | 'rejected';
  createdAt?: Date;
}

class FileStore extends Store {
  private sessions: Map<string, any>;
  private storageDir: string;

  constructor(options: any = {}) {
    super(options);
    this.sessions = new Map();
    this.storageDir = options.path || SESSIONS_DIR;
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  get(sid: string, callback: (err: any, session?: any) => void): void {
    const sessionPath = path.join(this.storageDir, `${sid}.json`);
    try {
      if (fs.existsSync(sessionPath)) {
        const data = fs.readFileSync(sessionPath, 'utf8');
        callback(null, JSON.parse(data));
      } else {
        callback(null);
      }
    } catch (err) {
      callback(err);
    }
  }

  set(sid: string, session: any, callback?: (err?: any) => void): void {
    const sessionPath = path.join(this.storageDir, `${sid}.json`);
    try {
      fs.writeFileSync(sessionPath, JSON.stringify(session));
      callback?.(null);
    } catch (err) {
      callback?.(err);
    }
  }

  destroy(sid: string, callback?: (err?: any) => void): void {
    const sessionPath = path.join(this.storageDir, `${sid}.json`);
    try {
      if (fs.existsSync(sessionPath)) {
        fs.unlinkSync(sessionPath);
      }
      callback?.(null);
    } catch (err) {
      callback?.(err);
    }
  }

  regenerate(req: any, callback: (err?: any) => void): void {
    const sid = req.sessionID;
    this.destroy(sid, (err) => {
      if (err) {
        callback(err);
        return;
      }
      req.sessionID = this.generateId();
      callback();
    });
  }

  load(sid: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.get(sid, (err, session) => {
        if (err) reject(err);
        else resolve(session);
      });
    });
  }

  createSession(req: any, session: any): any {
    session.id = req.sessionID;
    return session;
  }

  private generateId(): string {
    return crypto.randomBytes(16).toString('hex');
  }
}

class MemStorage {
  private static instance: MemStorage;
  private users: Map<number, User>;
  private products: Map<number, Product>;
  private wishlist: Map<number, Set<number>>;
  private ratings: Map<number, Map<number, Rating>>;
  private giveawayEntries: Map<number, GiveawayEntry>;
  private currentUserId: number;
  private currentProductId: number;
  private currentRatingId: number;
  private currentGiveawayEntryId: number;
  private connected: boolean = false;
  sessionStore: FileStore;

  private constructor() {
    this.users = new Map();
    this.products = new Map();
    this.wishlist = new Map();
    this.ratings = new Map();
    this.giveawayEntries = new Map();
    this.currentUserId = 1;
    this.currentProductId = 1;
    this.currentRatingId = 1;
    this.currentGiveawayEntryId = 1;
    this.sessionStore = new FileStore();
  }

  public static getInstance(): MemStorage {
    if (!MemStorage.instance) {
      MemStorage.instance = new MemStorage();
    }
    return MemStorage.instance;
  }

  async init(): Promise<void> {
    try {
      await this.loadData();
      this.connected = true;
    } catch (error) {
      console.error('Failed to initialize storage:', error);
      throw error;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  private async loadData(): Promise<void> {
    try {
      // Load users
      if (fs.existsSync(USERS_FILE)) {
        const usersData = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
        usersData.forEach((user: User) => this.users.set(user.id, user));
        this.currentUserId = Math.max(...Array.from(this.users.keys())) + 1;
      }

      // Load products
      if (fs.existsSync(PRODUCTS_FILE)) {
        const productsData = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf-8'));
        productsData.forEach((product: Product) => this.products.set(product.id, product));
        this.currentProductId = Math.max(...Array.from(this.products.keys())) + 1;
      }

      // Load ratings
      if (fs.existsSync(RATINGS_FILE)) {
        const ratingsData = JSON.parse(fs.readFileSync(RATINGS_FILE, 'utf-8'));
        if (Array.isArray(ratingsData)) {
          ratingsData.forEach((rating: Rating) => {
            const productRatings = this.ratings.get(rating.productId) || new Map();
            productRatings.set(rating.userId, rating);
            this.ratings.set(rating.productId, productRatings);
          });
        }
      }

      // Load giveaway entries
      if (fs.existsSync(GIVEAWAY_FILE)) {
        const entriesData = JSON.parse(fs.readFileSync(GIVEAWAY_FILE, 'utf-8'));
        entriesData.forEach((entry: GiveawayEntry) => this.giveawayEntries.set(entry.id, entry));
        this.currentGiveawayEntryId = Math.max(...Array.from(this.giveawayEntries.keys())) + 1;
      }

      // Calculate average ratings for products
      this.products.forEach(product => {
        const productRatings = this.ratings.get(product.id);
        if (productRatings && productRatings.size > 0) {
          const sum = Array.from(productRatings.values()).reduce((acc, rating) => acc + rating.rating, 0);
          product.averageRating = sum / productRatings.size;
        } else {
          product.averageRating = 0;
        }
      });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // File doesn't exist, initialize with empty data
        await this.saveData();
      } else {
        throw error;
      }
    }
  }

  private async saveData(): Promise<void> {
    // Save users
    fs.writeFileSync(USERS_FILE, JSON.stringify(Array.from(this.users.values()), null, 2));

    // Save products
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(Array.from(this.products.values()), null, 2));

    // Save ratings
    const allRatings = Array.from(this.ratings.values()).flatMap(ratings => Array.from(ratings.values()));
    fs.writeFileSync(RATINGS_FILE, JSON.stringify(allRatings, null, 2));

    // Save giveaway entries
    fs.writeFileSync(GIVEAWAY_FILE, JSON.stringify(Array.from(this.giveawayEntries.values()), null, 2));
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(userData: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user: User = {
      id: this.currentUserId++,
      ...userData,
      password: hashedPassword,
      isAdmin: userData.isAdmin || false,
      createdAt: new Date().toISOString()
    };
    this.users.set(user.id, user);
    await this.saveData();
    return user;
  }

  async updateUser(userId: number, data: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;

    Object.assign(user, data);
    await this.saveData();
    return user;
  }

  async updateUserPassword(userId: number, password: string): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await this.saveData();
    return user;
  }

  async verifyUserPassword(userId: number, password: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) return false;
    return await bcrypt.compare(password, user.password);
  }

  // Product methods
  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(productData: InsertProduct): Promise<Product> {
    const product: Product = {
      id: this.currentProductId++,
      ...productData,
      imageUrl: productData.imageUrl || `/uploads/${productData.image}`,
      createdAt: new Date().toISOString(),
      averageRating: 0
    };
    this.products.set(product.id, product);
    await this.saveData();
    return product;
  }

  // Giveaway methods
  async createGiveawayEntry(entryData: InsertGiveaway): Promise<GiveawayEntry> {
    const entry: GiveawayEntry = {
      id: this.currentGiveawayEntryId++,
      email: entryData.email,
      receiptImage: entryData.receiptImage,
      ipAddress: entryData.ipAddress,
      status: entryData.status || 'pending',
      createdAt: entryData.createdAt?.toISOString() || new Date().toISOString()
    };
    this.giveawayEntries.set(entry.id, entry);
    await this.saveData();
    return entry;
  }

  async checkRecentGiveawayEntriesByIP(ipAddress: string, minutes: number): Promise<number> {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return Array.from(this.giveawayEntries.values()).filter(
      entry => entry.ipAddress === ipAddress && new Date(entry.createdAt) > cutoff
    ).length;
  }

  async updateGiveawayEntryStatus(id: number, status: 'pending' | 'approved' | 'rejected'): Promise<GiveawayEntry | undefined> {
    const entry = this.giveawayEntries.get(id);
    if (!entry) return undefined;

    entry.status = status;
    await this.saveData();
    return entry;
  }

  async getGiveawayEntries(): Promise<GiveawayEntry[]> {
    return Array.from(this.giveawayEntries.values());
  }
}

export const storage = MemStorage.getInstance();