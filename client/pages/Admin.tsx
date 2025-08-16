import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageSquare,
  ArrowLeft,
  Lock,
  Eye,
  AlertCircle,
  Clock,
  CheckCircle,
  Flag,
  Image as ImageIcon,
  Calendar,
  Filter,
  Heart,
  AlertTriangle,
  Shield,
  MessageCircle,
  Settings,
  Video,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  Report,
  ReportStatus,
  GetReportsResponse,
  UpdateReportRequest,
} from "@shared/api";
import { decryptReportData } from "@/lib/encryption";
import { notificationService } from "@/lib/notifications";

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [adminResponse, setAdminResponse] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "all">("all");

  const authToken = "ritika:satoru 2624"; // In production, this would be stored securely

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Network error" }));
        setLoginError(
          errorData.error || "Login failed. Please check your credentials.",
        );
        return;
      }

      const data = await response.json();

      if (data.success) {
        setIsAuthenticated(true);
        fetchReports();

        // Setup real-time notifications
        notificationService.setupRealtimeNotifications(authToken);

        // Request notification permission
        if ("Notification" in window && Notification.permission === "default") {
          await Notification.requestPermission();
        }
      } else {
        setLoginError(data.error || "Invalid username or password");
      }
    } catch (error) {
      console.error("Login error:", error);
      setLoginError("Login failed. Please try again.");
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      const response = await fetch(`/api/reports?${params}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data: GetReportsResponse = await response.json();
        setReports(data.reports);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateReportStatus = async (
    reportId: string,
    status: ReportStatus,
    response?: string,
  ) => {
    try {
      const updateData: UpdateReportRequest = { status };
      if (response) {
        updateData.admin_response = response;
      }

      const res = await fetch(`/api/reports/${reportId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(updateData),
      });

      if (res.ok) {
        fetchReports();
        setSelectedReport(null);
        setAdminResponse("");
      }
    } catch (error) {
      console.error("Error updating report:", error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchReports();
    }
  }, [statusFilter, isAuthenticated]);

  const getCategoryBadge = (category: string) => {
    const categoryConfig = {
      harassment: {
        variant: "destructive" as const,
        icon: Flag,
        text: "Harassment",
      },
      medical: { variant: "default" as const, icon: Heart, text: "Medical" },
      emergency: {
        variant: "destructive" as const,
        icon: AlertTriangle,
        text: "Emergency",
      },
      safety: { variant: "secondary" as const, icon: Shield, text: "Safety" },
      feedback: {
        variant: "outline" as const,
        icon: MessageCircle,
        text: "Feedback",
      },
    };

    const config =
      categoryConfig[category as keyof typeof categoryConfig] ||
      categoryConfig.feedback;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="text-xs">
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </Badge>
    );
  };

  const getStatusBadge = (status: ReportStatus) => {
    const statusConfig = {
      pending: { variant: "secondary" as const, icon: Clock, text: "Pending" },
      reviewed: {
        variant: "default" as const,
        icon: CheckCircle,
        text: "Reviewed",
      },
      flagged: { variant: "destructive" as const, icon: Flag, text: "Flagged" },
      resolved: {
        variant: "outline" as const,
        icon: CheckCircle,
        text: "Resolved",
      },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </Badge>
    );
  };

  const getSeverityBadge = (severity: string) => {
    const severityConfig = {
      low: { color: "text-muted-foreground", bg: "bg-muted" },
      medium: { color: "text-yellow-700", bg: "bg-yellow-100" },
      high: { color: "text-orange-700", bg: "bg-orange-100" },
      urgent: { color: "text-red-700", bg: "bg-red-100" },
    };

    const config =
      severityConfig[severity as keyof typeof severityConfig] ||
      severityConfig.medium;

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${config.color} ${config.bg}`}
      >
        {severity?.toUpperCase() || "MEDIUM"}
      </span>
    );
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

  const getDecryptedReport = (report: Report) => {
    if (report.is_encrypted && report.encrypted_data) {
      try {
        return decryptReportData(report.encrypted_data);
      } catch (error) {
        console.error("Failed to decrypt report:", error);
        return {
          message: "[DECRYPTION ERROR]",
          category: "encrypted",
          photo_url: undefined,
          video_url: undefined,
          video_metadata: undefined,
        };
      }
    }
    return {
      message: report.message,
      category: report.category,
      photo_url: report.photo_url,
      video_url: report.video_url,
      video_metadata: report.video_metadata,
    };
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl whistle-gradient flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Whistle</h1>
                <p className="text-xs text-muted-foreground">Admin Dashboard</p>
              </div>
            </Link>
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
          </div>
        </header>

        {/* Login Form */}
        <div className="py-20 px-4">
          <div className="container mx-auto max-w-md">
            <Card className="shadow-lg">
              <CardHeader className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-primary" />
                </div>
                <CardTitle>
                  <p>Admin Access</p>
                </CardTitle>
                <CardDescription>
                  Enter your admin credentials to access the harassment
                  reporting dashboard
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter admin username"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter admin password"
                      required
                    />
                  </div>

                  {loginError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{loginError}</AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" className="w-full">
                    Sign In
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl whistle-gradient flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Whistle</h1>
              <p className="text-xs text-muted-foreground">Admin Dashboard</p>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/admin/settings">
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsAuthenticated(false);
                notificationService.disconnect();
              }}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <div className="py-8 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Stats and Filters */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                Harassment Reports Dashboard
              </h2>
              <p className="text-muted-foreground">
                {reports.length} total harassment complaints received
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                All reports are forwarded here for admin review and response
              </p>
            </div>

            <div className="flex items-center gap-4">
              <Select
                value={statusFilter}
                onValueChange={(value) =>
                  setStatusFilter(value as ReportStatus | "all")
                }
              >
                <SelectTrigger className="w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reports</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                  <SelectItem value="flagged">Flagged</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={fetchReports} variant="outline" size="sm">
                Refresh
              </Button>
            </div>
          </div>

          {/* Reports List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading reports...</p>
            </div>
          ) : reports.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Reports Found</h3>
                <p className="text-muted-foreground">
                  {statusFilter === "all"
                    ? "No reports have been submitted yet."
                    : `No ${statusFilter} reports found.`}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {reports.map((report) => (
                <Card
                  key={report.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {formatDate(report.created_at)}
                        </div>
                        {getCategoryBadge(
                          report.is_encrypted
                            ? getDecryptedReport(report).category
                            : report.category,
                        )}
                        {getSeverityBadge(report.severity)}
                        {report.is_encrypted ? (
                          <Badge
                            variant="secondary"
                            className="bg-green-100 text-green-800 border-green-300"
                          >
                            <Lock className="w-3 h-3 mr-1" />
                            E2E Encrypted
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-amber-50 text-amber-700 border-amber-300"
                          >
                            <Lock className="w-3 h-3 mr-1 opacity-50" />
                            Plain Text
                          </Badge>
                        )}
                        {(report.photo_url ||
                          (report.is_encrypted &&
                            getDecryptedReport(report).photo_url)) && (
                          <Badge variant="outline">
                            <ImageIcon className="w-3 h-3 mr-1" />
                            Photo
                          </Badge>
                        )}
                        {(report.video_url ||
                          (report.is_encrypted &&
                            getDecryptedReport(report).video_url)) && (
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
                            <Video className="w-3 h-3 mr-1" />
                            Video
                          </Badge>
                        )}
                      </div>
                      {getStatusBadge(report.status)}
                    </div>

                    <p className="text-foreground mb-4 line-clamp-3">
                      {report.is_encrypted ? (
                        <span className="flex items-center gap-2">
                          <Lock className="w-4 h-4 text-primary" />
                          {getDecryptedReport(report).message}
                        </span>
                      ) : (
                        report.message
                      )}
                    </p>

                    <div className="flex items-center justify-between">
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {report.id}
                      </code>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedReport(report)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Report Details</DialogTitle>
                            <DialogDescription>
                              Report ID: {selectedReport?.id}
                            </DialogDescription>
                          </DialogHeader>

                          {selectedReport && (
                            <div className="space-y-6">
                              <div>
                                <Label className="text-sm font-medium">
                                  Status
                                </Label>
                                <div className="mt-1">
                                  {getStatusBadge(selectedReport.status)}
                                </div>
                              </div>

                              <div>
                                <Label className="text-sm font-medium">
                                  Submitted
                                </Label>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {formatDate(selectedReport.created_at)}
                                </p>
                              </div>

                              <div>
                                <Label className="text-sm font-medium">
                                  Message
                                  {selectedReport.is_encrypted && (
                                    <Badge variant="outline" className="ml-2">
                                      <Lock className="w-3 h-3 mr-1" />
                                      Encrypted
                                    </Badge>
                                  )}
                                </Label>
                                <div className="mt-2 p-4 bg-muted rounded-lg">
                                  <p className="whitespace-pre-wrap">
                                    {selectedReport.is_encrypted
                                      ? getDecryptedReport(selectedReport)
                                          .message
                                      : selectedReport.message}
                                  </p>
                                </div>
                              </div>

                              {(selectedReport.photo_url ||
                                (selectedReport.is_encrypted &&
                                 getDecryptedReport(selectedReport).photo_url)) && (
                                <div>
                                  <Label className="text-sm font-medium">
                                    Photo Evidence
                                    {selectedReport.is_encrypted && (
                                      <Badge variant="outline" className="ml-2">
                                        <Lock className="w-3 h-3 mr-1" />
                                        Encrypted
                                      </Badge>
                                    )}
                                  </Label>
                                  <div className="mt-2">
                                    <img
                                      src={selectedReport.is_encrypted
                                        ? getDecryptedReport(selectedReport).photo_url
                                        : selectedReport.photo_url}
                                      alt="Report evidence"
                                      className="max-w-full h-auto rounded-lg border"
                                      onError={(e) => {
                                        console.error('Failed to load photo:', e);
                                        (e.target as HTMLImageElement).style.display = 'none';
                                      }}
                                    />
                                  </div>
                                </div>
                              )}

                              {(selectedReport.video_url ||
                                (selectedReport.is_encrypted &&
                                 getDecryptedReport(selectedReport).video_url)) && (
                                <div>
                                  <Label className="text-sm font-medium">
                                    Video Evidence
                                    {selectedReport.video_metadata && (
                                      <Badge variant="outline" className="ml-2">
                                        {(selectedReport.video_metadata.size / 1024 / 1024).toFixed(1)}MB • {Math.floor((selectedReport.video_metadata.duration || 0) / 60)}:{String(Math.floor((selectedReport.video_metadata.duration || 0) % 60)).padStart(2, '0')}
                                        {selectedReport.video_metadata.isRecorded && ' • Recorded'}
                                      </Badge>
                                    )}
                                  </Label>
                                  <div className="mt-2">
                                    {(() => {
                                      const videoUrl = selectedReport.is_encrypted
                                        ? getDecryptedReport(selectedReport).video_url
                                        : selectedReport.video_url;

                                      // Check if video URL is too large (base64 data URLs can be huge)
                                      if (videoUrl && videoUrl.length > 50000000) { // ~50MB base64 limit
                                        return (
                                          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                            <div className="flex items-center gap-2 mb-2">
                                              <AlertCircle className="w-5 h-5 text-amber-600" />
                                              <span className="font-medium text-amber-800">Video Too Large for Preview</span>
                                            </div>
                                            <p className="text-sm text-amber-700">
                                              Video file is too large to display in browser.
                                              In production, this would be streamed from cloud storage.
                                            </p>
                                            <p className="text-xs text-amber-600 mt-2">
                                              Size: {((selectedReport.video_metadata?.size || 0) / 1024 / 1024).toFixed(1)}MB
                                            </p>
                                          </div>
                                        );
                                      }

                                      return (
                                        <video
                                          src={videoUrl}
                                          controls
                                          preload="metadata"
                                          className="max-w-full h-auto rounded-lg border bg-black"
                                          style={{ maxHeight: '300px' }}
                                          onError={(e) => {
                                            console.error('Failed to load video:', e);
                                            (e.target as HTMLVideoElement).style.display = 'none';
                                          }}
                                        >
                                          Your browser does not support video playback.
                                        </video>
                                      );
                                    })()}
                                  </div>
                                </div>
                              )}

                              {selectedReport.admin_response && (
                                <div>
                                  <Label className="text-sm font-medium">
                                    Admin Response
                                  </Label>
                                  <div className="mt-2 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                                    <p className="whitespace-pre-wrap">
                                      {selectedReport.admin_response}
                                    </p>
                                    {selectedReport.admin_response_at && (
                                      <p className="text-xs text-muted-foreground mt-2">
                                        Responded on{" "}
                                        {formatDate(
                                          selectedReport.admin_response_at,
                                        )}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}

                              <div>
                                <Label
                                  htmlFor="admin-response"
                                  className="text-sm font-medium"
                                >
                                  Add Response
                                </Label>
                                <Textarea
                                  id="admin-response"
                                  placeholder="Add an administrative response..."
                                  value={adminResponse}
                                  onChange={(e) =>
                                    setAdminResponse(e.target.value)
                                  }
                                  className="mt-2"
                                />
                              </div>

                              <div className="flex flex-wrap gap-2">
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    updateReportStatus(
                                      selectedReport.id,
                                      "reviewed",
                                      adminResponse,
                                    )
                                  }
                                >
                                  Mark as Reviewed
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() =>
                                    updateReportStatus(
                                      selectedReport.id,
                                      "flagged",
                                      adminResponse,
                                    )
                                  }
                                >
                                  Flag for Attention
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    updateReportStatus(
                                      selectedReport.id,
                                      "resolved",
                                      adminResponse,
                                    )
                                  }
                                >
                                  Mark as Resolved
                                </Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
