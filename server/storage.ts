import path from 'path';
import { fileURLToPath } from 'url';
import { EventEmitter } from 'events';
import { products, users, wishlist, ratings, giveawayEntries, Product, User, InsertProduct, InsertWishlist, InsertRating, Rating, InsertGiveaway, GiveawayEntry } from "@shared/schema";
import session from "express-session";
import fs from "fs";
import { Store } from 'express-session';
import crypto from 'crypto';

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

interface IStorage {
  init(): Promise<void>;
  isConnected(): boolean;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(userId: number, data: Partial<InsertUser>): Promise<User | undefined>;
  updateUserEmail(userId: number, email: string): Promise<User | undefined>;
  updateUserPassword(userId: number, password: string): Promise<User | undefined>;
  verifyUserPassword(userId: number, password: string): Promise<boolean>;
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: number): Promise<void>;
  getWishlist(userId: number): Promise<Product[]>;
  addToWishlist(wishlist: InsertWishlist): Promise<void>;
  removeFromWishlist(userId: number, productId: number): Promise<void>;
  getRatings(productId: number): Promise<Rating[]>;
  getUserRating(userId: number, productId: number): Promise<Rating | null>;
  rateProduct(ratingData: InsertRating): Promise<Product | undefined>;
  updateRating(ratingId: number, newRating: number): Promise<Product | undefined>;
  deleteRating(ratingId: number): Promise<Product | undefined>;
  createGiveawayEntry(entryData: InsertGiveaway): Promise<GiveawayEntry>;
  updateGiveawayEntryStatus(id: number, status: 'pending' | 'approved' | 'rejected'): Promise<GiveawayEntry | undefined>;
  getGiveawayEntries(): Promise<GiveawayEntry[]>;
  sessionStore: FileStore;
}

interface Rating {
  id: number;
  userId: number;
  productId: number;
  rating: number;
  createdAt: string;
}

interface InsertRating {
  userId: number;
  productId: number;
  rating: number;
}

interface InsertGiveaway {
  email: string;
  receiptImage: string;
  status?: 'pending' | 'approved' | 'rejected';
}

interface GiveawayEntry {
  id: number;
  email: string;
  receiptImage: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
}

class MemStorage implements IStorage {
  private static instance: MemStorage;
  private users: Map<number, User>;
  private products: Map<number, Product>;
  private wishlist: Map<number, Set<number>>;
  private ratings: Map<number, Rating[]>;
  private giveawayEntries: Map<number, GiveawayEntry>;
  private currentUserId: number;
  private currentProductId: number;
  private currentRatingId: number;
  private currentGiveawayEntryId: number;
  private connected: boolean = false;
  private dataDir: string;
  private productsFile: string;
  private usersFile: string;
  private wishlistFile: string;
  private giveawayFile: string;
  private ratingsFile: string;
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
    
    // In production, use absolute paths from the app root
    const isProd = process.env.NODE_ENV === 'production';
    const baseDir = isProd ? '/app/data' : path.join(__dirname, '..', 'data');
    
    this.dataDir = baseDir;
    this.productsFile = path.join(this.dataDir, 'products.json');
    this.usersFile = path.join(this.dataDir, 'users.json');
    this.wishlistFile = path.join(this.dataDir, 'wishlist.json');
    this.giveawayFile = path.join(this.dataDir, 'giveaway.json');
    this.ratingsFile = path.join(this.dataDir, 'ratings.json');
    
