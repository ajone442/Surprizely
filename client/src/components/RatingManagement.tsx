
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Trash2, AlertCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface RatingManagementProps {
  productId: number;
  onUpdate: () => void;
}

interface Rating {
  id: number;
  userId: number;
  productId: number;
  rating: number;
  createdAt: string;
  username?: string;
}

export function RatingManagement({ productId, onUpdate }: RatingManagementProps) {
  const { toast } = useToast();
  const [selectedRating, setSelectedRating] = React.useState<Rating | null>(null);
  const [editedRating, setEditedRating] = React.useState<number>(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  
  const { data: ratings = [], refetch } = useQuery({
    queryKey: ["ratings", productId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/ratings/${productId}`);
      const ratings = await response.json();
      
      // Fetch usernames
      for (const rating of ratings) {
        try {
          const userResponse = await apiRequest("GET", `/api/admin/users/${rating.userId}`);
          const userData = await userResponse.json();
          rating.username = userData.username;
        } catch (error) {
          rating.username = `User ${rating.userId}`;
        }
      }
      
      return ratings;
    }
  });
  
  const handleEditRating = async () => {
    if (!selectedRating || editedRating === 0) return;
    
    try {
      const response = await apiRequest("PUT", `/api/admin/ratings/${selectedRating.id}`, {
        rating: editedRating
      });
      
      if (response.ok) {
        toast({
          title: "Rating Updated",
          description: "The rating has been successfully updated."
        });
        
        setSelectedRating(null);
        setEditedRating(0);
        refetch();
        onUpdate();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update the rating. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleDeleteRating = async () => {
    if (!selectedRating) return;
    
    try {
      const response = await apiRequest("DELETE", `/api/admin/ratings/${selectedRating.id}`);
      
      if (response.ok) {
        toast({
          title: "Rating Deleted",
          description: "The rating has been successfully deleted."
        });
        
        setSelectedRating(null);
        setDeleteDialogOpen(false);
        refetch();
        onUpdate();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete the rating. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  if (!ratings.length) {
    return (
      <Card>
        <CardContent className="p-4 flex items-center justify-center">
          <AlertCircle className="h-4 w-4 mr-2" />
          <p>No ratings available for this product.</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Rating</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ratings.map((rating) => (
            <TableRow key={rating.id}>
              <TableCell>{rating.username || `User ${rating.userId}`}</TableCell>
              <TableCell>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        rating.rating >= star
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-muted-foreground"
                      }`}
                    />
                  ))}
                </div>
              </TableCell>
              <TableCell>
                {new Date(rating.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedRating(rating);
                      setEditedRating(rating.rating);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setSelectedRating(rating);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {selectedRating && !deleteDialogOpen && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2">Edit Rating</h3>
            <div className="flex items-center space-x-4">
              <Select
                value={editedRating.toString()}
                onValueChange={(value) => setEditedRating(parseInt(value))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Select rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Star</SelectItem>
                  <SelectItem value="2">2 Stars</SelectItem>
                  <SelectItem value="3">3 Stars</SelectItem>
                  <SelectItem value="4">4 Stars</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleEditRating}>Save</Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedRating(null);
                  setEditedRating(0);
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Rating</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this rating? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRating}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
