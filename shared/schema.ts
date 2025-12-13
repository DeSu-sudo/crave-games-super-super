import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  craveCoins: integer("crave_coins").notNull().default(0),
  activeAvatarId: varchar("active_avatar_id"),
  isAdmin: boolean("is_admin").notNull().default(false),
});

export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  icon: text("icon").notNull().default("gamepad-2"),
});

export const games = pgTable("games", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  instructions: text("instructions"),
  categoryId: varchar("category_id").notNull(),
  thumbnailUrl: text("thumbnail_url").notNull(),
  iframeUrl: text("iframe_url"),
  type: text("type").notNull().default("iframe"),
  playCount: integer("play_count").notNull().default(0),
  averageRating: real("average_rating").notNull().default(0),
  ratingCount: integer("rating_count").notNull().default(0),
  badge: text("badge"),
  isTrending: boolean("is_trending").notNull().default(false),
});

export const favorites = pgTable("favorites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  gameId: varchar("game_id").notNull(),
});

export const ratings = pgTable("ratings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  gameId: varchar("game_id").notNull(),
  rating: integer("rating").notNull(),
});

export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  gameId: varchar("game_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const storeItems = pgTable("store_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  imageUrl: text("image_url").notNull(),
  price: integer("price").notNull(),
  itemType: text("item_type").notNull().default("avatar"),
});

export const inventory = pgTable("inventory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  itemId: varchar("item_id").notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
  icon: true,
});

export const insertGameSchema = createInsertSchema(games).omit({
  id: true,
  playCount: true,
  averageRating: true,
  ratingCount: true,
});

export const insertFavoriteSchema = createInsertSchema(favorites).pick({
  userId: true,
  gameId: true,
});

export const insertRatingSchema = createInsertSchema(ratings).pick({
  userId: true,
  gameId: true,
  rating: true,
});

export const insertCommentSchema = createInsertSchema(comments).pick({
  userId: true,
  gameId: true,
  content: true,
});

export const insertStoreItemSchema = createInsertSchema(storeItems).omit({
  id: true,
});

export const insertInventorySchema = createInsertSchema(inventory).pick({
  userId: true,
  itemId: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

export type InsertGame = z.infer<typeof insertGameSchema>;
export type Game = typeof games.$inferSelect;

export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type Favorite = typeof favorites.$inferSelect;

export type InsertRating = z.infer<typeof insertRatingSchema>;
export type Rating = typeof ratings.$inferSelect;

export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;

export type InsertStoreItem = z.infer<typeof insertStoreItemSchema>;
export type StoreItem = typeof storeItems.$inferSelect;

export type InsertInventory = z.infer<typeof insertInventorySchema>;
export type Inventory = typeof inventory.$inferSelect;

// Extended types for frontend
export type GameWithCategory = Game & { categoryName: string };
export type CommentWithUser = Comment & { username: string };
