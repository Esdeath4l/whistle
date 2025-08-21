import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import { Report } from '@shared/api';
import { Badge } from '@/components/ui/badge';
import { formatLocation } from '@/lib/geolocation';
import {
  AlertTriangle,
  Flag,
  MapPin,
  Calendar,
  Shield,
  Eye
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Import leaflet images explicitly
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png';

interface ReportsMapProps {
  reports: Report[];
  onReportSelect?: (report: Report) => void;
  className?: string;
}

// Fix default Leaflet icon issue
const defaultIcon = new Icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconRetinaUrl: markerIconRetina,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Custom icons for different report types
const flaggedIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="red" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
      <line x1="4" y1="22" x2="4" y2="15"/>
    </svg>
  `),
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30]
});

const urgentIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  `),
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28]
});

const moderatedIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  `),
  iconSize: [26, 26],
  iconAnchor: [13, 26],
  popupAnchor: [0, -26]
});

// Simple grouping logic for nearby reports (manual clustering)
const groupNearbyReports = (reports: Report[], maxDistance = 0.01) => {
  const groups: Report[][] = [];
  const processed = new Set<string>();

  reports.forEach(report => {
    if (processed.has(report.id) || !report.location) return;

    const group = [report];
    processed.add(report.id);

    reports.forEach(otherReport => {
      if (processed.has(otherReport.id) || !otherReport.location || otherReport.id === report.id) return;

      const distance = Math.sqrt(
        Math.pow(report.location!.latitude - otherReport.location!.latitude, 2) +
        Math.pow(report.location!.longitude - otherReport.location!.longitude, 2)
      );

      if (distance < maxDistance) {
        group.push(otherReport);
        processed.add(otherReport.id);
      }
    });

    groups.push(group);
  });

  return groups;
};

const ReportsMap: React.FC<ReportsMapProps> = ({ 
  reports, 
  onReportSelect, 
  className = "h-96 w-full" 
}) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const getReportIcon = (report: Report) => {
    if (report.status === 'flagged') return flaggedIcon;
    if (report.moderation?.isFlagged) return moderatedIcon;
    if (report.severity === 'urgent') return urgentIcon;
    return defaultIcon;
  };

  const getStatusBadge = (report: Report) => {
    if (report.status === 'flagged') {
      return <Badge variant="destructive">Flagged</Badge>;
    }
    if (report.moderation?.isFlagged) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">AI Flagged</Badge>;
    }
    if (report.severity === 'urgent') {
      return <Badge variant="destructive">Urgent</Badge>;
    }
    return <Badge variant="outline">{report.status}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filter reports with location data
  const reportsWithLocation = reports.filter(report =>
    report.location &&
    typeof report.location.latitude === 'number' &&
    typeof report.location.longitude === 'number'
  );

  // Group nearby reports for simple clustering
  const reportGroups = groupNearbyReports(reportsWithLocation);

  // Calculate map center based on reports
  const getMapCenter = (): [number, number] => {
    if (reportsWithLocation.length === 0) {
      return [37.7749, -122.4194]; // Default to San Francisco
    }

    const avgLat = reportsWithLocation.reduce((sum, report) =>
      sum + (report.location?.latitude || 0), 0) / reportsWithLocation.length;
    const avgLon = reportsWithLocation.reduce((sum, report) =>
      sum + (report.location?.longitude || 0), 0) / reportsWithLocation.length;

    return [avgLat, avgLon];
  };

  // Don't render on server side to avoid hydration issues
  if (!isClient) {
    return (
      <div className={`${className} bg-muted flex items-center justify-center rounded-lg border`}>
        <div className="text-center">
          <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  if (reportsWithLocation.length === 0) {
    return (
      <div className={`${className} bg-muted flex items-center justify-center rounded-lg border`}>
        <div className="text-center">
          <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No reports with location data</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <style>{`
        .leaflet-popup-content-wrapper {
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }

        .leaflet-popup-content {
          margin: 0;
          padding: 0;
        }

        .cluster-marker {
          background: #3b82f6;
          color: white;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          font-size: 12px;
        }

        .cluster-marker.flagged {
          background: #dc2626;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>

      <MapContainer
        center={getMapCenter()}
        zoom={12}
        style={{ height: '100%', width: '100%', borderRadius: '8px' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {reportGroups.map((group, groupIndex) => {
          if (group.length === 1) {
            // Single report - show normal marker
            const report = group[0];
            return (
              <Marker
                key={report.id}
                position={[report.location!.latitude, report.location!.longitude]}
                icon={getReportIcon(report)}
                eventHandlers={{
                  click: () => onReportSelect?.(report)
                }}
              >
                <Popup maxWidth={300} minWidth={250}>
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(report)}
                        {report.moderation?.isFlagged && (
                          <Badge variant="outline" className="text-xs">
                            ⚠️ AI Flagged
                          </Badge>
                        )}
                      </div>
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">
                        {report.id.slice(-8)}
                      </code>
                    </div>

                    <p className="text-sm mb-3 line-clamp-3">
                      {report.message.length > 100
                        ? `${report.message.substring(0, 100)}...`
                        : report.message
                      }
                    </p>

                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(report.created_at)}
                      </div>

                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {formatLocation(report.location!)}
                      </div>

                      {report.location?.address && (
                        <div className="text-xs text-muted-foreground truncate">
                          📍 {report.location.address}
                        </div>
                      )}

                      {report.moderation?.isFlagged && (
                        <div className="text-xs text-yellow-700 bg-yellow-50 p-1 rounded">
                          <Shield className="w-3 h-3 inline mr-1" />
                          {report.moderation.reason}
                        </div>
                      )}
                    </div>

                    {onReportSelect && (
                      <button
                        onClick={() => onReportSelect(report)}
                        className="mt-2 w-full text-xs bg-primary text-primary-foreground py-1 px-2 rounded hover:bg-primary/90 flex items-center justify-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        View Details
                      </button>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          } else {
            // Multiple reports - show cluster marker
            const firstReport = group[0];
            const hasFlagged = group.some(r => r.status === 'flagged' || r.moderation?.isFlagged);

            const clusterIcon = new Icon({
              iconUrl: `data:image/svg+xml;base64,${btoa(`
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30" width="30" height="30">
                  <circle cx="15" cy="15" r="13" fill="${hasFlagged ? '#dc2626' : '#3b82f6'}" stroke="white" stroke-width="2"/>
                  <text x="15" y="19" text-anchor="middle" fill="white" font-size="12" font-weight="bold">${group.length}</text>
                </svg>
              `)}`,
              iconSize: [30, 30],
              iconAnchor: [15, 15],
              popupAnchor: [0, -15]
            });

            return (
              <Marker
                key={`cluster-${groupIndex}`}
                position={[firstReport.location!.latitude, firstReport.location!.longitude]}
                icon={clusterIcon}
              >
                <Popup maxWidth={350} minWidth={300}>
                  <div className="p-3">
                    <div className="flex items-center gap-2 mb-3">
                      <Flag className="w-4 h-4 text-primary" />
                      <span className="font-medium">
                        {group.length} Reports in this area
                      </span>
                      {hasFlagged && (
                        <Badge variant="destructive" className="text-xs">
                          Contains flagged reports
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {group.slice(0, 3).map(report => (
                        <div key={report.id} className="border-l-2 border-primary/20 pl-2 text-xs">
                          <div className="flex items-center gap-1 mb-1">
                            {getStatusBadge(report)}
                            <code className="bg-muted px-1 rounded">
                              {report.id.slice(-6)}
                            </code>
                          </div>
                          <p className="text-muted-foreground line-clamp-2">
                            {report.message.substring(0, 80)}...
                          </p>
                        </div>
                      ))}
                      {group.length > 3 && (
                        <p className="text-xs text-muted-foreground italic">
                          +{group.length - 3} more reports...
                        </p>
                      )}
                    </div>

                    {onReportSelect && (
                      <button
                        onClick={() => onReportSelect(group[0])}
                        className="mt-2 w-full text-xs bg-primary text-primary-foreground py-1 px-2 rounded hover:bg-primary/90"
                      >
                        View First Report
                      </button>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          }
        })}
      </MapContainer>
    </div>
  );
};

export default ReportsMap;
