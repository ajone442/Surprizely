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

interface GiftCardProps {
  product: Product;
}

export default function GiftCard({ product }: GiftCardProps) {
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
    <Card className="overflow-hidden">
      <img
        src={product.imageUrl}
        alt={product.name}
        className="w-full h-48 object-cover"
      />
      <CardHeader>
        <CardTitle>{product.name}</CardTitle>
        <CardDescription>{product.category}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{product.description}</p>
        <p className="mt-2 text-lg font-semibold">
          ${product.price}
        </p>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={handleWishlistClick}
          disabled={addToWishlist.isPending || removeFromWishlist.isPending}
          className={isInWishlist ? "text-primary" : ""}
        >
          <Heart className={`h-4 w-4 ${isInWishlist ? "fill-current" : ""}`} />
        </Button>
        <Button
          className="flex-1"
          onClick={() => window.open(product.affiliateLink, "_blank")}
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          View Product
        </Button>
      </CardFooter>
    </Card>
  );
}