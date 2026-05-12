import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="text-7xl font-bold text-muted-foreground mb-4">404</div>
      <h2 className="text-2xl font-bold text-foreground mb-2">Page Not Found</h2>
      <p className="text-muted-foreground mb-6">The page you are looking for does not exist.</p>
      <Link href="/">
        <Button className="gap-2">
          <Home className="w-4 h-4" /> Go Home
        </Button>
      </Link>
    </div>
  );
}
