import React, { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { Upload, Check } from "lucide-react";

// Updated schema to use fileUpload instead of orderID
const giveawaySchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  orderScreenshot: z.instanceof(File, { message: "Please upload an order receipt screenshot" })
});

type GiveawayFormProps = {
  onSuccess?: () => void;
};

export function GiveawayEntryForm({ onSuccess }: GiveawayFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const form = useForm<z.infer<typeof giveawaySchema>>({
    resolver: zodResolver(giveawaySchema),
    defaultValues: {
      email: ""
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue("orderScreenshot", file);

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: z.infer<typeof giveawaySchema>) => {
    setIsSubmitting(true);

    try {
      // Create FormData to send the file
      const formData = new FormData();
      formData.append("email", data.email);
      formData.append("orderScreenshot", data.orderScreenshot);

      const response = await fetch("/api/giveaway/enter", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to submit entry");
      }

      toast({
        title: "Success!",
        description: "Your giveaway entry has been submitted.",
      });

      // Reset form
      form.reset();
      setPreviewUrl(null);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "There was a problem submitting your entry. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Enter our Exclusive Giveaway</h2>
        <p className="text-muted-foreground">
          Upload a screenshot of your order receipt from any store (Amazon, Etsy, etc.) to enter our monthly giveaway.
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="your@email.com"
            {...form.register("email")}
            disabled={isSubmitting}
          />
          {form.formState.errors.email && (
            <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="orderScreenshot">Order Receipt Screenshot</Label>
          <div className="flex flex-col gap-4">
            <div className="border rounded-md p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted transition-colors">
              <Input
                id="orderScreenshot"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={isSubmitting}
                className="hidden"
              />
              <Label htmlFor="orderScreenshot" className="cursor-pointer flex flex-col items-center gap-2">
                {previewUrl ? (
                  <>
                    <Check className="h-8 w-8 text-primary" />
                    <p className="text-sm">Image selected</p>
                    <div className="mt-2 max-w-full">
                      <img 
                        src={previewUrl} 
                        alt="Preview" 
                        className="max-h-48 max-w-full object-contain rounded-md" 
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload a screenshot of your order receipt
                    </p>
                  </>
                )}
              </Label>
            </div>
            {form.formState.errors.orderScreenshot && (
              <p className="text-sm text-destructive">{form.formState.errors.orderScreenshot.message}</p>
            )}
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Entry"}
        </Button>
      </form>
    </div>
  );
}