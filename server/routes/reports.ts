import { RequestHandler } from "express";
import {
  Report,
  CreateReportRequest,
  CreateReportResponse,
  GetReportsResponse,
  UpdateReportRequest,
  ReportStatus,
} from "@shared/api";
import { notifyNewReport } from "./notifications";

// In-memory storage for demo (replace with actual database in production)
let reports: Report[] = [];
let reportIdCounter = 1;

// Admin authentication for harassment reporting system
const ADMIN_USERNAME = "ritika";
const ADMIN_PASSWORD = "satoru 2624";

export const createReport: RequestHandler = (req, res) => {
  try {
    console.log("Received encrypted report submission"); // Debug log (no sensitive data)
    const {
      message,
      category,
      severity,
      photo_url,
      encrypted_data,
      is_encrypted,
    }: CreateReportRequest = req.body;

    // Handle both encrypted and plain text reports
    if (is_encrypted && encrypted_data) {
      // Encrypted report validation
      if (
        !encrypted_data.encryptedMessage ||
        !encrypted_data.encryptedCategory
      ) {
        console.log("Error: Encrypted data is incomplete");
        return res.status(400).json({ error: "Invalid encrypted data" });
      }
      console.log("Processing encrypted report");
    } else {
      // Plain text report validation
      if (!message || message.trim().length === 0) {
        console.log("Error: Message is required");
        return res.status(400).json({ error: "Message is required" });
      }

      if (!category) {
        console.log("Error: Category is required");
        return res.status(400).json({ error: "Category is required" });
      }

      const validCategories = [
        "harassment",
        "medical",
        "emergency",
        "safety",
        "feedback",
      ];
      if (!validCategories.includes(category)) {
        console.log("Error: Invalid category:", category);
        return res.status(400).json({ error: "Invalid category" });
      }
      console.log("Processing plain text report");
    }

    const validSeverities = ["low", "medium", "high", "urgent"];
    if (severity && !validSeverities.includes(severity)) {
      console.log("Error: Invalid severity:", severity);
      return res.status(400).json({ error: "Invalid severity level" });
    }

    const newReport: Report = {
      id: `report_${reportIdCounter++}`,
      message: is_encrypted ? "[ENCRYPTED]" : (message || "").trim(),
      category: is_encrypted
        ? ("harassment" as ReportCategory)
        : category || "feedback",
      severity: severity || "medium",
      photo_url: is_encrypted ? undefined : photo_url,
      created_at: new Date().toISOString(),
      status: "pending" as ReportStatus,
      encrypted_data: encrypted_data,
      is_encrypted: is_encrypted || false,
    };

    // Auto-flag urgent reports (check severity since category might be encrypted)
    if (severity === "urgent") {
      newReport.status = "flagged";
    }

    reports.push(newReport);
    console.log("Report created successfully:", newReport.id); // Debug log

    // Send real-time notification to admins
    notifyNewReport(newReport);

    const response: CreateReportResponse = {
      id: newReport.id,
      message: newReport.message,
      created_at: newReport.created_at,
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Error creating report:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getReports: RequestHandler = (req, res) => {
  try {
    // Simple admin check (in production, use proper JWT validation)
    const authHeader = req.headers.authorization;
    if (
      !authHeader ||
      authHeader !== `Bearer ${ADMIN_USERNAME}:${ADMIN_PASSWORD}`
    ) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { status } = req.query;

    let filteredReports = reports;
    if (status && typeof status === "string") {
      filteredReports = reports.filter((report) => report.status === status);
    }

    // Sort by newest first
    filteredReports.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    const response: GetReportsResponse = {
      reports: filteredReports,
      total: filteredReports.length,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getReportStatus: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;

    const report = reports.find((report) => report.id === id);
    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    // Return limited information for anonymous status check
    const statusInfo = {
      id: report.id,
      status: report.status,
      created_at: report.created_at,
      admin_response: report.admin_response || null,
      admin_response_at: report.admin_response_at || null,
    };

    res.json(statusInfo);
  } catch (error) {
    console.error("Error fetching report status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateReport: RequestHandler = (req, res) => {
  try {
    // Simple admin check
    const authHeader = req.headers.authorization;
    if (
      !authHeader ||
      authHeader !== `Bearer ${ADMIN_USERNAME}:${ADMIN_PASSWORD}`
    ) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    const { status, admin_response }: UpdateReportRequest = req.body;

    const reportIndex = reports.findIndex((report) => report.id === id);
    if (reportIndex === -1) {
      return res.status(404).json({ error: "Report not found" });
    }

    if (status) {
      reports[reportIndex].status = status;
    }

    if (admin_response !== undefined) {
      reports[reportIndex].admin_response = admin_response;
      reports[reportIndex].admin_response_at = new Date().toISOString();
    }

    res.json(reports[reportIndex]);
  } catch (error) {
    console.error("Error updating report:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const adminLogin: RequestHandler = (req, res) => {
  try {
    const { username, password } = req.body;

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      res.json({
        success: true,
        token: `${ADMIN_USERNAME}:${ADMIN_PASSWORD}`, // In production, generate proper JWT
      });
    } else {
      res
        .status(401)
        .json({ success: false, error: "Invalid username or password" });
    }
  } catch (error) {
    console.error("Error in admin login:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
