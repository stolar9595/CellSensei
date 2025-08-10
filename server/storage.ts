import { 
  type SpeedTest, type InsertSpeedTest, 
  type NetworkInfo, type InsertNetworkInfo, 
  type CellTower, type InsertCellTower, 
  type User, type UpsertUser,
  type CoveragePoint, type InsertCoveragePoint,
  type OutageReport, type InsertOutageReport,
  type ScheduledTest, type InsertScheduledTest,
  type DataUsage, type InsertDataUsage
} from "@shared/schema";
import { randomUUID } from "crypto";

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

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private speedTests: Map<string, SpeedTest>;
  private networkInfos: Map<string, NetworkInfo>;
  private cellTowers: Map<string, CellTower>;
  private coveragePoints: Map<string, CoveragePoint>;
  private outageReports: Map<string, OutageReport>;
  private scheduledTests: Map<string, ScheduledTest>;
  private dataUsage: Map<string, DataUsage>;

  constructor() {
    this.users = new Map();
    this.speedTests = new Map();
    this.networkInfos = new Map();
    this.cellTowers = new Map();
    this.coveragePoints = new Map();
    this.outageReports = new Map();
    this.scheduledTests = new Map();
    this.dataUsage = new Map();
    
    // Initialize with some Saskatchewan cell tower data
    this.initializeSaskatchewanTowers();
  }

  private initializeSaskatchewanTowers() {
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

    towers.forEach(tower => {
      this.createCellTower(tower);
    });
  }

  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = this.users.get(userData.id!);
    
    if (existingUser) {
      const updatedUser: User = {
        ...existingUser,
        ...userData,
        updatedAt: new Date(),
      };
      this.users.set(userData.id!, updatedUser);
      return updatedUser;
    } else {
      const newUser: User = {
        ...userData,
        id: userData.id || randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
        email: userData.email || null,
        firstName: userData.firstName || null,
        lastName: userData.lastName || null,
        profileImageUrl: userData.profileImageUrl || null,
      };
      this.users.set(newUser.id, newUser);
      return newUser;
    }
  }

  async createSpeedTest(insertSpeedTest: InsertSpeedTest): Promise<SpeedTest> {
    const id = randomUUID();
    const speedTest: SpeedTest = {
      ...insertSpeedTest,
      id,
      timestamp: new Date(),
      userId: insertSpeedTest.userId ?? null,
      jitter: insertSpeedTest.jitter ?? null,
      signalStrength: insertSpeedTest.signalStrength ?? null,
      latitude: insertSpeedTest.latitude ?? null,
      longitude: insertSpeedTest.longitude ?? null,
      location: insertSpeedTest.location ?? null,
      isAutoTest: insertSpeedTest.isAutoTest ?? false,
    };
    this.speedTests.set(id, speedTest);
    
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
    const tests = Array.from(this.speedTests.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
    return tests;
  }

  async getSpeedTestsByCarrier(carrier: string): Promise<SpeedTest[]> {
    return Array.from(this.speedTests.values())
      .filter(test => test.carrier === carrier)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getSpeedTestsByUser(userId: string): Promise<SpeedTest[]> {
    return Array.from(this.speedTests.values())
      .filter(test => test.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async createNetworkInfo(insertNetworkInfo: InsertNetworkInfo): Promise<NetworkInfo> {
    const id = randomUUID();
    const networkInfo: NetworkInfo = {
      ...insertNetworkInfo,
      id,
      timestamp: new Date(),
      latitude: insertNetworkInfo.latitude ?? null,
      longitude: insertNetworkInfo.longitude ?? null,
      frequency: insertNetworkInfo.frequency ?? null,
      cellId: insertNetworkInfo.cellId ?? null,
    };
    this.networkInfos.set(id, networkInfo);
    return networkInfo;
  }

  async getLatestNetworkInfo(): Promise<NetworkInfo | undefined> {
    const infos = Array.from(this.networkInfos.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return infos[0];
  }

  async createCellTower(insertCellTower: InsertCellTower): Promise<CellTower> {
    const id = randomUUID();
    const cellTower: CellTower = { 
      ...insertCellTower, 
      id,
      address: insertCellTower.address ?? null,
      frequency: insertCellTower.frequency ?? null,
      range: insertCellTower.range ?? null,
      networkTypes: insertCellTower.networkTypes as string[],
    };
    this.cellTowers.set(id, cellTower);
    return cellTower;
  }

  async getCellTowers(): Promise<CellTower[]> {
    return Array.from(this.cellTowers.values());
  }

  async getCellTowersByCarrier(carrier: string): Promise<CellTower[]> {
    return Array.from(this.cellTowers.values())
      .filter(tower => tower.carrier === carrier);
  }

  async getNearbyTowers(latitude: number, longitude: number, radiusKm: number): Promise<CellTower[]> {
    return Array.from(this.cellTowers.values()).filter(tower => {
      const distance = this.calculateDistance(latitude, longitude, tower.latitude, tower.longitude);
      return distance <= radiusKm;
    });
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Coverage Point operations
  async createCoveragePoint(point: InsertCoveragePoint): Promise<CoveragePoint> {
    const id = randomUUID();
    const coveragePoint: CoveragePoint = {
      ...point,
      id,
      timestamp: new Date(),
    };
    this.coveragePoints.set(id, coveragePoint);
    return coveragePoint;
  }

  async getCoveragePoints(carrier?: string): Promise<CoveragePoint[]> {
    const points = Array.from(this.coveragePoints.values());
    if (carrier) {
      return points.filter(p => p.carrier === carrier);
    }
    return points;
  }

  async getCoverageHeatmap(carrier: string, bounds: { north: number, south: number, east: number, west: number }): Promise<CoveragePoint[]> {
    return Array.from(this.coveragePoints.values())
      .filter(p => p.carrier === carrier && 
        p.latitude >= bounds.south && 
        p.latitude <= bounds.north &&
        p.longitude >= bounds.west && 
        p.longitude <= bounds.east
      );
  }

  // Outage Report operations
  async createOutageReport(report: InsertOutageReport): Promise<OutageReport> {
    const id = randomUUID();
    const outageReport: OutageReport = {
      ...report,
      id,
      timestamp: new Date(),
      userId: report.userId ?? null,
      description: report.description ?? null,
      resolved: report.resolved ?? false,
    };
    this.outageReports.set(id, outageReport);
    return outageReport;
  }

  async getOutageReports(carrier?: string, resolved?: boolean): Promise<OutageReport[]> {
    let reports = Array.from(this.outageReports.values());
    if (carrier) {
      reports = reports.filter(r => r.carrier === carrier);
    }
    if (resolved !== undefined) {
      reports = reports.filter(r => r.resolved === resolved);
    }
    return reports.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async updateOutageStatus(id: string, resolved: boolean): Promise<void> {
    const report = this.outageReports.get(id);
    if (report) {
      report.resolved = resolved;
    }
  }

  // Scheduled Test operations
  async createScheduledTest(test: InsertScheduledTest): Promise<ScheduledTest> {
    const id = randomUUID();
    const scheduledTest: ScheduledTest = {
      ...test,
      id,
      createdAt: new Date(),
      enabled: test.enabled ?? true,
      times: (test.times as string[]) ?? null,
      lastRun: test.lastRun ?? null,
      nextRun: test.nextRun ?? null,
    };
    this.scheduledTests.set(id, scheduledTest);
    return scheduledTest;
  }

  async getScheduledTests(userId: string): Promise<ScheduledTest[]> {
    return Array.from(this.scheduledTests.values())
      .filter(t => t.userId === userId);
  }

  async updateScheduledTest(id: string, updates: Partial<ScheduledTest>): Promise<void> {
    const test = this.scheduledTests.get(id);
    if (test) {
      Object.assign(test, updates);
    }
  }

  // Data Usage operations
  async createDataUsage(usage: InsertDataUsage): Promise<DataUsage> {
    const id = randomUUID();
    const dataUsage: DataUsage = {
      ...usage,
      id,
      timestamp: new Date(),
      carrier: usage.carrier ?? null,
    };
    this.dataUsage.set(id, dataUsage);
    return dataUsage;
  }

  async getDataUsage(userId: string, days: number = 30): Promise<DataUsage[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return Array.from(this.dataUsage.values())
      .filter(u => u.userId === userId && u.timestamp >= cutoffDate)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
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

export const storage = new MemStorage();
