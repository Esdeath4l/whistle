import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Copy, ExternalLink, Mail, Shield, AlertTriangle } from "lucide-react";

interface EmailSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EmailSetupDialog({ open, onOpenChange }: EmailSetupDialogProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Notifications Setup
          </DialogTitle>
          <DialogDescription>
            Configure email alerts for urgent harassment reports
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> Email notifications are currently not configured. 
              Urgent reports will only show in-app notifications until email is set up.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Gmail App Password Setup
            </h3>
            
            <div className="space-y-3 text-sm">
              <p>To enable email notifications for urgent reports, you need to generate a Gmail App Password:</p>
              
              <div className="space-y-2">
                <div className="font-medium">Step 1: Enable 2-Factor Authentication</div>
                <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground">
                  <li>Go to your Google Account settings</li>
                  <li>Navigate to Security → 2-Step Verification</li>
                  <li>Enable 2FA if not already enabled</li>
                </ul>
              </div>

              <div className="space-y-2">
                <div className="font-medium">Step 2: Generate App Password</div>
                <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground">
                  <li>Visit: <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">
                    Google App Passwords <ExternalLink className="w-3 h-3" />
                  </a></li>
                  <li>Select "Mail" as the app</li>
                  <li>Select "Other" for device and enter "Whistle Admin"</li>
                  <li>Click "Generate" and copy the 16-character password</li>
                </ul>
              </div>

              <div className="space-y-2">
                <div className="font-medium">Step 3: Configure Environment</div>
                <div className="space-y-2">
                  <div className="bg-muted p-3 rounded-lg font-mono text-xs">
                    <div className="flex items-center justify-between">
                      <span>EMAIL_APP_PASSWORD=your_app_password_here</span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => copyToClipboard("EMAIL_APP_PASSWORD=your_app_password_here")}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Replace <code>your_app_password_here</code> with the generated 16-character password
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2">Current Configuration</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Email Service:</span>
                <Badge variant="outline">Gmail SMTP</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Sender Email:</span>
                <Badge variant="outline">ritisulo@gmail.com</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Alert Recipient:</span>
                <Badge variant="outline">ritisulo@gmail.com</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>App Password:</span>
                <Badge variant="destructive">Not Configured</Badge>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2">What You'll Receive</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Immediate email alerts for urgent/emergency reports</li>
              <li>• Detailed report information and admin action links</li>
              <li>• Professional HTML-formatted notifications</li>
              <li>• Backup plain text for all email clients</li>
            </ul>
          </div>

          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
            <Button 
              onClick={() => {
                window.open("https://myaccount.google.com/apppasswords", "_blank");
              }}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Generate App Password
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
