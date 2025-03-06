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
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ProductFormProps {
  product?: Product | null;
  onComplete: () => void;
}

export default function ProductForm({ product, onComplete }: ProductFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isParsingUrl, setIsParsingUrl] = useState(false);

  const form = useForm({
    resolver: zodResolver(insertProductSchema),
    defaultValues: {
      name: product?.name || "",
      description: product?.description || "",
      price: product?.price ? (product.price / 100).toFixed(2) : "",
      imageUrl: product?.imageUrl || "",
      affiliateLink: product?.affiliateLink || "",
      category: product?.category || "",
    },
  });

  const urlForm = useForm({
    defaultValues: {
      productUrl: "",
    },
  });

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      // Convert price from decimal (e.g., "12.50") to cents (1250)
      const dataToSubmit = {
        ...data,
        price: Math.round(parseFloat(data.price) * 100),
      };

      if (product) {
        await apiRequest("PATCH", `/api/products/${product.id}`, dataToSubmit);
      } else {
        await apiRequest("POST", "/api/products", dataToSubmit);
      }

      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: product ? "Product updated" : "Product created",
        description: product
          ? "The product has been successfully updated."
          : "The product has been successfully created.",
      });
      if (onComplete) onComplete();
      form.reset();
      //if (addMode === "url") setProductUrl(""); //addMode is not defined in this scope.
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save product",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUrlSubmit = async (data: { productUrl: string }) => {
    try {
      setIsParsingUrl(true);
      await apiRequest("POST", "/api/products", {
        productUrl: data.productUrl,
      });

      toast({
        title: "Product added",
        description: "Successfully added product from URL",
      });

      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      urlForm.reset();
      onComplete();
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
            <Label htmlFor="description">Description</Label>
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
            <Label htmlFor="price">Price ($)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              placeholder="Enter price"
              {...form.register("price", {
                setValueAs: (value) => (value === "" ? undefined : parseFloat(value)),
                required: "Price is required",
              })}
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

        <TabsContent value="url" className="space-y-4">
          <form onSubmit={urlForm.handleSubmit(handleUrlSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="productUrl">Product URL</Label>
              <Input
                id="productUrl"
                placeholder="Paste Amazon or Etsy product URL"
                {...urlForm.register("productUrl")}
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">
                Paste a product URL from Amazon or Etsy to automatically import product details
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
              <Label htmlFor="description">Description</Label>
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
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="Enter price"
                {...form.register("price", {
                  setValueAs: (value) => (value === "" ? undefined : parseFloat(value)),
                  required: "Price is required",
                })}
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