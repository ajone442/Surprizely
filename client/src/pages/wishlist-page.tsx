import { useQuery } from "@tanstack/react-query";
import { Product } from "@shared/schema";
import GiftCard from "@/components/GiftCard";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Share2 } from "lucide-react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function WishlistPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  if (!user) {
    // Redirect to auth page with return URL
    setLocation(`/auth?redirect=/wishlist`);
    return null;
  }

  const { data: wishlist = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/wishlist"],
    enabled: !!user,
  });

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Wishlist shared!",
        description: "The link has been copied to your clipboard.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy wishlist link.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold">My Wishlist</h1>
              <p className="mt-2 text-muted-foreground">
                Your saved gift ideas
              </p>
            </div>
            <Button
              onClick={handleShare}
              variant="outline"
              className="gap-2"
            >
              <Share2 className="h-4 w-4" />
              Share Wishlist
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : wishlist.length === 0 ? (
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">Your wishlist is empty</p>
            <Button asChild>
              <Link href="/">Browse Gifts</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlist.map((product) => (
              <GiftCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}