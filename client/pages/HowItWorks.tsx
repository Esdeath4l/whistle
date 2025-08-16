import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  ArrowLeft,
  Shield,
  Lock,
  Eye,
  FileText,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  Server,
  Key,
  UserX,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function HowItWorks() {
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
              <p className="text-xs text-muted-foreground">How It Works</p>
            </div>
          </Link>
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <Badge variant="secondary" className="mb-6">
            <Shield className="w-4 h-4 mr-1" />
            Security & Privacy Guide
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            How Whistle Works
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Understanding our commitment to your privacy and how our anonymous
            reporting system protects your identity.
          </p>
        </div>
      </section>

      {/* How It Works Steps */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <h3 className="text-3xl font-bold text-center mb-12">
            Simple, Secure, Anonymous
          </h3>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="text-center border-0 shadow-lg">
              <CardHeader>
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-primary" />
                </div>
                <CardTitle>1. Submit Report</CardTitle>
                <CardDescription>
                  Write your concern anonymously. No personal information
                  required.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center border-0 shadow-lg">
              <CardHeader>
                <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                  <Server className="w-8 h-8 text-success" />
                </div>
                <CardTitle>2. Secure Processing</CardTitle>
                <CardDescription>
                  Your report is encrypted and stored securely without any
                  identifying data.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center border-0 shadow-lg">
              <CardHeader>
                <div className="w-16 h-16 rounded-full bg-info/10 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-info" />
                </div>
                <CardTitle>3. Admin Review</CardTitle>
                <CardDescription>
                  Administrators review and respond to reports in real-time.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Privacy & Security */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <h3 className="text-3xl font-bold text-center mb-12">
            Your Privacy is Protected
          </h3>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-destructive/10 flex items-center justify-center">
                    <UserX className="w-6 h-6 text-destructive" />
                  </div>
                  <CardTitle>What We DON'T Collect</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-destructive" />
                  <span>No IP addresses or device fingerprinting</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-destructive" />
                  <span>No personal information or contact details</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-destructive" />
                  <span>No cookies or tracking scripts</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-destructive" />
                  <span>
                    No location data or timestamps that could identify you
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-destructive" />
                  <span>No browser history or referrer information</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-success" />
                  </div>
                  <CardTitle>Security Measures</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-success" />
                  <span>End-to-end encryption for all data</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-success" />
                  <span>Secure servers with enterprise-grade protection</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-success" />
                  <span>Regular security audits and updates</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-success" />
                  <span>Anonymous report tracking system</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-success" />
                  <span>Admin access controls and audit logs</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Technical Details */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <h3 className="text-3xl font-bold text-center mb-12">
            Technical Implementation
          </h3>

          <div className="space-y-8">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Lock className="w-6 h-6 text-primary" />
                  <CardTitle>Anonymous Session Management</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Reports are submitted without any session tracking or user
                  identification. Each report is assigned a random, unique ID
                  that cannot be traced back to the submitter. Our system is
                  designed to never store any personally identifiable
                  information.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Key className="w-6 h-6 text-primary" />
                  <CardTitle>Data Encryption</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  All report data is encrypted both in transit and at rest using
                  industry-standard AES-256 encryption. Photos are processed and
                  stored with additional security layers to prevent any metadata
                  from revealing identifying information.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Eye className="w-6 h-6 text-primary" />
                  <CardTitle>Admin Access Controls</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Only authorized administrators can view reports through
                  password-protected access. Admin actions are logged for
                  accountability while maintaining reporter anonymity. No admin
                  can trace a report back to its source.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Safety Guidelines */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h3 className="text-3xl font-bold text-center mb-12">
            Safety Guidelines
          </h3>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-success" />
                  Best Practices
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  • Use public computers or incognito mode for extra privacy
                </p>
                <p className="text-sm text-muted-foreground">
                  • Be specific about incidents without revealing your identity
                </p>
                <p className="text-sm text-muted-foreground">
                  • Include relevant dates, times, and locations if safe to do
                  so
                </p>
                <p className="text-sm text-muted-foreground">
                  • Save your report ID in a secure place for tracking
                </p>
                <p className="text-sm text-muted-foreground">
                  • Report immediately after incidents when details are fresh
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                  Important Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  • For immediate emergencies, contact local authorities first
                </p>
                <p className="text-sm text-muted-foreground">
                  • Avoid including names unless absolutely necessary
                </p>
                <p className="text-sm text-muted-foreground">
                  • Remove metadata from photos before uploading
                </p>
                <p className="text-sm text-muted-foreground">
                  • This system is for organizational reporting, not legal
                  advice
                </p>
                <p className="text-sm text-muted-foreground">
                  • Reports may be shared with relevant authorities if required
                  by law
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto text-center max-w-3xl">
          <h3 className="text-3xl font-bold mb-6">Ready to Report?</h3>
          <p className="text-muted-foreground text-lg mb-8">
            Your safety and privacy are our top priorities. Submit your report
            with confidence knowing your identity is completely protected.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/report">
              <Button
                size="lg"
                className="whistle-gradient hover:opacity-90 transition-opacity px-8 py-6 text-lg"
              >
                <MessageSquare className="w-5 h-5 mr-2" />
                Submit Anonymous Report
              </Button>
            </Link>
            <Link to="/">
              <Button variant="outline" size="lg" className="px-8 py-6 text-lg">
                Return Home
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card/50 py-12 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg whistle-gradient flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">Whistle</span>
          </div>
          <p className="text-muted-foreground">
            Secure Anonymous Reporting Platform
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            Your privacy is protected. Reports are anonymous and secure.
          </p>
        </div>
      </footer>
    </div>
  );
}
