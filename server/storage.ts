import { InsertProduct, InsertUser, InsertWishlist, Product, User, Wishlist } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(userId: number, data: Partial<InsertUser>): Promise<User | undefined>; // Added updateUser function

  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: number): Promise<void>;

  getWishlist(userId: number): Promise<Product[]>;
  addToWishlist(wishlist: InsertWishlist): Promise<void>;
  removeFromWishlist(userId: number, productId: number): Promise<void>;

  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private products: Map<number, Product>;
  private wishlist: Map<number, Set<number>>;
  private currentUserId: number;
  private currentProductId: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.wishlist = new Map();
    this.currentUserId = 1;
    this.currentProductId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });

    // Create initial admin user
    this.createUser({
      username: "admin",
      password: "admin123",
      isAdmin: true,
    } as InsertUser);
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

  async updateUser(userId: number, data: Partial<InsertUser>): Promise<User | undefined> { // Added updateUser function
    const user = this.users.get(userId);
    if (!user) return undefined;
    const updatedUser = { ...user, ...data };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }


  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = this.currentProductId++;
    const product: Product = { ...insertProduct, id };
    this.products.set(id, product);
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
    // Remove from all wishlists
    for (const userWishlist of this.wishlist.values()) {
      userWishlist.delete(id);
    }
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
}

export const storage = new MemStorage();