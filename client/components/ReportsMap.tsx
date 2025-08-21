import React, { useState, useEffect } from "react";
import { Report } from "@shared/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { formatLocation } from "@/lib/geolocation";
import {
  AlertTriangle,
  Flag,
  MapPin,
  Calendar,
  Shield,
  Eye,
  Map,
  Navigation,
  Clock,
  Filter,
} from "lucide-react";

interface ReportsMapProps {
  reports: Report[];
  onReportSelect?: (report: Report) => void;
  className?: string;
}

const ReportsMap: React.FC<ReportsMapProps> = ({
  reports,
  onReportSelect,
  className = "h-96 w-full",
}) => {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 37.7749, lng: -122.4194 });
  const [zoom, setZoom] = useState(10);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Filter reports with location data
  const reportsWithLocation = reports.filter(
    (report) =>
      report.location &&
      typeof report.location.latitude === "number" &&
      typeof report.location.longitude === "number" &&
      (filterStatus === "all" || 
       (filterStatus === "urgent" && report.severity === "urgent") ||
       (filterStatus === "flagged" && (report.status === "flagged" || report.moderation?.isFlagged))
      )
  );

  // Calculate map center based on reports
  useEffect(() => {
    if (reportsWithLocation.length > 0) {
      const avgLat = reportsWithLocation.reduce((sum, report) => sum + report.location!.latitude, 0) / reportsWithLocation.length;
      const avgLng = reportsWithLocation.reduce((sum, report) => sum + report.location!.longitude, 0) / reportsWithLocation.length;
      setMapCenter({ lat: avgLat, lng: avgLng });
    }
  }, [reportsWithLocation]);

  const getReportColor = (report: Report) => {
    if (report.status === "flagged") return "bg-red-500";
    if (report.moderation?.isFlagged) return "bg-yellow-500";
    if (report.severity === "urgent") return "bg-orange-500";
    return "bg-blue-500";
  };

  const getStatusBadge = (report: Report) => {
    if (report.status === "flagged") {
      return <Badge variant="destructive">Flagged</Badge>;
    }
    if (report.moderation?.isFlagged) {
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          AI Flagged
        </Badge>
      );
    }
    if (report.severity === "urgent") {
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

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c;
    return d;
  };

  if (reportsWithLocation.length === 0) {
    return (
      <div
        className={`${className} bg-muted flex items-center justify-center rounded-lg border`}
      >
        <div className="text-center">
          <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            {filterStatus === "all" ? "No reports with location data" : `No ${filterStatus} reports with location data`}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="h-full bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg border overflow-hidden flex">
        
        {/* Interactive Map View */}
        <div className="flex-1 relative">
          {/* Map Header */}
          <div className="absolute top-0 left-0 right-0 bg-white/90 dark:bg-black/90 backdrop-blur-sm p-4 border-b z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Map className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-sm">
                  Interactive Location Map ({reportsWithLocation.length} locations)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <select 
                  className="text-xs border rounded px-2 py-1"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Reports</option>
                  <option value="urgent">Urgent Only</option>
                  <option value="flagged">Flagged Only</option>
                </select>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setZoom(zoom + 1)}
                  className="h-6 px-2 text-xs"
                >
                  Zoom In
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setZoom(Math.max(1, zoom - 1))}
                  className="h-6 px-2 text-xs"
                >
                  Zoom Out
                </Button>
              </div>
            </div>
          </div>

          {/* Simulated Map Canvas */}
          <div className="h-full pt-16 pb-12 px-4 relative overflow-auto">
            <div 
              className="relative bg-green-50 dark:bg-green-900/20 rounded-lg border-2 border-green-200 dark:border-green-800 min-h-full"
              style={{ 
                minHeight: '400px',
                backgroundImage: `
                  linear-gradient(90deg, rgba(34,197,94,0.1) 1px, transparent 1px),
                  linear-gradient(rgba(34,197,94,0.1) 1px, transparent 1px)
                `,
                backgroundSize: '20px 20px'
              }}
            >
              {/* Map Markers */}
              {reportsWithLocation.map((report, index) => {
                const x = 50 + (Math.sin(index * 0.8) * 35);
                const y = 30 + (Math.cos(index * 0.6) * 40);
                const isSelected = selectedReport?.id === report.id;
                
                return (
                  <div
                    key={report.id}
                    className={`absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 hover:scale-110 ${
                      isSelected ? 'scale-125 z-20' : 'z-10'
                    }`}
                    style={{ 
                      left: `${x}%`, 
                      top: `${y}%`,
                    }}
                    onClick={() => {
                      setSelectedReport(report);
                      onReportSelect?.(report);
                    }}
                  >
                    {/* Marker */}
                    <div className={`relative ${isSelected ? 'animate-pulse' : ''}`}>
                      <div className={`w-6 h-6 rounded-full border-2 border-white shadow-lg ${getReportColor(report)}`} />
                      {/* Marker Pin */}
                      <div className={`absolute top-6 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent ${getReportColor(report).replace('bg-', 'border-t-')}`} />
                      
                      {/* Hover Tooltip */}
                      {isSelected && (
                        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-white dark:bg-black border rounded-lg shadow-lg p-2 min-w-48 z-30">
                          <div className="text-xs space-y-1">
                            <div className="font-semibold">{report.category}</div>
                            <div className="text-muted-foreground">
                              {formatLocation(report.location!)}
                            </div>
                            <div className="text-muted-foreground">
                              {formatDate(report.created_at)}
                            </div>
                            {getStatusBadge(report)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Map Center Indicator */}
              <div 
                className="absolute w-2 h-2 bg-red-500 rounded-full border border-white"
                style={{ 
                  left: '50%', 
                  top: '50%',
                  transform: 'translate(-50%, -50%)'
                }}
              />
            </div>
          </div>

          {/* Map Footer */}
          <div className="absolute bottom-0 left-0 right-0 bg-white/90 dark:bg-black/90 backdrop-blur-sm p-3 border-t">
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
              <div className="flex items-center gap-2">
                <span>📍 {reportsWithLocation.length} geotagged reports</span>
                <span>•</span>
                <span>Zoom: {zoom}x</span>
              </div>
            </div>
          </div>
        </div>

        {/* Location Details Sidebar */}
        <div className="w-80 border-l bg-white/50 dark:bg-black/50 flex flex-col">
          <div className="p-4 border-b">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Navigation className="w-4 h-4" />
              Location Details
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              Click markers to view location information
            </p>
          </div>

          <ScrollArea className="flex-1 p-4">
            {selectedReport ? (
              <div className="space-y-4">
                {/* Selected Report Details */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span>Report #{reportsWithLocation.findIndex(r => r.id === selectedReport.id) + 1}</span>
                      {getStatusBadge(selectedReport)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">

                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-2">Location Details</div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3 h-3 text-blue-600" />
                          <span className="text-sm font-mono">
                            {formatLocation(selectedReport.location!)}
                          </span>
                        </div>
                        
                        {selectedReport.location?.address && (
                          <div className="text-sm text-muted-foreground">
                            📍 {selectedReport.location.address}
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Accuracy:</span>
                            <span className="font-medium ml-1">
                              ±{Math.round(selectedReport.location!.accuracy)}m
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Captured:</span>
                            <div className="font-medium">
                              {new Date(selectedReport.location!.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      <span className="text-xs text-muted-foreground">
                        Submitted: {formatDate(selectedReport.created_at)}
                      </span>
                    </div>

                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={() => onReportSelect?.(selectedReport)}
                    >
                      <Eye className="w-3 h-3 mr-2" />
                      View Full Report
                    </Button>
                  </CardContent>
                </Card>

              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">Select a marker on the map to view location details</p>
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

export default ReportsMap;
