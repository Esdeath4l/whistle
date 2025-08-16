import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import {
  createReport,
  getReports,
  updateReport,
  adminLogin,
  getReportStatus,
} from "./routes/reports";
import {
  streamNotifications,
  sendEmailNotification,
  sendSMSNotification,
  getNotificationSettings,
} from "./routes/notifications";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: "10mb" })); // Increased limit for image uploads
  app.use(express.urlencoded({ extended: true }));

  // Legacy routes
  app.get("/api/ping", (_req, res) => {
    res.json({ message: "Hello from Whistle server!" });
  });
  app.get("/api/debug", (_req, res) => {
    const fs = require("fs");
    const path = require("path");

    const dataDir =
      process.env.NODE_ENV === "production"
        ? path.join("/tmp", "whistle-data")
        : path.join(process.cwd(), "server", "data");
    const reportsFile = path.join(dataDir, "reports.json");

    res.json({
      message: "Debug info",
      environment: process.env.NODE_ENV || "development",
      dataDir,
      reportsFile,
      dataDirExists: fs.existsSync(dataDir),
      reportsFileExists: fs.existsSync(reportsFile),
      emailConfigured: !!process.env.EMAIL_USER,
      emailUser: process.env.EMAIL_USER
        ? `${process.env.EMAIL_USER.split("@")[0]}@***`
        : "not configured",
      cwd: process.cwd(),
      timestamp: new Date().toISOString(),
    });
  });

  // Email test endpoint (admin only)
  app.post("/api/test-email", async (req, res) => {
    try {
      const { emailService } = await import("./lib/email");

      // Simple admin check
      const authHeader = req.headers.authorization;
      if (!authHeader || authHeader !== `Bearer ritika:satoru 2624`) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const testResult = await emailService.testConnection();

      if (testResult) {
        // Send test email
        const success = await emailService.sendEmail({
          to: "whistle.git@gmail.com",
          subject: "🧪 Whistle Email Test - Configuration Successful",
          body: `Email service test successful!

This is a test email to confirm that the Whistle email alert system is working correctly.

Test Details:
=============
- Email service: Configured and working
- Admin email: whistle.git@gmail.com
- Test time: ${new Date().toLocaleString()}

If you received this email, priority-based alerts are now active for:
- 🚨 URGENT: Critical incidents (immediate notification)
- ⚠️  HIGH: Harassment reports and high priority incidents
- 📋 MEDIUM: Standard reports (based on category)
- 📝 LOW: Routine reports for important categories

The email alert system is now ready to notify you of new reports based on their priority level.

- Whistle Security System`,
          priority: "normal",
        });

        res.json({
          success: true,
          message: "Email test successful",
          emailSent: success,
          emailConfigured: true,
        });
      } else {
        res.json({
          success: false,
          message: "Email service not configured or connection failed",
          emailConfigured: false,
          help: "Set EMAIL_USER and EMAIL_PASS environment variables",
        });
      }
    } catch (error) {
      console.error("Email test error:", error);
      res.status(500).json({
        error: "Email test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });
  app.get("/api/demo", handleDemo);

  // Whistle API routes
  app.post("/api/reports", createReport);
  app.get("/api/reports", getReports);
  app.get("/api/reports/:id/status", getReportStatus); // Anonymous status check
  app.put("/api/reports/:id", updateReport);
  app.post("/api/admin/login", adminLogin);

  // Notification routes
  app.get("/api/notifications/stream", streamNotifications);
  app.post("/api/notifications/email", sendEmailNotification);
  app.post("/api/notifications/sms", sendSMSNotification);
  app.get("/api/notifications/settings", getNotificationSettings);

  return app;
}
