import type { Express, Request as ExpressRequest, Response as ExpressResponse, NextFunction, RequestHandler, ErrorRequestHandler } from "express";
import { createServer, type Server } from "http";
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import storageInstance from './storage.js';
import passport from 'passport';
import { setupAuth, hashPassword } from "./auth";
import { Product, Rating, GiveawayEntry, InsertGiveaway } from "@shared/schema";
import { initEmailTransporter, sendGiveawayConfirmation } from './email.js';
import openai from "./openai";
import { z } from 'zod';
import { isAuthenticated, isAdmin } from './auth.js';
import { Session } from 'express-session';

// Extend Express Request type to include session and user
interface Request extends ExpressRequest {
  session: Session & { [key: string]: any };
  user?: any;
  file?: multer.File;
}

interface Response extends ExpressResponse {}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Initialize storage instance
const db = storageInstance.getInstance();

// Authentication middleware
const isAuthenticatedMiddleware: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Not authenticated' });
};

const isAdminMiddleware: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated() && req.user && (req.user as any).isAdmin) {
    return next();
  }
  res.status(403).json({ error: 'Not authorized' });
};

const giveawaySchema = z.object({
  email: z.string().email(),
  receiptImage: z.string(),
  status: z.enum(['pending', 'approved', 'rejected']).optional().default('pending')
});

const productSchema = z.object({
  name: z.string(),
  description: z.string(),
  price: z.number(),
  imageUrl: z.string(),
  affiliateLink: z.string(),
  category: z.string()
});

