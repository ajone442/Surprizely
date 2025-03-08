
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Product } from "@shared/schema";
import ProductForm from "@/components/ProductForm";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, ArrowLeft, Star } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { RatingManagement } from "@/components/RatingManagement"; // Placeholder component
import { useMutation } from "@tanstack/react-query";

export default function AdminPage() {
  const { toast } = useToast();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [, setLocation] = useLocation();
  const [showRatings, setShowRatings] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  // Fetch products
  const fetchProducts = async () => {
    try {
      const data = await apiRequest("GET", "/api/products");
      console.log("Fetched products:", data);
      return data;
    } catch (error) {
      console.error("Error fetching products:", error);
      return [];
    }
  };

  const { data, isLoading, refetch } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    queryFn: fetchProducts,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const products = Array.isArray(data) ? data : [];

  // Auto refresh products every few seconds
  React.useEffect(() => {
    console.log("Setting up refetch interval");
    refetch();
    
    // Check immediately first
    const initialRefetch = setTimeout(() => {
      refetch();
    }, 500);
    
    const interval = setInterval(() => {
      refetch();
    }, 2000);
    
    return () => {
      clearTimeout(initialRefetch);
      clearInterval(interval);
    };
  }, [refetch]);

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Product deleted",
        description: "The product has been successfully deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/logout"),
    onSuccess: () => {
      setLocation("/login");
    },
  });

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  const handleEditRatings = (productId: number) => {
    setEditingProduct(null);
    setSelectedProductId(productId);
    setShowRatings(true);
  };

  const handleProductSubmit = () => {
    console.log("Product form submitted, refreshing product list");
    setEditingProduct(null);
    
    // Force immediate refetch
    queryClient.removeQueries({ queryKey: ["/api/products"] });
    queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    
    setTimeout(() => {
      refetch();
      // Refetch again after a short delay to ensure everything is updated
      setTimeout(() => {
        refetch();
      }, 1000);
    }, 500);
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
              onComplete={handleProductSubmit}
            />
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">Manage Products</h2>
            {isLoading ? (
              <div className="text-center py-8">Loading products...</div>
            ) : products.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No products available. Add a product to get started.
              </div>
            ) : (
              <div className="space-y-4">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      {product.imageUrl && (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded-md"
                        />
                      )}
                      <div>
                        <h3 className="font-semibold">{product.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          ${parseFloat(String(product.price)).toFixed(2)} - {product.category}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditRatings(product.id)}
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingProduct(product)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(product.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Ratings Dialog */}
      <Dialog open={showRatings} onOpenChange={setShowRatings}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Ratings</DialogTitle>
            <DialogDescription>
              Edit and delete product ratings
            </DialogDescription>
          </DialogHeader>
          {selectedProductId && <RatingManagement productId={selectedProductId} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
