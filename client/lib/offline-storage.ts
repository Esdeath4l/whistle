/**
 * Offline Storage Service for Whistle App
 * Handles offline report storage and synchronization
 */

import { CreateReportRequest, CreateReportResponse } from '@shared/api';

export interface OfflineReport extends CreateReportRequest {
  id: string;
  timestamp: number;
  synced: boolean;
}

const OFFLINE_REPORTS_KEY = 'whistle_offline_reports';
const SYNC_STATUS_KEY = 'whistle_sync_status';

/**
 * Check if the browser is online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Save a report to local storage for offline submission
 */
export function saveOfflineReport(reportData: CreateReportRequest): string {
  const offlineReport: OfflineReport = {
    ...reportData,
    id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    synced: false
  };

  const existingReports = getOfflineReports();
  existingReports.push(offlineReport);
  
  localStorage.setItem(OFFLINE_REPORTS_KEY, JSON.stringify(existingReports));
  
  return offlineReport.id;
}

/**
 * Get all offline reports from local storage
 */
export function getOfflineReports(): OfflineReport[] {
  try {
    const stored = localStorage.getItem(OFFLINE_REPORTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading offline reports:', error);
    return [];
  }
}

/**
 * Get pending (unsynced) offline reports
 */
export function getPendingReports(): OfflineReport[] {
  return getOfflineReports().filter(report => !report.synced);
}

/**
 * Mark a report as synced
 */
export function markReportAsSynced(offlineId: string, serverResponse?: CreateReportResponse): void {
  const reports = getOfflineReports();
  const reportIndex = reports.findIndex(report => report.id === offlineId);
  
  if (reportIndex !== -1) {
    reports[reportIndex].synced = true;
    if (serverResponse) {
      // Store server response for reference
      (reports[reportIndex] as any).serverResponse = serverResponse;
    }
    localStorage.setItem(OFFLINE_REPORTS_KEY, JSON.stringify(reports));
  }
}

/**
 * Remove old synced reports to free up storage
 */
export function cleanupOldReports(daysOld: number = 7): void {
  const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
  const reports = getOfflineReports();
  const filteredReports = reports.filter(report => 
    !report.synced || report.timestamp > cutoffTime
  );
  
  localStorage.setItem(OFFLINE_REPORTS_KEY, JSON.stringify(filteredReports));
}

/**
 * Sync all pending reports with the server
 */
export async function syncPendingReports(): Promise<{
  successful: number;
  failed: number;
  errors: string[];
}> {
  const pendingReports = getPendingReports();
  const results = {
    successful: 0,
    failed: 0,
    errors: [] as string[]
  };

  if (pendingReports.length === 0) {
    return results;
  }

  for (const report of pendingReports) {
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: report.message,
          category: report.category,
          photo_url: report.photo_url,
          video_url: report.video_url,
          video_metadata: report.video_metadata,
          severity: report.severity,
          encrypted_data: report.encrypted_data,
          is_encrypted: report.is_encrypted
        })
      });

      if (response.ok) {
        const serverResponse: CreateReportResponse = await response.json();
        markReportAsSynced(report.id, serverResponse);
        results.successful++;
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        results.errors.push(`Report ${report.id}: ${errorData.error}`);
        results.failed++;
      }
    } catch (error) {
      results.errors.push(`Report ${report.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      results.failed++;
    }
  }

  // Update sync status
  setSyncStatus({
    lastSync: Date.now(),
    lastSyncResult: results
  });

  return results;
}

/**
 * Set up automatic sync when connection is restored
 */
export function setupOfflineSync(onSyncComplete?: (results: any) => void): void {
  // Listen for online/offline events
  window.addEventListener('online', async () => {
    console.log('Connection restored, syncing pending reports...');
    
    // Small delay to ensure connection is stable
    setTimeout(async () => {
      try {
        const results = await syncPendingReports();
        if (onSyncComplete) {
          onSyncComplete(results);
        }
        
        if (results.successful > 0) {
          showSyncNotification(`${results.successful} report(s) synced successfully`);
        }
      } catch (error) {
        console.error('Auto-sync failed:', error);
      }
    }, 1000);
  });

  window.addEventListener('offline', () => {
    console.log('Connection lost, reports will be saved offline');
  });
}

/**
 * Get sync status information
 */
export function getSyncStatus(): {
  lastSync?: number;
  lastSyncResult?: any;
  pendingCount: number;
} {
  try {
    const stored = localStorage.getItem(SYNC_STATUS_KEY);
    const status = stored ? JSON.parse(stored) : {};
    return {
      ...status,
      pendingCount: getPendingReports().length
    };
  } catch (error) {
    return { pendingCount: getPendingReports().length };
  }
}

/**
 * Set sync status
 */
function setSyncStatus(status: any): void {
  try {
    localStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(status));
  } catch (error) {
    console.error('Error saving sync status:', error);
  }
}

/**
 * Show sync notification (browser notification if permitted)
 */
function showSyncNotification(message: string): void {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Whistle - Sync Complete', {
      body: message,
      icon: '/favicon.ico'
    });
  }
}

/**
 * Estimate storage usage for offline reports
 */
export function getStorageInfo(): {
  reportCount: number;
  estimatedSizeMB: number;
  pendingCount: number;
} {
  const reports = getOfflineReports();
  const pendingCount = reports.filter(r => !r.synced).length;
  
  // Rough estimation of storage size
  const jsonString = localStorage.getItem(OFFLINE_REPORTS_KEY) || '';
  const estimatedSizeMB = new Blob([jsonString]).size / (1024 * 1024);
  
  return {
    reportCount: reports.length,
    estimatedSizeMB: Math.round(estimatedSizeMB * 100) / 100,
    pendingCount
  };
}
