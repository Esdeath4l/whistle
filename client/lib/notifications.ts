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

      this.eventSource.onerror = () => {
        console.error("Notification stream error");
        this.eventSource?.close();
        this.attemptReconnect(adminToken);
      };
    } catch (error) {
      console.error("Failed to setup real-time notifications:", error);
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
      default:
        console.log("Unknown notification type:", data.type);
    }
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
    const { reportId, category } = data;

    // Show urgent toast notification
    this.showToast({
      title: "🚨 URGENT REPORT",
      description: `Emergency ${category} report requires immediate attention - ID: ${reportId}`,
      type: "error",
      duration: 15000,
    });

    // Send urgent browser notification
    this.sendPushNotification(
      "🚨 URGENT: Harassment Report",
      `An emergency ${category} report requires immediate attention.`,
    );

    // Play urgent notification sound (multiple beeps)
    this.playUrgentSound();

    // Flash document title
    this.flashDocumentTitle("🚨 URGENT REPORT");
  }

  private playUrgentSound() {
    // Play 3 quick beeps for urgent notifications
    for (let i = 0; i < 3; i++) {
      setTimeout(() => this.playNotificationSound(), i * 400);
    }
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
      const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff

      console.log(
        `Attempting to reconnect notifications in ${delay}ms (attempt ${this.reconnectAttempts})`,
      );

      setTimeout(() => {
        this.setupRealtimeNotifications(adminToken);
      }, delay);
    } else {
      this.showToast({
        title: "❌ Notifications Disconnected",
        description:
          "Unable to connect to real-time notifications. Please refresh the page.",
        type: "error",
        duration: 10000,
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
}

export const notificationService = NotificationService.getInstance();
