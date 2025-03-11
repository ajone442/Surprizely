import path from 'path';
import { fileURLToPath } from 'url';
import { EventEmitter } from 'events';
import { products, users, wishlist, ratings, giveawayEntries, Product, User, InsertProduct, InsertWishlist, InsertRating, Rating, InsertGiveaway, GiveawayEntry } from "@shared/schema";
import session from "express-session";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Allow configuring data directory through environment variable
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, "products.json");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const RATINGS_FILE = path.join(DATA_DIR, "ratings.json");
const WISHLIST_FILE = path.join(DATA_DIR, "wishlist.json");
const GIVEAWAY_FILE = path.join(DATA_DIR, "giveaway.json");
const SESSIONS_FILE = path.join(DATA_DIR, "sessions.json");

// Create data directory if it doesn't exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

class FileStore extends EventEmitter implements session.Store {
  private sessions: { [key: string]: any } = {};

  constructor() {
    super();
    this.loadSessions();
  }

  private loadSessions() {
    try {
      if (fs.existsSync(SESSIONS_FILE)) {
        const data = fs.readFileSync(SESSIONS_FILE, 'utf8');
        this.sessions = JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
      this.sessions = {};
    }
  }

  private saveSessions() {
    try {
      fs.writeFileSync(SESSIONS_FILE, JSON.stringify(this.sessions, null, 2));
    } catch (error) {
      console.error('Error saving sessions:', error);
    }
  }

  get = (sid: string, callback: (err: any, session?: any) => void) => {
    const session = this.sessions[sid];
    callback(null, session);
  };

  set = (sid: string, session: any, callback?: (err?: any) => void) => {
    this.sessions[sid] = session;
    this.saveSessions();
    if (callback) callback();
  };

  destroy = (sid: string, callback?: (err?: any) => void) => {
    delete this.sessions[sid];
    this.saveSessions();
    if (callback) callback();
  };

  all = (callback: (err: any, obj?: { [sid: string]: any }) => void) => {
    callback(null, this.sessions);
  };

  clear = (callback?: (err?: any) => void) => {
    this.sessions = {};
    this.saveSessions();
    if (callback) callback();
  };

  length = (callback: (err: any, length: number) => void) => {
    callback(null, Object.keys(this.sessions).length);
  };

  touch = (sid: string, session: any, callback?: () => void) => {
    if (this.sessions[sid]) {
      this.sessions[sid] = session;
      this.saveSessions();
    }
    if (callback) callback();
  };
}

interface IStorage {
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
  sessionStore: session.Store;
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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private products: Map<number, Product>;
  private wishlist: Map<number, Set<number>>;
  private ratings: Map<number, Rating[]>;
  private giveawayEntries: Map<number, GiveawayEntry>;
  private currentUserId: number;
  private currentProductId: number;
  private currentRatingId: number;
  private currentGiveawayEntryId: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.wishlist = new Map();
    this.ratings = new Map();
    this.giveawayEntries = new Map();
    this.currentUserId = 1;
    this.currentProductId = 1;
    this.currentRatingId = 1;
    this.currentGiveawayEntryId = 1;
    
    // Use our custom file-based session storage
    this.sessionStore = new FileStore();

    // Load saved data
    this.loadData();
    
    // Create admin user if it doesn't exist
    this.createAdminUser();
  }

