import { InsertProduct, InsertUser, InsertWishlist } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
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


export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private products: Map<number, Product>;
  private wishlist: Map<number, Set<number>>;
  private ratings: Map<number, Rating[]>;
  private currentUserId: number;
  private currentProductId: number;
  private currentRatingId: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.wishlist = new Map();
    this.ratings = new Map();
    this.currentUserId = 1;
    this.currentProductId = 1;
    this.currentRatingId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
    
    // Create admin user with a hashed password
    this.createAdminUser();
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
    return user;
  }

  async updateUser(userId: number, data: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    const updatedUser = { ...user, ...data };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async updateUserEmail(userId: number, email: string): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    const updatedUser = { ...user, username: email };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async updateUserPassword(userId: number, password: string): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    const updatedUser = { ...user, password };
    this.users.set(userId, updatedUser);
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

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = this.currentProductId++;
    const product: Product = { ...insertProduct, id, averageRating: 0, ratingCount: 0 };
    this.products.set(id, product);
    this.ratings.set(id, []);
    return product;
  }

  async updateProduct(
    id: number,
    updateProduct: Partial<InsertProduct>,
  ): Promise<Product> {
    const existing = await this.getProduct(id);
    if (!existing) throw new Error("Product not found");

    const updated: Product = { ...existing, ...updateProduct };
    this.products.set(id, updated);
    return updated;
  }

  async deleteProduct(id: number): Promise<void> {
    this.products.delete(id);
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
    return updatedProduct;
  }
}

export const storage = new MemStorage();

// Placeholder for password validation function (requires a more robust solution)
export function validatePassword(password: string): boolean {
  // Check for minimum length and at least one uppercase letter.  This is a basic example and should be improved for production.
  return password.length >= 7 && /[A-Z]/.test(password);
}