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
  averageRating: integer("average_rating").default(0),
  ratingCount: integer("rating_count").default(0),
});

export const ratings = pgTable("ratings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  rating: integer("rating").notNull(), // Rating from 1-5
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
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

export const insertUserSchema = createInsertSchema(users)
  .pick({
    username: true,
    password: true,
  })
  .extend({
    password: z
      .string()
      .min(7, "Password must be at least 7 characters")
      .regex(/[A-Z]/, "Password must contain at least one capital letter"),
  });

// Product schema with flexible price handling
export const insertProductSchema = createInsertSchema(products)
  .pick({
    name: true,
    description: true,
    imageUrl: true,
    affiliateLink: true,
    category: true,
  })
  .extend({
    price: z.string().or(z.number()),
  });

export const insertWishlistSchema = createInsertSchema(wishlist).pick({
  userId: true,
  productId: true,
});

export const insertRatingSchema = createInsertSchema(ratings).pick({
  userId: true,
  productId: true,
  rating: true,
}).extend({
  rating: z.number().min(1).max(5)
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;
export type InsertWishlist = z.infer<typeof insertWishlistSchema>;
export type Wishlist = typeof wishlist.$inferSelect;
export type InsertRating = z.infer<typeof insertRatingSchema>;
export type Rating = typeof ratings.$inferSelect;

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