import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export default function Footer() {
  const { user } = useAuth();

  return (
    <footer className="border-t py-6 md:py-0">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-14 md:flex-row">
        <p className="text-sm text-muted-foreground">
          © 2025 Gift Finder. All rights reserved.
        </p>
        <nav className="text-sm text-muted-foreground">
          {user?.isAdmin && (
            <Link 
              href="/admin"
              className="hover:text-foreground transition-colors border-b border-dotted border-current"
            >
              Admin Dashboard
            </Link>
          )}
        </nav>
      </div>
    </footer>
  );
}