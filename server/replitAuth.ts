import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import { z } from "zod";

// Validation schemas
const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required")
});

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  
  try {
    const pgStore = connectPg(session);
    const sessionStore = new pgStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
      ttl: sessionTtl,
      tableName: "sessions",
    });
    
    // Add error handling for the session store
    sessionStore.on('error', (error) => {
      console.error('Session store error:', error);
    });
    
    return session({
      secret: process.env.SESSION_SECRET!,
      store: sessionStore,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Enable secure cookies in production
        maxAge: sessionTtl,
        sameSite: 'lax', // Required for OAuth flows
      },
    });
  } catch (error) {
    console.error('Failed to initialize session store, using memory store:', error);
    // Fallback to memory store if database is unavailable
    return session({
      secret: process.env.SESSION_SECRET!,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: sessionTtl,
        sameSite: 'lax',
      },
    });
  }
}

// Hash password helper
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Verify password helper
async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure local strategy for email/password authentication
  passport.use(new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password'
    },
    async (email, password, done) => {
      try {
        const user = await storage.getUserByEmail(email);
        if (!user) {
          return done(null, false, { message: 'User not found' });
        }

        const isValidPassword = await verifyPassword(password, user.password!);
        if (!isValidPassword) {
          return done(null, false, { message: 'Invalid password' });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  ));

  // Configure Google OAuth strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    // For development, use the exact Replit domain from environment
    // For production, use calonik.ai
    let domain;
    let isProduction = false;
    
    // Check if we're on calonik.ai custom domain
    if (process.env.REPLIT_DOMAINS && process.env.REPLIT_DOMAINS.includes('calonik.ai')) {
      domain = 'calonik.ai';
      isProduction = true;
    } else if (process.env.CUSTOM_DOMAIN === 'calonik.ai') {
      domain = 'calonik.ai';
      isProduction = true;
    } else {
      // Use the first Replit domain for development
      domain = process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000';
    }
    
    const callbackURL = domain.includes('localhost') 
      ? `http://${domain}/api/auth/google/callback`
      : `https://${domain}/api/auth/google/callback`;
    
    console.log(`Google OAuth configured with callback URL: ${callbackURL}`);
    console.log(`Using domain: ${domain} (auto-detected for production: ${isProduction})`);
    console.log(`Client ID configured: ${process.env.GOOGLE_CLIENT_ID ? 'Yes' : 'No'}`);
    
    passport.use(new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: callbackURL
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Extract user information from Google profile
          const email = profile.emails?.[0]?.value;
          const firstName = profile.name?.givenName;
          const lastName = profile.name?.familyName;
          const profileImageUrl = profile.photos?.[0]?.value;
          
          if (!email) {
            return done(new Error('No email provided by Google'), null);
          }

          // Check if user already exists
          let user = await storage.getUserByEmail(email);
          
          if (user) {
            // Update existing user with Google info if needed
            user = await storage.upsertUser({
              id: user.id,
              email: email,
              firstName: firstName || user.firstName,
              lastName: lastName || user.lastName,
              profileImageUrl: profileImageUrl || user.profileImageUrl,
              googleId: profile.id,
            });
          } else {
            // Create new user
            user = await storage.upsertUser({
              id: `google_${profile.id}`,
              email: email,
              firstName: firstName || null,
              lastName: lastName || null,
              profileImageUrl: profileImageUrl || null,
              googleId: profile.id,
            });
          }

          return done(null, user);
        } catch (error) {
          console.error('Google OAuth error:', error);
          return done(error, null);
        }
      }
    ));
  }

  passport.serializeUser((user: any, cb) => {
    try {
      cb(null, user.id);
    } catch (error) {
      console.error("Failed to serialize user:", error);
      cb(error, null);
    }
  });
  
  passport.deserializeUser(async (id: string, cb) => {
    try {
      // Add timeout protection for database calls
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('User lookup timeout')), 5000);
      });
      
      const userPromise = storage.getUser(id);
      const user = await Promise.race([userPromise, timeoutPromise]) as any;
      
      if (!user) {
        // If user doesn't exist in storage, clear the session gracefully
        console.log(`User ${id} not found during session deserialization`);
        cb(null, false);
        return;
      }
      cb(null, user);
    } catch (error) {
      console.error("Failed to deserialize user:", error);
      // Don't throw error, just clear session to prevent app crash
      cb(null, false);
    }
  });

  // Registration endpoint
  app.post("/api/register", async (req, res) => {
    try {
      const validation = registerSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: validation.error.issues 
        });
      }

      const { email, password } = validation.data;

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password and create user
      const hashedPassword = await hashPassword(password);
      const newUser = await storage.createUser({
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email,
        password: hashedPassword,
        firstName: null,
        lastName: null,
        profileImageUrl: null,
      });

      // Log the user in
      req.login(newUser, (err) => {
        if (err) {
          return res.status(500).json({ message: "Registration successful but login failed" });
        }
        res.json({ message: "Registration successful", user: { id: newUser.id, email: newUser.email } });
      });

    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Login endpoint
  app.post("/api/login", (req, res, next) => {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        message: "Validation failed", 
        errors: validation.error.issues 
      });
    }

    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Authentication error" });
      }
      if (!user) {
        return res.status(401).json({ message: info.message || "Invalid credentials" });
      }

      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login failed" });
        }
        res.json({ message: "Login successful", user: { id: user.id, email: user.email } });
      });
    })(req, res, next);
  });

  // Google OAuth routes
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    app.get("/api/auth/google", (req, res, next) => {
      console.log("Starting Google OAuth flow");
      passport.authenticate("google", { 
        scope: ["profile", "email"],
        prompt: "select_account"
      })(req, res, next);
    });

    app.get("/api/auth/google/callback",
      passport.authenticate("google", { 
        failureRedirect: "/oauth-callback?error=auth_failed",
        failureMessage: true 
      }),
      (req, res) => {
        console.log("Google OAuth callback successful for user:", req.user);
        // For popup flow, redirect to a simple success page that closes the popup
        res.redirect("/oauth-callback?success=true");
      }
    );
  } else {
    console.log("Google OAuth not configured - missing credentials");
    
    // Fallback route for when Google OAuth is not configured
    app.get("/api/auth/google", (req, res) => {
      res.status(500).json({ 
        error: "Google OAuth not configured",
        message: "Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables"
      });
    });
  }

  // Logout endpoint
  app.get("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      
      // Destroy session
      req.session.destroy((destroyErr) => {
        if (destroyErr) {
          console.error("Session destroy error:", destroyErr);
        }
        res.clearCookie('connect.sid');
        res.json({ message: "Logout successful" });
      });
    });
  });
}

export const isAuthenticated: RequestHandler = async (req: any, res, next) => {
  try {
    // Check for admin session first
    if (req.session && req.session.userId === "admin_testing_user" && req.session.isAdmin) {
      // Get admin user from storage and set on request
      try {
        const adminUser = await storage.getUser("admin_testing_user");
        if (adminUser) {
          req.user = adminUser;
          return next();
        }
      } catch (error) {
        console.error("Error fetching admin user:", error);
      }
    }
    
    // Fall back to standard Passport.js authentication
    if (req.isAuthenticated && req.isAuthenticated()) {
      return next();
    }
    
    res.status(401).json({ message: "Unauthorized" });
  } catch (error) {
    console.error("Authentication middleware error:", error);
    res.status(401).json({ message: "Authentication error" });
  }
};