  private loadData() {
    try {
      // Load products
      if (fs.existsSync(PRODUCTS_FILE)) {
        const productsData = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf-8'));
        productsData.forEach((product: Product) => {
          this.products.set(product.id, product);
          if (product.id >= this.currentProductId) {
            this.currentProductId = product.id + 1;
          }
        });
      }
      
      // Load users
      if (fs.existsSync(USERS_FILE)) {
        const usersData = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
        usersData.forEach((user: User) => {
          this.users.set(user.id, user);
          if (user.id >= this.currentUserId) {
            this.currentUserId = user.id + 1;
          }
        });
      }

      // Load ratings
      if (fs.existsSync(RATINGS_FILE)) {
        const ratingsData = JSON.parse(fs.readFileSync(RATINGS_FILE, 'utf-8')) as Record<string, Rating[]>;
        Object.entries(ratingsData).forEach(([productId, productRatings]) => {
          this.ratings.set(Number(productId), productRatings);
          productRatings.forEach((rating: Rating) => {
            if (rating.id >= this.currentRatingId) {
              this.currentRatingId = rating.id + 1;
            }
          });
        });
      }

      // Load wishlist
      if (fs.existsSync(WISHLIST_FILE)) {
        const wishlistData = JSON.parse(fs.readFileSync(WISHLIST_FILE, 'utf-8'));
        Object.entries(wishlistData).forEach(([userId, productIds]) => {
          this.wishlist.set(Number(userId), new Set(productIds as number[]));
        });
      }

      // Load giveaway entries
      if (fs.existsSync(GIVEAWAY_FILE)) {
        const giveawayEntriesData = JSON.parse(fs.readFileSync(GIVEAWAY_FILE, 'utf-8'));
        giveawayEntriesData.forEach((entry: GiveawayEntry) => {
          this.giveawayEntries.set(entry.id, entry);
          if (entry.id >= this.currentGiveawayEntryId) {
            this.currentGiveawayEntryId = entry.id + 1;
          }
        });
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
  }

  private saveData() {
    try {
      // Save products
      fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(Array.from(this.products.values()), null, 2));
      
      // Save users (excluding passwords for security)
      const usersToSave = Array.from(this.users.values()).map(user => ({
        ...user,
        password: undefined
      }));
      fs.writeFileSync(USERS_FILE, JSON.stringify(usersToSave, null, 2));

      // Save ratings
      const ratingsObj = Object.fromEntries(this.ratings.entries());
      fs.writeFileSync(RATINGS_FILE, JSON.stringify(ratingsObj, null, 2));

      // Save wishlist
      const wishlistObj = Object.fromEntries(
        Array.from(this.wishlist.entries()).map(([userId, productIds]) => [
          userId,
          Array.from(productIds)
        ])
      );
      fs.writeFileSync(WISHLIST_FILE, JSON.stringify(wishlistObj, null, 2));

      // Save giveaway entries
      fs.writeFileSync(GIVEAWAY_FILE, JSON.stringify(Array.from(this.giveawayEntries.values()), null, 2));
    } catch (error) {
      console.error("Error saving data:", error);
    }
  }

  private async createAdminUser() {
    try {
      // Import hashPassword function from auth.ts
      const { hashPassword } = await import('./auth');
      const hashedPassword = await hashPassword("admin123");

      this.createUser({
        username: "admin",
        password: hashedPassword,
        isAdmin: true,
      } as InsertUser);
    } catch (error) {
      console.error("Failed to create admin user with hashed password:", error);
      // Fallback to plain text password if hashing fails
      this.createUser({
        username: "admin",
        password: "admin123",
        isAdmin: true,
      } as InsertUser);
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser & { isAdmin?: boolean }): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id, isAdmin: insertUser.isAdmin || false };
    this.users.set(id, user);
    this.wishlist.set(id, new Set());
    this.saveData();
    return user;
  }

  async updateUser(userId: number, data: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    const updatedUser = { ...user, ...data };
    this.users.set(userId, updatedUser);
    this.saveData();
    return updatedUser;
  }

