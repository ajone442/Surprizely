import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Activity, Gift, Heart, LogIn, LogOut, User } from "lucide-react";

export default function Navigation() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 flex h-14 items-center justify-between">
        <div className="flex pl-2">
          <Link href="/" className="flex items-center space-x-2">
            <Gift className="h-6 w-6" />
            <span className="font-bold">Suprizely</span>
          </Link>
        </div>

        <div className="flex items-center space-x-2">
          {user ? (
            <>
              <Button
                variant={location === "/wishlist" ? "default" : "ghost"}
                size="sm"
                asChild
              >
                <Link href="/wishlist">
                  <Heart className="mr-2 h-4 w-4" />
                  Wishlist
                </Link>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <User className="mr-2 h-4 w-4" />
                    {user.username}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/account">
                      <User className="mr-2 h-4 w-4" />
                      Manage Account
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/status">
                      <Activity className="mr-2 h-4 w-4" />
                      System Status
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => logoutMutation.mutate()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button size="sm" asChild>
              <Link href="/auth">
                <LogIn className="mr-2 h-4 w-4" />
                Login
              </Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}

// Footer component
const Footer = () => {
  const { user } = useAuth();
  return (
    <footer className="bg-gray-100 p-4 text-center">
      {user && user.isAdmin && (
        <Link href="/admin">Admin Dashboard</Link>
      )}
      <p>&copy; 2023 Gift Finder</p>
    </footer>
  );
};

export {Footer};