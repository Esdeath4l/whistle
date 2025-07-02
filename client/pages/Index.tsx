import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Shield,
  MessageSquare,
  Lock,
  Users,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl whistle-gradient flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Whistle</h1>
              <p className="text-xs text-muted-foreground">
                Anonymous Reporting
              </p>
            </div>
          </div>
          <Link to="/admin">
            <Button variant="outline" size="sm">
              Admin Access
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Lock className="w-4 h-4" />
            100% Anonymous & Secure
          </div>

          <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Report Safely,
            <br />
            <span className="whistle-gradient bg-clip-text text-transparent">
              Stay Anonymous
            </span>
          </h2>

          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Whistle provides a secure, anonymous platform for reporting
            incidents, concerns, or feedback. Your privacy is our priority.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/report">
              <Button
                size="lg"
                className="whistle-gradient hover:opacity-90 transition-opacity px-8 py-6 text-lg"
              >
                <MessageSquare className="w-5 h-5 mr-2" />
                Submit Anonymous Report
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="px-8 py-6 text-lg">
              <Shield className="w-5 h-5 mr-2" />
              Learn How It Works
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold mb-4">Why Choose Whistle?</h3>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Built with privacy and security at its core, designed for
              organizations that care about their community.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Lock className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>100% Anonymous</CardTitle>
                <CardDescription>
                  No personal information required. Your identity remains
                  completely protected.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-success" />
                </div>
                <CardTitle>Secure Platform</CardTitle>
                <CardDescription>
                  Enterprise-grade security ensures your reports are safe and
                  confidential.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-info/10 flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-info" />
                </div>
                <CardTitle>Real-time Response</CardTitle>
                <CardDescription>
                  Administrators receive instant notifications and can respond
                  quickly.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center mb-4">
                  <AlertTriangle className="w-6 h-6 text-warning" />
                </div>
                <CardTitle>Photo Evidence</CardTitle>
                <CardDescription>
                  Optionally attach photo evidence to support your report.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center mb-4">
                  <CheckCircle className="w-6 h-6 text-success" />
                </div>
                <CardTitle>Track Progress</CardTitle>
                <CardDescription>
                  Get a private tracking code to check the status of your
                  report.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <MessageSquare className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Easy to Use</CardTitle>
                <CardDescription>
                  Simple, intuitive interface makes reporting quick and
                  straightforward.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-3xl">
          <h3 className="text-3xl font-bold mb-6">Ready to Make a Report?</h3>
          <p className="text-muted-foreground text-lg mb-10">
            Your voice matters. Report incidents safely and help create a better
            environment for everyone.
          </p>
          <Link to="/report">
            <Button
              size="lg"
              className="whistle-gradient hover:opacity-90 transition-opacity px-10 py-6 text-lg"
            >
              Start Anonymous Report
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-12 px-4">
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