  async updateUserEmail(userId: number, email: string): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    const updatedUser = { ...user, username: email };
    this.users.set(userId, updatedUser);
    this.saveData();
    return updatedUser;
  }

  async updateUserPassword(userId: number, password: string): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    const updatedUser = { ...user, password };
    this.users.set(userId, updatedUser);
    this.saveData();
    return updatedUser;
  }

  async verifyUserPassword(userId: number, password: string): Promise<boolean> {
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
    return Array.from(this.products.values());
  }

  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const id = this.currentProductId++;
    const newProduct = {
      id,
      ...product,
      price: product.price,
      averageRating: 0,
      ratingCount: 0,
    };
    this.products.set(id, newProduct);
    this.saveData();
    return newProduct;
  }

  async updateProduct(
    id: number,
    updateProduct: Partial<InsertProduct>,
  ): Promise<Product> {
    const existing = await this.getProduct(id);
    if (!existing) throw new Error("Product not found");

    const updated: Product = { ...existing, ...updateProduct };
    this.products.set(id, updated);
    this.saveData();
    return updated;
  }

  async deleteProduct(id: number): Promise<void> {
    this.products.delete(id);
    this.saveData();
    for (const userWishlist of this.wishlist.values()) {
      userWishlist.delete(id);
    }
    this.ratings.delete(id);
  }

  async getWishlist(userId: number): Promise<Product[]> {
    const userWishlist = this.wishlist.get(userId);
    if (!userWishlist) return [];

    return Array.from(userWishlist)
      .map(productId => this.products.get(productId))
      .filter((product): product is Product => !!product);
  }

  async addToWishlist(wishlistItem: InsertWishlist): Promise<void> {
    const userWishlist = this.wishlist.get(wishlistItem.userId);
    if (!userWishlist) return;
    userWishlist.add(wishlistItem.productId);
  }

  async removeFromWishlist(userId: number, productId: number): Promise<void> {
    const userWishlist = this.wishlist.get(userId);
    if (!userWishlist) return;
    userWishlist.delete(productId);
  }

  async getRatings(productId: number): Promise<Rating[]> {
    return this.ratings.get(productId) || [];
  }

  async getUserRating(userId: number, productId: number): Promise<Rating | null> {
    const ratingsForProduct = this.ratings.get(productId);
    if (!ratingsForProduct) return null;
    return ratingsForProduct.find(r => r.userId === userId) || null;
  }

  async rateProduct(ratingData: InsertRating): Promise<Product | undefined> {
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

    this.saveData();
    return updatedProduct;
  }

  async updateRating(ratingId: number, newRating: number): Promise<Product | undefined> {
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

    this.saveData();
    return updatedProduct;
  }

  async deleteRating(ratingId: number): Promise<Product | undefined> {
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

    this.saveData();
    return updatedProduct;
  }

  async createGiveawayEntry(entryData: InsertGiveaway): Promise<GiveawayEntry> {
    const entry: GiveawayEntry = {
      id: this.currentGiveawayEntryId++,
      email: entryData.email,
      receiptImage: entryData.receiptImage,
      status: entryData.status || 'pending',
      submittedAt: new Date().toISOString()
    };

    this.giveawayEntries.set(entry.id, entry);
    this.saveData();
    return entry;
  }

  async updateGiveawayEntryStatus(id: number, status: 'pending' | 'approved' | 'rejected'): Promise<GiveawayEntry | undefined> {
    const entry = this.giveawayEntries.get(id);
    if (!entry) return undefined;

    entry.status = status;
    this.saveData();
    return entry;
  }

  async getGiveawayEntries(): Promise<GiveawayEntry[]> {
    return Array.from(this.giveawayEntries.values());
  }

  // Placeholder for email sending functionality - replace with actual implementation using Flask-Mail or similar
  private async sendEmail(email: string, orderID: string, productLink: string | null): Promise<void> {
    console.log(`Sending email to ${email} for order ${orderID} (product link: ${productLink})`);
    // Add your email sending logic here using Flask-Mail or another email service.
    //  Remember to handle potential errors and implement robust security measures to prevent spam.
  }
}

export const storage = new MemStorage();

// Placeholder for password validation function (requires a more robust solution)
export function validatePassword(password: string): boolean {
  // Check for minimum length and at least one uppercase letter.  This is a basic example and should be improved for production.
  return password.length >= 7 && /[A-Z]/.test(password);
}