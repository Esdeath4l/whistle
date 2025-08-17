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
  testEmailService,
} from "./routes/notifications";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: "50mb" })); // Increased limit for video/image uploads
  app.use(express.urlencoded({ extended: true }));

  // Legacy routes
  app.get("/api/ping", (_req, res) => {
    res.json({ message: "Hello from Whistle server!" });
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
  app.post("/api/notifications/test-email", testEmailService);

  return app;
}
