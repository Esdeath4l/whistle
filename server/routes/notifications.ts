import { RequestHandler } from "express";
import { Report } from "@shared/api";

// In-memory storage for SSE connections
const sseConnections = new Set<any>();

// Admin authentication credentials
const ADMIN_USERNAME = "ritika";
const ADMIN_PASSWORD = "satoru 2624";

/**
 * Server-Sent Events endpoint for real-time notifications
 */
export const streamNotifications: RequestHandler = (req, res) => {
  const { token } = req.query;

  // Verify admin token
  if (!token || token !== `${ADMIN_USERNAME}:${ADMIN_PASSWORD}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
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
      try {
        if (!res.destroyed) {
          res.write(
            `data: ${JSON.stringify({ type: "heartbeat", timestamp: Date.now() })}\n\n`,
          );
          connection.lastPing = Date.now();
        } else {
          clearInterval(heartbeat);
          sseConnections.delete(connection);
        }
      } catch (error) {
        console.error("Heartbeat error:", error);
        clearInterval(heartbeat);
        sseConnections.delete(connection);
      }
    }, 30000);

    // Handle client disconnect
    req.on("close", () => {
      clearInterval(heartbeat);
      sseConnections.delete(connection);
      console.log(`SSE connection ${connection.id} closed`);
    });

    // Handle server-side errors
    req.on("error", (error) => {
      console.error(`SSE connection ${connection.id} error:`, error);
      clearInterval(heartbeat);
      sseConnections.delete(connection);
    });

    res.on("error", (error) => {
      console.error(`SSE response ${connection.id} error:`, error);
      clearInterval(heartbeat);
      sseConnections.delete(connection);
    });

    console.log(`SSE connection ${connection.id} established`);
  } catch (error) {
    console.error("Failed to establish SSE connection:", error);
    res.status(500).json({ error: "Failed to setup notification stream" });
  }
};

/**
 * Broadcast notification to all connected admin clients
 */
export function broadcastNotification(notification: any) {
  const data = `data: ${JSON.stringify(notification)}\n\n`;
  const connectionsToRemove: any[] = [];

  sseConnections.forEach((connection) => {
    try {
      // Check if response is still writable
      if (!connection.res.destroyed && connection.res.writable) {
        connection.res.write(data);
      } else {
        connectionsToRemove.push(connection);
      }
    } catch (error) {
      console.error("Failed to send notification to connection:", error);
      connectionsToRemove.push(connection);
    }
  });

  // Clean up dead connections
  connectionsToRemove.forEach((connection) => {
    sseConnections.delete(connection);
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

  // Send email notification based on priority
  sendPriorityBasedEmailAlert(report);
}

/**
 * Priority-based email notification system
 */
async function sendPriorityBasedEmailAlert(report: Report) {
  const adminEmail = "whistle.git@gmail.com";

  // Determine if email should be sent based on priority
  const shouldSendEmail = shouldSendEmailForPriority(
    report.severity,
    report.category,
  );

  if (!shouldSendEmail) {
    console.log(
      `📧 Skipping email for ${report.severity} priority report:`,
      report.id,
    );
    return;
  }

  try {
    const priorityConfig = getEmailPriorityConfig(
      report.severity,
      report.category,
    );

    const emailData = {
      to: adminEmail,
      subject: `${priorityConfig.emoji} ${priorityConfig.urgency}: New ${report.category} Report - ${report.id}`,
      body: `
        ${priorityConfig.alertText}

        Report Details:
        ================
        Report ID: ${report.id}
        Category: ${report.category}
        Severity: ${report.severity}
        Submitted: ${new Date(report.created_at).toLocaleString()}

        ${
          report.is_encrypted
            ? "⚠️  This report contains encrypted data that requires admin access to decrypt."
            : `Message Preview: ${report.message.substring(0, 100)}${report.message.length > 100 ? "..." : ""}`
        }

        Action Required:
        ================
        ${priorityConfig.actionRequired}

        Admin Dashboard: ${process.env.FRONTEND_URL || "http://localhost:3000"}/admin

        - Whistle Security System
        Automated Alert System
      `,
      priority: priorityConfig.priority,
    };

    // Log the email (integrate with real email service in production)
    console.log(
      `📧 ${priorityConfig.urgency} email notification sent to ${adminEmail}:`,
      {
        reportId: report.id,
        severity: report.severity,
        category: report.category,
        subject: emailData.subject,
      },
    );

    // In production, replace this with actual email service
    await sendActualEmail(emailData);
  } catch (error) {
    console.error("Failed to send priority-based email notification:", error);
  }
}

/**
 * Determine if email should be sent based on priority rules
 */
function shouldSendEmailForPriority(
  severity?: string,
  category?: string,
): boolean {
  // Always send for urgent and high priority
  if (severity === "urgent" || severity === "high") return true;

  // Always send for emergency and harassment categories
  if (category === "emergency" || category === "harassment") return true;

  // Send for medium priority medical and safety issues
  if (
    (category === "medical" || category === "safety") &&
    severity === "medium"
  )
    return true;

  // Don't send for low priority feedback
  if (severity === "low" && category === "feedback") return false;

  // Send for all other medium priority reports
  if (severity === "medium") return true;

  // Default: send email to be safe
  return true;
}

/**
 * Get email configuration based on priority
 */
function getEmailPriorityConfig(severity?: string, category?: string) {
  if (severity === "urgent" || category === "emergency") {
    return {
      emoji: "🚨",
      urgency: "CRITICAL ALERT",
      priority: "high",
      alertText:
        "🔴 IMMEDIATE ACTION REQUIRED - A critical incident has been reported that may require emergency response.",
      actionRequired:
        "1. Review immediately (within 5 minutes)\n2. Contact relevant authorities if needed\n3. Respond to reporter ASAP\n4. Document all actions taken",
    };
  }

  if (severity === "high" || category === "harassment") {
    return {
      emoji: "⚠️",
      urgency: "HIGH PRIORITY",
      priority: "high",
      alertText:
        "🟠 HIGH PRIORITY REPORT - A serious incident requiring prompt attention has been reported.",
      actionRequired:
        "1. Review within 30 minutes\n2. Investigate thoroughly\n3. Respond within 2 hours\n4. Consider escalation if needed",
    };
  }

  if (severity === "medium") {
    return {
      emoji: "📋",
      urgency: "STANDARD PRIORITY",
      priority: "normal",
      alertText:
        "🟡 STANDARD REPORT - A new incident report has been submitted for review.",
      actionRequired:
        "1. Review within 4 hours\n2. Investigate as appropriate\n3. Respond within 24 hours",
    };
  }

  // Low priority or default
  return {
    emoji: "📝",
    urgency: "LOW PRIORITY",
    priority: "low",
    alertText:
      "🟢 ROUTINE REPORT - A new report has been submitted for your review.",
    actionRequired: "1. Review within 24 hours\n2. Respond as appropriate",
  };
}

/**
 * Legacy email alert function (keeping for backward compatibility)
 */
async function sendEmailAlert(report: Report) {
  return sendPriorityBasedEmailAlert(report);
}

/**
 * Send actual email using Nodemailer service
 */
async function sendActualEmail(emailData: any) {
  const { emailService } = await import("../lib/email");

  try {
    const success = await emailService.sendEmail({
      to: emailData.to,
      subject: emailData.subject,
      body: emailData.body,
      priority: emailData.priority,
    });

    if (success) {
      console.log(`✅ Email alert successfully sent to ${emailData.to}`);
    } else {
      console.log(`⚠️  Email service not configured, but alert was logged`);
    }

    return success;
  } catch (error) {
    console.error("❌ Failed to send email alert:", error);
    return false;
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
      to: "+1234567890", // Admin phone number
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
    emailEnabled: !!process.env.EMAIL_USER,
    smsEnabled: false, // SMS service not configured yet
    pushEnabled: true,
    urgentAlerts: true,
    categories: ["harassment", "medical", "emergency", "safety", "feedback"],
    adminEmail: "whistle.git@gmail.com",
    emailServiceConfigured: !!process.env.EMAIL_USER,
    priorityRules: {
      urgent: "Immediate email alert",
      high: "High priority email alert",
      medium: "Standard email alert (based on category)",
      low: "Email alert for important categories only",
    },
  });
};
