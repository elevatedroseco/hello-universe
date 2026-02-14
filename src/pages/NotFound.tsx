import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <AlertTriangle className="w-12 h-12 mx-auto text-modded-gold" />
        <h1 className="font-display text-5xl font-bold text-foreground">404</h1>
        <p className="text-muted-foreground text-lg">
          Route <span className="font-mono text-sm text-primary">{location.pathname}</span> not found
        </p>
        <Button asChild variant="outline" className="border-border">
          <Link to="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Return to HQ
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
