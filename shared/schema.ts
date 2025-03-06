import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(),
  imageUrl: text("image_url").notNull(),
  affiliateLink: text("affiliate_link").notNull(),
  category: text("category").notNull(),
});

export const wishlist = pgTable("wishlist", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Custom validation for price to handle dollars to cents conversion
export const insertProductSchema = createInsertSchema(products)
  .pick({
    name: true,
    description: true,
    imageUrl: true,
    affiliateLink: true,
    category: true,
  })
  .extend({
    price: z.number()
      .min(0, "Price must be greater than or equal to 0")
      .transform(price => Math.round(price * 100)), // Convert dollars to cents
  });

export const insertWishlistSchema = createInsertSchema(wishlist).pick({
  userId: true,
  productId: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;
export type InsertWishlist = z.infer<typeof insertWishlistSchema>;
export type Wishlist = typeof wishlist.$inferSelect;

export const giftCategories = [
  "Electronics",
  "Fashion",
  "Home & Living",
  "Books",
  "Toys",
  "Jewelry",
  "Sports",
  "Beauty",
] as const;