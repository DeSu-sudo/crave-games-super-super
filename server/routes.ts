import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import bcrypt from "bcrypt";
import multer from "multer";
import { storage } from "./storage";
import { uploadFile, supabase } from "./supabase";
import { insertUserSchema, insertCommentSchema, insertRatingSchema, insertGameSchema, insertCategorySchema, insertStoreItemSchema } from "@shared/schema";
import { z } from "zod";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const SALT_ROUNDS = 10;

declare module "express-session" {
  interface SessionData {
    userId?: string;
    adminVerified?: boolean;
  }
}

async function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  const user = await storage.getUser(req.session.userId);
  if (!user || !user.isAdmin) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Session middleware
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "cravegames-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      },
    })
  );

  // Get current user
  app.get("/api/me", async (req, res) => {
    if (!req.session.userId) {
      return res.json(null);
    }
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      req.session.destroy(() => {});
      return res.json(null);
    }
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  // Register
  app.post("/api/register", async (req, res) => {
    try {
      const parsed = insertUserSchema.parse(req.body);
      const existing = await storage.getUserByUsername(parsed.username);
      if (existing) {
        return res.status(400).json({ error: "Username already exists" });
      }
      const hashedPassword = await bcrypt.hash(parsed.password, SALT_ROUNDS);
      const user = await storage.createUser({ ...parsed, password: hashedPassword });
      req.session.userId = user.id;
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      res.status(500).json({ error: "Registration failed" });
    }
  });

  // Login
  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      req.session.userId = user.id;
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Logout
  app.post("/api/logout", (req, res) => {
    req.session.destroy(() => {});
    res.json({ success: true });
  });

  // Get all categories
  app.get("/api/categories", async (req, res) => {
    const categories = await storage.getCategories();
    res.json(categories);
  });

  // Get all games
  app.get("/api/games", async (req, res) => {
    const games = await storage.getGames();
    res.json(games);
  });

  // Get home page data
  app.get("/api/home", async (req, res) => {
    const [trendingGames, categories, allGames] = await Promise.all([
      storage.getTrendingGames(),
      storage.getCategories(),
      storage.getGames(),
    ]);

    const gamesByCategory = await Promise.all(
      categories.map(async (category) => {
        const games = allGames
          .filter(g => g.categoryId === category.id)
          .slice(0, 10);
        return { category, games };
      })
    );

    res.json({
      trendingGames,
      gamesByCategory: gamesByCategory.filter(c => c.games.length > 0),
    });
  });

  // Get games by category
  app.get("/api/category/:name", async (req, res) => {
    const category = await storage.getCategoryByName(req.params.name);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }
    const games = await storage.getGamesByCategory(category.id);
    res.json(games);
  });

  // Get game details
  app.get("/api/game/:id", async (req, res) => {
    const game = await storage.getGameById(req.params.id);
    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }

    const [comments, allGames] = await Promise.all([
      storage.getCommentsByGame(game.id),
      storage.getGames(),
    ]);

    const relatedGames = allGames
      .filter(g => g.categoryId === game.categoryId && g.id !== game.id)
      .slice(0, 8);

    let isFavorite = false;
    let userRating = null;

    if (req.session.userId) {
      const favorite = await storage.getFavorite(req.session.userId, game.id);
      isFavorite = !!favorite;

      const rating = await storage.getRating(req.session.userId, game.id);
      userRating = rating?.rating || null;
    }

    // Increment play count
    await storage.incrementPlayCount(game.id);

    res.json({
      game,
      comments,
      relatedGames,
      isFavorite,
      userRating,
    });
  });

  // Toggle favorite
  app.post("/api/favorite/:id", requireAuth, async (req, res) => {
    const userId = req.session.userId!;
    const gameId = req.params.id;

    const existing = await storage.getFavorite(userId, gameId);
    if (existing) {
      await storage.removeFavorite(userId, gameId);
      res.json({ isFavorite: false });
    } else {
      await storage.addFavorite({ userId, gameId });
      res.json({ isFavorite: true });
    }
  });

  // Rate game
  app.post("/api/rate/:id", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const gameId = req.params.id;
      const { rating } = req.body;

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: "Rating must be between 1 and 5" });
      }

      await storage.upsertRating({ userId, gameId, rating });

      // Recalculate average
      const ratings = await storage.getRatingsByGame(gameId);
      const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
      await storage.updateGameRating(gameId, avgRating, ratings.length);

      res.json({ success: true, averageRating: avgRating, ratingCount: ratings.length });
    } catch (error) {
      res.status(500).json({ error: "Failed to submit rating" });
    }
  });

  // Add comment
  app.post("/api/comment/:id", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const gameId = req.params.id;
      const { content } = req.body;

      if (!content || content.trim().length === 0) {
        return res.status(400).json({ error: "Comment cannot be empty" });
      }

      const comment = await storage.addComment({ userId, gameId, content: content.trim() });
      const user = await storage.getUser(userId);

      res.json({
        ...comment,
        username: user?.username || "Unknown",
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to add comment" });
    }
  });

  // Get user favorites
  app.get("/api/favorites", requireAuth, async (req, res) => {
    const userId = req.session.userId!;
    const favorites = await storage.getFavoritesByUser(userId);
    const games = await Promise.all(
      favorites.map(fav => storage.getGameById(fav.gameId))
    );
    res.json(games.filter(Boolean));
  });

  // Get store items
  app.get("/api/store", async (req, res) => {
    const items = await storage.getStoreItems();
    
    let ownedItemIds: string[] = [];
    if (req.session.userId) {
      const inventory = await storage.getInventoryByUser(req.session.userId);
      ownedItemIds = inventory.map(inv => inv.itemId);
    }

    res.json({ items, ownedItemIds });
  });

  // Buy store item
  app.post("/api/store/buy/:id", requireAuth, async (req, res) => {
    const userId = req.session.userId!;
    const itemId = req.params.id;

    const [user, item] = await Promise.all([
      storage.getUser(userId),
      storage.getStoreItemById(itemId),
    ]);

    if (!user || !item) {
      return res.status(404).json({ error: "User or item not found" });
    }

    // Check if already owned
    const existing = await storage.getInventoryItem(userId, itemId);
    if (existing) {
      return res.status(400).json({ error: "Already owned" });
    }

    // Check if can afford
    if (user.craveCoins < item.price) {
      return res.status(400).json({ error: "Not enough coins" });
    }

    // Deduct coins and add to inventory
    await storage.updateUserCoins(userId, user.craveCoins - item.price);
    await storage.addToInventory({ userId, itemId });

    res.json({ success: true, newBalance: user.craveCoins - item.price });
  });

  // Get user inventory
  app.get("/api/inventory", requireAuth, async (req, res) => {
    const userId = req.session.userId!;
    const user = await storage.getUser(userId);
    const inventory = await storage.getInventoryByUser(userId);
    
    const items = await Promise.all(
      inventory.map(inv => storage.getStoreItemById(inv.itemId))
    );

    res.json({
      items: items.filter(Boolean),
      activeAvatarId: user?.activeAvatarId || null,
    });
  });

  // Set active avatar
  app.post("/api/inventory/set-avatar/:id", requireAuth, async (req, res) => {
    const userId = req.session.userId!;
    const itemId = req.params.id;

    // Verify user owns this item
    const inventory = await storage.getInventoryItem(userId, itemId);
    if (!inventory) {
      return res.status(400).json({ error: "Item not owned" });
    }

    await storage.updateUserAvatar(userId, itemId);
    res.json({ success: true });
  });

  // Click coin for earnings
  app.post("/api/coins/click", requireAuth, async (req, res) => {
    const userId = req.session.userId!;
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const coinsEarned = Math.floor(Math.random() * 3) + 1; // 1-3 coins per click
    await storage.updateUserCoins(userId, user.craveCoins + coinsEarned);

    res.json({ success: true, coinsEarned, newBalance: user.craveCoins + coinsEarned });
  });

  // ==================== ADMIN ROUTES ====================

  // Verify admin password (separate from user authentication)
  app.post("/api/admin/verify-password", async (req, res) => {
    const { password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    if (!adminPassword) {
      return res.status(500).json({ error: "Admin password not configured" });
    }
    
    if (password === adminPassword) {
      req.session.adminVerified = true;
      res.json({ success: true });
    } else {
      res.status(401).json({ error: "Invalid admin password" });
    }
  });

  // Check admin session status
  app.get("/api/admin/session", async (req, res) => {
    res.json({ verified: !!req.session.adminVerified });
  });

  // Middleware to require admin password verification
  async function requireAdminPassword(req: Request, res: Response, next: NextFunction) {
    if (!req.session.adminVerified) {
      return res.status(401).json({ error: "Admin password verification required" });
    }
    next();
  }

  // Get admin dashboard data
  app.get("/api/admin/dashboard", requireAdminPassword, async (req, res) => {
    const [games, categories, storeItems] = await Promise.all([
      storage.getGames(),
      storage.getCategories(),
      storage.getStoreItems(),
    ]);
    res.json({ games, categories, storeItems });
  });

  // GAMES CRUD
  app.post("/api/admin/games", requireAdminPassword, async (req, res) => {
    try {
      const parsed = insertGameSchema.parse(req.body);
      const game = await storage.createGame(parsed);
      res.json(game);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      res.status(500).json({ error: "Failed to create game" });
    }
  });

  app.put("/api/admin/games/:id", requireAdminPassword, async (req, res) => {
    try {
      const game = await storage.updateGame(req.params.id, req.body);
      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }
      res.json(game);
    } catch (error) {
      res.status(500).json({ error: "Failed to update game" });
    }
  });

  app.delete("/api/admin/games/:id", requireAdminPassword, async (req, res) => {
    await storage.deleteGame(req.params.id);
    res.json({ success: true });
  });

  // CATEGORIES CRUD
  app.post("/api/admin/categories", requireAdminPassword, async (req, res) => {
    try {
      const parsed = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(parsed);
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      res.status(500).json({ error: "Failed to create category" });
    }
  });

  app.put("/api/admin/categories/:id", requireAdminPassword, async (req, res) => {
    try {
      const category = await storage.updateCategory(req.params.id, req.body);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      res.status(500).json({ error: "Failed to update category" });
    }
  });

  app.delete("/api/admin/categories/:id", requireAdminPassword, async (req, res) => {
    await storage.deleteCategory(req.params.id);
    res.json({ success: true });
  });

  // STORE ITEMS CRUD
  app.post("/api/admin/store-items", requireAdminPassword, async (req, res) => {
    try {
      const parsed = insertStoreItemSchema.parse(req.body);
      const item = await storage.createStoreItem(parsed);
      res.json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      res.status(500).json({ error: "Failed to create store item" });
    }
  });

  app.put("/api/admin/store-items/:id", requireAdminPassword, async (req, res) => {
    try {
      const item = await storage.updateStoreItem(req.params.id, req.body);
      if (!item) {
        return res.status(404).json({ error: "Store item not found" });
      }
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to update store item" });
    }
  });

  app.delete("/api/admin/store-items/:id", requireAdminPassword, async (req, res) => {
    await storage.deleteStoreItem(req.params.id);
    res.json({ success: true });
  });

  // ==================== FILE UPLOAD ROUTES ====================

  // Upload avatar image
  app.post("/api/admin/upload/avatar", requireAdminPassword, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const ext = req.file.originalname.split(".").pop() || "png";
      const filename = `avatar-${Date.now()}.${ext}`;
      const url = await uploadFile("avatars", filename, req.file.buffer, req.file.mimetype);

      if (!url) {
        return res.status(500).json({ error: "Upload failed" });
      }

      res.json({ url });
    } catch (error) {
      console.error("Avatar upload error:", error);
      res.status(500).json({ error: "Upload failed" });
    }
  });

  // Upload game thumbnail
  app.post("/api/admin/upload/thumbnail", requireAdminPassword, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const ext = req.file.originalname.split(".").pop() || "png";
      const filename = `thumb-${Date.now()}.${ext}`;
      const url = await uploadFile("thumbnails", filename, req.file.buffer, req.file.mimetype);

      if (!url) {
        return res.status(500).json({ error: "Upload failed" });
      }

      res.json({ url });
    } catch (error) {
      console.error("Thumbnail upload error:", error);
      res.status(500).json({ error: "Upload failed" });
    }
  });

  // Upload HTML game file
  app.post("/api/admin/upload/game", requireAdminPassword, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const htmlContent = req.file.buffer.toString("utf-8");
      res.json({ htmlContent });
    } catch (error) {
      console.error("Game upload error:", error);
      res.status(500).json({ error: "Upload failed" });
    }
  });

  // Serve HTML game content
  app.get("/api/game/:id/play", async (req, res) => {
    const game = await storage.getGameById(req.params.id);
    if (!game) {
      return res.status(404).send("Game not found");
    }

    if (game.type === "uploaded" && game.htmlContent) {
      res.setHeader("Content-Type", "text/html");
      res.send(game.htmlContent);
    } else if (game.iframeUrl) {
      res.redirect(game.iframeUrl);
    } else {
      res.status(404).send("Game content not available");
    }
  });

  return httpServer;
}