    // Use our custom file-based session storage
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
      // Ensure data directory exists
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }

      // Initialize files if they don't exist
      const files = [
        this.productsFile,
        this.usersFile,
        this.wishlistFile,
        this.giveawayFile,
        this.ratingsFile
      ];

      for (const file of files) {
        if (!fs.existsSync(file)) {
          fs.writeFileSync(file, '[]');
        }
      }

      // Load initial data
      await this.loadData();
      this.connected = true;
      console.log('Storage initialized successfully at:', this.dataDir);
    } catch (error) {
      console.error('Failed to initialize storage:', error);
      this.connected = false;
      throw error;
    }
  }

  private async loadData(): Promise<void> {
    try {
      // Load products
      if (fs.existsSync(this.productsFile)) {
        const productsData = await fs.promises.readFile(this.productsFile, 'utf-8');
        const products = JSON.parse(productsData);
        products.forEach((product: Product) => {
          this.products.set(product.id, product);
          if (product.id >= this.currentProductId) {
            this.currentProductId = product.id + 1;
          }
        });
      }
      
      // Load users
      if (fs.existsSync(this.usersFile)) {
        const usersData = await fs.promises.readFile(this.usersFile, 'utf-8');
        const users = JSON.parse(usersData);
        users.forEach((user: User) => {
          this.users.set(user.id, user);
          if (user.id >= this.currentUserId) {
            this.currentUserId = user.id + 1;
          }
        });
      }

      // Load ratings
      if (fs.existsSync(this.ratingsFile)) {
        const ratingsData = await fs.promises.readFile(this.ratingsFile, 'utf-8');
        const ratings = JSON.parse(ratingsData) as Record<string, Rating[]>;
        Object.entries(ratings).forEach(([productId, productRatings]) => {
          this.ratings.set(Number(productId), productRatings);
          productRatings.forEach((rating: Rating) => {
            if (rating.id >= this.currentRatingId) {
              this.currentRatingId = rating.id + 1;
            }
          });
        });
      }

      // Load wishlist
      if (fs.existsSync(this.wishlistFile)) {
        const wishlistData = await fs.promises.readFile(this.wishlistFile, 'utf-8');
        const wishlist = JSON.parse(wishlistData);
        Object.entries(wishlist).forEach(([userId, productIds]) => {
          this.wishlist.set(Number(userId), new Set(productIds as number[]));
        });
      }

      // Load giveaway entries
      if (fs.existsSync(this.giveawayFile)) {
        const giveawayEntriesData = await fs.promises.readFile(this.giveawayFile, 'utf-8');
        const giveawayEntries = JSON.parse(giveawayEntriesData);
        giveawayEntries.forEach((entry: GiveawayEntry) => {
          this.giveawayEntries.set(entry.id, entry);
          if (entry.id >= this.currentGiveawayEntryId) {
            this.currentGiveawayEntryId = entry.id + 1;
          }
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
      throw error;
    }
  }

  private async saveData(): Promise<void> {
    try {
      // Save products
      await fs.promises.writeFile(this.productsFile, JSON.stringify(Array.from(this.products.values()), null, 2));
      
      // Save users (excluding passwords for security)
      const usersToSave = Array.from(this.users.values()).map(user => ({
        ...user,
        password: undefined
      }));
      await fs.promises.writeFile(this.usersFile, JSON.stringify(usersToSave, null, 2));

      // Save ratings
      const ratingsObj = Object.fromEntries(this.ratings.entries());
      await fs.promises.writeFile(this.ratingsFile, JSON.stringify(ratingsObj, null, 2));

      // Save wishlist
      const wishlistObj = Object.fromEntries(
        Array.from(this.wishlist.entries()).map(([userId, productIds]) => [
          userId,
          Array.from(productIds)
        ])
      );
      await fs.promises.writeFile(this.wishlistFile, JSON.stringify(wishlistObj, null, 2));

      // Save giveaway entries
      await fs.promises.writeFile(this.giveawayFile, JSON.stringify(Array.from(this.giveawayEntries.values()), null, 2));
    } catch (error) {
      console.error('Error saving data:', error);
      throw error;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  async getUser(id: number): Promise<User | undefined> {
    if (!this.connected) {
      throw new Error('Storage is not initialized');
    }
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    if (!this.connected) {
      throw new Error('Storage is not initialized');
    }
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser & { isAdmin?: boolean }): Promise<User> {
    if (!this.connected) {
      throw new Error('Storage is not initialized');
    }
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id, isAdmin: insertUser.isAdmin || false };
    this.users.set(id, user);
    this.wishlist.set(id, new Set());
    await this.saveData();
    return user;
  }

  async updateUser(userId: number, data: Partial<InsertUser>): Promise<User | undefined> {
    if (!this.connected) {
      throw new Error('Storage is not initialized');
    }
    const user = this.users.get(userId);
    if (!user) return undefined;
    const updatedUser = { ...user, ...data };
    this.users.set(userId, updatedUser);
    await this.saveData();
    return updatedUser;
  }

  async updateUserEmail(userId: number, email: string): Promise<User | undefined> {
    if (!this.connected) {
      throw new Error('Storage is not initialized');
    }
    const user = this.users.get(userId);
    if (!user) return undefined;
    const updatedUser = { ...user, username: email };
    this.users.set(userId, updatedUser);
    await this.saveData();
    return updatedUser;
  }

  async updateUserPassword(userId: number, password: string): Promise<User | undefined> {
    if (!this.connected) {
      throw new Error('Storage is not initialized');
    }
    const user = this.users.get(userId);
    if (!user) return undefined;
    const updatedUser = { ...user, password };
    this.users.set(userId, updatedUser);
    await this.saveData();
    return updatedUser;
  }

  async verifyUserPassword(userId: number, password: string): Promise<boolean> {
    if (!this.connected) {
      throw new Error('Storage is not initialized');
    }
    const user = this.users.get(userId);
    if (!user) return false;

    // Check if password is already hashed
    if (user.password.includes('.')) {
      // Password is hashed, use secure comparison
      try {
        // Import comparePasswords function from auth.ts
        const { comparePasswords } = await import('./auth');
        return await comparePasswords(password, user.password);
      } catch (error) {
        console.error("Error comparing passwords:", error);
        return false;
      }
    } else {
      // Legacy password comparison (plain text)
      return user.password === password;
    }
  }

  async getProducts(): Promise<Product[]> {
    if (!this.connected) {
      throw new Error('Storage is not initialized');
    }
    return Array.from(this.products.values());
  }

  async getProduct(id: number): Promise<Product | undefined> {
    if (!this.connected) {
      throw new Error('Storage is not initialized');
    }
    return this.products.get(id);
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    if (!this.connected) {
      throw new Error('Storage is not initialized');
    }
    const id = this.currentProductId++;
    const newProduct = {
      id,
      ...product,
      price: product.price,
      averageRating: 0,
      ratingCount: 0,
    };
    this.products.set(id, newProduct);
    await this.saveData();
    return newProduct;
  }

  async updateProduct(
    id: number,
    updateProduct: Partial<InsertProduct>,
  ): Promise<Product> {
    if (!this.connected) {
      throw new Error('Storage is not initialized');
    }
    const existing = await this.getProduct(id);
    if (!existing) throw new Error("Product not found");

    const updated: Product = { ...existing, ...updateProduct };
    this.products.set(id, updated);
    await this.saveData();
    return updated;
  }

  async deleteProduct(id: number): Promise<void> {
    if (!this.connected) {
      throw new Error('Storage is not initialized');
    }
    this.products.delete(id);
    await this.saveData();
    for (const userWishlist of this.wishlist.values()) {
      userWishlist.delete(id);
    }
    this.ratings.delete(id);
  }

  async getWishlist(userId: number): Promise<Product[]> {
    if (!this.connected) {
      throw new Error('Storage is not initialized');
    }
    const userWishlist = this.wishlist.get(userId);
    if (!userWishlist) return [];

    return Array.from(userWishlist)
      .map(productId => this.products.get(productId))
      .filter((product): product is Product => !!product);
  }

  async addToWishlist(wishlistItem: InsertWishlist): Promise<void> {
    if (!this.connected) {
      throw new Error('Storage is not initialized');
    }
    const userWishlist = this.wishlist.get(wishlistItem.userId);
    if (!userWishlist) return;
    userWishlist.add(wishlistItem.productId);
  }

  async removeFromWishlist(userId: number, productId: number): Promise<void> {
    if (!this.connected) {
      throw new Error('Storage is not initialized');
    }
    const userWishlist = this.wishlist.get(userId);
    if (!userWishlist) return;
    userWishlist.delete(productId);
  }

  async getRatings(productId: number): Promise<Rating[]> {
    if (!this.connected) {
      throw new Error('Storage is not initialized');
    }
    return this.ratings.get(productId) || [];
  }

  async getUserRating(userId: number, productId: number): Promise<Rating | null> {
    if (!this.connected) {
      throw new Error('Storage is not initialized');
    }
    const ratingsForProduct = this.ratings.get(productId);
    if (!ratingsForProduct) return null;
    return ratingsForProduct.find(r => r.userId === userId) || null;
  }

  async rateProduct(ratingData: InsertRating): Promise<Product | undefined> {
    if (!this.connected) {
      throw new Error('Storage is not initialized');
    }
    const productId = ratingData.productId;
    const existingRating = await this.getUserRating(ratingData.userId, productId);

    if (existingRating) {
      //Update existing rating
      const updatedRating: Rating = { ...existingRating, rating: ratingData.rating, createdAt: new Date().toISOString()};
      const updatedRatings = [...this.ratings.get(productId)!.filter(r => r.id !== existingRating.id), updatedRating];
      this.ratings.set(productId, updatedRatings);
    } else {
      const newRating: Rating = { id: this.currentRatingId++, ...ratingData, createdAt: new Date().toISOString()};
      const productRatings = this.ratings.get(productId) || [];
      this.ratings.set(productId, [...productRatings, newRating]);
    }

    const productRatings = this.ratings.get(productId) || [];
    const averageRating = productRatings.reduce((sum, r) => sum + r.rating, 0) / productRatings.length || 0;
    const updatedProduct = {...this.products.get(productId)!, averageRating: Math.round(averageRating * 10) / 10, ratingCount: productRatings.length};
    this.products.set(productId, updatedProduct);

    await this.saveData();
    return updatedProduct;
  }

  async updateRating(ratingId: number, newRating: number): Promise<Product | undefined> {
    if (!this.connected) {
      throw new Error('Storage is not initialized');
    }
    const ratingToUpdate = Array.from(this.ratings.values()).flat().find(r => r.id === ratingId);

    if(!ratingToUpdate) {
      throw new Error("Rating not found");
    }

    const updatedRating:Rating = {...ratingToUpdate, rating: newRating, createdAt: new Date().toISOString()};
    const productRatings = this.ratings.get(ratingToUpdate.productId)!.map(r => r.id === ratingId ? updatedRating : r);
    this.ratings.set(ratingToUpdate.productId, productRatings);
    const averageRating = productRatings.reduce((sum, r) => sum + r.rating, 0) / productRatings.length || 0;
    const updatedProduct = {...this.products.get(ratingToUpdate.productId)!, averageRating: Math.round(averageRating * 10) / 10, ratingCount: productRatings.length};
    this.products.set(ratingToUpdate.productId, updatedProduct);

    await this.saveData();
    return updatedProduct;
  }

  async deleteRating(ratingId: number): Promise<Product | undefined> {
    if (!this.connected) {
      throw new Error('Storage is not initialized');
    }
    const ratingToDelete = Array.from(this.ratings.values()).flat().find(r => r.id === ratingId);
    if (!ratingToDelete) {
      throw new Error("Rating not found");
    }
    const productId = ratingToDelete.productId;
    const updatedRatings = this.ratings.get(productId)!.filter(r => r.id !== ratingId);
    this.ratings.set(productId, updatedRatings);

    const averageRating = updatedRatings.length > 0 ? updatedRatings.reduce((sum, r) => sum + r.rating, 0) / updatedRatings.length : 0;
    const updatedProduct = {...this.products.get(productId)!, averageRating: Math.round(averageRating * 10) / 10, ratingCount: updatedRatings.length};
    this.products.set(productId, updatedProduct);

    await this.saveData();
    return updatedProduct;
  }

  async createGiveawayEntry(entryData: InsertGiveaway): Promise<GiveawayEntry> {
    if (!this.connected) {
      throw new Error('Storage is not initialized');
    }
    const entry: GiveawayEntry = {
      id: this.currentGiveawayEntryId++,
      email: entryData.email,
      receiptImage: entryData.receiptImage,
      status: entryData.status || 'pending',
      submittedAt: new Date().toISOString()
    };

    this.giveawayEntries.set(entry.id, entry);
    await this.saveData();
    return entry;
  }

  async updateGiveawayEntryStatus(id: number, status: 'pending' | 'approved' | 'rejected'): Promise<GiveawayEntry | undefined> {
    if (!this.connected) {
      throw new Error('Storage is not initialized');
    }
    const entry = this.giveawayEntries.get(id);
    if (!entry) return undefined;

    entry.status = status;
    await this.saveData();
    return entry;
  }

  async getGiveawayEntries(): Promise<GiveawayEntry[]> {
    if (!this.connected) {
      throw new Error('Storage is not initialized');
    }
    return Array.from(this.giveawayEntries.values());
  }

  // Placeholder for email sending functionality - replace with actual implementation using Flask-Mail or similar
  private async sendEmail(email: string, orderID: string, productLink: string | null): Promise<void> {
    console.log(`Sending email to ${email} for order ${orderID} (product link: ${productLink})`);
    // Add your email sending logic here using Flask-Mail or another email service.
    //  Remember to handle potential errors and implement robust security measures to prevent spam.
  }
}

export const storage = MemStorage.getInstance();