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
import { Product, giftCategories } from "@shared/schema";
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
  productUrl: z.string().url({ message: "Must be a valid URL" }).optional().or(z.literal("")),
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
    defaultValues: {
          name: product ? product.name : "",
          description: product ? product.description || "" : "",
          imageUrl: product ? product.imageUrl || "" : "",
          affiliateLink: product ? product.affiliateLink || "" : "",
          category: product ? product.category : "",
          price: product ? String(product.price) : "",
          productUrl: "",
    },
  });

  // This ensures the form updates when the product prop changes
  React.useEffect(() => {
    if (product) {
      form.reset({
        name: product.name,
        description: product.description || "",
        imageUrl: product.imageUrl || "",
        affiliateLink: product.affiliateLink || "",
        category: product.category,
        price: String(product.price),
        productUrl: "",
      });
    }
  }, [product, form]);

  // Create or update mutation
  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      // Filter out empty productUrl if present
      const cleanValues = {...values};
      if (!cleanValues.productUrl) {
        delete cleanValues.productUrl;
      }

      console.log("Submitting product data:", cleanValues);

      if (product) {
        // Update existing product
        return apiRequest("PATCH", `/api/products/${product.id}`, cleanValues);
      } else {
        // Create new product
        const response = await apiRequest("POST", "/api/products", cleanValues);
        console.log("Added product:", response);
        return response;
      }
    },
    onSuccess: async (response) => {
      console.log("Product created/updated successfully:", response);

      // Reset form
      form.reset();

      // Force refresh products list
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.refetchQueries({ 
        queryKey: ["/api/products"],
        type: 'all'
      });

      // Call onComplete to trigger parent component refresh
      if (onComplete) {
        onComplete();
      }

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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex space-x-2 mb-4">
          <Button
            type="button"
            variant={isUrlMode ? "outline" : "default"}
            onClick={() => setIsUrlMode(false)}
          >
            Manual Entry
          </Button>
          <Button
            type="button"
            variant={isUrlMode ? "default" : "outline"}
            onClick={() => setIsUrlMode(true)}
          >
            Import from URL
          </Button>
        </div>

        {isUrlMode ? (
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
                  <FormLabel>Product Name</FormLabel>
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

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2">
                        $
                      </span>
                      <Input
                        type="text"
                        placeholder="0.00"
                        className="pl-8"
                        {...field}
                        value={field.value || ""}
                      />
                    </div>
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
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {giftCategories.map((category) => (
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