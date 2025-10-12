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
        networkTypes: insertCellTower.networkTypes as string[]
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
    
    const minLat = latitude - latDegrees;
    const maxLat = latitude + latDegrees;
    const minLon = longitude - lonDegrees;
    const maxLon = longitude + lonDegrees;
    
    return await db
      .select()
      .from(cellTowers)
      .where(
        and(
          gte(cellTowers.latitude, minLat),
          sql`${cellTowers.latitude} <= ${maxLat}`,
          gte(cellTowers.longitude, minLon),
          sql`${cellTowers.longitude} <= ${maxLon}`
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
        times: test.times as string[] | undefined
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
    // Saskatoon - Major City (multiple towers per carrier)
    { towerId: "SK-SASK-001", carrier: "SaskTel", latitude: 52.1332, longitude: -106.6700, address: "Saskatoon Downtown", networkTypes: ["4G LTE", "5G"], frequency: "Band 4 (1700 MHz)", range: 5.2 },
    { towerId: "SK-SASK-003", carrier: "SaskTel", latitude: 52.0928, longitude: -106.6245, address: "Saskatoon East", networkTypes: ["4G LTE", "5G"], frequency: "Band 4 (1700 MHz)", range: 4.5 },
    { towerId: "SK-SASK-004", carrier: "SaskTel", latitude: 52.1580, longitude: -106.7136, address: "Saskatoon West End", networkTypes: ["4G LTE", "5G"], frequency: "Band 12 (700 MHz)", range: 5.0 },
    { towerId: "SK-BELL-001", carrier: "Bell", latitude: 52.1445, longitude: -106.6607, address: "Saskatoon North", networkTypes: ["4G LTE", "5G"], frequency: "Band 7 (2600 MHz)", range: 4.5 },
    { towerId: "SK-BELL-003", carrier: "Bell", latitude: 52.1207, longitude: -106.6349, address: "Saskatoon Central", networkTypes: ["4G LTE", "5G"], frequency: "Band 7 (2600 MHz)", range: 4.8 },
    { towerId: "SK-ROGERS-001", carrier: "Rogers", latitude: 52.1167, longitude: -106.6333, address: "Saskatoon West", networkTypes: ["4G LTE", "5G"], frequency: "Band 4 (1700 MHz)", range: 4.2 },
    { towerId: "SK-ROGERS-003", carrier: "Rogers", latitude: 52.1015, longitude: -106.5894, address: "Saskatoon Southeast", networkTypes: ["4G LTE", "5G"], frequency: "Band 4 (1700 MHz)", range: 4.3 },
    { towerId: "SK-TELUS-003", carrier: "Telus", latitude: 52.1445, longitude: -106.6985, address: "Saskatoon Airport", networkTypes: ["4G LTE", "5G"], frequency: "Band 4 (1700 MHz)", range: 4.5 },
    { towerId: "SK-TELUS-004", carrier: "Telus", latitude: 52.0778, longitude: -106.6503, address: "Saskatoon South", networkTypes: ["4G LTE", "5G"], frequency: "Band 12 (700 MHz)", range: 4.7 },

    // Regina - Major City (multiple towers per carrier)
    { towerId: "SK-SASK-002", carrier: "SaskTel", latitude: 50.4452, longitude: -104.6189, address: "Regina Central", networkTypes: ["4G LTE", "5G"], frequency: "Band 4 (1700 MHz)", range: 4.8 },
    { towerId: "SK-SASK-005", carrier: "SaskTel", latitude: 50.4897, longitude: -104.6185, address: "Regina North", networkTypes: ["4G LTE", "5G"], frequency: "Band 12 (700 MHz)", range: 5.0 },
    { towerId: "SK-SASK-006", carrier: "SaskTel", latitude: 50.4129, longitude: -104.6539, address: "Regina West", networkTypes: ["4G LTE", "5G"], frequency: "Band 4 (1700 MHz)", range: 4.6 },
    { towerId: "SK-BELL-004", carrier: "Bell", latitude: 50.4547, longitude: -104.6067, address: "Regina Downtown", networkTypes: ["4G LTE", "5G"], frequency: "Band 7 (2600 MHz)", range: 4.9 },
    { towerId: "SK-BELL-005", carrier: "Bell", latitude: 50.4239, longitude: -104.5627, address: "Regina East", networkTypes: ["4G LTE", "5G"], frequency: "Band 7 (2600 MHz)", range: 4.4 },
    { towerId: "SK-TELUS-001", carrier: "Telus", latitude: 50.4647, longitude: -104.6067, address: "Regina Airport", networkTypes: ["4G LTE", "5G"], frequency: "Band 4 (1700 MHz)", range: 4.8 },
    { towerId: "SK-TELUS-005", carrier: "Telus", latitude: 50.4334, longitude: -104.6791, address: "Regina Northwest", networkTypes: ["4G LTE", "5G"], frequency: "Band 12 (700 MHz)", range: 4.5 },
    { towerId: "SK-ROGERS-004", carrier: "Rogers", latitude: 50.4451, longitude: -104.6348, address: "Regina Centre", networkTypes: ["4G LTE", "5G"], frequency: "Band 4 (1700 MHz)", range: 4.6 },

    // Prince Albert
    { towerId: "SK-SASK-101", carrier: "SaskTel", latitude: 53.2033, longitude: -105.7531, address: "Prince Albert Downtown", networkTypes: ["4G LTE", "5G"], frequency: "Band 4 (1700 MHz)", range: 5.1 },
    { towerId: "SK-BELL-101", carrier: "Bell", latitude: 53.2145, longitude: -105.7672, address: "Prince Albert North", networkTypes: ["4G LTE", "5G"], frequency: "Band 7 (2600 MHz)", range: 4.3 },
    { towerId: "SK-ROGERS-101", carrier: "Rogers", latitude: 53.1988, longitude: -105.7411, address: "Prince Albert Central", networkTypes: ["4G LTE"], frequency: "Band 4 (1700 MHz)", range: 4.0 },
    { towerId: "SK-TELUS-101", carrier: "Telus", latitude: 53.2091, longitude: -105.7298, address: "Prince Albert East", networkTypes: ["4G LTE", "5G"], frequency: "Band 4 (1700 MHz)", range: 4.2 },

    // Moose Jaw
    { towerId: "SK-SASK-201", carrier: "SaskTel", latitude: 50.3933, longitude: -105.5519, address: "Moose Jaw Downtown", networkTypes: ["4G LTE", "5G"], frequency: "Band 4 (1700 MHz)", range: 4.8 },
    { towerId: "SK-BELL-201", carrier: "Bell", latitude: 50.4022, longitude: -105.5382, address: "Moose Jaw North", networkTypes: ["4G LTE", "5G"], frequency: "Band 7 (2600 MHz)", range: 4.2 },
    { towerId: "SK-ROGERS-201", carrier: "Rogers", latitude: 50.3845, longitude: -105.5651, address: "Moose Jaw Central", networkTypes: ["4G LTE"], frequency: "Band 4 (1700 MHz)", range: 4.1 },
    { towerId: "SK-TELUS-201", carrier: "Telus", latitude: 50.3987, longitude: -105.5234, address: "Moose Jaw East", networkTypes: ["4G LTE", "5G"], frequency: "Band 4 (1700 MHz)", range: 4.3 },

    // Swift Current
    { towerId: "SK-SASK-301", carrier: "SaskTel", latitude: 50.2883, longitude: -107.7939, address: "Swift Current Downtown", networkTypes: ["4G LTE", "5G"], frequency: "Band 4 (1700 MHz)", range: 4.9 },
    { towerId: "SK-BELL-301", carrier: "Bell", latitude: 50.2947, longitude: -107.8105, address: "Swift Current North", networkTypes: ["4G LTE"], frequency: "Band 7 (2600 MHz)", range: 4.1 },
    { towerId: "SK-ROGERS-301", carrier: "Rogers", latitude: 50.2812, longitude: -107.7812, address: "Swift Current Central", networkTypes: ["4G LTE"], frequency: "Band 4 (1700 MHz)", range: 3.9 },
    { towerId: "SK-TELUS-301", carrier: "Telus", latitude: 50.2955, longitude: -107.7693, address: "Swift Current East", networkTypes: ["4G LTE", "5G"], frequency: "Band 4 (1700 MHz)", range: 4.4 },

    // Yorkton
    { towerId: "SK-SASK-401", carrier: "SaskTel", latitude: 51.2144, longitude: -102.4627, address: "Yorkton Downtown", networkTypes: ["4G LTE", "5G"], frequency: "Band 4 (1700 MHz)", range: 4.7 },
    { towerId: "SK-BELL-401", carrier: "Bell", latitude: 51.2203, longitude: -102.4782, address: "Yorkton North", networkTypes: ["4G LTE", "5G"], frequency: "Band 7 (2600 MHz)", range: 4.3 },
    { towerId: "SK-ROGERS-401", carrier: "Rogers", latitude: 51.2089, longitude: -102.4544, address: "Yorkton Central", networkTypes: ["4G LTE"], frequency: "Band 4 (1700 MHz)", range: 4.0 },
    { towerId: "SK-TELUS-401", carrier: "Telus", latitude: 51.2176, longitude: -102.4399, address: "Yorkton East", networkTypes: ["4G LTE", "5G"], frequency: "Band 4 (1700 MHz)", range: 4.5 },

    // North Battleford
    { towerId: "SK-SASK-501", carrier: "SaskTel", latitude: 52.7575, longitude: -108.2861, address: "North Battleford Downtown", networkTypes: ["4G LTE", "5G"], frequency: "Band 4 (1700 MHz)", range: 4.6 },
    { towerId: "SK-BELL-501", carrier: "Bell", latitude: 52.7633, longitude: -108.2972, address: "North Battleford Central", networkTypes: ["4G LTE"], frequency: "Band 7 (2600 MHz)", range: 4.0 },
    { towerId: "SK-ROGERS-501", carrier: "Rogers", latitude: 52.7521, longitude: -108.2743, address: "North Battleford East", networkTypes: ["4G LTE"], frequency: "Band 4 (1700 MHz)", range: 3.8 },
    { towerId: "SK-TELUS-501", carrier: "Telus", latitude: 52.7689, longitude: -108.3012, address: "North Battleford North", networkTypes: ["4G LTE"], frequency: "Band 4 (1700 MHz)", range: 4.1 },

    // Estevan
    { towerId: "SK-SASK-601", carrier: "SaskTel", latitude: 49.1392, longitude: -102.9862, address: "Estevan Downtown", networkTypes: ["4G LTE", "5G"], frequency: "Band 4 (1700 MHz)", range: 4.8 },
    { towerId: "SK-BELL-601", carrier: "Bell", latitude: 49.1456, longitude: -102.9987, address: "Estevan North", networkTypes: ["4G LTE"], frequency: "Band 7 (2600 MHz)", range: 4.2 },
    { towerId: "SK-TELUS-601", carrier: "Telus", latitude: 49.1339, longitude: -102.9721, address: "Estevan East", networkTypes: ["4G LTE"], frequency: "Band 4 (1700 MHz)", range: 4.3 },

    // Weyburn
    { towerId: "SK-SASK-701", carrier: "SaskTel", latitude: 49.6614, longitude: -103.8526, address: "Weyburn Downtown", networkTypes: ["4G LTE", "5G"], frequency: "Band 4 (1700 MHz)", range: 4.7 },
    { towerId: "SK-BELL-701", carrier: "Bell", latitude: 49.6672, longitude: -103.8651, address: "Weyburn North", networkTypes: ["4G LTE"], frequency: "Band 7 (2600 MHz)", range: 4.1 },
    { towerId: "SK-TELUS-701", carrier: "Telus", latitude: 49.6558, longitude: -103.8391, address: "Weyburn Central", networkTypes: ["4G LTE"], frequency: "Band 4 (1700 MHz)", range: 4.4 },

    // Melfort
    { towerId: "SK-SASK-801", carrier: "SaskTel", latitude: 52.8564, longitude: -104.6109, address: "Melfort Downtown", networkTypes: ["4G LTE", "5G"], frequency: "Band 4 (1700 MHz)", range: 4.5 },
    { towerId: "SK-BELL-801", carrier: "Bell", latitude: 52.8621, longitude: -104.6234, address: "Melfort North", networkTypes: ["4G LTE"], frequency: "Band 7 (2600 MHz)", range: 4.0 },
    { towerId: "SK-TELUS-801", carrier: "Telus", latitude: 52.8512, longitude: -104.5987, address: "Melfort East", networkTypes: ["4G LTE"], frequency: "Band 4 (1700 MHz)", range: 4.2 },

    // Humboldt
    { towerId: "SK-SASK-901", carrier: "SaskTel", latitude: 52.2017, longitude: -105.1231, address: "Humboldt Downtown", networkTypes: ["4G LTE", "5G"], frequency: "Band 4 (1700 MHz)", range: 4.6 },
    { towerId: "SK-BELL-901", carrier: "Bell", latitude: 52.2073, longitude: -105.1352, address: "Humboldt Central", networkTypes: ["4G LTE"], frequency: "Band 7 (2600 MHz)", range: 4.1 },
    { towerId: "SK-TELUS-901", carrier: "Telus", latitude: 52.1967, longitude: -105.1119, address: "Humboldt South", networkTypes: ["4G LTE"], frequency: "Band 4 (1700 MHz)", range: 4.3 },

    // Warman
    { towerId: "SK-SASK-1001", carrier: "SaskTel", latitude: 52.3214, longitude: -106.5847, address: "Warman Central", networkTypes: ["4G LTE", "5G"], frequency: "Band 4 (1700 MHz)", range: 4.4 },
    { towerId: "SK-BELL-1001", carrier: "Bell", latitude: 52.3267, longitude: -106.5921, address: "Warman North", networkTypes: ["4G LTE", "5G"], frequency: "Band 7 (2600 MHz)", range: 4.2 },

    // Martensville
    { towerId: "SK-SASK-1101", carrier: "SaskTel", latitude: 52.2897, longitude: -106.6664, address: "Martensville Central", networkTypes: ["4G LTE", "5G"], frequency: "Band 4 (1700 MHz)", range: 4.3 },
    { towerId: "SK-ROGERS-1101", carrier: "Rogers", latitude: 52.2945, longitude: -106.6738, address: "Martensville North", networkTypes: ["4G LTE"], frequency: "Band 4 (1700 MHz)", range: 4.0 },

    // Lloydminster
    { towerId: "SK-SASK-1201", carrier: "SaskTel", latitude: 53.2783, longitude: -110.0053, address: "Lloydminster Downtown", networkTypes: ["4G LTE", "5G"], frequency: "Band 4 (1700 MHz)", range: 4.7 },
    { towerId: "SK-BELL-1201", carrier: "Bell", latitude: 53.2839, longitude: -110.0178, address: "Lloydminster North", networkTypes: ["4G LTE"], frequency: "Band 7 (2600 MHz)", range: 4.2 },
    { towerId: "SK-TELUS-1201", carrier: "Telus", latitude: 53.2731, longitude: -109.9931, address: "Lloydminster South", networkTypes: ["4G LTE"], frequency: "Band 4 (1700 MHz)", range: 4.4 },

    // Meadow Lake
    { towerId: "SK-SASK-1301", carrier: "SaskTel", latitude: 54.1253, longitude: -108.4350, address: "Meadow Lake Downtown", networkTypes: ["4G LTE"], frequency: "Band 4 (1700 MHz)", range: 4.5 },
    { towerId: "SK-BELL-1301", carrier: "Bell", latitude: 54.1308, longitude: -108.4475, address: "Meadow Lake North", networkTypes: ["4G LTE"], frequency: "Band 7 (2600 MHz)", range: 4.0 },

    // Kindersley
    { towerId: "SK-SASK-1401", carrier: "SaskTel", latitude: 51.4672, longitude: -109.1647, address: "Kindersley Downtown", networkTypes: ["4G LTE"], frequency: "Band 4 (1700 MHz)", range: 4.6 },
    { towerId: "SK-BELL-1401", carrier: "Bell", latitude: 51.4728, longitude: -109.1772, address: "Kindersley Central", networkTypes: ["4G LTE"], frequency: "Band 7 (2600 MHz)", range: 4.1 },

    // Melville
    { towerId: "SK-SASK-1501", carrier: "SaskTel", latitude: 50.9267, longitude: -102.8081, address: "Melville Downtown", networkTypes: ["4G LTE"], frequency: "Band 4 (1700 MHz)", range: 4.4 },
    { towerId: "SK-TELUS-1501", carrier: "Telus", latitude: 50.9322, longitude: -102.8206, address: "Melville North", networkTypes: ["4G LTE"], frequency: "Band 4 (1700 MHz)", range: 4.2 },

    // La Ronge
    { towerId: "SK-SASK-1601", carrier: "SaskTel", latitude: 55.1003, longitude: -105.2842, address: "La Ronge Downtown", networkTypes: ["4G LTE"], frequency: "Band 4 (1700 MHz)", range: 4.8 },
    { towerId: "SK-BELL-1601", carrier: "Bell", latitude: 55.1058, longitude: -105.2967, address: "La Ronge Central", networkTypes: ["4G LTE"], frequency: "Band 7 (2600 MHz)", range: 4.3 },

    // Nipawin
    { towerId: "SK-SASK-1701", carrier: "SaskTel", latitude: 53.3633, longitude: -104.0050, address: "Nipawin Downtown", networkTypes: ["4G LTE"], frequency: "Band 4 (1700 MHz)", range: 4.5 },
    { towerId: "SK-BELL-1701", carrier: "Bell", latitude: 53.3689, longitude: -104.0175, address: "Nipawin North", networkTypes: ["4G LTE"], frequency: "Band 7 (2600 MHz)", range: 4.0 },

    // Tisdale
    { towerId: "SK-SASK-1801", carrier: "SaskTel", latitude: 52.8506, longitude: -104.0428, address: "Tisdale Downtown", networkTypes: ["4G LTE"], frequency: "Band 4 (1700 MHz)", range: 4.4 },
    { towerId: "SK-TELUS-1801", carrier: "Telus", latitude: 52.8561, longitude: -104.0553, address: "Tisdale Central", networkTypes: ["4G LTE"], frequency: "Band 4 (1700 MHz)", range: 4.2 },

    // Fort Qu'Appelle
    { towerId: "SK-SASK-1901", carrier: "SaskTel", latitude: 50.7753, longitude: -103.7872, address: "Fort Qu'Appelle Downtown", networkTypes: ["4G LTE"], frequency: "Band 4 (1700 MHz)", range: 4.3 },
    { towerId: "SK-BELL-1901", carrier: "Bell", latitude: 50.7808, longitude: -103.7997, address: "Fort Qu'Appelle North", networkTypes: ["4G LTE"], frequency: "Band 7 (2600 MHz)", range: 4.0 },

    // Indian Head
    { towerId: "SK-SASK-2001", carrier: "SaskTel", latitude: 50.5400, longitude: -103.6650, address: "Indian Head Downtown", networkTypes: ["4G LTE"], frequency: "Band 4 (1700 MHz)", range: 4.2 },

    // Rosetown
    { towerId: "SK-SASK-2101", carrier: "SaskTel", latitude: 51.5550, longitude: -107.9903, address: "Rosetown Downtown", networkTypes: ["4G LTE"], frequency: "Band 4 (1700 MHz)", range: 4.4 },

    // Outlook
    { towerId: "SK-SASK-2201", carrier: "SaskTel", latitude: 51.4919, longitude: -107.0542, address: "Outlook Downtown", networkTypes: ["4G LTE"], frequency: "Band 4 (1700 MHz)", range: 4.1 },

    // Unity
    { towerId: "SK-SASK-2301", carrier: "SaskTel", latitude: 52.4489, longitude: -109.1728, address: "Unity Downtown", networkTypes: ["4G LTE"], frequency: "Band 4 (1700 MHz)", range: 4.3 },

    // Maple Creek
    { towerId: "SK-SASK-2401", carrier: "SaskTel", latitude: 49.9156, longitude: -109.4803, address: "Maple Creek Downtown", networkTypes: ["4G LTE"], frequency: "Band 4 (1700 MHz)", range: 4.5 },

    // Shaunavon
    { towerId: "SK-SASK-2501", carrier: "SaskTel", latitude: 49.6506, longitude: -108.4211, address: "Shaunavon Downtown", networkTypes: ["4G LTE"], frequency: "Band 4 (1700 MHz)", range: 4.2 },

    // Assiniboia
    { towerId: "SK-SASK-2601", carrier: "SaskTel", latitude: 49.6336, longitude: -105.9847, address: "Assiniboia Downtown", networkTypes: ["4G LTE"], frequency: "Band 4 (1700 MHz)", range: 4.4 },

    // Carlyle
    { towerId: "SK-SASK-2701", carrier: "SaskTel", latitude: 49.6347, longitude: -102.2625, address: "Carlyle Downtown", networkTypes: ["4G LTE"], frequency: "Band 4 (1700 MHz)", range: 4.0 },

    // Moosomin
    { towerId: "SK-SASK-2801", carrier: "SaskTel", latitude: 50.1406, longitude: -101.6664, address: "Moosomin Downtown", networkTypes: ["4G LTE"], frequency: "Band 4 (1700 MHz)", range: 4.3 },

    // Esterhazy
    { towerId: "SK-SASK-2901", carrier: "SaskTel", latitude: 50.6547, longitude: -102.0800, address: "Esterhazy Downtown", networkTypes: ["4G LTE"], frequency: "Band 4 (1700 MHz)", range: 4.2 },

    // Kamsack
    { towerId: "SK-SASK-3001", carrier: "SaskTel", latitude: 51.5664, longitude: -101.9019, address: "Kamsack Downtown", networkTypes: ["4G LTE"], frequency: "Band 4 (1700 MHz)", range: 4.1 },

    // Preeceville
    { towerId: "SK-SASK-3101", carrier: "SaskTel", latitude: 51.9547, longitude: -102.6622, address: "Preeceville Downtown", networkTypes: ["4G LTE"], frequency: "Band 4 (1700 MHz)", range: 4.0 },

    // Wadena
    { towerId: "SK-SASK-3201", carrier: "SaskTel", latitude: 51.9433, longitude: -103.7947, address: "Wadena Downtown", networkTypes: ["4G LTE"], frequency: "Band 4 (1700 MHz)", range: 4.2 },

    // Watrous
    { towerId: "SK-SASK-3301", carrier: "SaskTel", latitude: 51.6744, longitude: -105.4669, address: "Watrous Downtown", networkTypes: ["4G LTE"], frequency: "Band 4 (1700 MHz)", range: 4.3 },

    // Davidson
    { towerId: "SK-SASK-3401", carrier: "SaskTel", latitude: 51.2503, longitude: -105.9947, address: "Davidson Downtown", networkTypes: ["4G LTE"], frequency: "Band 4 (1700 MHz)", range: 4.1 },

    // Lanigan
    { towerId: "SK-SASK-3501", carrier: "SaskTel", latitude: 51.8569, longitude: -105.0364, address: "Lanigan Downtown", networkTypes: ["4G LTE"], frequency: "Band 4 (1700 MHz)", range: 4.4 },

    // Foam Lake
    { towerId: "SK-SASK-3601", carrier: "SaskTel", latitude: 51.6492, longitude: -103.5372, address: "Foam Lake Downtown", networkTypes: ["4G LTE"], frequency: "Band 4 (1700 MHz)", range: 4.0 }
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
