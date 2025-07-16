import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Trophy,
  Zap,
  Shield,
  QrCode,
  Brain,
  Lock,
  Users,
  Bell,
} from "lucide-react";

export default function WinningFeatures() {
  return (
    <section className="py-20 px-4 bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <Badge
            variant="secondary"
            className="mb-4 bg-yellow-100 text-yellow-800"
          >
            <Trophy className="w-4 h-4 mr-1" />
            🏆 Award-Winning Innovation
          </Badge>
          <h3 className="text-3xl font-bold mb-4">
            Why Whistle is Built to Win
          </h3>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
            Combining cutting-edge security, real-time AI, and innovative UX
            design to create the most comprehensive anonymous reporting platform
            for hackathons, workplaces, and events.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="text-center border-2 border-primary/20 hover:border-primary/40 transition-colors">
            <CardHeader>
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-lg">E2E Encryption</CardTitle>
              <CardDescription>
                Military-grade AES-256 encryption ensures reports are secure
                from submission to admin review.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center border-2 border-success/20 hover:border-success/40 transition-colors">
            <CardHeader>
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-success" />
              </div>
              <CardTitle className="text-lg">Real-time Alerts</CardTitle>
              <CardDescription>
                Instant notifications via email/SMS with AI-powered severity
                detection and automatic escalation.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center border-2 border-info/20 hover:border-info/40 transition-colors">
            <CardHeader>
              <div className="w-16 h-16 rounded-full bg-info/10 flex items-center justify-center mx-auto mb-4">
                <QrCode className="w-8 h-8 text-info" />
              </div>
              <CardTitle className="text-lg">QR Innovation</CardTitle>
              <CardDescription>
                Printable QR codes with embedded safety info - zero-friction
                access without downloads or URLs.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center border-2 border-warning/20 hover:border-warning/40 transition-colors">
            <CardHeader>
              <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-warning" />
              </div>
              <CardTitle className="text-lg">AI Classification</CardTitle>
              <CardDescription>
                Smart categorization and severity detection automatically routes
                urgent reports for immediate attention.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Technical Innovation */}
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardHeader>
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-6 h-6 text-primary" />
                <CardTitle>Privacy-First Architecture</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>✓ Zero personal data collection</p>
              <p>✓ Anonymous session management</p>
              <p>✓ Encrypted photo metadata removal</p>
              <p>✓ GDPR/CCPA compliant by design</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-success/5 to-success/10 border-success/20">
            <CardHeader>
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-6 h-6 text-success" />
                <CardTitle>Enterprise-Ready Scale</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>✓ Multi-admin role management</p>
              <p>✓ Bulk report processing</p>
              <p>✓ Audit trail compliance</p>
              <p>✓ White-label customization</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-info/5 to-info/10 border-info/20">
            <CardHeader>
              <div className="flex items-center gap-3 mb-4">
                <Bell className="w-6 h-6 text-info" />
                <CardTitle>Smart Alert System</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>✓ Priority-based routing</p>
              <p>✓ Escalation workflows</p>
              <p>✓ Multi-channel notifications</p>
              <p>✓ Response time tracking</p>
            </CardContent>
          </Card>
        </div>

        {/* Impact Statement */}
        <div className="text-center mt-16 p-8 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl border border-primary/20">
          <h4 className="text-2xl font-bold mb-4">🎯 Real-World Impact</h4>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Whistle doesn't just collect reports—it saves lives, prevents
            harassment, and creates safer spaces where people can speak up
            without fear. Built for hackathons, scalable for enterprises,
            trusted by communities.
          </p>
          <div className="flex justify-center gap-8 mt-6 text-sm">
            <div>
              <div className="text-2xl font-bold text-primary">100%</div>
              <div className="text-muted-foreground">Anonymous</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-success">
                ⚡ Real-time
              </div>
              <div className="text-muted-foreground">Alerts</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-info">🔒 Encrypted</div>
              <div className="text-muted-foreground">End-to-End</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
