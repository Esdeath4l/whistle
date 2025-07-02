/**
 * Shared types between client and server for Whistle app
 */

export interface Report {
  id: string;
  message: string;
  photo_url?: string;
  created_at: string;
  status: ReportStatus;
  admin_response?: string;
  admin_response_at?: string;
}

export type ReportStatus = "pending" | "reviewed" | "flagged" | "resolved";

export interface CreateReportRequest {
  message: string;
  photo_url?: string;
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
