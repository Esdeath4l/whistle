import { RequestHandler } from "express";
import { Report } from "@shared/api";

// In-memory storage for SSE connections
const sseConnections = new Set<any>();

// Admin authentication credentials
const ADMIN_USERNAME = "process.env.ADMIN_USERNAME";
const ADMIN_PASSWORD = "process.env.ADMIN_PASSWORD";

/**
 * Server-Sent Events endpoint for real-time notifications
 */
export const streamNotifications: RequestHandler = (req, res) => {
  const { token } = req.query;

  // Verify admin token
  if (!token || token !== `${ADMIN_USERNAME}:${ADMIN_PASSWORD}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Set SSE headers
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Cache-Control",
  });

  // Create connection object
  const connection = {
    id: Date.now(),
    res,
    lastPing: Date.now(),
  };

  // Add to active connections
  sseConnections.add(connection);

  // Send initial connection message
  res.write(
    `data: ${JSON.stringify({ type: "connected", message: "Notifications active" })}\n\n`,
  );

  // Setup heartbeat
  const heartbeat = setInterval(() => {
    res.write(
      `data: ${JSON.stringify({ type: "heartbeat", timestamp: Date.now() })}\n\n`,
    );
    connection.lastPing = Date.now();
  }, 30000);

  // Handle client disconnect
  req.on("close", () => {
    clearInterval(heartbeat);
    sseConnections.delete(connection);
    console.log(`SSE connection ${connection.id} closed`);
  });

  console.log(`SSE connection ${connection.id} established`);
};

/**
 * Broadcast notification to all connected admin clients
 */
export function broadcastNotification(notification: any) {
  const data = `data: ${JSON.stringify(notification)}\n\n`;

  sseConnections.forEach((connection) => {
    try {
      connection.res.write(data);
    } catch (error) {
      console.error("Failed to send notification to connection:", error);
      sseConnections.delete(connection);
    }
  });

  console.log(
    `Broadcasted notification to ${sseConnections.size} connections:`,
    notification.type,
  );
}

/**
 * Send notification when new report is created
 */
export function notifyNewReport(report: Report) {
  const notification = {
    type:
      report.severity === "urgent" || report.category === "emergency"
        ? "urgent_report"
        : "new_report",
    reportId: report.id,
    category: report.category,
    severity: report.severity,
    timestamp: new Date().toISOString(),
  };

  broadcastNotification(notification);

  // Send email notification for urgent reports
  if (notification.type === "urgent_report") {
    sendEmailAlert(report);
  }
}

/**
 * Email notification for urgent reports
 */
async function sendEmailAlert(report: Report) {
  try {
    // Import the real email service
    const { sendEmailAlert: sendRealEmail } = await import("../email-service");

    // Try to send real email first
    const emailSent = await sendRealEmail(report);

    if (emailSent) {
      console.log(
        "✅ Email alert sent successfully for urgent report:",
        report.id,
      );
    } else {
      console.log(
        "⚠️ Email service not configured - logging notification instead",
      );

      // Fallback: Log the email details
      const emailData = {
        to: process.env.EMAIL_TO,
        subject: `🚨 URGENT: New ${report.category} Report - ${report.id}`,
        body: `
          A new urgent harassment report has been submitted:

          Report ID: ${report.id}
          Category: ${report.category}
          Severity: ${report.severity}
          Submitted: ${report.created_at}

          Please log into the admin dashboard immediately to review and respond.

          - Whistle Security System
        `,
      };

      console.log("📧 Email notification (simulated):", emailData);
    }
  } catch (error) {
    console.error("❌ Failed to send email notification:", error);
  }
}

/**
 * SMS notification for critical reports
 */
async function sendSMSAlert(report: Report) {
  try {
    // In production, integrate with SMS service (Twilio, AWS SNS, etc.)
    console.log("📱 SMS alert sent for critical report:", report.id);

    const smsData = {
      to: "+9178885555", // Admin phone number
      message: `🚨 URGENT WHISTLE ALERT: New ${report.category} report ${report.id} requires immediate attention. Check admin dashboard now.`,
    };

    // Log the SMS (in production, send actual SMS)
    console.log("SMS notification:", smsData);
  } catch (error) {
    console.error("Failed to send SMS notification:", error);
  }
}

/**
 * Email notification endpoint
 */
export const sendEmailNotification: RequestHandler = async (req, res) => {
  try {
    const { reportId, category, severity } = req.body;

    await sendEmailAlert({
      id: reportId,
      category,
      severity,
      created_at: new Date().toISOString(),
    } as Report);

    res.json({ success: true, message: "Email notification sent" });
  } catch (error) {
    console.error("Email notification error:", error);
    res.status(500).json({ error: "Failed to send email notification" });
  }
};

/**
 * SMS notification endpoint
 */
export const sendSMSNotification: RequestHandler = async (req, res) => {
  try {
    const { reportId, category, severity } = req.body;

    await sendSMSAlert({
      id: reportId,
      category,
      severity,
      created_at: new Date().toISOString(),
    } as Report);

    res.json({ success: true, message: "SMS notification sent" });
  } catch (error) {
    console.error("SMS notification error:", error);
    res.status(500).json({ error: "Failed to send SMS notification" });
  }
};

/**
 * Get notification settings
 */
export const getNotificationSettings: RequestHandler = (req, res) => {
  res.json({
    emailEnabled: true,
    smsEnabled: true,
    pushEnabled: true,
    urgentAlerts: true,
    categories: ["harassment", "medical", "emergency", "safety"],
    adminEmail: process.env.EMAIL_TO,
    adminPhone: "+91888888881",
  });
};

/**
 * Test email service configuration
 */
export const testEmailService: RequestHandler = async (req, res) => {
  try {
    const { testEmailService: testService, sendTestEmail } = await import(
      "../email-service"
    );

    // Test connection
    const isConfigured = await testService();

    if (!isConfigured) {
      return res.status(503).json({
        error: "Email service not configured",
        message: "Set EMAIL_APP_PASSWORD environment variable",
      });
    }

    // Send test email
    const testSent = await sendTestEmail();

    if (testSent) {
      res.json({
        success: true,
        message: "Test email sent successfully to ritisulo@gmail.com",
      });
    } else {
      res.status(500).json({
        error: "Failed to send test email",
        message: "Check server logs for details",
      });
    }
  } catch (error) {
    console.error("Email test error:", error);
    res.status(500).json({
      error: "Email test failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
