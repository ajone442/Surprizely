
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProductSchema, giftCategories, type Product } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ProductFormProps {
  product?: Product | null;
  onComplete: () => void;
}

export default function ProductForm({ product, onComplete }: ProductFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isParsingUrl, setIsParsingUrl] = useState(false);

  // Form for manual product entry
  const form = useForm({
    resolver: zodResolver(insertProductSchema),
    defaultValues: {
      name: product?.name || "",
      description: product?.description || "",
      price: product?.price ? String(product.price) : "",
      imageUrl: product?.imageUrl || "",
      affiliateLink: product?.affiliateLink || "",
      category: product?.category || "Electronics", // Default category
    },
  });

  // Form for URL parsing
  const urlForm = useForm({
    defaultValues: {
      productUrl: "",
    },
  });

  // Set form values when product changes
  React.useEffect(() => {
    if (product) {
      form.reset({
        name: product.name,
        description: product.description,
        price: String(product.price),
        imageUrl: product.imageUrl,
        affiliateLink: product.affiliateLink,
        category: product.category,
      });
    }
  }, [product, form]);

  // Submit handler for manual product entry
  const onSubmit = async (data) => {
    setIsSubmitting(true);
    console.log("Submitting product data:", data);
    
    try {
      let response;
      
      if (product) {
        // Update existing product
        response = await apiRequest("PATCH", `/api/products/${product.id}`, data);
        console.log("Updated product:", response);
      } else {
        // Create new product
        response = await apiRequest("POST", `/api/products`, data);
        console.log("Added product:", response);
      }

      // Clear form first
      form.reset();
      
      // Clear cache and force refetch
      queryClient.removeQueries({ queryKey: ["/api/products"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      
      // Success toast
      toast({
        title: product ? "Product updated" : "Product created",
        description: product
          ? "The product has been successfully updated."
          : "The product has been successfully created.",
      });
      
      // Notify parent component
      if (onComplete) onComplete();
    } catch (error) {
      console.error("Product submission error:", error);
      toast({
        title: "Error",
        description: "Failed to save product. Please check all required fields are filled correctly.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit handler for URL parsing
  const handleUrlSubmit = async (data: { productUrl: string }) => {
    try {
      setIsParsingUrl(true);
      const response = await apiRequest("POST", "/api/products", {
        productUrl: data.productUrl,
      });
      console.log("Added product from URL:", response);

      toast({
        title: "Product added",
        description: "Successfully added product from URL",
      });

      // Force refetch products
      queryClient.removeQueries({ queryKey: ["/api/products"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/products"] });

      urlForm.reset();
      if (onComplete) onComplete();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to parse product URL. Please ensure it's a valid Amazon or Etsy product page.",
        variant: "destructive",
      });
    } finally {
      setIsParsingUrl(false);
    }
  };

  // If in edit mode, only show the manual form
  if (product) {
    return (
      <div className="bg-card rounded-lg border p-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name</Label>
            <Input
              id="name"
              placeholder="Enter product name"
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Product Description</Label>
            <Textarea
              id="description"
              placeholder="Enter product description"
              {...form.register("description")}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              placeholder="Enter price"
              {...form.register("price")}
            />
            {form.formState.errors.price && (
              <p className="text-sm text-destructive">{form.formState.errors.price.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input
              id="imageUrl"
              placeholder="Enter image URL"
              {...form.register("imageUrl")}
            />
            {form.formState.errors.imageUrl && (
              <p className="text-sm text-destructive">{form.formState.errors.imageUrl.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="affiliateLink">Affiliate Link</Label>
            <Input
              id="affiliateLink"
              placeholder="Enter affiliate link"
              {...form.register("affiliateLink")}
            />
            {form.formState.errors.affiliateLink && (
              <p className="text-sm text-destructive">{form.formState.errors.affiliateLink.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              onValueChange={(value) => form.setValue("category", value)}
              defaultValue={form.getValues("category")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {giftCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.category && (
              <p className="text-sm text-destructive">{form.formState.errors.category.message}</p>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onComplete}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Product
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border p-6">
      <Tabs defaultValue="url" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="url">Add from URL</TabsTrigger>
          <TabsTrigger value="manual">Manual Entry</TabsTrigger>
        </TabsList>

        <TabsContent value="url">
          <form onSubmit={urlForm.handleSubmit(handleUrlSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="productUrl">Product URL</Label>
              <Input
                id="productUrl"
                placeholder="Paste Amazon or Etsy product URL"
                {...urlForm.register("productUrl")}
              />
              <p className="text-xs text-muted-foreground">
                We'll automatically extract product details from the URL.
              </p>
            </div>

            <Button type="submit" disabled={isParsingUrl} className="w-full">
              {isParsingUrl && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Product from URL
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="manual">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                placeholder="Enter product name"
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Product Description</Label>
              <Textarea
                id="description"
                placeholder="Enter product description"
                {...form.register("description")}
              />
              {form.formState.errors.description && (
                <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                placeholder="Enter price"
                {...form.register("price")}
              />
              {form.formState.errors.price && (
                <p className="text-sm text-destructive">{form.formState.errors.price.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                placeholder="Enter image URL"
                {...form.register("imageUrl")}
              />
              {form.formState.errors.imageUrl && (
                <p className="text-sm text-destructive">{form.formState.errors.imageUrl.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="affiliateLink">Affiliate Link</Label>
              <Input
                id="affiliateLink"
                placeholder="Enter affiliate link"
                {...form.register("affiliateLink")}
              />
              {form.formState.errors.affiliateLink && (
                <p className="text-sm text-destructive">{form.formState.errors.affiliateLink.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                onValueChange={(value) => form.setValue("category", value)}
                defaultValue={form.getValues("category")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {giftCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.category && (
                <p className="text-sm text-destructive">{form.formState.errors.category.message}</p>
              )}
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Product
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
