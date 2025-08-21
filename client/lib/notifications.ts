import { toast } from "@/components/ui/use-toast";

export interface NotificationConfig {
  title: string;
  description: string;
  type: "info" | "success" | "warning" | "error";
  duration?: number;
}

export class NotificationService {
  private static instance: NotificationService;
  private eventSource: EventSource | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private notificationsEnabled = true;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Show in-app toast notification
   */
  showToast(config: NotificationConfig) {
    toast({
      title: config.title,
      description: config.description,
      duration: config.duration || 5000,
      variant: config.type === "error" ? "destructive" : "default",
    });
  }

  /**
   * Send browser push notification (requires permission)
   */
  async sendPushNotification(title: string, body: string, icon?: string) {
    if (!("Notification" in window)) {
      console.warn("This browser does not support notifications");
      return;
    }

    let permission = Notification.permission;

    if (permission === "default") {
      permission = await Notification.requestPermission();
    }

    if (permission === "granted") {
      new Notification(title, {
        body,
        icon: icon || "/favicon.ico",
        badge: "/favicon.ico",
        tag: "whistle-notification",
        requireInteraction: true,
      });
    }
  }

  /**
   * Play notification sound
   */
  playNotificationSound() {
    try {
      // Create audio context for notification sound
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();

      // Create a simple notification beep
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(
        400,
        audioContext.currentTime + 0.3,
      );

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.3,
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.warn("Could not play notification sound:", error);
    }
  }

  /**
   * Setup real-time notifications via Server-Sent Events
   */
  setupRealtimeNotifications(adminToken: string) {
    // Skip if notifications are disabled
    if (!this.notificationsEnabled) {
      console.log("Notifications are disabled, skipping setup");
      return;
    }

    // Skip if not in browser environment
    if (typeof window === "undefined" || typeof EventSource === "undefined") {
      console.log("SSE not supported in this environment");
      return;
    }

    if (this.eventSource) {
      this.eventSource.close();
    }

    try {
      this.eventSource = new EventSource(
        `/api/notifications/stream?token=${encodeURIComponent(adminToken)}`,
      );

      this.eventSource.onopen = () => {
        console.log("Real-time notifications connected");
        this.reconnectAttempts = 0;
        this.showToast({
          title: "🔔 Notifications Active",
          description: "Real-time alerts enabled for new reports",
          type: "success",
        });
      };

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleNotificationEvent(data);
        } catch (error) {
          console.error("Failed to parse notification data:", error);
        }
      };

