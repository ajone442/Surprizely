import type { Express } from "express";
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


function isAdmin(req: Express.Request, res: Express.Response, next: Express.NextFunction) {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

function isAuthenticated(req: Express.Request, res: Express.Response, next: Express.NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);
  
  // Initialize email transporter if environment variables are set
  initEmailTransporter();

  app.get("/api/products", async (_req, res) => {
    const products = await storage.getProducts();
    res.json(products);
  });

  app.post("/api/products", isAdmin, async (req, res) => {
    try {
      let productData;

      if (req.body.productUrl) {
        // Parse product data from URL
        productData = await parseProductUrl(req.body.productUrl);
        if (!productData) {
          return res.status(400).json({ message: "Failed to parse product URL" });
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

  app.patch("/api/products/:id", isAdmin, async (req, res) => {
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

  app.delete("/api/products/:id", isAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    await storage.deleteProduct(id);
    res.sendStatus(204);
  });

  // Wishlist routes
  app.get("/api/wishlist", isAuthenticated, async (req, res) => {
    const products = await storage.getWishlist(req.user!.id);
    res.json(products);
  });

  app.post("/api/wishlist/:productId", isAuthenticated, async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const wishlistItem = { userId: req.user!.id, productId };
      await storage.addToWishlist(wishlistItem);
      res.sendStatus(201);
    } catch (error) {
      throw error;
    }
  });

  app.delete("/api/wishlist/:productId", isAuthenticated, async (req, res) => {
    const productId = parseInt(req.params.productId);
    await storage.removeFromWishlist(req.user!.id, productId);
    res.sendStatus(204);
  });
  
  // Rating routes
  app.get("/api/ratings/:productId", async (req, res) => {
    const productId = parseInt(req.params.productId);
    const ratings = await storage.getRatings(productId);
    res.json(ratings);
  });
  
  app.get("/api/ratings/user/:productId", isAuthenticated, async (req, res) => {
    const productId = parseInt(req.params.productId);
    const rating = await storage.getUserRating(req.user!.id, productId);
    res.json(rating || { rating: 0 });
  });
  
  app.post("/api/ratings/:productId", isAuthenticated, async (req, res) => {
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
  app.put("/api/admin/ratings/:ratingId", isAdmin, async (req, res) => {
    try {
      const ratingId = parseInt(req.params.ratingId);
      const { rating } = req.body;
      
      if (typeof rating !== 'number' || rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Rating must be a number between 1 and 5" });
      }
      
      const updatedProduct = await storage.updateRating(ratingId, rating);
      res.json(updatedProduct);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  
  app.delete("/api/admin/ratings/:ratingId", isAdmin, async (req, res) => {
    try {
      const ratingId = parseInt(req.params.ratingId);
      const updatedProduct = await storage.deleteRating(ratingId);
      res.json(updatedProduct);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

  // Chat endpoint for gift suggestions
  app.post("/api/chat", async (req, res) => {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    try {
      // If OpenAI API key is not set, return a helpful error
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({
          message: "AI features are not available",
          error: "OpenAI API key is not configured. Please set up your API key in Secrets."
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
        message: "Failed to get gift suggestions",
        error: "The AI service is currently unavailable. Please try the quiz again later."
      });
    }
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });

  // Account management routes
  app.post("/api/account/password", isAuthenticated, async (req, res) => {
    try {
      const { password } = req.body;

      // Validate password requirements
      if (!password || password.length < 7) {
        return res.status(400).json({ message: "Password must be at least 7 characters" });
      }
      
      if (!/[A-Z]/.test(password)) {
        return res.status(400).json({ message: "Password must contain at least one capital letter" });
      }

      const hashedPassword = await hashPassword(password);
      await storage.updateUser(req.user!.id, { password: hashedPassword });

      res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Password update error:", error);
      res.status(500).json({ message: "Failed to update password" });
    }
  });

  // Giveaway entry endpoint
  app.post("/api/giveaway", async (req, res) => {
    try {
      // Get client IP address for rate limiting
      const ipAddress = req.headers['x-forwarded-for'] || 
                        req.socket.remoteAddress || 
                        'unknown';
      
      // Rate limiting check - max 5 entries per hour per IP
      const recentEntries = await storage.checkRecentGiveawayEntriesByIP(String(ipAddress), 60);
      if (recentEntries >= 5) {
        return res.status(429).json({ 
          message: "Too many entries. Please try again later." 
        });
      }

      // Get the affiliate link from the referer or query param
      const productLink = req.headers.referer || req.body.productLink || '';
      
      // Validate and sanitize input
      const giveawayData = insertGiveawaySchema.parse({
        email: req.body.email,
        orderID: req.body.orderID,
        productLink,
        ipAddress: String(ipAddress)
      });
      
      // Save to database
      const entry = await storage.createGiveawayEntry(giveawayData);
      
      // Send confirmation email
      const emailSent = await sendGiveawayConfirmation(
        giveawayData.email,
        giveawayData.orderID
      );
      
      // Update entry with email status
      if (emailSent) {
        await storage.updateGiveawayEntryEmailStatus(entry.id, true);
      }
      
      res.status(201).json({ 
        message: "Successfully entered the giveaway!", 
        entryId: entry.id 
      });
    } catch (error) {
      console.error("Giveaway entry error:", error);
      
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Invalid input", 
          errors: error.errors 
        });
      }
      
      // Handle duplicate entries
      if (error.message && error.message.includes("already entered")) {
        return res.status(400).json({ message: error.message });
      }
      
      res.status(500).json({ message: "Failed to process giveaway entry" });
    }
  });

  // Admin endpoint to view giveaway entries (protected)
  app.get("/api/admin/giveaway-entries", isAdmin, async (req, res) => {
    try {
      const entries = await storage.getGiveawayEntries();
      res.json(entries);
    } catch (error) {
      console.error("Error fetching giveaway entries:", error);
      res.status(500).json({ message: "Failed to fetch giveaway entries" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

function getOpenAI() {
  return openai;
}
import { Express } from "express";
import { storage } from "./storage";
import { z } from "zod";
import { hashPassword } from "./auth";

export function setupAccountRoutes(app: Express) {
  // Change email endpoint
  app.post("/api/account/email", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const schema = z.object({
      email: z.string().email("Invalid email address"),
    });

    try {
      const { email } = schema.parse(req.body);
      
      // Check if email is already in use
      const existingUser = await storage.getUserByUsername(email);
      if (existingUser && existingUser.id !== req.user?.id) {
        return res.status(400).json({ message: "Email already in use" });
      }
      
      // Update user email
      const updatedUser = await storage.updateUserEmail(req.user?.id, email);
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update email" });
      }
      
      return res.status(200).json({ message: "Email updated successfully" });
    } catch (error) {
      console.error("Error updating email:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      return res.status(500).json({ message: "An error occurred" });
    }
  });

  // Change password endpoint
  app.post("/api/account/password", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const schema = z.object({
      currentPassword: z.string(),
      newPassword: z.string()
        .min(7, "Password must be at least 7 characters")
        .regex(/[A-Z]/, "Password must contain at least one capital letter"),
    });

    try {
      const { currentPassword, newPassword } = schema.parse(req.body);
      
      // Verify current password (this would need to be implemented in auth.ts)
      const passwordValid = await storage.verifyUserPassword(req.user?.id, currentPassword);
      
      if (!passwordValid) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      
      // Hash and update new password
      const hashedPassword = await hashPassword(newPassword);
      const updatedUser = await storage.updateUserPassword(req.user?.id, hashedPassword);
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update password" });
      }
      
      return res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Error updating password:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      return res.status(500).json({ message: "An error occurred" });
    }
  });
}
