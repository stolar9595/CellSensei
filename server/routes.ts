import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertSpeedTestSchema, 
  insertNetworkInfoSchema,
  insertOutageReportSchema,
  insertScheduledTestSchema,
  insertDataUsageSchema 
} from "@shared/schema";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  
  // Speed Test Routes
  app.post("/api/speed-tests", async (req: any, res) => {
    try {
      const speedTestData = insertSpeedTestSchema.parse(req.body);
      // Add userId if authenticated
      if (req.user?.claims?.sub) {
        speedTestData.userId = req.user.claims.sub;
      }
      const speedTest = await storage.createSpeedTest(speedTestData);
      res.json(speedTest);
    } catch (error) {
      res.status(400).json({ error: "Invalid speed test data" });
    }
  });

  app.get("/api/speed-tests", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const carrier = req.query.carrier as string;
      
      let speedTests;
      if (carrier) {
        speedTests = await storage.getSpeedTestsByCarrier(carrier);
      } else {
        speedTests = await storage.getSpeedTests(limit);
      }
      
      res.json(speedTests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch speed tests" });
    }
  });

  // Network Info Routes
  app.post("/api/network-info", async (req, res) => {
    try {
      const networkInfoData = insertNetworkInfoSchema.parse(req.body);
      const networkInfo = await storage.createNetworkInfo(networkInfoData);
      res.json(networkInfo);
    } catch (error) {
      res.status(400).json({ error: "Invalid network info data" });
    }
  });

  app.get("/api/network-info/latest", async (req, res) => {
    try {
      const networkInfo = await storage.getLatestNetworkInfo();
      if (!networkInfo) {
        return res.status(404).json({ error: "No network info found" });
      }
      res.json(networkInfo);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch network info" });
    }
  });

  // Cell Tower Routes
  app.get("/api/cell-towers", async (req, res) => {
    try {
      const carrier = req.query.carrier as string;
      const lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
      const lng = req.query.lng ? parseFloat(req.query.lng as string) : undefined;
      const radius = req.query.radius ? parseFloat(req.query.radius as string) : 50;

      let towers;
      if (lat && lng) {
        towers = await storage.getNearbyTowers(lat, lng, radius);
      } else if (carrier) {
        towers = await storage.getCellTowersByCarrier(carrier);
      } else {
        towers = await storage.getCellTowers();
      }

      res.json(towers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch cell towers" });
    }
  });

  // Speed Test Execution
  app.post("/api/speed-test/run", async (req, res) => {
    try {
      // Simulate speed test execution
      const testResult = await runSpeedTest();
      res.json(testResult);
    } catch (error) {
      res.status(500).json({ error: "Speed test failed" });
    }
  });

  // Coverage Heatmap Routes
  app.get("/api/coverage-points", async (req, res) => {
    try {
      const carrier = req.query.carrier as string;
      const points = await storage.getCoveragePoints(carrier);
      res.json(points);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch coverage points" });
    }
  });

  app.get("/api/coverage-heatmap", async (req, res) => {
    try {
      const carrier = req.query.carrier as string;
      const bounds = {
        north: parseFloat(req.query.north as string),
        south: parseFloat(req.query.south as string),
        east: parseFloat(req.query.east as string),
        west: parseFloat(req.query.west as string),
      };
      
      if (!carrier || isNaN(bounds.north) || isNaN(bounds.south) || isNaN(bounds.east) || isNaN(bounds.west)) {
        return res.status(400).json({ error: "Invalid parameters" });
      }
      
      const points = await storage.getCoverageHeatmap(carrier, bounds);
      res.json(points);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch heatmap data" });
    }
  });

  // Outage Report Routes
  app.post("/api/outage-reports", isAuthenticated, async (req: any, res) => {
    try {
      const reportData = insertOutageReportSchema.parse(req.body);
      reportData.userId = req.user.claims.sub;
      const report = await storage.createOutageReport(reportData);
      res.json(report);
    } catch (error) {
      res.status(400).json({ error: "Invalid outage report data" });
    }
  });

  app.get("/api/outage-reports", async (req, res) => {
    try {
      const carrier = req.query.carrier as string;
      const resolved = req.query.resolved === 'true' ? true : req.query.resolved === 'false' ? false : undefined;
      const reports = await storage.getOutageReports(carrier, resolved);
      res.json(reports);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch outage reports" });
    }
  });

  app.patch("/api/outage-reports/:id", async (req, res) => {
    try {
      await storage.updateOutageStatus(req.params.id, req.body.resolved);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update outage status" });
    }
  });

  // Scheduled Test Routes
  app.get("/api/scheduled-tests", isAuthenticated, async (req: any, res) => {
    try {
      const tests = await storage.getScheduledTests(req.user.claims.sub);
      res.json(tests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch scheduled tests" });
    }
  });

  app.post("/api/scheduled-tests", isAuthenticated, async (req: any, res) => {
    try {
      const testData = insertScheduledTestSchema.parse(req.body);
      testData.userId = req.user.claims.sub;
      const test = await storage.createScheduledTest(testData);
      res.json(test);
    } catch (error) {
      res.status(400).json({ error: "Invalid scheduled test data" });
    }
  });

  app.patch("/api/scheduled-tests/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.updateScheduledTest(req.params.id, req.body);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update scheduled test" });
    }
  });

  // Data Usage Routes
  app.get("/api/data-usage", isAuthenticated, async (req: any, res) => {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 30;
      const usage = await storage.getDataUsage(req.user.claims.sub, days);
      res.json(usage);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch data usage" });
    }
  });

  app.get("/api/data-usage/by-app", isAuthenticated, async (req: any, res) => {
    try {
      const usage = await storage.getDataUsageByApp(req.user.claims.sub);
      res.json(usage);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch app usage" });
    }
  });

  app.post("/api/data-usage", isAuthenticated, async (req: any, res) => {
    try {
      const usageData = insertDataUsageSchema.parse(req.body);
      usageData.userId = req.user.claims.sub;
      const usage = await storage.createDataUsage(usageData);
      res.json(usage);
    } catch (error) {
      res.status(400).json({ error: "Invalid data usage entry" });
    }
  });

  // Carrier Comparison Route
  app.get("/api/carrier-comparison", async (req, res) => {
    try {
      const carriers = ["SaskTel", "Bell", "Telus", "Rogers"];
      const comparison = await Promise.all(carriers.map(async (carrier) => {
        const speedTests = await storage.getSpeedTestsByCarrier(carrier);
        const coverage = await storage.getCoveragePoints(carrier);
        const outages = await storage.getOutageReports(carrier, false);
        
        const avgDownload = speedTests.length > 0 
          ? speedTests.reduce((sum, t) => sum + t.downloadSpeed, 0) / speedTests.length 
          : 0;
        const avgUpload = speedTests.length > 0
          ? speedTests.reduce((sum, t) => sum + t.uploadSpeed, 0) / speedTests.length
          : 0;
        const avgPing = speedTests.length > 0
          ? speedTests.reduce((sum, t) => sum + t.ping, 0) / speedTests.length
          : 0;
        
        return {
          carrier,
          avgDownload: Math.round(avgDownload * 10) / 10,
          avgUpload: Math.round(avgUpload * 10) / 10,
          avgPing: Math.round(avgPing),
          totalTests: speedTests.length,
          coveragePoints: coverage.length,
          activeOutages: outages.length,
          reliabilityScore: Math.max(0, 100 - (outages.length * 5)),
        };
      }));
      
      res.json(comparison);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate carrier comparison" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Simulate actual speed test
async function runSpeedTest() {
  return new Promise((resolve) => {
    setTimeout(() => {
      const downloadSpeed = Math.random() * 80 + 20; // 20-100 Mbps
      const uploadSpeed = Math.random() * 30 + 10; // 10-40 Mbps
      const ping = Math.random() * 50 + 10; // 10-60 ms
      const jitter = Math.random() * 10 + 1; // 1-11 ms

      resolve({
        downloadSpeed: Math.round(downloadSpeed * 10) / 10,
        uploadSpeed: Math.round(uploadSpeed * 10) / 10,
        ping: Math.round(ping),
        jitter: Math.round(jitter * 10) / 10,
      });
    }, 3000); // 3 second test duration - more reasonable for simulation
  });
}
