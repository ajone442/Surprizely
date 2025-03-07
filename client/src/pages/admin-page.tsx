import { useQuery } from "@tanstack/react-query";
import { Product } from "@shared/schema";
import ProductForm from "@/components/ProductForm";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Pencil, Trash2, ArrowLeft, Star } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { RatingManagement } from "@/components/RatingManagement"; // Placeholder component


export default function AdminPage() {
  const { logoutMutation } = useAuth();
  const { toast } = useToast();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [, setLocation] = useLocation();
  const [showRatings, setShowRatings] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    queryFn: fetchProducts //Added fetchProducts function call here
  });

  const fetchProducts = async () => {
    const data = await apiRequest("GET", "/api/products");
    return data;
  }

  const handleDelete = async (id: number) => {
    try {
      await apiRequest("DELETE", `/api/products/${id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Product deleted",
        description: "The product has been successfully deleted.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    }
  };

  const handleEditRatings = (productId: number) => {
    setEditingProduct(null); //Added to prevent conflicting states
    setSelectedProductId(productId);
    setShowRatings(true);
  };


  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setLocation("/")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-4xl font-bold">Admin Dashboard</h1>
          </div>
          <Button variant="outline" onClick={() => logoutMutation.mutate()}>
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-semibold mb-4">
              {editingProduct ? "Edit Product" : "Add New Product"}
            </h2>
            <ProductForm
              product={editingProduct}
              onComplete={() => setEditingProduct(null)}
            />
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">Products</h2>
            <div className="space-y-4">
              {products.map((product) => (
                <Card key={product.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <h3 className="font-semibold">{product.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {product.category} - ${product.price}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setEditingProduct(product)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDelete(product.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={() => handleEditRatings(product.id)}
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
        {showRatings && selectedProductId && (
          <Dialog open={true} onOpenChange={() => setShowRatings(false)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Rating Management</DialogTitle>
                <DialogDescription>
                  Manage customer ratings for this product.
                </DialogDescription>
              </DialogHeader>
              <RatingManagement 
                productId={selectedProductId} 
                onUpdate={fetchProducts}
              />
            </DialogContent>
          </Dialog>
        )}

        {(editingProduct) && (
          <Dialog open={true} onOpenChange={() => {
            setEditingProduct(null);
          }}>
            {/*Existing Dialog Content remains here*/}
          </Dialog>
        )}
      </main>
    </div>
  );
}