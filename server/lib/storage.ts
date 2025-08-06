import { Report } from "@shared/api";
import fs from "fs";
import path from "path";

interface StorageAdapter {
  loadReports(): Report[];
  saveReports(reports: Report[]): void;
}

class FileStorageAdapter implements StorageAdapter {
  private dataDir: string;
  private reportsFile: string;

  constructor() {
    this.dataDir = process.env.NODE_ENV === "production" 
      ? path.join("/tmp", "whistle-data")
      : path.join(process.cwd(), "server", "data");
    this.reportsFile = path.join(this.dataDir, "reports.json");
    
    // Ensure data directory exists
    if (!fs.existsSync(this.dataDir)) {
      try {
        fs.mkdirSync(this.dataDir, { recursive: true });
        console.log("Created data directory:", this.dataDir);
      } catch (error) {
        console.error("Failed to create data directory:", error);
      }
    }
  }

  loadReports(): Report[] {
    try {
      console.log("Loading reports from:", this.reportsFile);
      if (fs.existsSync(this.reportsFile)) {
        const data = fs.readFileSync(this.reportsFile, "utf8");
        const loadedReports = JSON.parse(data);
        console.log(`Loaded ${loadedReports.length} reports from file`);
        return loadedReports;
      } else {
        console.log("Reports file does not exist, starting with empty array");
      }
    } catch (error) {
      console.error("Error loading reports from file:", error);
    }
    return [];
  }

  saveReports(reports: Report[]): void {
    try {
      console.log(`Saving ${reports.length} reports to:`, this.reportsFile);
      fs.writeFileSync(this.reportsFile, JSON.stringify(reports, null, 2));
      console.log("Reports saved successfully");
    } catch (error) {
      console.error("Error saving reports to file:", error);
      console.error("File path:", this.reportsFile);
      console.error("Directory exists:", fs.existsSync(this.dataDir));
    }
  }
}

// In production with limited file persistence, we could use environment variables as backup
class EnvStorageAdapter implements StorageAdapter {
  loadReports(): Report[] {
    try {
      const reportsJson = process.env.WHISTLE_REPORTS;
      if (reportsJson) {
        const reports = JSON.parse(reportsJson);
        console.log(`Loaded ${reports.length} reports from environment variable`);
        return reports;
      }
    } catch (error) {
      console.error("Error loading reports from environment:", error);
    }
    return [];
  }

  saveReports(reports: Report[]): void {
    try {
      // Note: This won't persist across deployments, but it's a fallback
      process.env.WHISTLE_REPORTS = JSON.stringify(reports);
      console.log(`Saved ${reports.length} reports to environment variable`);
    } catch (error) {
      console.error("Error saving reports to environment:", error);
    }
  }
}

// Storage factory
export function createStorageAdapter(): StorageAdapter {
  // Use environment variable storage if explicitly requested
  if (process.env.WHISTLE_USE_ENV_STORAGE === "true") {
    console.log("Using environment variable storage");
    return new EnvStorageAdapter();
  }
  
  // Default to file storage
  console.log("Using file storage");
  return new FileStorageAdapter();
}

// Global storage instance
export const storage = createStorageAdapter();
