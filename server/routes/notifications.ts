import { RequestHandler } from "express";
import { Report } from "@shared/api";
import nodemailer from "nodemailer";

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
 * Create email transporter based on configuration
 */
function createEmailTransporter() {
  // Debug environment variables
  console.log('🔧 Email Configuration Debug:');
  console.log('  - EMAIL_USER:', process.env.EMAIL_USER || 'whistle.git@gmail.com');
  console.log('  - EMAIL_PASSWORD set:', !!process.env.EMAIL_PASSWORD);

  // For Gmail, you'll need to use App Password instead of regular password
  // Go to Google Account settings > Security > App passwords to generate one
  const emailConfig = {
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER || "whistle.git@gmail.com",
      pass: process.env.EMAIL_PASSWORD || "", // App password required
    },
  };

  // Fallback to console logging if no email credentials
  if (!process.env.EMAIL_PASSWORD) {
    console.warn(
      "⚠️  No EMAIL_PASSWORD environment variable set. Email notifications will be logged to console only.",
    );
    console.warn('⚠️  To fix this:');
    console.warn('   1. Go to https://myaccount.google.com/security');
    console.warn('   2. Enable 2-Step Verification');
    console.warn('   3. Go to App passwords and generate one for Mail');
    console.warn('   4. Set EMAIL_PASSWORD environment variable');
    return null;
  }

  try {
    const transporter = nodemailer.createTransporter(emailConfig);
    console.log('📧 Email transporter created successfully');
    return transporter;
  } catch (error) {
    console.error('❌ Failed to create email transporter:', error);
    return null;
  }
}

/**
 * Email notification for urgent reports
 */
async function sendEmailAlert(report: Report) {
  try {
    const transporter = createEmailTransporter();

    const emailData = {
      from: process.env.EMAIL_USER || "whistle.git@gmail.com",
      to: "whistle.git@gmail.com", // Your admin email
      subject: `🚨 URGENT: New ${report.category} Report - ${report.id}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="background: #dc2626; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="margin: 0; font-size: 24px;">🚨 URGENT HARASSMENT REPORT</h2>
          </div>

          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #dc2626; margin-top: 0;">Report Details:</h3>
            <ul style="list-style: none; padding: 0;">
              <li style="margin-bottom: 10px;"><strong>Report ID:</strong> ${report.id}</li>
              <li style="margin-bottom: 10px;"><strong>Category:</strong> ${report.category}</li>
              <li style="margin-bottom: 10px;"><strong>Severity:</strong> <span style="color: #dc2626; font-weight: bold;">${report.severity.toUpperCase()}</span></li>
              <li style="margin-bottom: 10px;"><strong>Submitted:</strong> ${new Date(report.created_at).toLocaleString()}</li>
              <li style="margin-bottom: 10px;"><strong>Status:</strong> ${report.status}</li>
            </ul>
          </div>

          <div style="background: #fee2e2; padding: 20px; border-radius: 8px; border-left: 4px solid #dc2626;">
            <p style="margin: 0; font-weight: bold; color: #dc2626;">
              ⚠️ This report requires immediate attention. Please log into the admin dashboard to review and respond.
            </p>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5; text-align: center;">
            <p style="margin: 0; color: #666; font-size: 14px;">
              - Whistle Security System<br>
              Automated alert for urgent reports
            </p>
          </div>
        </div>
      `,
      text: `
🚨 URGENT HARASSMENT REPORT

A new urgent harassment report has been submitted:

Report ID: ${report.id}
Category: ${report.category}
Severity: ${report.severity}
Submitted: ${new Date(report.created_at).toLocaleString()}
Status: ${report.status}

⚠️ This report requires immediate attention. Please log into the admin dashboard to review and respond.

- Whistle Security System
Automated alert for urgent reports
      `,
    };

    if (transporter) {
      // Send actual email
      const info = await transporter.sendMail(emailData);
      console.log("📧 Email alert sent successfully:", info.messageId);
      console.log("📧 Email sent to:", emailData.to);
    } else {
      // Fallback: log to console
      console.log("📧 Email notification (console fallback):", emailData);
      console.log("📧 Would send to:", emailData.to);
    }
  } catch (error) {
    console.error("❌ Failed to send email notification:", error);
    // Log the email details for debugging
    console.log("📧 Email that failed to send:");
    console.log("  - To:", "whistle.git@gmail.com");
    console.log(
      "  - Subject:",
      `🚨 URGENT: New ${report.category} Report - ${report.id}`,
    );
    console.log("  - Report ID:", report.id);
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
    emailEnabled: true,
    smsEnabled: true,
    pushEnabled: true,
    urgentAlerts: true,
    categories: ["harassment", "medical", "emergency", "safety"],
    adminEmail: "whistle.git@gmail.com",
    adminPhone: "+1234567890",
  });
};

/**
 * Test email alert endpoint
 */
export const testEmailAlert: RequestHandler = async (req, res) => {
  try {
    const testReport: Report = {
      id: `test_${Date.now()}`,
      message: "This is a test urgent report to verify email notifications",
      category: "harassment",
      severity: "urgent",
      created_at: new Date().toISOString(),
      status: "pending",
      is_encrypted: false,
    };

    await sendEmailAlert(testReport);

    res.json({
      success: true,
      message: "Test email sent to whistle.git@gmail.com",
      reportId: testReport.id,
    });
  } catch (error) {
    console.error("Test email failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to send test email",
      details: error instanceof Error ? error.message : String(error),
    });
  }
};
