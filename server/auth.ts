import express from 'express';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';
import session from 'express-session';
import { storage } from './storage.js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

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

// Configure nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Store password reset tokens
const resetTokens = new Map<string, { userId: number; expires: Date }>();

passport.use(new LocalStrategy(async (username, password, done) => {
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

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
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
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Authentication middleware
  app.post('/api/login', passport.authenticate('local'), (req, res) => {
    res.json(req.user);
  });

  app.post('/api/logout', (req, res) => {
    req.logout(() => {
      res.sendStatus(200);
    });
  });

  app.post("/api/register", async (req, res, next) => {
    const existingUser = await storage.getUserByUsername(req.body.username);
    if (existingUser) {
      return res.status(400).send("Username already exists");
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
  });

  app.get("/api/user", isAuthenticated, (req, res) => {
    res.json(req.user);
  });

  app.post('/api/forgot-password', async (req, res) => {
    try {
      const token = await generateResetToken(req.body.email);
      res.json({ message: 'Password reset email sent successfully' });
    } catch (error) {
      res.status(400).json({ error: 'Failed to send password reset email' });
    }
  });

  app.post('/api/reset-password', async (req, res) => {
    try {
      await resetPassword(req.body.token, req.body.newPassword);
      res.json({ message: 'Password reset successfully' });
    } catch (error) {
      res.status(400).json({ error: 'Failed to reset password' });
    }
  });
}

export const generateResetToken = async (email: string) => {
  const user = await storage.getUserByEmail(email);
  if (!user) {
    throw new Error('User not found');
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date();
  expires.setHours(expires.getHours() + 1); // Token expires in 1 hour

  resetTokens.set(token, { userId: user.id, expires });

  // Send reset email
  const resetUrl = `${process.env.APP_URL}/reset-password?token=${token}`;
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Password Reset Request',
    html: `
      <p>You requested a password reset. Click the link below to reset your password:</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `
  });

  return token;
};

export const resetPassword = async (token: string, newPassword: string) => {
  const resetInfo = resetTokens.get(token);
  if (!resetInfo) {
    throw new Error('Invalid or expired reset token');
  }

  if (resetInfo.expires < new Date()) {
    resetTokens.delete(token);
    throw new Error('Reset token has expired');
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await storage.updateUserPassword(resetInfo.userId, hashedPassword);
  resetTokens.delete(token);
};

// Middleware to check if user is authenticated
export function isAuthenticated(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Not authenticated' });
}

// Middleware to check if user is admin
export function isAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (req.isAuthenticated() && req.user && (req.user as any).isAdmin) {
    return next();
  }
  res.status(403).json({ error: 'Not authorized' });
}