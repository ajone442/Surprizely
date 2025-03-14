import express from 'express';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';
import session from 'express-session';
import { storage } from './storage.js';
import { User } from '../shared/schema.js';

declare global {
  namespace Express {
    interface User {
      id: number;
      username: string;
      password: string;
      isAdmin: boolean;
    }
  }
}

passport.use(new LocalStrategy({
  usernameField: 'username',
  passwordField: 'password'
}, async (username: string, password: string, done: Function) => {
  try {
    const user = await storage.getUserByUsername(username);
    if (!user) {
      return done(null, false, { message: 'Invalid username or password' });
    }

    const isValid = await storage.verifyUserPassword(user.id, password);
    if (!isValid) {
      return done(null, false, { message: 'Invalid username or password' });
    }

    return done(null, user);
  } catch (error) {
    return done(error);
  }
}));

passport.serializeUser((user: Express.User, done: Function) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done: Function) => {
  try {
    const user = await storage.getUser(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export async function setupAuth(app: express.Express) {
  // Session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || 'dev-secret-key',
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    name: 'surprizely.sid',
    proxy: true,
    cookie: { 
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: true,
      path: '/'
    }
  }));

  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Authentication middleware
  app.post('/api/login', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    passport.authenticate('local', (err: Error, user: Express.User | false, info: { message: string }) => {
      if (err) {
        console.error('Login error:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      if (!user) {
        return res.status(401).json({ error: info.message || 'Invalid credentials' });
      }
      req.logIn(user, (err: Error) => {
        if (err) {
          console.error('Session error:', err);
          return res.status(500).json({ error: 'Failed to establish session' });
        }
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post('/api/logout', (req: express.Request, res: express.Response) => {
    req.logout(() => {
      res.sendStatus(200);
    });
  });

  app.post("/api/register", async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        res.status(400).json({ error: "Username already exists" });
        return;
      }

      const user = await storage.createUser({
        username: req.body.username,
        password: await hashPassword(req.body.password)
      });

      req.login(user, (err: Error) => {
        if (err) {
          console.error('Login error after registration:', err);
          res.status(500).json({ error: 'Failed to log in after registration' });
          return;
        }
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Failed to register user' });
    }
  });

  app.get("/api/user", isAuthenticated, (req: express.Request, res: express.Response) => {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });
}

// Middleware to check if user is authenticated
export function isAuthenticated(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Not authenticated' });
}

// Middleware to check if user is admin
export function isAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (req.isAuthenticated() && req.user.isAdmin) {
    return next();
  }
  res.status(403).json({ error: 'Not authorized' });
}