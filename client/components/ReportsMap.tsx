import React, { useState } from 'react';
import { Report } from '@shared/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatLocation } from '@/lib/geolocation';
import { 
  AlertTriangle, 
  Flag, 
  MapPin, 
  Calendar,
  Shield,
  Eye,
  Map
} from 'lucide-react';

interface ReportsMapProps {
  reports: Report[];
  onReportSelect?: (report: Report) => void;
  className?: string;
}

const ReportsMap: React.FC<ReportsMapProps> = ({ 
  reports, 
  onReportSelect, 
  className = "h-96 w-full" 
}) => {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  // Filter reports with location data
  const reportsWithLocation = reports.filter(report => 
    report.location && 
    typeof report.location.latitude === 'number' && 
    typeof report.location.longitude === 'number'
  );

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
      <div className="h-full bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg border overflow-hidden">
        {/* Map Header */}
        <div className="bg-white/80 dark:bg-black/80 backdrop-blur-sm p-4 border-b">
          <div className="flex items-center gap-2">
            <Map className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-sm">
              Reports Map View ({reportsWithLocation.length} locations)
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Interactive list view of all geotagged reports
          </p>
        </div>

        {/* Map Content - List View */}
        <div className="h-full overflow-y-auto p-4 space-y-3">
          {reportsWithLocation.map((report, index) => {
            const isSelected = selectedReport?.id === report.id;
            const isFlagged = report.status === 'flagged' || report.moderation?.isFlagged;
            
            return (
              <div
                key={report.id}
                className={`relative p-3 rounded-lg border transition-all cursor-pointer ${
                  isSelected 
                    ? 'bg-primary/10 border-primary shadow-md' 
                    : 'bg-white/80 dark:bg-black/40 hover:bg-white dark:hover:bg-black/60 border-gray-200 dark:border-gray-700'
                } ${isFlagged ? 'ring-2 ring-red-200 dark:ring-red-800' : ''}`}
                onClick={() => {
                  setSelectedReport(report);
                  onReportSelect?.(report);
                }}
              >
                {/* Report Pin Indicator */}
                <div className={`absolute -left-1 top-3 w-3 h-3 rounded-full border-2 border-white ${
                  report.status === 'flagged' ? 'bg-red-500' :
                  report.moderation?.isFlagged ? 'bg-yellow-500' :
                  report.severity === 'urgent' ? 'bg-orange-500' :
                  'bg-blue-500'
                }`} />

                {/* Report Content */}
                <div className="ml-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getStatusBadge(report)}
                      {report.moderation?.isFlagged && (
                        <Badge variant="outline" className="text-xs">
                          ⚠️ AI Flagged
                        </Badge>
                      )}
                      {report.location && (
                        <Badge variant="outline" className="text-xs">
                          <MapPin className="w-3 h-3 mr-1" />
                          GPS
                        </Badge>
                      )}
                    </div>
                    <code className="text-xs bg-muted px-1 py-0.5 rounded">
                      #{index + 1}
                    </code>
                  </div>

                  <p className="text-sm mb-2 line-clamp-2">
                    {report.message.length > 80 
                      ? `${report.message.substring(0, 80)}...` 
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
                      <div className="text-xs text-yellow-700 bg-yellow-50 dark:bg-yellow-950/20 p-1 rounded">
                        <Shield className="w-3 h-3 inline mr-1" />
                        {report.moderation.reason}
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="mt-2 flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onReportSelect?.(report);
                      }}
                      className="text-xs h-6 px-2"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Map Footer */}
        <div className="bg-white/80 dark:bg-black/80 backdrop-blur-sm p-3 border-t">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Normal</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>AI Flagged</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>Flagged</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>Urgent</span>
              </div>
            </div>
            <span>📍 {reportsWithLocation.length} geotagged reports</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsMap;
