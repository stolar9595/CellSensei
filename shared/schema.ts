import { sql } from "drizzle-orm";
import { pgTable, text, varchar, real, timestamp, integer, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const speedTests = pgTable("speed_tests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  downloadSpeed: real("download_speed").notNull(),
  uploadSpeed: real("upload_speed").notNull(),
  ping: integer("ping").notNull(),
  jitter: real("jitter"),
  carrier: text("carrier").notNull(),
  networkType: text("network_type").notNull(),
  signalStrength: integer("signal_strength"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  location: text("location"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const networkInfo = pgTable("network_info", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  carrier: text("carrier").notNull(),
  networkType: text("network_type").notNull(),
  signalStrength: integer("signal_strength").notNull(),
  frequency: text("frequency"),
  cellId: text("cell_id"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const cellTowers = pgTable("cell_towers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  towerId: text("tower_id").notNull().unique(),
  carrier: text("carrier").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  address: text("address"),
  networkTypes: jsonb("network_types").$type<string[]>().notNull(),
  frequency: text("frequency"),
  range: real("range"), // in kilometers
});

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSpeedTestSchema = createInsertSchema(speedTests).omit({
  id: true,
  timestamp: true,
});

export const insertNetworkInfoSchema = createInsertSchema(networkInfo).omit({
  id: true,
  timestamp: true,
});

export const insertCellTowerSchema = createInsertSchema(cellTowers).omit({
  id: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export type InsertSpeedTest = z.infer<typeof insertSpeedTestSchema>;
export type SpeedTest = typeof speedTests.$inferSelect;
export type InsertNetworkInfo = z.infer<typeof insertNetworkInfoSchema>;
export type NetworkInfo = typeof networkInfo.$inferSelect;
export type InsertCellTower = z.infer<typeof insertCellTowerSchema>;
export type CellTower = typeof cellTowers.$inferSelect;
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
