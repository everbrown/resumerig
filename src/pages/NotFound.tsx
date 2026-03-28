import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <Sparkles className="h-10 w-10 text-secondary mb-6" />
      <h1 className="font-display text-7xl font-bold text-foreground mb-2">404</h1>
      <p className="font-display text-xl text-muted-foreground mb-1">Page not found</p>
      <p className="font-body text-sm text-muted-foreground mb-8">
        The page <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">{location.pathname}</code> doesn't exist.
      </p>
      <Button asChild variant="default" className="gap-2 font-body">
        <Link to="/">
          <ArrowLeft className="h-4 w-4" />
          Back to ResumeRig
        </Link>
      </Button>
    </div>
  );
};

export default NotFound;
