import { 
  type User, type InsertUser,
  type Category, type InsertCategory,
  type Game, type InsertGame,
  type Favorite, type InsertFavorite,
  type Rating, type InsertRating,
  type Comment, type InsertComment,
  type StoreItem, type InsertStoreItem,
  type Inventory, type InsertInventory,
  type CommentWithUser
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserCoins(userId: string, coins: number): Promise<void>;
  updateUserAvatar(userId: string, avatarId: string | null): Promise<void>;

  // Categories
  getCategories(): Promise<Category[]>;
  getCategoryByName(name: string): Promise<Category | undefined>;
  getCategoryById(id: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<void>;

  // Games
  getGames(): Promise<Game[]>;
  getGameById(id: string): Promise<Game | undefined>;
  getGamesByCategory(categoryId: string): Promise<Game[]>;
  getTrendingGames(): Promise<Game[]>;
  incrementPlayCount(gameId: string): Promise<void>;
  updateGameRating(gameId: string, avgRating: number, count: number): Promise<void>;
  createGame(game: InsertGame): Promise<Game>;
  updateGame(id: string, game: Partial<InsertGame>): Promise<Game | undefined>;
  deleteGame(id: string): Promise<void>;

  // Favorites
  getFavoritesByUser(userId: string): Promise<Favorite[]>;
  getFavorite(userId: string, gameId: string): Promise<Favorite | undefined>;
  addFavorite(favorite: InsertFavorite): Promise<Favorite>;
  removeFavorite(userId: string, gameId: string): Promise<void>;

  // Ratings
  getRatingsByGame(gameId: string): Promise<Rating[]>;
  getRating(userId: string, gameId: string): Promise<Rating | undefined>;
  upsertRating(rating: InsertRating): Promise<Rating>;

  // Comments
  getCommentsByGame(gameId: string): Promise<CommentWithUser[]>;
  addComment(comment: InsertComment): Promise<Comment>;

  // Store
  getStoreItems(): Promise<StoreItem[]>;
  getStoreItemById(id: string): Promise<StoreItem | undefined>;
  createStoreItem(item: InsertStoreItem): Promise<StoreItem>;
  updateStoreItem(id: string, item: Partial<InsertStoreItem>): Promise<StoreItem | undefined>;
  deleteStoreItem(id: string): Promise<void>;

  // Inventory
  getInventoryByUser(userId: string): Promise<Inventory[]>;
  getInventoryItem(userId: string, itemId: string): Promise<Inventory | undefined>;
  addToInventory(inventory: InsertInventory): Promise<Inventory>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private categories: Map<string, Category>;
  private games: Map<string, Game>;
  private favorites: Map<string, Favorite>;
  private ratings: Map<string, Rating>;
  private comments: Map<string, Comment>;
  private storeItems: Map<string, StoreItem>;
  private inventory: Map<string, Inventory>;

  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.games = new Map();
    this.favorites = new Map();
    this.ratings = new Map();
    this.comments = new Map();
    this.storeItems = new Map();
    this.inventory = new Map();

    this.seedData();
  }

  private seedData() {
    // Seed categories
    const categoryData = [
      { name: "Action", icon: "gamepad-2" },
      { name: "Puzzle", icon: "gamepad-2" },
      { name: "Racing", icon: "gamepad-2" },
      { name: "Sports", icon: "gamepad-2" },
      { name: "Adventure", icon: "gamepad-2" },
    ];

    categoryData.forEach(cat => {
      const id = randomUUID();
      this.categories.set(id, { id, ...cat });
    });

    const categoryIds = Array.from(this.categories.keys());

    // Seed games with placeholder images
    const gameData = [
      { name: "Space Shooter", description: "Blast through waves of enemies in this exciting space shooter!", instructions: "Use arrow keys to move, space to shoot", categoryId: categoryIds[0], isTrending: true, badge: "hot" as const },
      { name: "Block Puzzle", description: "Solve challenging block puzzles to advance through levels", instructions: "Drag and drop blocks to complete the puzzle", categoryId: categoryIds[1], isTrending: true, badge: "new" as const },
      { name: "Street Racer", description: "Race through city streets at high speed", instructions: "Arrow keys to steer, avoid obstacles", categoryId: categoryIds[2], isTrending: true },
      { name: "Basketball Pro", description: "Shoot hoops and become a basketball champion", instructions: "Click and drag to aim, release to shoot", categoryId: categoryIds[3], isTrending: true, badge: "hot" as const },
      { name: "Dungeon Quest", description: "Explore dungeons and defeat monsters", instructions: "WASD to move, click to attack", categoryId: categoryIds[4], isTrending: true },
      { name: "Ninja Jump", description: "Jump and climb through ninja training courses", instructions: "Space to jump, arrows to move", categoryId: categoryIds[0], badge: "new" as const },
      { name: "Match Master", description: "Match 3 or more gems to score points", instructions: "Swap adjacent gems to make matches", categoryId: categoryIds[1] },
      { name: "Drift King", description: "Master the art of drifting on various tracks", instructions: "Hold space to drift, arrows to steer", categoryId: categoryIds[2], badge: "hot" as const },
      { name: "Soccer Stars", description: "Score goals in fast-paced soccer matches", instructions: "Click to kick, aim for the goal", categoryId: categoryIds[3] },
      { name: "Treasure Hunter", description: "Search for hidden treasures across mysterious islands", instructions: "Click to dig, collect treasures", categoryId: categoryIds[4], badge: "new" as const },
      { name: "Zombie Defense", description: "Defend your base against zombie waves", instructions: "Click to place turrets, upgrade for more power", categoryId: categoryIds[0] },
      { name: "Word Search", description: "Find hidden words in the letter grid", instructions: "Click and drag to select words", categoryId: categoryIds[1] },
      { name: "Motorcycle Rush", description: "Race motorcycles through challenging terrain", instructions: "Up to accelerate, balance with left/right", categoryId: categoryIds[2] },
      { name: "Golf Master", description: "Play through 18 holes of challenging golf", instructions: "Click and drag to aim, release to swing", categoryId: categoryIds[3] },
      { name: "Mystery Island", description: "Solve mysteries on a tropical island", instructions: "Click to interact with objects", categoryId: categoryIds[4] },
    ];

    gameData.forEach((game, index) => {
      const id = randomUUID();
      this.games.set(id, {
        id,
        name: game.name,
        description: game.description,
        instructions: game.instructions,
        categoryId: game.categoryId,
        thumbnailUrl: `https://picsum.photos/seed/${game.name.replace(/\s/g, '')}/400/300`,
        iframeUrl: "https://www.example.com/game-placeholder",
        type: "iframe",
        playCount: Math.floor(Math.random() * 10000) + 500,
        averageRating: Math.random() * 2 + 3, // 3-5 rating
        ratingCount: Math.floor(Math.random() * 500) + 50,
        badge: game.badge || null,
        isTrending: game.isTrending || false,
      });
    });

    // Seed store items
    const storeItemData = [
      { name: "Cool Cat", price: 500, itemType: "avatar" },
      { name: "Robot Head", price: 750, itemType: "avatar" },
      { name: "Ninja Mask", price: 1000, itemType: "avatar" },
      { name: "Space Helmet", price: 1500, itemType: "avatar" },
      { name: "Crown", price: 2500, itemType: "avatar" },
      { name: "Dragon Avatar", price: 5000, itemType: "avatar" },
    ];

    storeItemData.forEach(item => {
      const id = randomUUID();
      this.storeItems.set(id, {
        id,
        name: item.name,
        imageUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${item.name.replace(/\s/g, '')}`,
        price: item.price,
        itemType: item.itemType,
      });
    });
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id, craveCoins: 100, activeAvatarId: null, isAdmin: false };
    this.users.set(id, user);
    return user;
  }

  async updateUserCoins(userId: string, coins: number): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.craveCoins = coins;
      this.users.set(userId, user);
    }
  }

  async updateUserAvatar(userId: string, avatarId: string | null): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.activeAvatarId = avatarId;
      this.users.set(userId, user);
    }
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async getCategoryByName(name: string): Promise<Category | undefined> {
    return Array.from(this.categories.values()).find(cat => cat.name.toLowerCase() === name.toLowerCase());
  }

  async getCategoryById(id: string): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const id = randomUUID();
    const newCategory: Category = { id, ...category };
    this.categories.set(id, newCategory);
    return newCategory;
  }

  async updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const existing = this.categories.get(id);
    if (!existing) return undefined;
    const updated: Category = { ...existing, ...category };
    this.categories.set(id, updated);
    return updated;
  }

  async deleteCategory(id: string): Promise<void> {
    this.categories.delete(id);
  }

  // Games
  async getGames(): Promise<Game[]> {
    return Array.from(this.games.values());
  }

  async getGameById(id: string): Promise<Game | undefined> {
    return this.games.get(id);
  }

  async getGamesByCategory(categoryId: string): Promise<Game[]> {
    return Array.from(this.games.values()).filter(game => game.categoryId === categoryId);
  }

  async getTrendingGames(): Promise<Game[]> {
    return Array.from(this.games.values()).filter(game => game.isTrending);
  }

  async incrementPlayCount(gameId: string): Promise<void> {
    const game = this.games.get(gameId);
    if (game) {
      game.playCount += 1;
      this.games.set(gameId, game);
    }
  }

  async updateGameRating(gameId: string, avgRating: number, count: number): Promise<void> {
    const game = this.games.get(gameId);
    if (game) {
      game.averageRating = avgRating;
      game.ratingCount = count;
      this.games.set(gameId, game);
    }
  }

  async createGame(game: InsertGame): Promise<Game> {
    const id = randomUUID();
    const newGame: Game = {
      id,
      name: game.name,
      description: game.description || null,
      instructions: game.instructions || null,
      categoryId: game.categoryId,
      thumbnailUrl: game.thumbnailUrl,
      iframeUrl: game.iframeUrl || null,
      type: game.type || "iframe",
      playCount: 0,
      averageRating: 0,
      ratingCount: 0,
      badge: game.badge || null,
      isTrending: game.isTrending || false,
    };
    this.games.set(id, newGame);
    return newGame;
  }

  async updateGame(id: string, game: Partial<InsertGame>): Promise<Game | undefined> {
    const existing = this.games.get(id);
    if (!existing) return undefined;
    const updated: Game = { ...existing, ...game };
    this.games.set(id, updated);
    return updated;
  }

  async deleteGame(id: string): Promise<void> {
    this.games.delete(id);
  }

  // Favorites
  async getFavoritesByUser(userId: string): Promise<Favorite[]> {
    return Array.from(this.favorites.values()).filter(fav => fav.userId === userId);
  }

  async getFavorite(userId: string, gameId: string): Promise<Favorite | undefined> {
    return Array.from(this.favorites.values()).find(fav => fav.userId === userId && fav.gameId === gameId);
  }

  async addFavorite(favorite: InsertFavorite): Promise<Favorite> {
    const id = randomUUID();
    const newFavorite: Favorite = { ...favorite, id };
    this.favorites.set(id, newFavorite);
    return newFavorite;
  }

  async removeFavorite(userId: string, gameId: string): Promise<void> {
    const favorite = await this.getFavorite(userId, gameId);
    if (favorite) {
      this.favorites.delete(favorite.id);
    }
  }

  // Ratings
  async getRatingsByGame(gameId: string): Promise<Rating[]> {
    return Array.from(this.ratings.values()).filter(rating => rating.gameId === gameId);
  }

  async getRating(userId: string, gameId: string): Promise<Rating | undefined> {
    return Array.from(this.ratings.values()).find(rating => rating.userId === userId && rating.gameId === gameId);
  }

  async upsertRating(rating: InsertRating): Promise<Rating> {
    const existing = await this.getRating(rating.userId, rating.gameId);
    if (existing) {
      existing.rating = rating.rating;
      this.ratings.set(existing.id, existing);
      return existing;
    }
    const id = randomUUID();
    const newRating: Rating = { ...rating, id };
    this.ratings.set(id, newRating);
    return newRating;
  }

  // Comments
  async getCommentsByGame(gameId: string): Promise<CommentWithUser[]> {
    const comments = Array.from(this.comments.values())
      .filter(comment => comment.gameId === gameId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return Promise.all(comments.map(async comment => {
      const user = await this.getUser(comment.userId);
      return {
        ...comment,
        username: user?.username || "Unknown"
      };
    }));
  }

  async addComment(comment: InsertComment): Promise<Comment> {
    const id = randomUUID();
    const newComment: Comment = { ...comment, id, createdAt: new Date() };
    this.comments.set(id, newComment);
    return newComment;
  }

  // Store
  async getStoreItems(): Promise<StoreItem[]> {
    return Array.from(this.storeItems.values());
  }

  async getStoreItemById(id: string): Promise<StoreItem | undefined> {
    return this.storeItems.get(id);
  }

  async createStoreItem(item: InsertStoreItem): Promise<StoreItem> {
    const id = randomUUID();
    const newItem: StoreItem = { id, ...item };
    this.storeItems.set(id, newItem);
    return newItem;
  }

  async updateStoreItem(id: string, item: Partial<InsertStoreItem>): Promise<StoreItem | undefined> {
    const existing = this.storeItems.get(id);
    if (!existing) return undefined;
    const updated: StoreItem = { ...existing, ...item };
    this.storeItems.set(id, updated);
    return updated;
  }

  async deleteStoreItem(id: string): Promise<void> {
    this.storeItems.delete(id);
  }

  // Inventory
  async getInventoryByUser(userId: string): Promise<Inventory[]> {
    return Array.from(this.inventory.values()).filter(inv => inv.userId === userId);
  }

  async getInventoryItem(userId: string, itemId: string): Promise<Inventory | undefined> {
    return Array.from(this.inventory.values()).find(inv => inv.userId === userId && inv.itemId === itemId);
  }

  async addToInventory(inventory: InsertInventory): Promise<Inventory> {
    const id = randomUUID();
    const newInventory: Inventory = { ...inventory, id };
    this.inventory.set(id, newInventory);
    return newInventory;
  }
}

export const storage = new MemStorage();
