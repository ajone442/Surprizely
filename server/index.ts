import express from 'express';
import cors from 'cors';
import session from 'express-session';
import { setupAuth } from './auth.js';
import { registerRoutes } from './routes.js';
import { storage } from './storage.js';
import { setupVite, serveStatic } from './vite.js';

const app = express();
const port = Number(process.env.PORT) || 10000;
const isProd = process.env.NODE_ENV === 'production';

async function startServer() {
  try {
    // Initialize storage before setting up routes
    await storage.init();
    console.log('Storage initialized successfully');

    // Basic middleware
    app.use(express.json());
    app.use(cors({
      origin: isProd ? 'https://surprizely.onrender.com' : 'http://localhost:10000',
      credentials: true
    }));

    // Auth setup (includes session)
    app.set('trust proxy', 1); // Trust first proxy for secure cookies
    app.use(session({
      store: storage.sessionStore,
      secret: process.env.SESSION_SECRET || 'development_secret',
      resave: false,
      saveUninitialized: false,
      name: 'surprizely.sid',
      proxy: true,
      cookie: { 
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        httpOnly: true,
        path: '/'
      }
    }));
    await setupAuth(app);

    if (isProd) {
      app.use(serveStatic());
    } else {
      await setupVite(app);
    }

    // Request logging middleware
    app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
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

          console.log(logLine);
        }
      });

      next();
    });

    // Register API routes
    await registerRoutes(app);

    // Error handling middleware
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('Error:', err);
      res.status(500).json({ error: 'Internal server error' });
    });

    // Start listening
    app.listen(port, '0.0.0.0', () => {
      if (!process.env.EMAIL_HOST) {
        console.log('Email configuration missing. Email functionality will be disabled.');
      }
      console.log(`Server is running on http://0.0.0.0:${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();