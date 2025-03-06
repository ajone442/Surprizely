import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import openai from "./openai";
import { insertProductSchema, insertWishlistSchema } from "@shared/schema";
import { ZodError } from "zod";
import { parseProductUrl } from "./product-parser";
import passport from 'passport';
import { hashPassword } from './auth';


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
      }

      const product = insertProductSchema.parse(productData);
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

  // Chat endpoint for gift suggestions
  app.post("/api/chat", async (req, res) => {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    try {
      const openai = getOpenAI();

      const completion = await openai.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are a gift recommendation assistant for an online store. 
            When given product data and user preferences, analyze both to match the ideal products.
            Consider all user preferences including relationship, interests, and budget.
            If products contain specific details about materials, features, or style, use these to make better matches.
            Always return your response as a JSON object with a "recommendations" array containing matching products.
            Each recommendation should include the original product data plus an "explanation" field explaining why this product matches.`,
          },
          {
            role: "user",
            content: message,
          },
        ],
        model: "gpt-3.5-turbo",
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

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Set isAdmin true only for specific email/username
      const isAdmin = req.body.username === process.env.ADMIN_USERNAME;

      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
        isAdmin,
      });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Failed to register. Please try again." });
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      req.login(user, (err) => {
        if (err) {
          return next(err);
        }
        return res.status(200).json(user);
      });
    })(req, res, next);
  });

  const httpServer = createServer(app);
  return httpServer;
}

function getOpenAI() {
  return openai;
}