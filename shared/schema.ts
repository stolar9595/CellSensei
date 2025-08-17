import { sql } from "drizzle-orm";
import { pgTable, text, varchar, real, timestamp, integer, jsonb, index, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const speedTests = pgTable("speed_tests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
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
  isAutoTest: boolean("is_auto_test").default(false),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
}, (table) => [
  index("idx_speed_tests_user_id").on(table.userId),
  index("idx_speed_tests_timestamp").on(table.timestamp),
  index("idx_speed_tests_carrier").on(table.carrier),
]);

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
}, (table) => [
  index("idx_network_info_timestamp").on(table.timestamp),
  index("idx_network_info_carrier").on(table.carrier),
]);

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
}, (table) => [
  index("idx_users_email").on(table.email),
]);

// Coverage heatmap data points
export const coveragePoints = pgTable("coverage_points", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  carrier: text("carrier").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  signalStrength: integer("signal_strength").notNull(),
  downloadSpeed: real("download_speed").notNull(),
  uploadSpeed: real("upload_speed").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Network outage reports
export const outageReports = pgTable("outage_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  carrier: text("carrier").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  issueType: text("issue_type").notNull(), // "no_signal", "slow_speed", "intermittent"
  description: text("description"),
  resolved: boolean("resolved").default(false),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Scheduled test configurations
export const scheduledTests = pgTable("scheduled_tests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  enabled: boolean("enabled").default(true),
  frequency: text("frequency").notNull(), // "hourly", "daily", "weekly"
  times: jsonb("times").$type<string[]>(), // specific times for tests
  lastRun: timestamp("last_run"),
  nextRun: timestamp("next_run"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Data usage tracking
export const dataUsage = pgTable("data_usage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  appName: text("app_name").notNull(),
  dataConsumed: real("data_consumed").notNull(), // in MB
  connectionType: text("connection_type").notNull(), // "wifi", "cellular"
  carrier: text("carrier"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
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

export const insertCoveragePointSchema = createInsertSchema(coveragePoints).omit({
  id: true,
  timestamp: true,
});

export const insertOutageReportSchema = createInsertSchema(outageReports).omit({
  id: true,
  timestamp: true,
});

export const insertScheduledTestSchema = createInsertSchema(scheduledTests).omit({
  id: true,
  createdAt: true,
});

export const insertDataUsageSchema = createInsertSchema(dataUsage).omit({
  id: true,
  timestamp: true,
});

export type InsertSpeedTest = z.infer<typeof insertSpeedTestSchema>;
export type SpeedTest = typeof speedTests.$inferSelect;
export type InsertNetworkInfo = z.infer<typeof insertNetworkInfoSchema>;
export type NetworkInfo = typeof networkInfo.$inferSelect;
export type InsertCellTower = z.infer<typeof insertCellTowerSchema>;
export type CellTower = typeof cellTowers.$inferSelect;
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertCoveragePoint = z.infer<typeof insertCoveragePointSchema>;
export type CoveragePoint = typeof coveragePoints.$inferSelect;
export type InsertOutageReport = z.infer<typeof insertOutageReportSchema>;
export type OutageReport = typeof outageReports.$inferSelect;
export type InsertScheduledTest = z.infer<typeof insertScheduledTestSchema>;
export type ScheduledTest = typeof scheduledTests.$inferSelect;
export type InsertDataUsage = z.infer<typeof insertDataUsageSchema>;
export type DataUsage = typeof dataUsage.$inferSelect;