      this.eventSource.onerror = (error) => {
        console.warn("Notification stream connection issue:", error);

        // Only show error if we're not already attempting to reconnect
        if (this.reconnectAttempts === 0) {
          this.showToast({
            title: "⚠️ Notification Connection Issue",
            description: "Attempting to reconnect to notification stream...",
            type: "warning",
            duration: 3000,
          });
        }

        this.eventSource?.close();
        this.attemptReconnect(adminToken);
      };
    } catch (error) {
      console.error("Failed to setup real-time notifications:", error);
      this.showToast({
        title: "❌ Notification Setup Failed",
        description:
          "Could not establish notification connection. Some features may be limited.",
        type: "error",
        duration: 5000,
      });
    }
  }

  private handleNotificationEvent(data: any) {
    switch (data.type) {
      case "new_report":
        this.handleNewReportNotification(data);
        break;
      case "urgent_report":
        this.handleUrgentReportNotification(data);
        break;
      case "email_sent":
        this.handleEmailStatusNotification(data, "success");
        break;
      case "email_warning":
        this.handleEmailStatusNotification(data, "warning");
        break;
      case "email_error":
        this.handleEmailStatusNotification(data, "error");
        break;
      case "test":
        this.handleTestNotification(data);
        break;
      case "connected":
      case "heartbeat":
        // Ignore connection/heartbeat messages
        break;
      default:
        console.log("Unknown notification type:", data.type, data);
    }
  }

  private handleTestNotification(data: any) {
    this.showToast({
      title: "🧪 Test Notification",
      description: data.message || "Test notification received successfully",
      type: "info",
      duration: 3000,
    });
  }

  private handleNewReportNotification(data: any) {
    const { reportId, category, severity } = data;

    // Show toast notification
    this.showToast({
      title: "🚨 New Report Received",
      description: `${category} report (${severity} priority) - ID: ${reportId}`,
      type: "info",
      duration: 8000,
    });

    // Send browser notification
    this.sendPushNotification(
      "New Harassment Report",
      `A new ${category} report has been submitted with ${severity} priority.`,
    );

    // Play notification sound
    this.playNotificationSound();

    // Update document title for attention
    this.updateDocumentTitle("🚨 New Report");
  }

  private handleUrgentReportNotification(data: any) {
    const { reportId, category, severity, status, message } = data;

    // Show urgent toast notification
    this.showToast({
      title: "🚨 URGENT REPORT",
      description: `${message || 'Emergency report'} - ${category} (${severity}) - ID: ${reportId}`,
      type: "error",
      duration: 20000, // Longer duration for urgent reports
    });

    // Send urgent browser notification
    this.sendPushNotification(
      "🚨 URGENT: Whistle Alert",
      `Emergency ${category} report (${severity}) requires immediate attention. Click to view dashboard.`,
      "/favicon.ico"
    );

    // Play urgent notification sound (multiple beeps)
    this.playUrgentSound();

    // Flash document title
    this.flashDocumentTitle("🚨 URGENT REPORT");

    console.log(`URGENT notification processed for report ${reportId}:`, {
      category,
      severity,
      status,
      timestamp: data.timestamp
    });
  }

  private playUrgentSound() {
    // Play 3 quick beeps for urgent notifications
    for (let i = 0; i < 3; i++) {
      setTimeout(() => this.playNotificationSound(), i * 400);
    }

    // Additional longer beep after 2 seconds
    setTimeout(() => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 1);
      } catch (error) {
        console.warn("Could not play urgent sound:", error);
      }
    }, 2000);
  }

  private updateDocumentTitle(prefix: string) {
    const originalTitle = document.title;
    document.title = `${prefix} - ${originalTitle}`;

    setTimeout(() => {
      document.title = originalTitle;
    }, 10000);
  }

  private flashDocumentTitle(urgentText: string) {
    const originalTitle = document.title;
    let flashCount = 0;
    const maxFlashes = 10;

    const flashInterval = setInterval(() => {
      document.title = flashCount % 2 === 0 ? urgentText : originalTitle;
      flashCount++;

      if (flashCount >= maxFlashes) {
        clearInterval(flashInterval);
        document.title = originalTitle;
      }
    }, 1000);
  }

  private attemptReconnect(adminToken: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(Math.pow(2, this.reconnectAttempts) * 1000, 30000); // Cap at 30 seconds

      console.log(
        `Attempting to reconnect notifications in ${delay / 1000}s (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`,
      );

      setTimeout(() => {
        if (this.reconnectAttempts <= this.maxReconnectAttempts) {
          this.setupRealtimeNotifications(adminToken);
        }
      }, delay);
    } else {
      console.log("Max reconnection attempts reached, disabling notifications");
      this.disableNotifications();
      this.showToast({
        title: "❌ Notifications Disabled",
        description:
          "Real-time notifications are temporarily disabled due to connection issues. The app will still function normally.",
        type: "error",
        duration: 8000,
      });
    }
  }

  /**
   * Disconnect real-time notifications
   */
  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.reconnectAttempts = 0;
  }

  /**
   * Disable real-time notifications
   */
  disableNotifications() {
    this.notificationsEnabled = false;
    this.disconnect();
  }

  /**
   * Re-enable real-time notifications
   */
  enableNotifications() {
    this.notificationsEnabled = true;
    this.reconnectAttempts = 0;
  }

  /**
   * Send email notification (server-side implementation)
   */
  async sendEmailNotification(reportData: any) {
    try {
      await fetch("/api/notifications/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reportData),
      });
    } catch (error) {
      console.error("Failed to send email notification:", error);
    }
  }

  /**
   * Send SMS notification (server-side implementation)
   */
  async sendSMSNotification(reportData: any) {
    try {
      await fetch("/api/notifications/sms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reportData),
      });
    } catch (error) {
      console.error("Failed to send SMS notification:", error);
    }
  }

  private handleEmailStatusNotification(data: any, status: "success" | "warning" | "error") {
    const { reportId, message } = data;

    switch (status) {
      case "success":
        this.showToast({
          title: "✅ Email Alert Sent",
          description: `Urgent email notification sent for report ${reportId}`,
          type: "success",
          duration: 5000,
        });
        break;
      case "warning":
        this.showToast({
          title: "⚠️ Email Not Configured",
          description: `Email service needs setup - urgent report ${reportId} requires attention`,
          type: "warning",
          duration: 10000,
        });
        break;
      case "error":
        this.showToast({
          title: "❌ Email Failed",
          description: `Failed to send email alert for report ${reportId}`,
          type: "error",
          duration: 8000,
        });
        break;
    }
  }
}

export const notificationService = NotificationService.getInstance();