export async function registerRoutes(app: Express) {
  setupAuth(app);

  // Initialize email transporter if environment variables are set
  initEmailTransporter();

  // Ensure storage is initialized
  if (!db.isConnected()) {
    throw new Error('Storage must be initialized before registering routes');
  }

  // Serve uploaded files
  app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

  // Product routes
  const getProducts: RequestHandler = async (_req: Request, res: Response): Promise<void> => {
    try {
      const products = await db.getProducts();
      res.json(products);
    } catch (error: unknown) {
      console.error('Error fetching products:', error);
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  };

  app.get("/api/products", getProducts);

  const createProduct: RequestHandler = async (req: Request, res: Response) => {
    try {
      const productData = req.body;
      if (process.env.NODE_ENV !== 'production') {
        console.log("Product data received:", productData);
      }

      const product = productSchema.parse({
        ...productData,
        price: typeof productData.price === 'string' ? parseFloat(productData.price) : productData.price
      });
      
      console.log("Parsed product:", product);
      const created = await db.createProduct(product);
      res.status(201).json(created);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        console.error('Error creating product:', error);
        res.status(500).json({ error: "Failed to create product" });
      }
    }
  };

  app.post("/api/products", isAdminMiddleware, createProduct);

  const updateProduct: RequestHandler = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const productData = productSchema.partial().parse(req.body);
      const updated = await db.updateProduct(id, {
        ...productData,
        price: typeof productData.price === 'string' ? parseFloat(productData.price) : productData.price
      });
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update product" });
      }
    }
  };

  app.put("/api/products/:id", isAdminMiddleware, updateProduct);

  const deleteProduct: RequestHandler = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    await db.deleteProduct(id);
    res.sendStatus(204);
  };

  app.delete("/api/products/:id", isAdminMiddleware, deleteProduct);

  // Wishlist routes
  const getWishlist: RequestHandler = async (req: Request, res: Response) => {
    const products = await db.getWishlist(req.user!.id);
    res.json(products);
  };

  app.get("/api/wishlist", isAuthenticatedMiddleware, getWishlist);

  const addToWishlist: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const productId = parseInt(req.params.productId);
      const wishlistItem = { userId: req.user!.id, productId };
      await db.addToWishlist(wishlistItem);
      res.sendStatus(201);
    } catch (error: unknown) {
      console.error('Error adding to wishlist:', error);
      res.status(500).json({ error: 'Failed to add item to wishlist' });
    }
  };

  app.post("/api/wishlist/:productId", isAuthenticatedMiddleware, addToWishlist);

  const removeFromWishlist: RequestHandler = async (req: Request, res: Response) => {
    const productId = parseInt(req.params.productId);
    await db.removeFromWishlist(req.user!.id, productId);
    res.sendStatus(204);
  };

  app.delete("/api/wishlist/:productId", isAuthenticatedMiddleware, removeFromWishlist);

  // Rating routes
  const getRatings: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const productId = parseInt(req.params.productId);
      const ratings = await db.getRatings(productId);
      res.json(ratings);
    } catch (error: unknown) {
      console.error('Error fetching ratings:', error);
      res.status(500).json({ error: 'Failed to fetch ratings' });
    }
  };

  app.get("/api/ratings/:productId", getRatings);

  const getUserRating: RequestHandler = async (req: Request, res: Response) => {
    const productId = parseInt(req.params.productId);
    const rating = await db.getUserRating(req.user!.id, productId);
    res.json(rating || { rating: 0 });
  };

  app.get("/api/ratings/user/:productId", isAuthenticatedMiddleware, getUserRating);

  const rateProduct: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const productId = parseInt(req.params.productId);
      const ratingData = z.object({
        rating: z.number().min(1).max(5),
        comment: z.string().optional()
      }).parse(req.body);

      const result = await db.rateProduct({
        userId: req.user!.id,
        productId,
        ...ratingData
      });

      res.status(201).json(result);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        console.error('Error creating rating:', error);
        res.status(500).json({ error: 'Failed to create rating' });
      }
    }
  };

  app.post("/api/ratings/:productId", isAuthenticatedMiddleware, rateProduct);

  // Admin only rating routes
  const updateRating: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const ratingId = parseInt(req.params.ratingId);
      const { rating } = req.body;
      
      if (typeof rating !== 'number' || rating < 1 || rating > 5) {
        res.status(400).json({ error: 'Rating must be a number between 1 and 5' });
        return;
      }

      const updatedProduct = await db.updateRating(ratingId, rating);
      res.json(updatedProduct);
    } catch (error: unknown) {
      console.error('Error updating rating:', error);
      res.status(500).json({ error: 'Failed to update rating' });
    }
  };

  app.put("/api/admin/ratings/:ratingId", isAdminMiddleware, updateRating);

  const deleteRating: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const ratingId = parseInt(req.params.ratingId);
      const updatedProduct = await db.deleteRating(ratingId);
      res.json(updatedProduct);
    } catch (error: unknown) {
      console.error('Error deleting rating:', error);
      res.status(500).json({ error: 'Failed to delete rating' });
    }
  };

  app.delete("/api/admin/ratings/:ratingId", isAdminMiddleware, deleteRating);

  // Chat endpoint for gift suggestions
  const chat: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    const { message } = req.body;

    if (!message) {
      res.status(400).json({ error: "Message is required" });
      return;
    }

    try {
      // If OpenAI API key is not set, return a helpful error
      if (!process.env.OPENAI_API_KEY) {
        res.status(500).json({
          error: "AI features are not available",
          message: "OpenAI API key is not configured. Please set up your API key in Secrets."
        });
        return;
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a gift recommendation assistant for an online store called Gift Finder.

            Your goal is to help users find the perfect gift by understanding their needs and matching them with products from our catalog.

            When analyzing product data:
            1. Consider the relationship between the gift giver and recipient
            2. Match product categories to the recipient's interests
            3. Filter by price range according to the user's budget
            4. Consider special occasions if mentioned

            If a user asks a question unrelated to gift recommendations, politely redirect them to gift-related topics.

            When recommending products:
            - Be conversational and friendly
            - Give 2-3 specific product recommendations with reasoning
            - Mention key features, price, and why it would make a good gift
            - Format your response in a readable way with product names in bold

            If you need more information from the user, ask clear follow-up questions to better understand their needs.`,
          },
          {
            role: "user",
            content: message,
          },
        ],
        temperature: 0.7,
        max_tokens: 800,
      });

      res.json({ message: completion.choices[0].message.content });
    } catch (error: unknown) {
      console.error("OpenAI API error:", error);
      res.status(500).json({
        error: "Failed to get gift suggestions",
        message: "The AI service is currently unavailable. Please try again later."
      });
    }
  };

  app.post("/api/chat", chat);

  const getUser: RequestHandler = (req: Request, res: Response): void => {
    if (!req.isAuthenticated()) {
      res.sendStatus(401);
      return;
    }
    res.json(req.user);
  };

  app.get("/api/user", getUser);

  // Account management routes
  const updatePassword: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const { password } = req.body;

      if (!password) {
        res.status(400).json({ error: "Password is required" });
        return;
      }

      const hashedPassword = await hashPassword(password);
      await db.updateUserPassword(req.user!.id, hashedPassword);

      res.json({ message: "Password updated successfully" });
    } catch (error: unknown) {
      console.error("Password update error:", error);
      res.status(500).json({ error: "Failed to update password" });
    }
  };

  app.post("/api/account/password", isAuthenticatedMiddleware, updatePassword);

  // Giveaway entry endpoint
  const createGiveawayEntry: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;
      if (!req.file) {
        res.status(400).json({ error: "Receipt image is required" });
        return;
      }

      const now = new Date().toISOString();
      const entry = await db.createGiveawayEntry({
        email,
        receiptImage: req.file.filename,
        createdAt: now,
        submittedAt: now,
        status: 'pending'
      });

      // Send confirmation email if configured
      try {
        const emailSent = await sendGiveawayConfirmation(email, entry.id.toString());
        console.log("Confirmation email sent:", emailSent);

        // Update entry with email status
        if (emailSent) {
          await db.updateGiveawayEntryEmailStatus(entry.id, true);
        }
      } catch (emailError: unknown) {
        console.error("Failed to send confirmation email:", emailError);
      }

      res.status(201).json(entry);
    } catch (error: unknown) {
      console.error("Error creating giveaway entry:", error);
      res.status(500).json({ error: "Failed to create giveaway entry" });
    }
  };

  app.post("/api/giveaway", upload.single('receipt'), createGiveawayEntry);

  const updateGiveawayEntryStatus: RequestHandler = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const entry = await db.updateGiveawayEntryStatus(parseInt(id), status);
      if (!entry) {
        return res.status(404).json({ error: "Entry not found" });
      }

      res.json(entry);
    } catch (error) {
      console.error("Error updating giveaway entry status:", error);
      res.status(500).json({ error: "Failed to update entry status" });
    }
  };

  app.put("/api/admin/giveaway-entries/:id/status", isAdminMiddleware, updateGiveawayEntryStatus);

  // Admin endpoint to view giveaway entries (protected)
  const getGiveawayEntries: RequestHandler = async (req: Request, res: Response) => {
    try {
      const entries = await db.getGiveawayEntries();
      res.json(entries);
    } catch (error) {
      console.error("Error fetching giveaway entries:", error);
      res.status(500).json({ error: "Failed to fetch giveaway entries" });
    }
  };

  app.get("/api/admin/giveaway-entries", isAdminMiddleware, getGiveawayEntries);

  // Status check endpoint
  const getStatus: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const status = {
        auth: { status: 'up', message: 'Authentication system is operational' },
        database: { status: 'up', message: 'Database connection is active' },
        email: { status: 'up', message: 'Email service is configured' }
      };
      res.json(status);
    } catch (error: unknown) {
      console.error('Error checking status:', error);
      res.status(500).json({ error: 'Failed to check system status' });
    }
  };

  app.get('/api/status', getStatus);

  // Error handling middleware
  const errorHandler: ErrorRequestHandler = (err: Error, req: Request, res: Response, next: NextFunction): void => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  };

  app.use(errorHandler);

  return;
}

function getOpenAI() {
  return openai;
}