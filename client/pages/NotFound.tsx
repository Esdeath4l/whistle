import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, AlertTriangle, MessageSquare } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

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
          <Link to="/">
            <Button variant="ghost" size="sm">
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
          </Link>
        </div>
      </header>

      {/* 404 Content */}
      <div className="flex items-center justify-center min-h-[80vh] px-4">
        <Card className="max-w-md w-full shadow-lg">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle className="text-3xl font-bold mb-2">404</CardTitle>
            <p className="text-xl text-muted-foreground">Page Not Found</p>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Sorry, the page you're looking for doesn't exist or has been
              moved.
            </p>
            <p className="text-sm text-muted-foreground">
              You tried to access:{" "}
              <code className="bg-muted px-2 py-1 rounded">
                {location.pathname}
              </code>
            </p>
            <div className="flex flex-col gap-3 pt-4">
              <Link to="/">
                <Button className="w-full whistle-gradient hover:opacity-90">
                  <Home className="w-4 h-4 mr-2" />
                  Return to Home
                </Button>
              </Link>
              <Link to="/report">
                <Button variant="outline" className="w-full">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Submit Report
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NotFound;
