
import React from "react";
import { Heart } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { StarRating } from "./StarRating";

interface ProductCardProps {
  product: {
    id: number;
    name: string;
    description: string;
    price: number;
    imageUrl: string;
    affiliateLink: string;
    category: string;
    averageRating?: number;
    ratingCount?: number;
  };
  inWishlist?: boolean;
  onWishlistChange?: () => void;
  onRatingChange?: () => void;
}

export function ProductCard({
  product,
  inWishlist = false,
  onWishlistChange,
  onRatingChange,
}: ProductCardProps) {
  const [isInWishlist, setIsInWishlist] = React.useState(inWishlist);
  const [isLoading, setIsLoading] = React.useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const toggleWishlist = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to add items to your wishlist",
      });
      return;
    }

    setIsLoading(true);
    try {
      if (isInWishlist) {
        await apiRequest("DELETE", `/api/wishlist/${product.id}`);
        setIsInWishlist(false);
        toast({
          title: "Removed from Wishlist",
          description: `${product.name} has been removed from your wishlist`,
        });
      } else {
        await apiRequest("POST", `/api/wishlist/${product.id}`);
        setIsInWishlist(true);
        toast({
          title: "Added to Wishlist",
          description: `${product.name} has been added to your wishlist`,
        });
      }
      if (onWishlistChange) {
        onWishlistChange();
      }
    } catch (error) {
      console.error("Wishlist operation failed:", error);
      toast({
        title: "Error",
        description: "Failed to update wishlist. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRatingChange = () => {
    if (onRatingChange) {
      onRatingChange();
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-video overflow-hidden">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="object-cover w-full h-full"
        />
      </div>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-lg line-clamp-1">{product.name}</h3>
            <p className="text-sm text-muted-foreground">{product.category}</p>
          </div>
          <div className="text-lg font-bold">${(product.price / 100).toFixed(2)}</div>
        </div>
        <p className="mt-2 text-sm line-clamp-2">{product.description}</p>
        
        <div className="mt-3">
          <StarRating 
            productId={product.id}
            averageRating={product.averageRating || 0}
            ratingCount={product.ratingCount || 0}
            onRatingChange={handleRatingChange}
          />
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between">
        <Button
          variant="outline"
          size="icon"
          disabled={isLoading}
          onClick={toggleWishlist}
        >
          <Heart
            className={`h-4 w-4 ${isInWishlist ? "fill-red-500 text-red-500" : ""}`}
          />
        </Button>
        <Button
          className="flex-1 ml-2"
          onClick={() => window.open(product.affiliateLink, "_blank")}
        >
          View Product
        </Button>
      </CardFooter>
    </Card>
  );
}
