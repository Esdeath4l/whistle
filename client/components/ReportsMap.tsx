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

// Custom cluster icon
const createClusterIcon = (cluster: any) => {
  const count = cluster.getChildCount();
  const hasFlagged = cluster.getAllChildMarkers().some((marker: any) => 
    marker.options.report?.status === 'flagged' || marker.options.report?.moderation?.isFlagged
  );
  
  return divIcon({
    html: `<div class="cluster-icon ${hasFlagged ? 'cluster-flagged' : ''}">${count}</div>`,
    className: 'custom-cluster-icon',
    iconSize: [40, 40]
  });
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
      <style jsx global>{`
        .custom-cluster-icon .cluster-icon {
          background: #3b82f6;
          color: white;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          border: 3px solid white;
          box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        }
        
        .custom-cluster-icon .cluster-flagged {
          background: #dc2626;
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        .leaflet-popup-content-wrapper {
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }
        
        .leaflet-popup-content {
          margin: 0;
          padding: 0;
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
        
        <MarkerClusterGroup
          chunkedLoading
          iconCreateFunction={createClusterIcon}
        >
          {reportsWithLocation.map((report) => (
            <Marker
              key={report.id}
              position={[report.location!.latitude, report.location!.longitude]}
              icon={getReportIcon(report)}
              eventHandlers={{
                click: () => onReportSelect?.(report)
              }}
              // Pass report data for cluster detection
              {...({ report } as any)}
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
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
};

export default ReportsMap;
