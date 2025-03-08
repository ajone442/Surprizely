import React, { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Product } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Form schema
const formSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters" }),
  description: z.string().optional(),
  imageUrl: z.string().url({ message: "Must be a valid URL" }),
  affiliateLink: z.string().url({ message: "Must be a valid URL" }),
  category: z.string().min(1, { message: "Category is required" }),
  price: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "Price must be a positive number",
  }),
  // Product URL for scraping - optional
  productUrl: z.string().url({ message: "Must be a valid URL" }).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ProductFormProps {
  product?: Product | null;
  onComplete?: () => void;
}

export default function ProductForm({ product, onComplete }: ProductFormProps) {
  const { toast } = useToast();
  const [isUrlMode, setIsUrlMode] = useState(false);

  // Initialize form with default values or existing product
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: product
      ? {
          name: product.name,
          description: product.description || "",
          imageUrl: product.imageUrl || "",
          affiliateLink: product.affiliateLink || "",
          category: product.category,
          price: product.price.toString(),
        }
      : {
          name: "",
          description: "",
          imageUrl: "",
          affiliateLink: "",
          category: "",
          price: "",
          productUrl: "",
        },
  });

  // Create or update mutation
  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      console.log("Submitting product data:", values);
      if (product) {
        // Update existing product
        return apiRequest("PATCH", `/api/products/${product.id}`, values);
      } else {
        // Create new product
        const response = await apiRequest("POST", "/api/products", values);
        console.log("Added product:", response);
        return response;
      }
    },
    onSuccess: async () => {
      // Reset form first to ensure clean state
      form.reset(); 

      // Clear the cache completely to ensure fresh data
      queryClient.removeQueries({ queryKey: ["/api/products"] });

      // Then invalidate and force a full refetch
      await queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      await queryClient.refetchQueries({ 
        queryKey: ["/api/products"],
        exact: true,
        type: 'all'
      });

      console.log("Product created/updated successfully");
      // Call onComplete to trigger parent component refresh
      if (onComplete) onComplete();

      toast({
        title: product ? "Product updated" : "Product created",
        description: "The product has been saved successfully.",
      });
    },
    onError: (error) => {
      console.error("Error creating/updating product:", error);
      toast({
        title: "Error",
        description: "Failed to save product. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: FormValues) => {
    mutation.mutate(values);
  };

  // For loading from URL
  const categories = [
    "Electronics",
    "Clothing",
    "Home & Kitchen",
    "Books",
    "Toys",
    "Beauty",
    "Sports",
    "Jewelry",
    "Food",
    "Other",
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {!product && (
          <div className="flex items-center space-x-2">
            <Button
              type="button"
              variant={isUrlMode ? "default" : "outline"}
              onClick={() => setIsUrlMode(false)}
            >
              Manual Entry
            </Button>
            <Button
              type="button"
              variant={isUrlMode ? "outline" : "default"}
              onClick={() => setIsUrlMode(true)}
            >
              Import from URL
            </Button>
          </div>
        )}

        {isUrlMode && !product ? (
          <FormField
            control={form.control}
            name="productUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product URL</FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://example.com/product"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : (
          <>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Product name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Product description"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input placeholder="9.99" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com/image.jpg"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="affiliateLink"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Affiliate Link</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com/buy"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? "Saving..." : product ? "Update Product" : "Create Product"}
        </Button>
      </form>
    </Form>
  );
}