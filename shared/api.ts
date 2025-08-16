/**
 * Shared types between client and server for Whistle app
 */

export interface Report {
  id: string;
  message: string;
  category: ReportCategory;
  photo_url?: string;
  video_url?: string;
  video_metadata?: VideoMetadata;
  created_at: string;
  status: ReportStatus;
  admin_response?: string;
  admin_response_at?: string;
  severity?: ReportSeverity;
  // Encrypted data fields
  encrypted_data?: EncryptedReportData;
  is_encrypted?: boolean;
}

export interface VideoMetadata {
  duration: number; // in seconds
  size: number; // in bytes
  format: string; // MIME type
  width?: number;
  height?: number;
  isRecorded: boolean;
  uploadMethod: "direct" | "resumable";
}

export interface EncryptedReportData {
  encryptedMessage: string;
  encryptedCategory: string;
  encryptedPhotoUrl?: string;
  encryptedVideoUrl?: string;
  encryptedVideoMetadata?: string;
  iv: string;
  timestamp: string;
}

export type ReportStatus = "pending" | "reviewed" | "flagged" | "resolved";
export type ReportCategory =
  | "harassment"
  | "medical"
  | "emergency"
  | "feedback"
  | "safety"
  | "encrypted";
export type ReportSeverity = "low" | "medium" | "high" | "urgent";

export interface CreateReportRequest {
  message: string;
  category: ReportCategory;
  photo_url?: string;
  video_url?: string;
  video_metadata?: VideoMetadata;
  severity?: ReportSeverity;
  // For encrypted submissions
  encrypted_data?: EncryptedReportData;
  is_encrypted?: boolean;
}

export interface CreateReportResponse {
  id: string;
  message: string;
  created_at: string;
}

export interface GetReportsResponse {
  reports: Report[];
  total: number;
}

export interface ReportStatusResponse {
  id: string;
  status: ReportStatus;
  created_at: string;
  admin_response?: string;
  admin_response_at?: string;
}

export interface UpdateReportRequest {
  status?: ReportStatus;
  admin_response?: string;
}

export interface AdminAuthRequest {
  username: string;
  password: string;
}

export interface AdminAuthResponse {
  success: boolean;
  token?: string;
}

/**
 * Legacy demo interface (keeping for compatibility)
 */
export interface DemoResponse {
  message: string;
}
