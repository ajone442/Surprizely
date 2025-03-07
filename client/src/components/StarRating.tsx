
import React from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface StarRatingProps {
  productId: number;
  initialRating?: number;
  averageRating?: number;
  ratingCount?: number;
  readOnly?: boolean;
  size?: "sm" | "md" | "lg";
  onRatingChange?: (newRating: number) => void;
  className?: string;
}

export function StarRating({
  productId,
  initialRating = 0,
  averageRating,
  ratingCount,
  readOnly = false,
  size = "md",
  onRatingChange,
  className = "",
}: StarRatingProps) {
  const [rating, setRating] = React.useState(initialRating);
  const [hoveredRating, setHoveredRating] = React.useState(0);
  const [userRating, setUserRating] = React.useState(initialRating);
  const [isLoading, setIsLoading] = React.useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Load user's existing rating if they're logged in
  React.useEffect(() => {
    if (user && !readOnly) {
      const fetchUserRating = async () => {
        try {
          const response = await apiRequest("GET", `/api/ratings/user/${productId}`);
          const data = await response.json();
          if (data && data.rating) {
            setRating(data.rating);
            setUserRating(data.rating);
          }
        } catch (error) {
          console.error("Failed to fetch user rating:", error);
        }
      };
      
      fetchUserRating();
    }
  }, [productId, user, readOnly]);
  
  const handleRating = async (newRating: number) => {
    if (readOnly || !user) {
      return;
    }
    
    setRating(newRating);
    setUserRating(newRating);
    setIsLoading(true);
    
    try {
      const response = await apiRequest("POST", `/api/ratings/${productId}`, {
        rating: newRating
      });
      
      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Rating Submitted",
          description: "Thank you for rating this product!",
        });
        
        if (onRatingChange) {
          onRatingChange(newRating);
        }
      }
    } catch (error) {
      console.error("Failed to submit rating:", error);
      toast({
        title: "Error",
        description: "Failed to submit your rating. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };
  
  const starSize = sizeClasses[size];
  
  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Button
            key={star}
            variant="ghost"
            size="icon"
            disabled={isLoading || readOnly || !user}
            className="p-0 m-0 h-auto"
            onClick={() => handleRating(star)}
            onMouseEnter={() => !readOnly && setHoveredRating(star)}
            onMouseLeave={() => !readOnly && setHoveredRating(0)}
          >
            <Star
              className={`${starSize} ${
                (hoveredRating ? hoveredRating >= star : rating >= star)
                  ? "text-yellow-400 fill-yellow-400"
                  : "text-muted-foreground"
              }`}
            />
          </Button>
        ))}
        
        {averageRating !== undefined && ratingCount !== undefined && (
          <span className="ml-2 text-sm text-muted-foreground">
            {averageRating.toFixed(1)} ({ratingCount})
          </span>
        )}
        
        {!user && !readOnly && (
          <span className="ml-2 text-xs text-muted-foreground">
            Log in to rate
          </span>
        )}
      </div>
    </div>
  );
}
