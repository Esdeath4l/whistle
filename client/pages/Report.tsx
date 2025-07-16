import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageSquare,
  Lock,
  Upload,
  ArrowLeft,
  Send,
  CheckCircle,
  AlertCircle,
  Camera,
  Shield,
  AlertTriangle,
  Heart,
  MessageCircle,
  Flag,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  CreateReportRequest,
  CreateReportResponse,
  ReportCategory,
  ReportSeverity,
} from "@shared/api";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function Report() {
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState<ReportCategory>("harassment");
  const [severity, setSeverity] = useState<ReportSeverity>("medium");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [reportId, setReportId] = useState<string>("");
  const [error, setError] = useState<string>("");

  const categoryOptions = [
    {
      value: "harassment",
      label: "Harassment",
      icon: Flag,
      description: "Inappropriate behavior, bullying, or discrimination",
    },
    {
      value: "medical",
      label: "Medical Emergency",
      icon: Heart,
      description: "Health-related emergencies or medical assistance needed",
    },
    {
      value: "emergency",
      label: "Safety Emergency",
      icon: AlertTriangle,
      description: "Immediate safety threats or dangerous situations",
    },
    {
      value: "safety",
      label: "Safety Concern",
      icon: Shield,
      description: "General safety issues or security concerns",
    },
    {
      value: "feedback",
      label: "Feedback",
      icon: MessageCircle,
      description: "General feedback or non-urgent concerns",
    },
  ] as const;

  const severityOptions = [
    { value: "low", label: "Low Priority", color: "text-muted-foreground" },
    { value: "medium", label: "Medium Priority", color: "text-yellow-600" },
    { value: "high", label: "High Priority", color: "text-orange-600" },
    { value: "urgent", label: "Urgent", color: "text-red-600" },
  ] as const;

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("Photo must be smaller than 5MB");
        return;
      }

      // Check file type
      if (!file.type.startsWith("image/")) {
        setError("Please select a valid image file");
        return;
      }

      setPhotoFile(file);
      setError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      setError("Please enter a message");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      let photo_url = "";

      // If there's a photo, convert to base64 for demo
      // In production, you'd upload to a file storage service
      if (photoFile) {
        const reader = new FileReader();
        photo_url = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(photoFile);
        });
      }

      const reportData: CreateReportRequest = {
        message: message.trim(),
        category,
        severity,
        photo_url: photo_url || undefined,
      };

      const response = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reportData),
      });

      if (!response.ok) {
        throw new Error("Failed to submit report");
      }

      const result: CreateReportResponse = await response.json();
      setReportId(result.id);
      setSubmitted(true);
    } catch (err) {
      console.error("Error submitting report:", err);
      setError("Failed to submit report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
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
                <p className="text-xs text-muted-foreground">
                  Anonymous Reporting
                </p>
              </div>
            </Link>
          </div>
        </header>

        {/* Success Content */}
        <div className="py-20 px-4">
          <div className="container mx-auto max-w-2xl text-center">
            <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-success" />
            </div>

            <h2 className="text-3xl font-bold mb-4">
              Report Submitted Successfully
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Thank you for your report. It has been submitted anonymously and
              securely.
            </p>

            <Card className="text-left mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Your Report ID
                </CardTitle>
                <CardDescription>
                  Save this ID to check the status of your report later
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-lg">
                  <code className="text-lg font-mono">{reportId}</code>
                </div>
              </CardContent>
            </Card>

            <Alert className="mb-8">
              <Lock className="h-4 w-4" />
              <AlertDescription>
                Your report has been submitted anonymously. No personal
                information was collected or stored.
              </AlertDescription>
            </Alert>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={`/check-status`}>
                <Button className="whistle-gradient hover:opacity-90">
                  Check Status Later
                </Button>
              </Link>
              <Link to="/">
                <Button variant="outline">Return Home</Button>
              </Link>
              <Button
                variant="secondary"
                onClick={() => {
                  setSubmitted(false);
                  setMessage("");
                  setPhotoFile(null);
                  setReportId("");
                }}
              >
                Submit Another Report
              </Button>
            </div>
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
              <p className="text-xs text-muted-foreground">
                Anonymous Reporting
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Form Content */}
      <div className="py-12 px-4">
        <div className="container mx-auto max-w-2xl">
          <div className="text-center mb-8">
            <Badge variant="secondary" className="mb-4">
              <Lock className="w-4 h-4 mr-1" />
              Anonymous & Secure
            </Badge>
            <h2 className="text-3xl font-bold mb-4">Submit Anonymous Report</h2>
            <p className="text-muted-foreground">
              Your privacy is protected. This form collects no personal
              information.
            </p>
          </div>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Report Details</CardTitle>
              <CardDescription>
                Describe the incident or concern you'd like to report. Be as
                specific as possible.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="category">Report Category *</Label>
                    <Select
                      value={category}
                      onValueChange={(value) =>
                        setCategory(value as ReportCategory)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map((option) => {
                          const Icon = option.icon;
                          return (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center gap-2">
                                <Icon className="w-4 h-4" />
                                <div>
                                  <div className="font-medium">
                                    {option.label}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {option.description}
                                  </div>
                                </div>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="severity">Priority Level *</Label>
                    <Select
                      value={severity}
                      onValueChange={(value) =>
                        setSeverity(value as ReportSeverity)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        {severityOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <span className={option.color}>{option.label}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Your Report *</Label>
                  <Textarea
                    id="message"
                    placeholder="Please describe the incident, concern, or feedback you'd like to report. Include relevant details such as date, time, location, and people involved..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="min-h-[120px] resize-none"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    {message.length}/1000 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="photo">Photo Evidence (Optional)</Label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                    {photoFile ? (
                      <div className="space-y-2">
                        <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center mx-auto">
                          <CheckCircle className="w-6 h-6 text-success" />
                        </div>
                        <p className="text-sm font-medium">{photoFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(photoFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setPhotoFile(null)}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mx-auto">
                          <Camera className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <p className="text-sm">Click to upload a photo</p>
                        <p className="text-xs text-muted-foreground">
                          PNG, JPG up to 5MB
                        </p>
                      </div>
                    )}
                    <Input
                      id="photo"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="mt-2"
                    />
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    Your report will be submitted completely anonymously. No
                    personal information, IP addresses, or identifying data will
                    be stored.
                  </AlertDescription>
                </Alert>

                <Button
                  type="submit"
                  className="w-full whistle-gradient hover:opacity-90"
                  size="lg"
                  disabled={isSubmitting || !message.trim()}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Submitting...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Send className="w-4 h-4" />
                      Submit Anonymous Report
                    </div>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
