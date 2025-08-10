import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSpeedTestSchema, insertNetworkInfoSchema } from "@shared/schema";
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
  app.post("/api/speed-tests", async (req, res) => {
    try {
      const speedTestData = insertSpeedTestSchema.parse(req.body);
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
