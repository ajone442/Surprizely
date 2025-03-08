
import { Product } from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Heart } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Rating } from "./Rating";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: wishlist = [] } = useQuery<Product[]>({
    queryKey: ["/api/wishlist"],
    enabled: !!user,
  });

  const isInWishlist = wishlist.some((item) => item.id === product.id);

  const addToWishlist = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/wishlist/${product.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
      toast({
        title: "Added to wishlist",
        description: "The item has been added to your wishlist.",
      });
    },
  });

  const removeFromWishlist = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/wishlist/${product.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
      toast({
        title: "Removed from wishlist",
        description: "The item has been removed from your wishlist.",
      });
    },
  });

  const handleWishlistClick = () => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to add items to your wishlist.",
        variant: "destructive",
      });
      return;
    }

    if (isInWishlist) {
      removeFromWishlist.mutate();
    } else {
      addToWishlist.mutate();
    }
  };

  return (
    <Card className="overflow-hidden h-full flex flex-col">
      {product.imageUrl && (
        <div className="aspect-[4/3] relative">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="object-cover w-full h-full"
          />
          <button
            onClick={handleWishlistClick}
            className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow-md"
          >
            <Heart
              className={`h-5 w-5 ${
                isInWishlist ? "fill-red-500 text-red-500" : "text-gray-400"
              }`}
            />
          </button>
        </div>
      )}
      <CardHeader className="p-4 pb-0">
        <CardTitle className="line-clamp-1">{product.name}</CardTitle>
        <CardDescription>${parseFloat(String(product.price)).toFixed(2)}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 py-2 flex-grow">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {product.description || "No description available"}
        </p>
        <div className="mt-2">
          <Rating rating={product.averageRating || 0} />
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between">
        <span className="text-xs uppercase tracking-wider font-medium text-muted-foreground">
          {product.category}
        </span>
        {product.affiliateLink && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(product.affiliateLink, "_blank")}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
