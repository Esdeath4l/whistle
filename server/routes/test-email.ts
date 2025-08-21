import { RequestHandler } from "express";
import { testEmailService, sendTestEmail } from "../email-service";
import { notifyNewReport } from "./notifications";
import { Report } from "@shared/api";

/**
 * Test endpoint to verify email configuration
 */
export const testEmailConfiguration: RequestHandler = async (req, res) => {
  try {
    console.log("Testing email configuration...");

    // Check if email is configured
    const isConfigured = await testEmailService();

    const result = {
      configured: isConfigured,
      EMAIL_USER: process.env.EMAIL_USER || "Not set",
      EMAIL_TO: process.env.EMAIL_TO || "Not set",
      EMAIL_APP_PASSWORD: process.env.EMAIL_APP_PASSWORD ? "****" : "Not set",
      ADMIN_DASHBOARD_URL: process.env.ADMIN_DASHBOARD_URL || "Not set",
    };

    console.log("Email configuration status:", result);

    res.json({
      success: true,
      message: "Email configuration test completed",
      config: result,
    });
  } catch (error) {
    console.error("Email configuration test failed:", error);
    res.status(500).json({
      success: false,
      error: "Email configuration test failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Test endpoint to send a test email
 */
export const sendTestEmailNotification: RequestHandler = async (req, res) => {
  try {
    console.log("Attempting to send test email...");

    const testSent = await sendTestEmail();

    if (testSent) {
      res.json({
        success: true,
        message: "Test email sent successfully",
      });
    } else {
      res.status(503).json({
        success: false,
        error: "Failed to send test email",
        message:
          "Email service may not be configured properly. Check EMAIL_APP_PASSWORD environment variable.",
      });
    }
  } catch (error) {
    console.error("Test email failed:", error);
    res.status(500).json({
      success: false,
      error: "Test email failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Test endpoint to simulate an urgent report notification
 */
export const testUrgentNotification: RequestHandler = async (req, res) => {
  try {
    console.log("Testing urgent report notification...");

    // Create a test urgent report
    const testReport: Report = {
      id: `test_urgent_${Date.now()}`,
      message:
        "This is a test urgent harassment report to verify the notification system",
      category: "harassment",
      severity: "urgent",
      status: "pending",
      created_at: new Date().toISOString(),
      is_encrypted: false,
    };

    // Trigger the notification system
    notifyNewReport(testReport);

    res.json({
      success: true,
      message: "Urgent notification test triggered",
      reportId: testReport.id,
      note: "Check server logs for email sending results",
    });
  } catch (error) {
    console.error("Urgent notification test failed:", error);
    res.status(500).json({
      success: false,
      error: "Urgent notification test failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
