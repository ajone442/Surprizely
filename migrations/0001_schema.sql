-- Create users table
CREATE TABLE IF NOT EXISTS "users" (
  "id" SERIAL PRIMARY KEY,
  "username" TEXT NOT NULL UNIQUE,
  "password" TEXT NOT NULL,
  "is_admin" BOOLEAN NOT NULL DEFAULT false
);

-- Create products table
CREATE TABLE IF NOT EXISTS "products" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "price" INTEGER NOT NULL,
  "image_url" TEXT NOT NULL,
  "affiliate_link" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "average_rating" INTEGER DEFAULT 0,
  "rating_count" INTEGER DEFAULT 0
);

-- Create ratings table
CREATE TABLE IF NOT EXISTS "ratings" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id"),
  "product_id" INTEGER NOT NULL REFERENCES "products"("id"),
  "rating" INTEGER NOT NULL,
  "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "rating_range" CHECK ("rating" >= 1 AND "rating" <= 5)
);

-- Create wishlist table
CREATE TABLE IF NOT EXISTS "wishlist" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id"),
  "product_id" INTEGER NOT NULL REFERENCES "products"("id"),
  UNIQUE("user_id", "product_id")
);

-- Create giveaway_entries table
CREATE TABLE IF NOT EXISTS "giveaway_entries" (
  "id" SERIAL PRIMARY KEY,
  "email" TEXT NOT NULL,
  "order_id" TEXT,
  "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ip_address" TEXT,
  "product_link" TEXT,
  "email_sent" BOOLEAN DEFAULT false,
  "order_screenshot" TEXT,
  "receipt_image" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending'
);
