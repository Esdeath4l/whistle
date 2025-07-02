import { RequestHandler } from "express";
import {
  Report,
  CreateReportRequest,
  CreateReportResponse,
  GetReportsResponse,
  UpdateReportRequest,
  ReportStatus,
} from "@shared/api";

// In-memory storage for demo (replace with actual database in production)
let reports: Report[] = [];
let reportIdCounter = 1;

// Admin authentication for harassment reporting system
const ADMIN_USERNAME = "ritika";
const ADMIN_PASSWORD = "satoru 2624";

export const createReport: RequestHandler = (req, res) => {
  try {
    const { message, photo_url }: CreateReportRequest = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: "Message is required" });
    }

    const newReport: Report = {
      id: `report_${reportIdCounter++}`,
      message: message.trim(),
      photo_url,
      created_at: new Date().toISOString(),
      status: "pending" as ReportStatus,
    };

    reports.push(newReport);

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
