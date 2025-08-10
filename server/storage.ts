import { 
  users, speedTests, networkInfo, cellTowers, coveragePoints,
  outageReports, scheduledTests, dataUsage,
  type SpeedTest, type InsertSpeedTest, 
  type NetworkInfo, type InsertNetworkInfo, 
  type CellTower, type InsertCellTower, 
  type User, type UpsertUser,
  type CoveragePoint, type InsertCoveragePoint,
  type OutageReport, type InsertOutageReport,
  type ScheduledTest, type InsertScheduledTest,
  type DataUsage, type InsertDataUsage
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Speed Test operations
  createSpeedTest(speedTest: InsertSpeedTest): Promise<SpeedTest>;
  getSpeedTests(limit?: number): Promise<SpeedTest[]>;
  getSpeedTestsByCarrier(carrier: string): Promise<SpeedTest[]>;
  getSpeedTestsByUser(userId: string): Promise<SpeedTest[]>;
  
  // Network Info operations
  createNetworkInfo(networkInfo: InsertNetworkInfo): Promise<NetworkInfo>;
  getLatestNetworkInfo(): Promise<NetworkInfo | undefined>;
  
  // Cell Tower operations
  createCellTower(cellTower: InsertCellTower): Promise<CellTower>;
  getCellTowers(): Promise<CellTower[]>;
  getCellTowersByCarrier(carrier: string): Promise<CellTower[]>;
  getNearbyTowers(latitude: number, longitude: number, radiusKm: number): Promise<CellTower[]>;
  
  // Coverage Point operations
  createCoveragePoint(point: InsertCoveragePoint): Promise<CoveragePoint>;
  getCoveragePoints(carrier?: string): Promise<CoveragePoint[]>;
  getCoverageHeatmap(carrier: string, bounds: { north: number, south: number, east: number, west: number }): Promise<CoveragePoint[]>;
  
  // Outage Report operations
  createOutageReport(report: InsertOutageReport): Promise<OutageReport>;
  getOutageReports(carrier?: string, resolved?: boolean): Promise<OutageReport[]>;
  updateOutageStatus(id: string, resolved: boolean): Promise<void>;
  
  // Scheduled Test operations
  createScheduledTest(test: InsertScheduledTest): Promise<ScheduledTest>;
  getScheduledTests(userId: string): Promise<ScheduledTest[]>;
  updateScheduledTest(id: string, updates: Partial<ScheduledTest>): Promise<void>;
  
  // Data Usage operations
  createDataUsage(usage: InsertDataUsage): Promise<DataUsage>;
  getDataUsage(userId: string, days?: number): Promise<DataUsage[]>;
  getDataUsageByApp(userId: string): Promise<{ appName: string, totalUsage: number }[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async createSpeedTest(insertSpeedTest: InsertSpeedTest): Promise<SpeedTest> {
    const [speedTest] = await db
      .insert(speedTests)
      .values(insertSpeedTest)
      .returning();
    
    // Also create a coverage point from this speed test
    if (speedTest.latitude && speedTest.longitude) {
      await this.createCoveragePoint({
        carrier: speedTest.carrier,
        latitude: speedTest.latitude,
        longitude: speedTest.longitude,
        signalStrength: speedTest.signalStrength ?? -90,
        downloadSpeed: speedTest.downloadSpeed,
        uploadSpeed: speedTest.uploadSpeed,
      });
    }
    
    return speedTest;
  }

  async getSpeedTests(limit = 50): Promise<SpeedTest[]> {
    const tests = await db
      .select()
      .from(speedTests)
      .orderBy(desc(speedTests.timestamp))
      .limit(limit);
    return tests;
  }

  async getSpeedTestsByCarrier(carrier: string): Promise<SpeedTest[]> {
    return await db
      .select()
      .from(speedTests)
      .where(eq(speedTests.carrier, carrier))
      .orderBy(desc(speedTests.timestamp));
  }

  async getSpeedTestsByUser(userId: string): Promise<SpeedTest[]> {
    return await db
      .select()
      .from(speedTests)
      .where(eq(speedTests.userId, userId))
      .orderBy(desc(speedTests.timestamp));
  }

  async createNetworkInfo(insertNetworkInfo: InsertNetworkInfo): Promise<NetworkInfo> {
    const [info] = await db
      .insert(networkInfo)
      .values(insertNetworkInfo)
      .returning();
    return info;
  }

  async getLatestNetworkInfo(): Promise<NetworkInfo | undefined> {
    const [latest] = await db
      .select()
      .from(networkInfo)
      .orderBy(desc(networkInfo.timestamp))
      .limit(1);
    return latest;
  }

  async createCellTower(insertCellTower: InsertCellTower): Promise<CellTower> {
    const [tower] = await db
      .insert(cellTowers)
      .values([{
        ...insertCellTower,
        networkTypes: insertCellTower.networkTypes as any
      }])
      .onConflictDoNothing({ target: cellTowers.towerId })
      .returning();
    
    // If conflict, return existing tower
    if (!tower) {
      const [existing] = await db
        .select()
        .from(cellTowers)
        .where(eq(cellTowers.towerId, insertCellTower.towerId));
      return existing;
    }
    
    return tower;
  }

  async getCellTowers(): Promise<CellTower[]> {
    return await db.select().from(cellTowers);
  }

  async getCellTowersByCarrier(carrier: string): Promise<CellTower[]> {
    return await db
      .select()
      .from(cellTowers)
      .where(eq(cellTowers.carrier, carrier));
  }

  async getNearbyTowers(latitude: number, longitude: number, radiusKm: number): Promise<CellTower[]> {
    // Using a simple approximation for distance calculation in SQL
    // 1 degree latitude ≈ 111 km, 1 degree longitude ≈ 111 km * cos(latitude)
    const latDegrees = radiusKm / 111;
    const lonDegrees = radiusKm / (111 * Math.cos(latitude * Math.PI / 180));
    
    return await db
      .select()
      .from(cellTowers)
      .where(
        and(
          gte(cellTowers.latitude, latitude - latDegrees),
          sql`${cellTowers.latitude} <= ${latitude + latDegrees}`,
          gte(cellTowers.longitude, longitude - lonDegrees),
          sql`${cellTowers.longitude} <= ${longitude + lonDegrees}`
        )
      );
  }

  // Coverage Point operations
  async createCoveragePoint(point: InsertCoveragePoint): Promise<CoveragePoint> {
    const [coveragePoint] = await db
      .insert(coveragePoints)
      .values(point)
      .returning();
    return coveragePoint;
  }

  async getCoveragePoints(carrier?: string): Promise<CoveragePoint[]> {
    if (carrier) {
      return await db
        .select()
        .from(coveragePoints)
        .where(eq(coveragePoints.carrier, carrier));
    }
    return await db.select().from(coveragePoints);
  }

  async getCoverageHeatmap(carrier: string, bounds: { north: number, south: number, east: number, west: number }): Promise<CoveragePoint[]> {
    return await db
      .select()
      .from(coveragePoints)
      .where(
        and(
          eq(coveragePoints.carrier, carrier),
          gte(coveragePoints.latitude, bounds.south),
          sql`${coveragePoints.latitude} <= ${bounds.north}`,
          gte(coveragePoints.longitude, bounds.west),
          sql`${coveragePoints.longitude} <= ${bounds.east}`
        )
      );
  }

  // Outage Report operations
  async createOutageReport(report: InsertOutageReport): Promise<OutageReport> {
    const [outageReport] = await db
      .insert(outageReports)
      .values(report)
      .returning();
    return outageReport;
  }

  async getOutageReports(carrier?: string, resolved?: boolean): Promise<OutageReport[]> {
    const conditions = [];
    if (carrier) {
      conditions.push(eq(outageReports.carrier, carrier));
    }
    if (resolved !== undefined) {
      conditions.push(eq(outageReports.resolved, resolved));
    }
    
    if (conditions.length > 0) {
      return await db
        .select()
        .from(outageReports)
        .where(and(...conditions))
        .orderBy(desc(outageReports.timestamp));
    }
    
    return await db
      .select()
      .from(outageReports)
      .orderBy(desc(outageReports.timestamp));
  }

  async updateOutageStatus(id: string, resolved: boolean): Promise<void> {
    await db
      .update(outageReports)
      .set({ resolved })
      .where(eq(outageReports.id, id));
  }

  // Scheduled Test operations
  async createScheduledTest(test: InsertScheduledTest): Promise<ScheduledTest> {
    const [scheduledTest] = await db
      .insert(scheduledTests)
      .values([{
        ...test,
        times: test.times as any
      }])
      .returning();
    return scheduledTest;
  }

  async getScheduledTests(userId: string): Promise<ScheduledTest[]> {
    return await db
      .select()
      .from(scheduledTests)
      .where(eq(scheduledTests.userId, userId));
  }

  async updateScheduledTest(id: string, updates: Partial<ScheduledTest>): Promise<void> {
    await db
      .update(scheduledTests)
      .set(updates)
      .where(eq(scheduledTests.id, id));
  }

  // Data Usage operations
  async createDataUsage(usage: InsertDataUsage): Promise<DataUsage> {
    const [dataUsageEntry] = await db
      .insert(dataUsage)
      .values(usage)
      .returning();
    return dataUsageEntry;
  }

  async getDataUsage(userId: string, days: number = 30): Promise<DataUsage[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return await db
      .select()
      .from(dataUsage)
      .where(
        and(
          eq(dataUsage.userId, userId),
          gte(dataUsage.timestamp, cutoffDate)
        )
      )
      .orderBy(desc(dataUsage.timestamp));
  }

  async getDataUsageByApp(userId: string): Promise<{ appName: string, totalUsage: number }[]> {
    const usage = await this.getDataUsage(userId, 30);
    const appUsageMap = new Map<string, number>();
    
    for (const u of usage) {
      const current = appUsageMap.get(u.appName) || 0;
      appUsageMap.set(u.appName, current + u.dataConsumed);
    }
    
    return Array.from(appUsageMap.entries())
      .map(([appName, totalUsage]) => ({ appName, totalUsage }))
      .sort((a, b) => b.totalUsage - a.totalUsage);
  }
}

// Initialize database with Saskatchewan tower data
async function initializeSaskatchewanTowers() {
  const storage = new DatabaseStorage();
  
  const towers: InsertCellTower[] = [
    {
      towerId: "SK-SASK-001",
      carrier: "SaskTel",
      latitude: 52.1332,
      longitude: -106.6700,
      address: "Saskatoon Downtown",
      networkTypes: ["4G LTE", "5G"],
      frequency: "Band 4 (1700 MHz)",
      range: 5.2
    },
    {
      towerId: "SK-SASK-002",
      carrier: "SaskTel",
      latitude: 50.4452,
      longitude: -104.6189,
      address: "Regina Central",
      networkTypes: ["4G LTE", "5G"],
      frequency: "Band 4 (1700 MHz)",
      range: 4.8
    },
    {
      towerId: "SK-BELL-001",
      carrier: "Bell",
      latitude: 52.1445,
      longitude: -106.6607,
      address: "Saskatoon North",
      networkTypes: ["4G LTE", "5G"],
      frequency: "Band 7 (2600 MHz)",
      range: 4.5
    },
    {
      towerId: "SK-TELUS-001",
      carrier: "Telus",
      latitude: 50.4647,
      longitude: -104.6067,
      address: "Regina East",
      networkTypes: ["4G LTE"],
      frequency: "Band 4 (1700 MHz)",
      range: 3.8
    },
    {
      towerId: "SK-ROGERS-001",
      carrier: "Rogers",
      latitude: 52.1167,
      longitude: -106.6333,
      address: "Saskatoon West",
      networkTypes: ["4G LTE"],
      frequency: "Band 4 (1700 MHz)",
      range: 4.2
    }
  ];

  for (const tower of towers) {
    try {
      await storage.createCellTower(tower);
    } catch (error) {
      // Tower might already exist, ignore the error
    }
  }
}

export const storage = new DatabaseStorage();

// Initialize towers on startup (non-blocking)
initializeSaskatchewanTowers().catch(console.error);
