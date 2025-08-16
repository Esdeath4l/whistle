import nodemailer from "nodemailer";

interface EmailData {
  to: string;
  subject: string;
  body: string;
  priority: "low" | "normal" | "high";
}

/**
 * Email service configuration
 */
class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured = false;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    try {
      // Check if email credentials are provided
      const emailUser = process.env.EMAIL_USER;
      const emailPass = process.env.EMAIL_PASS;
      const emailHost = process.env.EMAIL_HOST;
      const emailPort = process.env.EMAIL_PORT;

      if (emailUser && emailPass) {
        // Use custom SMTP settings if provided
        if (emailHost) {
          this.transporter = nodemailer.createTransporter({
            host: emailHost,
            port: parseInt(emailPort || "587"),
            secure: emailPort === "465", // true for 465, false for other ports
            auth: {
              user: emailUser,
              pass: emailPass,
            },
          });
        } else {
          // Auto-detect provider based on email domain
          this.transporter = nodemailer.createTransporter({
            service: this.getEmailService(emailUser),
            auth: {
              user: emailUser,
              pass: emailPass,
            },
          });
        }

        this.isConfigured = true;
        console.log("📧 Email service configured successfully");
      } else {
        console.log("📧 Email service not configured - missing credentials");
        console.log(
          "   Set EMAIL_USER and EMAIL_PASS environment variables to enable email alerts",
        );
      }
    } catch (error) {
      console.error("Failed to configure email service:", error);
    }
  }

  private getEmailService(email: string): string {
    const domain = email.split("@")[1]?.toLowerCase();

    const serviceMap: { [key: string]: string } = {
      "gmail.com": "gmail",
      "outlook.com": "outlook",
      "hotmail.com": "hotmail",
      "yahoo.com": "yahoo",
      "yahoo.co.uk": "yahoo",
      "icloud.com": "icloud",
    };

    return serviceMap[domain] || "gmail"; // Default to gmail
  }

  async sendEmail(emailData: EmailData): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      console.log("📧 Email service not configured - logging email instead:");
      console.log("   To:", emailData.to);
      console.log("   Subject:", emailData.subject);
      console.log("   Priority:", emailData.priority);
      console.log("   Body:", emailData.body.substring(0, 200) + "...");
      return false;
    }

    try {
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: emailData.to,
        subject: emailData.subject,
        text: emailData.body,
        html: this.convertToHtml(emailData.body, emailData.priority),
        priority: emailData.priority,
      });

      console.log("📧 Email sent successfully:", info.messageId);
      console.log("   To:", emailData.to);
      console.log("   Subject:", emailData.subject);
      return true;
    } catch (error) {
      console.error("📧 Failed to send email:", error);

      // Fallback: log the email content
      console.log("📧 Email content (fallback logging):");
      console.log("   To:", emailData.to);
      console.log("   Subject:", emailData.subject);
      console.log("   Priority:", emailData.priority);
      console.log("   Body:", emailData.body);

      return false;
    }
  }

  private convertToHtml(text: string, priority: string): string {
    const priorityColors = {
      high: "#dc2626", // red
      normal: "#ea580c", // orange
      low: "#16a34a", // green
    };

    const color =
      priorityColors[priority as keyof typeof priorityColors] ||
      priorityColors.normal;

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="border-left: 4px solid ${color}; padding-left: 20px; margin-bottom: 20px;">
          <h2 style="color: ${color}; margin: 0 0 10px 0;">Whistle Security Alert</h2>
          <p style="color: #666; margin: 0; font-size: 14px;">Priority: ${priority.toUpperCase()}</p>
        </div>
        
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <pre style="white-space: pre-wrap; font-family: Arial, sans-serif; margin: 0; line-height: 1.6;">${text}</pre>
        </div>
        
        <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #666; font-size: 12px;">
          <p>This is an automated alert from the Whistle Security System</p>
          <p>Report Date: ${new Date().toLocaleString()}</p>
        </div>
      </div>
    `;
  }

  async testConnection(): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      console.log("📧 Email connection test successful");
      return true;
    } catch (error) {
      console.error("📧 Email connection test failed:", error);
      return false;
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();

// Export types
export type { EmailData };
