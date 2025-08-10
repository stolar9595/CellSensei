import { sql } from "drizzle-orm";
import { pgTable, text, varchar, real, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
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

export type InsertSpeedTest = z.infer<typeof insertSpeedTestSchema>;
export type SpeedTest = typeof speedTests.$inferSelect;
export type InsertNetworkInfo = z.infer<typeof insertNetworkInfoSchema>;
export type NetworkInfo = typeof networkInfo.$inferSelect;
export type InsertCellTower = z.infer<typeof insertCellTowerSchema>;
export type CellTower = typeof cellTowers.$inferSelect;
