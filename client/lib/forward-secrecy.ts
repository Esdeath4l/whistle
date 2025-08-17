import { secureE2EE } from "./secure-encryption";

/**
 * Perfect Forward Secrecy Manager
 * Implements automatic key rotation and cleanup for maximum security
 */

export interface SessionMetrics {
  sessionsCreated: number;
  sessionsCleared: number;
  averageSessionDuration: number;
  lastKeyRotation: number;
}

export class ForwardSecrecyManager {
  private static instance: ForwardSecrecyManager;
  private sessionMetrics: SessionMetrics;
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  private readonly MAX_SESSION_DURATION = 2 * 60 * 60 * 1000; // 2 hours
  private keyRotationTimer: NodeJS.Timeout | null = null;
  private sessionStartTime: number = 0;

  private constructor() {
    this.sessionMetrics = {
      sessionsCreated: 0,
      sessionsCleared: 0,
      averageSessionDuration: 0,
      lastKeyRotation: 0
    };
    this.setupForwardSecrecy();
  }

  static getInstance(): ForwardSecrecyManager {
    if (!ForwardSecrecyManager.instance) {
      ForwardSecrecyManager.instance = new ForwardSecrecyManager();
    }
    return ForwardSecrecyManager.instance;
  }

  /**
   * Setup automatic forward secrecy mechanisms
   */
  private setupForwardSecrecy(): void {
    console.log("🛡️ Setting up Perfect Forward Secrecy");

    // Clear keys on page unload
    window.addEventListener('beforeunload', () => {
      this.clearSessionImmediate("Page unload");
    });

    // Clear keys on page visibility change (tab switch, minimize)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.scheduleKeyClearance("Page hidden");
      } else {
        this.cancelScheduledClearance();
      }
    });

    // Clear keys on user inactivity
    this.setupInactivityDetection();

    // Automatic key rotation
    this.setupKeyRotation();

    console.log("✅ Perfect Forward Secrecy mechanisms active");
  }

  /**
   * Start a new secure session
   */
  startSession(): void {
    console.log("🔑 Starting new secure session with PFS");
    
    // Clear any existing session first
    this.clearSessionImmediate("New session starting");
    
    // Generate new ephemeral keys
    secureE2EE.generateEphemeralKeys();
    
    this.sessionStartTime = Date.now();
    this.sessionMetrics.sessionsCreated++;
    this.sessionMetrics.lastKeyRotation = Date.now();
    
    // Set maximum session duration limit
    setTimeout(() => {
      this.clearSessionImmediate("Maximum session duration reached");
    }, this.MAX_SESSION_DURATION);
    
    console.log("✅ Secure session started with ephemeral keys");
  }

  /**
   * Clear session immediately for forward secrecy
   */
  clearSessionImmediate(reason: string): void {
    console.log(`🗑️ Clearing session for PFS: ${reason}`);
    
    // Clear cryptographic keys
    secureE2EE.clearSessionKeys();
    
    // Clear any cached encrypted data
    this.clearBrowserCaches();
    
    // Update metrics
    if (this.sessionStartTime > 0) {
      const sessionDuration = Date.now() - this.sessionStartTime;
      this.updateSessionMetrics(sessionDuration);
      this.sessionStartTime = 0;
    }
    
    this.sessionMetrics.sessionsCleared++;
    
    console.log(`✅ Session cleared successfully: ${reason}`);
  }

  /**
   * Schedule key clearance after inactivity
   */
  private scheduleKeyClearance(reason: string): void {
    if (this.keyRotationTimer) {
      clearTimeout(this.keyRotationTimer);
    }
    
    this.keyRotationTimer = setTimeout(() => {
      this.clearSessionImmediate(reason);
    }, this.SESSION_TIMEOUT);
    
    console.log(`⏰ Scheduled key clearance in ${this.SESSION_TIMEOUT / 1000}s: ${reason}`);
  }

  /**
   * Cancel scheduled clearance (user became active again)
   */
  private cancelScheduledClearance(): void {
    if (this.keyRotationTimer) {
      clearTimeout(this.keyRotationTimer);
      this.keyRotationTimer = null;
      console.log("⏰ Cancelled scheduled key clearance - user active");
    }
  }

  /**
   * Setup user inactivity detection
   */
  private setupInactivityDetection(): void {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    let inactivityTimer: NodeJS.Timeout | null = null;
    
    const resetInactivityTimer = () => {
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
      
      // Clear keys after 30 minutes of inactivity
      inactivityTimer = setTimeout(() => {
        this.clearSessionImmediate("User inactivity timeout");
      }, this.SESSION_TIMEOUT);
    };
    
    // Set up event listeners for user activity
    events.forEach(event => {
      document.addEventListener(event, resetInactivityTimer, true);
    });
    
    // Initial timer
    resetInactivityTimer();
    
    console.log("👤 User inactivity detection active");
  }

  /**
   * Setup automatic key rotation
   */
  private setupKeyRotation(): void {
    // Rotate keys every 15 minutes for active sessions
    setInterval(() => {
      const sessionInfo = secureE2EE.getSessionInfo();
      if (sessionInfo) {
        const sessionAge = Date.now() - sessionInfo.derivedAt;
        const rotationInterval = 15 * 60 * 1000; // 15 minutes
        
        if (sessionAge > rotationInterval) {
          console.log("🔄 Automatic key rotation triggered");
          this.rotateKeys("Automatic rotation");
        }
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
  }

  /**
   * Rotate encryption keys while maintaining session
   */
  private rotateKeys(reason: string): void {
    console.log(`🔄 Rotating encryption keys: ${reason}`);
    
    const oldSessionInfo = secureE2EE.getSessionInfo();
    
    // Generate new ephemeral keys
    const newKeys = secureE2EE.generateEphemeralKeys();
    
    this.sessionMetrics.lastKeyRotation = Date.now();
    
    console.log("✅ Keys rotated successfully:", {
      oldSession: oldSessionInfo?.sessionId,
      newSession: newKeys.sessionId,
      reason
    });
  }

  /**
   * Clear browser caches that might contain sensitive data
   */
  private clearBrowserCaches(): void {
    try {
      // Clear sessionStorage
      sessionStorage.clear();
      
      // Clear any cached form data
      const forms = document.querySelectorAll('form');
      forms.forEach(form => {
        if (form.reset) {
          form.reset();
        }
      });
      
      // Clear any cached blobs/object URLs
      // Note: We can't enumerate all object URLs, but we clear what we can track
      
      console.log("🧹 Browser caches cleared");
    } catch (error) {
      console.warn("Failed to clear some browser caches:", error);
    }
  }

  /**
   * Update session duration metrics
   */
  private updateSessionMetrics(duration: number): void {
    const totalSessions = this.sessionMetrics.sessionsCleared;
    const currentAverage = this.sessionMetrics.averageSessionDuration;
    
    // Calculate running average
    this.sessionMetrics.averageSessionDuration = 
      (currentAverage * (totalSessions - 1) + duration) / totalSessions;
  }

  /**
   * Get current session security status
   */
  getSecurityStatus(): {
    hasActiveSession: boolean;
    sessionAge?: number;
    nextRotation?: number;
    forwardSecrecyActive: boolean;
    metrics: SessionMetrics;
  } {
    const sessionInfo = secureE2EE.getSessionInfo();
    
    if (!sessionInfo) {
      return {
        hasActiveSession: false,
        forwardSecrecyActive: true,
        metrics: this.sessionMetrics
      };
    }
    
    const sessionAge = Date.now() - sessionInfo.derivedAt;
    const rotationInterval = 15 * 60 * 1000; // 15 minutes
    const nextRotation = rotationInterval - (sessionAge % rotationInterval);
    
    return {
      hasActiveSession: true,
      sessionAge,
      nextRotation,
      forwardSecrecyActive: true,
      metrics: this.sessionMetrics
    };
  }

  /**
   * Manually trigger forward secrecy cleanup
   */
  triggerForwardSecrecy(): void {
    this.clearSessionImmediate("Manual trigger");
  }

  /**
   * Get PFS recommendations for admin
   */
  getPFSRecommendations(): string[] {
    const status = this.getSecurityStatus();
    const recommendations: string[] = [];
    
    if (status.hasActiveSession && status.sessionAge! > 60 * 60 * 1000) {
      recommendations.push("Session has been active for over 1 hour - consider rotating keys");
    }
    
    if (status.metrics.averageSessionDuration > 2 * 60 * 60 * 1000) {
      recommendations.push("Average session duration is high - consider shorter session limits");
    }
    
    if (status.metrics.sessionsCleared < status.metrics.sessionsCreated * 0.8) {
      recommendations.push("Some sessions may not be properly cleared - check PFS implementation");
    }
    
    return recommendations;
  }
}

// Export singleton instance
export const forwardSecrecy = ForwardSecrecyManager.getInstance();

/**
 * Utility functions for easy PFS management
 */
export function startSecureSession(): void {
  forwardSecrecy.startSession();
}

export function clearSessionForPFS(): void {
  forwardSecrecy.triggerForwardSecrecy();
}

export function getSecurityStatus() {
  return forwardSecrecy.getSecurityStatus();
}
