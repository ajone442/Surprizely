import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import openai from "./openai";
import { insertProductSchema, insertWishlistSchema, insertRatingSchema, insertGiveawaySchema } from "@shared/schema";
import { ZodError } from "zod";
import { parseProductUrl } from "./product-parser";
import passport from 'passport';
import { hashPassword } from "./auth";
import { sendGiveawayConfirmation, initEmailTransporter } from "./email";
import express from 'express';
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
const storageMulter = multer.diskStorage({
  destination: function (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storageMulter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG and GIF images are allowed.'));
    }
  }
});

function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: "Unauthorized" });
  }
  next();
}

function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

export async function registerRoutes(app: Express, storage: any): Promise<Server> {
  setupAuth(app);

  // Initialize email transporter if environment variables are set
  initEmailTransporter();

  // Serve uploaded files
  app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

  app.get("/api/products", async (_req: Request, res: Response) => {
    const products = await storage.getProducts();
    res.json(products);
  });

  app.post("/api/products", isAdmin, async (req: Request, res: Response) => {
    try {
      let productData;

      if (req.body.productUrl) {
        // Parse product data from URL
        productData = await parseProductUrl(req.body.productUrl);
        if (!productData) {
          return res.status(400).json({ error: "Failed to parse product URL" });
        }
      } else {
        // Manual product data entry
        productData = req.body;
        // Preserve the price format exactly as entered
        console.log("Product data received:", productData);
      }

      const product = insertProductSchema.parse(productData);
      // Log the parsed product
      console.log("Parsed product:", product);
      const created = await storage.createProduct(product);
      res.status(201).json(created);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json(error.errors);
      } else {
        throw error;
      }
    }
  });

  app.patch("/api/products/:id", isAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const product = insertProductSchema.partial().parse(req.body);
      const updated = await storage.updateProduct(id, product);
      res.json(updated);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json(error.errors);
      } else {
        throw error;
      }
    }
  });

  app.delete("/api/products/:id", isAdmin, async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    await storage.deleteProduct(id);
    res.sendStatus(204);
  });

  // Wishlist routes
  app.get("/api/wishlist", isAuthenticated, async (req: Request, res: Response) => {
    const products = await storage.getWishlist(req.user!.id);
    res.json(products);
  });

  app.post("/api/wishlist/:productId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const productId = parseInt(req.params.productId);
      const wishlistItem = { userId: req.user!.id, productId };
      await storage.addToWishlist(wishlistItem);
      res.sendStatus(201);
    } catch (error) {
      throw error;
    }
  });

  app.delete("/api/wishlist/:productId", isAuthenticated, async (req: Request, res: Response) => {
    const productId = parseInt(req.params.productId);
    await storage.removeFromWishlist(req.user!.id, productId);
    res.sendStatus(204);
  });

  // Rating routes
  app.get("/api/ratings/:productId", async (req: Request, res: Response) => {
    const productId = parseInt(req.params.productId);
    const ratings = await storage.getRatings(productId);
    res.json(ratings);
  });

  app.get("/api/ratings/user/:productId", isAuthenticated, async (req: Request, res: Response) => {
    const productId = parseInt(req.params.productId);
    const rating = await storage.getUserRating(req.user!.id, productId);
    res.json(rating || { rating: 0 });
  });

  app.post("/api/ratings/:productId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const productId = parseInt(req.params.productId);
      const ratingData = insertRatingSchema.parse({
        userId: req.user!.id,
        productId,
        rating: req.body.rating
      });

      const updatedProduct = await storage.rateProduct(ratingData);
      res.status(201).json(updatedProduct);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json(error.errors);
      } else {
        throw error;
      }
    }
  });

  // Admin only rating routes
  app.put("/api/admin/ratings/:ratingId", isAdmin, async (req: Request, res: Response) => {
    try {
      const ratingId = parseInt(req.params.ratingId);
      const { rating } = req.body;

      if (typeof rating !== 'number' || rating < 1 || rating > 5) {
        return res.status(400).json({ error: "Rating must be a number between 1 and 5" });
      }

      const updatedProduct = await storage.updateRating(ratingId, rating);
      res.json(updatedProduct);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/admin/ratings/:ratingId", isAdmin, async (req: Request, res: Response) => {
    try {
      const ratingId = parseInt(req.params.ratingId);
      const updatedProduct = await storage.deleteRating(ratingId);
      res.json(updatedProduct);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Chat endpoint for gift suggestions
  app.post("/api/chat", async (req: Request, res: Response) => {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    try {
      // If OpenAI API key is not set, return a helpful error
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({
          error: "AI features are not available",
          message: "OpenAI API key is not configured. Please set up your API key in Secrets."
        });
      }

      const openai = getOpenAI();

      // Enhanced system prompt for more personalized recommendations
      const completion = await openai.chat.completions.create({
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
        model: "gpt-3.5-turbo",
        temperature: 0.7,
        max_tokens: 800,
      });

      res.json({ message: completion.choices[0].message.content });
    } catch (error) {
      console.error("OpenAI API error:", error);

      // Return a more helpful error message to the client
      return res.status(500).json({ 
        error: "Failed to get gift suggestions",
        message: "The AI service is currently unavailable. Please try the quiz again later."
      });
    }
  });

  app.get("/api/user", (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });

  // Account management routes
  app.post("/api/account/password", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { password } = req.body;

      // Validate password requirements
      if (!password || password.length < 7) {
        return res.status(400).json({ error: "Password must be at least 7 characters" });
      }

      if (!/[A-Z]/.test(password)) {
        return res.status(400).json({ error: "Password must contain at least one capital letter" });
      }

      const hashedPassword = await hashPassword(password);
      await storage.updateUser(req.user!.id, { password: hashedPassword });

      res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Password update error:", error);
      res.status(500).json({ error: "Failed to update password" });
    }
  });

  // Giveaway entry endpoint
  app.post("/api/giveaway", async (req: Request, res: Response) => {
    try {
      // Get client IP address for rate limiting
      const ipAddress = req.headers['x-forwarded-for'] || 
                        req.socket.remoteAddress || 
                        'unknown';

      // Rate limiting check - max 5 entries per hour per IP
      const recentEntries = await storage.checkRecentGiveawayEntriesByIP(String(ipAddress), 60);
      if (recentEntries >= 5) {
        return res.status(429).json({ 
          error: "Too many entries. Please try again later." 
        });
      }

      // Get the affiliate link from the referer or query param
      const productLink = req.headers.referer || req.body.productLink || '';

      // Validate and sanitize input
      const giveawayData = insertGiveawaySchema.parse({
        email: req.body.email,
        orderID: req.body.orderID || "Screenshot provided",
        orderScreenshot: req.body.orderScreenshot,
        productLink,
        ipAddress: String(ipAddress)
      });

      console.log("Giveaway entry data:", giveawayData);

      // Save to database
      const entry = await storage.createGiveawayEntry(giveawayData);

      // Send confirmation email if configured
      try {
        const emailSent = await sendGiveawayConfirmation(
          giveawayData.email,
          giveawayData.orderScreenshot || giveawayData.orderID
        );

        // Update entry with email status
        if (emailSent) {
          await storage.updateGiveawayEntryEmailStatus(entry.id, true);
        }
      } catch (emailError) {
        console.error("Failed to send confirmation email:", emailError);
        // Continue without failing the request
      }

      res.status(201).json({ 
        message: "Successfully entered the giveaway!", 
        entryId: entry.id 
      });
    } catch (error) {
      console.error("Giveaway entry error:", error);

      if (error instanceof ZodError) {
        return res.status(400).json({ 
          error: "Invalid input", 
          errors: error.errors 
        });
      }

      // Handle duplicate entries
      if (error.message && error.message.includes("already entered")) {
        return res.status(400).json({ error: error.message });
      }

      res.status(500).json({ error: "Failed to process giveaway entry" });
    }
  });

  // Giveaway entry route with file upload handling
  app.post('/api/giveaway/enter', upload.single('receipt'), async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      if (!req.file) {
        return res.status(400).json({ error: "Receipt image is required" });
      }

      const entry = await storage.createGiveawayEntry({
        email,
        receiptImage: req.file.filename,
      });

      res.json(entry);
    } catch (error) {
      console.error("Error creating giveaway entry:", error);
      res.status(500).json({ error: "Failed to create giveaway entry" });
    }
  });

  app.put("/api/admin/giveaway-entries/:id/status", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const entry = await storage.updateGiveawayEntryStatus(parseInt(id), status);
      if (!entry) {
        return res.status(404).json({ error: "Entry not found" });
      }

      res.json(entry);
    } catch (error) {
      console.error("Error updating giveaway entry status:", error);
      res.status(500).json({ error: "Failed to update entry status" });
    }
  });

  // Admin endpoint to view giveaway entries (protected)
  app.get("/api/admin/giveaway-entries", isAdmin, async (req: Request, res: Response) => {
    try {
      const entries = await storage.getGiveawayEntries();
      res.json(entries);
    } catch (error) {
      console.error("Error fetching giveaway entries:", error);
      res.status(500).json({ error: "Failed to fetch giveaway entries" });
    }
  });

  // Status check endpoint
  app.get('/api/status', async (req: Request, res: Response) => {
    try {
      const status = {
        auth: {
          status: 'up',
          message: 'Authentication system is operational'
        },
        database: {
          status: storage.isConnected() ? 'up' : 'down',
          message: storage.isConnected() ? 'Database is connected' : 'Database connection issues'
        },
        session: {
          status: req.session ? 'up' : 'down',
          message: req.session ? 'Session management is working' : 'Session issues detected'
        },
        email: {
          status: process.env.EMAIL_HOST ? 'up' : 'down',
          message: process.env.EMAIL_HOST ? 'Email system configured' : 'Email system not configured'
        }
      };
      
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: 'Error checking system status' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

function getOpenAI() {
  return openai;
}