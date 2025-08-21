/**
 * Demo data for testing the enhanced Whistle features
 */
import { Report } from "@shared/api";

export const demoReports: Report[] = [
  {
    id: "demo_1",
    message:
      "Someone was being really rude and using bad language in the office. This is unacceptable behavior.",
    category: "harassment",
    severity: "medium",
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    status: "pending",
    is_encrypted: false,
    location: {
      latitude: 37.7749,
      longitude: -122.4194,
      accuracy: 10,
      timestamp: Date.now() - 2 * 60 * 60 * 1000,
      address: "123 Market Street, San Francisco, CA",
    },
    moderation: {
      isFlagged: true,
      reason: "Potentially inappropriate language detected",
      confidence: 0.85,
      detectedTerms: ["bad", "rude"],
    },
  },
  {
    id: "demo_2",
    message:
      "There was a medical emergency in the building. Someone collapsed and needed immediate help.",
    category: "medical",
    severity: "urgent",
    created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
    status: "flagged",
    is_encrypted: false,
    location: {
      latitude: 37.7849,
      longitude: -122.4094,
      accuracy: 15,
      timestamp: Date.now() - 1 * 60 * 60 * 1000,
      address: "456 Mission Street, San Francisco, CA",
    },
    moderation: {
      isFlagged: false,
      reason: undefined,
      confidence: 0.1,
      detectedTerms: [],
    },
  },
  {
    id: "demo_3",
    message:
      "The security guard was being threatening and said some really scary things. I felt unsafe.",
    category: "safety",
    severity: "high",
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    status: "reviewed",
    is_encrypted: false,
    location: {
      latitude: 37.7649,
      longitude: -122.4294,
      accuracy: 8,
      timestamp: Date.now() - 30 * 60 * 1000,
      address: "789 Howard Street, San Francisco, CA",
    },
    moderation: {
      isFlagged: true,
      reason: "Potentially threatening content detected",
      confidence: 0.92,
      detectedTerms: ["threatening", "scary"],
    },
    admin_response:
      "Thank you for the report. We have investigated the matter and taken appropriate action.",
    admin_response_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
  {
    id: "demo_4",
    message:
      "Just wanted to provide some feedback about the new lunch menu. It's really great!",
    category: "feedback",
    severity: "low",
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
    status: "resolved",
    is_encrypted: false,
    location: {
      latitude: 37.7549,
      longitude: -122.4394,
      accuracy: 12,
      timestamp: Date.now() - 45 * 60 * 1000,
      address: "321 Folsom Street, San Francisco, CA",
    },
    moderation: {
      isFlagged: false,
      reason: undefined,
      confidence: 0.05,
      detectedTerms: [],
    },
  },
  {
    id: "demo_5",
    message:
      "Someone was using really offensive language and making threats. This is completely unacceptable and needs to stop now!",
    category: "harassment",
    severity: "urgent",
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
    status: "flagged",
    is_encrypted: false,
    location: {
      latitude: 37.7449,
      longitude: -122.4494,
      accuracy: 20,
      timestamp: Date.now() - 15 * 60 * 1000,
      address: "654 Bryant Street, San Francisco, CA",
    },
    moderation: {
      isFlagged: true,
      reason: "Potentially offensive or inappropriate language detected",
      confidence: 0.98,
      detectedTerms: ["offensive", "threats"],
    },
    is_offline_sync: true,
  },
];

/**
 * Add demo reports to the server (for testing purposes)
 */
export async function addDemoReports(): Promise<void> {
  try {
    for (const report of demoReports) {
      await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: report.message,
          category: report.category,
          severity: report.severity,
          location: report.location,
          share_location: true,
          is_offline_sync: report.is_offline_sync || false,
        }),
      });
    }
    console.log("Demo reports added successfully");
  } catch (error) {
    console.error("Failed to add demo reports:", error);
  }
}
