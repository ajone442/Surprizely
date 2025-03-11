import express, { Request, Response, NextFunction } from 'express';
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import session from 'express-session';
import cors from 'cors';
import { storage } from './storage';
import { setupAuth } from './auth';

(async () => {
  // Initialize storage
  await storage.init();

  // Initialize express app
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cors({ origin: true, credentials: true }));

  // Add session middleware with a proper secret
  app.use(session({
    store: storage.sessionStore,
    secret: process.env.SESSION_SECRET || 'development_secret',
    resave: false,
    saveUninitialized: false,
    proxy: process.env.NODE_ENV === 'production',
    cookie: { 
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Set up authentication
  setupAuth(app);

  // Request logging middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, any> | undefined = undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path.startsWith("/api")) {
        let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }

        if (logLine.length > 80) {
          logLine = logLine.slice(0, 79) + "…";
        }

        log(logLine);
      }
    });

    next();
  });

  // Set up routes
  await registerRoutes(app);

  // Serve static files in production
  if (process.env.NODE_ENV === 'production') {
    app.use('/', serveStatic());
  }

  // Setup Vite in development
  if (process.env.NODE_ENV !== 'production') {
    await setupVite(app);
  }

  // Error handling middleware
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
    next(err);
  });

  const PORT = Number(process.env.PORT) || 3000;
  const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

  app.listen(PORT, HOST, () => {
    console.log(`Server is running on http://${HOST}:${PORT}`);
  });
})().catch(console.error);