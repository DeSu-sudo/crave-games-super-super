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
import { supabase } from "./supabase";

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

export class SupabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    return data ? this.mapUser(data) : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();
    return data ? this.mapUser(data) : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    const isFirstUser = count === 0;
    
    const { data, error } = await supabase
      .from('users')
      .insert({
        username: insertUser.username,
        password: insertUser.password,
        crave_coins: 100,
        active_avatar_id: null,
        is_admin: isFirstUser
      })
      .select()
      .single();
    
    if (error) throw error;
    return this.mapUser(data);
  }

  async updateUserCoins(userId: string, coins: number): Promise<void> {
    await supabase
      .from('users')
      .update({ crave_coins: coins })
      .eq('id', userId);
  }

  async updateUserAvatar(userId: string, avatarId: string | null): Promise<void> {
    await supabase
      .from('users')
      .update({ active_avatar_id: avatarId })
      .eq('id', userId);
  }

  private mapUser(data: any): User {
    return {
      id: data.id,
      username: data.username,
      password: data.password,
      craveCoins: data.crave_coins,
      activeAvatarId: data.active_avatar_id,
      isAdmin: data.is_admin
    };
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    const { data } = await supabase
      .from('categories')
      .select('*');
    return (data || []).map(this.mapCategory);
  }

  async getCategoryByName(name: string): Promise<Category | undefined> {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .ilike('name', name)
      .single();
    return data ? this.mapCategory(data) : undefined;
  }

  async getCategoryById(id: string): Promise<Category | undefined> {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();
    return data ? this.mapCategory(data) : undefined;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .insert({
        name: category.name,
        icon: category.icon || 'gamepad-2'
      })
      .select()
      .single();
    
    if (error) throw error;
    return this.mapCategory(data);
  }

  async updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const { data } = await supabase
      .from('categories')
      .update(category)
      .eq('id', id)
      .select()
      .single();
    return data ? this.mapCategory(data) : undefined;
  }

  async deleteCategory(id: string): Promise<void> {
    await supabase.from('categories').delete().eq('id', id);
  }

  private mapCategory(data: any): Category {
    return {
      id: data.id,
      name: data.name,
      icon: data.icon
    };
  }

  // Games
  async getGames(): Promise<Game[]> {
    const { data } = await supabase
      .from('games')
      .select('*');
    return (data || []).map(this.mapGame);
  }

  async getGameById(id: string): Promise<Game | undefined> {
    const { data } = await supabase
      .from('games')
      .select('*')
      .eq('id', id)
      .single();
    return data ? this.mapGame(data) : undefined;
  }

  async getGamesByCategory(categoryId: string): Promise<Game[]> {
    const { data } = await supabase
      .from('games')
      .select('*')
      .eq('category_id', categoryId);
    return (data || []).map(this.mapGame);
  }

  async getTrendingGames(): Promise<Game[]> {
    const { data } = await supabase
      .from('games')
      .select('*')
      .eq('is_trending', true);
    return (data || []).map(this.mapGame);
  }

  async incrementPlayCount(gameId: string): Promise<void> {
    const game = await this.getGameById(gameId);
    if (game) {
      await supabase
        .from('games')
        .update({ play_count: game.playCount + 1 })
        .eq('id', gameId);
    }
  }

  async updateGameRating(gameId: string, avgRating: number, count: number): Promise<void> {
    await supabase
      .from('games')
      .update({ average_rating: avgRating, rating_count: count })
      .eq('id', gameId);
  }

  async createGame(game: InsertGame): Promise<Game> {
    const { data, error } = await supabase
      .from('games')
      .insert({
        name: game.name,
        description: game.description || null,
        instructions: game.instructions || null,
        category_id: game.categoryId,
        thumbnail_url: game.thumbnailUrl,
        iframe_url: game.iframeUrl || null,
        html_content: game.htmlContent || null,
        type: game.type || 'iframe',
        play_count: 0,
        average_rating: 0,
        rating_count: 0,
        badge: game.badge || null,
        is_trending: game.isTrending || false
      })
      .select()
      .single();
    
    if (error) throw error;
    return this.mapGame(data);
  }

  async updateGame(id: string, game: Partial<InsertGame>): Promise<Game | undefined> {
    const updateData: any = {};
    if (game.name !== undefined) updateData.name = game.name;
    if (game.description !== undefined) updateData.description = game.description;
    if (game.instructions !== undefined) updateData.instructions = game.instructions;
    if (game.categoryId !== undefined) updateData.category_id = game.categoryId;
    if (game.thumbnailUrl !== undefined) updateData.thumbnail_url = game.thumbnailUrl;
    if (game.iframeUrl !== undefined) updateData.iframe_url = game.iframeUrl;
    if (game.htmlContent !== undefined) updateData.html_content = game.htmlContent;
    if (game.type !== undefined) updateData.type = game.type;
    if (game.badge !== undefined) updateData.badge = game.badge;
    if (game.isTrending !== undefined) updateData.is_trending = game.isTrending;

    const { data } = await supabase
      .from('games')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    return data ? this.mapGame(data) : undefined;
  }

  async deleteGame(id: string): Promise<void> {
    await supabase.from('games').delete().eq('id', id);
  }

  private mapGame(data: any): Game {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      instructions: data.instructions,
      categoryId: data.category_id,
      thumbnailUrl: data.thumbnail_url,
      iframeUrl: data.iframe_url,
      htmlContent: data.html_content,
      type: data.type,
      playCount: data.play_count,
      averageRating: data.average_rating,
      ratingCount: data.rating_count,
      badge: data.badge,
      isTrending: data.is_trending
    };
  }

  // Favorites
  async getFavoritesByUser(userId: string): Promise<Favorite[]> {
    const { data } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', userId);
    return (data || []).map(this.mapFavorite);
  }

  async getFavorite(userId: string, gameId: string): Promise<Favorite | undefined> {
    const { data } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', userId)
      .eq('game_id', gameId)
      .single();
    return data ? this.mapFavorite(data) : undefined;
  }

  async addFavorite(favorite: InsertFavorite): Promise<Favorite> {
    const { data, error } = await supabase
      .from('favorites')
      .insert({
        user_id: favorite.userId,
        game_id: favorite.gameId
      })
      .select()
      .single();
    
    if (error) throw error;
    return this.mapFavorite(data);
  }

  async removeFavorite(userId: string, gameId: string): Promise<void> {
    await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('game_id', gameId);
  }

  private mapFavorite(data: any): Favorite {
    return {
      id: data.id,
      userId: data.user_id,
      gameId: data.game_id
    };
  }

  // Ratings
  async getRatingsByGame(gameId: string): Promise<Rating[]> {
    const { data } = await supabase
      .from('ratings')
      .select('*')
      .eq('game_id', gameId);
    return (data || []).map(this.mapRating);
  }

  async getRating(userId: string, gameId: string): Promise<Rating | undefined> {
    const { data } = await supabase
      .from('ratings')
      .select('*')
      .eq('user_id', userId)
      .eq('game_id', gameId)
      .single();
    return data ? this.mapRating(data) : undefined;
  }

  async upsertRating(rating: InsertRating): Promise<Rating> {
    const existing = await this.getRating(rating.userId, rating.gameId);
    
    if (existing) {
      const { data, error } = await supabase
        .from('ratings')
        .update({ rating: rating.rating })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      return this.mapRating(data);
    }

    const { data, error } = await supabase
      .from('ratings')
      .insert({
        user_id: rating.userId,
        game_id: rating.gameId,
        rating: rating.rating
      })
      .select()
      .single();
    
    if (error) throw error;
    return this.mapRating(data);
  }

  private mapRating(data: any): Rating {
    return {
      id: data.id,
      userId: data.user_id,
      gameId: data.game_id,
      rating: data.rating
    };
  }

  // Comments
  async getCommentsByGame(gameId: string): Promise<CommentWithUser[]> {
    const { data } = await supabase
      .from('comments')
      .select('*, users(username)')
      .eq('game_id', gameId)
      .order('created_at', { ascending: false });

    return (data || []).map((comment: any) => ({
      id: comment.id,
      userId: comment.user_id,
      gameId: comment.game_id,
      content: comment.content,
      createdAt: new Date(comment.created_at),
      username: comment.users?.username || 'Unknown'
    }));
  }

  async addComment(comment: InsertComment): Promise<Comment> {
    const { data, error } = await supabase
      .from('comments')
      .insert({
        user_id: comment.userId,
        game_id: comment.gameId,
        content: comment.content
      })
      .select()
      .single();
    
    if (error) throw error;
    return {
      id: data.id,
      userId: data.user_id,
      gameId: data.game_id,
      content: data.content,
      createdAt: new Date(data.created_at)
    };
  }

  // Store
  async getStoreItems(): Promise<StoreItem[]> {
    const { data } = await supabase
      .from('store_items')
      .select('*');
    return (data || []).map(this.mapStoreItem);
  }

  async getStoreItemById(id: string): Promise<StoreItem | undefined> {
    const { data } = await supabase
      .from('store_items')
      .select('*')
      .eq('id', id)
      .single();
    return data ? this.mapStoreItem(data) : undefined;
  }

  async createStoreItem(item: InsertStoreItem): Promise<StoreItem> {
    const { data, error } = await supabase
      .from('store_items')
      .insert({
        name: item.name,
        image_url: item.imageUrl,
        price: item.price,
        item_type: item.itemType || 'avatar'
      })
      .select()
      .single();
    
    if (error) throw error;
    return this.mapStoreItem(data);
  }

  async updateStoreItem(id: string, item: Partial<InsertStoreItem>): Promise<StoreItem | undefined> {
    const updateData: any = {};
    if (item.name !== undefined) updateData.name = item.name;
    if (item.imageUrl !== undefined) updateData.image_url = item.imageUrl;
    if (item.price !== undefined) updateData.price = item.price;
    if (item.itemType !== undefined) updateData.item_type = item.itemType;

    const { data } = await supabase
      .from('store_items')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    return data ? this.mapStoreItem(data) : undefined;
  }

  async deleteStoreItem(id: string): Promise<void> {
    await supabase.from('store_items').delete().eq('id', id);
  }

  private mapStoreItem(data: any): StoreItem {
    return {
      id: data.id,
      name: data.name,
      imageUrl: data.image_url,
      price: data.price,
      itemType: data.item_type
    };
  }

  // Inventory
  async getInventoryByUser(userId: string): Promise<Inventory[]> {
    const { data } = await supabase
      .from('inventory')
      .select('*')
      .eq('user_id', userId);
    return (data || []).map(this.mapInventory);
  }

  async getInventoryItem(userId: string, itemId: string): Promise<Inventory | undefined> {
    const { data } = await supabase
      .from('inventory')
      .select('*')
      .eq('user_id', userId)
      .eq('item_id', itemId)
      .single();
    return data ? this.mapInventory(data) : undefined;
  }

  async addToInventory(inventory: InsertInventory): Promise<Inventory> {
    const { data, error } = await supabase
      .from('inventory')
      .insert({
        user_id: inventory.userId,
        item_id: inventory.itemId
      })
      .select()
      .single();
    
    if (error) throw error;
    return this.mapInventory(data);
  }

  private mapInventory(data: any): Inventory {
    return {
      id: data.id,
      userId: data.user_id,
      itemId: data.item_id
    };
  }
}

export const storage = new SupabaseStorage();
