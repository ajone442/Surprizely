import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Product } from "@shared/schema";
import ProductForm from "@/components/ProductForm";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, ArrowLeft, Star, Gift, Download } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { RatingManagement } from "@/components/RatingManagement"; // Placeholder component
import { useMutation } from "@tanstack/react-query";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/ui/container";

// GiveawayEntry type definition
type GiveawayEntry = {
  id: number;
  email: string;
  orderID: string;
  createdAt: string;
  ipAddress?: string;
  productLink?: string;
  emailSent: boolean;
};

export default function AdminPage() {
  const { toast } = useToast();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [, setLocation] = useLocation();
  const [showRatings, setShowRatings] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [addingProduct, setAddingProduct] = useState(false); // Added state for adding new product
  const [showGiveawayEntries, setShowGiveawayEntries] = useState(false);
  const [giveawayEntries, setGiveawayEntries] = useState<GiveawayEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [errorEntries, setErrorEntries] = useState<string | null>(null);

  // Fetch products
  const fetchProducts = async () => {
    try {
      const response = await apiRequest("GET", "/api/products");
      let data;

      if (response.ok) {
        data = await response.json();
      } else {
        data = [];
      }

      console.log("Fetched products:", data);
      return data || []; // Ensure we always return an array
    } catch (error) {
      console.error("Error fetching products:", error);
      return [];
    }
  };

  const { data, isLoading, refetch } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    queryFn: fetchProducts,
    staleTime: 0, // Ensures data is always fetched
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchInterval: 3000, // Refetch every 3 seconds to ensure updates
  });

  const products = Array.isArray(data) ? data : [];

  // Add debugging to check products data
  console.log("Admin Dashboard Products:", products);

  // Fetch giveaway entries
  const fetchGiveawayEntries = async () => {
    try {
      setLoadingEntries(true);
      setErrorEntries(null);
      const response = await fetch('/api/admin/giveaway-entries');

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setLocation('/auth');
          return;
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setGiveawayEntries(data);
    } catch (err) {
      setErrorEntries(err.message || 'Failed to fetch giveaway entries');
    } finally {
      setLoadingEntries(false);
    }
  };

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
  
  // Fetch giveaway entries when the dialog is shown
  useEffect(() => {
    if (showGiveawayEntries) {
      fetchGiveawayEntries();
    }
  }, [showGiveawayEntries]);

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

  const handleEditProduct = (product: Product) => {
    console.log("Setting product for editing:", product);
    setEditingProduct(product);
  };

  const handleProductSubmit = (data: any) => {
    console.log("Product submitted:", data);
    setEditingProduct(null);
    setAddingProduct(false);
    // Force immediate refetch to update the product list
    setTimeout(() => {
      refetch();
    }, 500);
  };
  
  const handleExportCSV = () => {
    if (!giveawayEntries.length) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    // Add headers
    csvContent += "ID,Email,Order ID,Date,Email Sent\n";
    
    // Add rows
    giveawayEntries.forEach(entry => {
      csvContent += `${entry.id},${entry.email},${entry.orderID},${new Date(entry.createdAt).toLocaleString()},${entry.emailSent ? 'Yes' : 'No'}\n`;
    });
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `giveaway-entries-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => setShowGiveawayEntries(true)}
            >
              <Gift className="h-4 w-4" />
              Giveaway Entries
            </Button>
            <Button variant="outline" onClick={() => logoutMutation.mutate()}>
              Logout
            </Button>
          </div>
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
              onAddingProduct={() => setAddingProduct(true)}
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
                        onClick={() => handleEditProduct(product)}
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
          {selectedProductId && <RatingManagement productId={selectedProductId} onUpdate={() => refetch()} />}
        </DialogContent>
      </Dialog>

      {/* Giveaway Entries Dialog */}
      <Dialog open={showGiveawayEntries} onOpenChange={setShowGiveawayEntries}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              Giveaway Entries
            </DialogTitle>
            <DialogDescription>
              View all entries to your giveaway
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-end mb-4">
            <Button 
              size="sm"
              onClick={handleExportCSV}
              className="flex items-center gap-1"
              disabled={giveawayEntries.length === 0}
            >
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          </div>

          {loadingEntries && <p className="text-center py-4">Loading entries...</p>}

          {errorEntries && (
            <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-4">
              <p>{errorEntries}</p>
            </div>
          )}

          {!loadingEntries && !errorEntries && giveawayEntries.length === 0 && (
            <p className="text-center py-8 text-muted-foreground">No giveaway entries found.</p>
          )}

          {!loadingEntries && !errorEntries && giveawayEntries.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableCaption>
                  Total of {giveawayEntries.length} giveaway entries
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Order Info</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Email Sent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {giveawayEntries.map(entry => (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.id}</TableCell>
                      <TableCell>{entry.email}</TableCell>
                      <TableCell>
                        {entry.orderScreenshot ? (
                          <Button variant="outline" size="sm" onClick={() => window.open(entry.orderScreenshot, '_blank')}>
                            View Screenshot
                          </Button>
                        ) : (
                          entry.orderID
                        )}
                      </TableCell>
                      <TableCell>{new Date(entry.createdAt).toLocaleString()}</TableCell>
                      <TableCell>{entry.emailSent ? 'Yes' : 'No'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}