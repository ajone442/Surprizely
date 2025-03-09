import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Gift, ArrowRight, Timer } from "lucide-react";

const giveawaySchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  orderID: z.string().min(5, "Order ID must be at least 5 characters"),
});

type GiveawayData = z.infer<typeof giveawaySchema>;

export default function BonusPage() {
  const [searchParams] = useSearchParams();
  const affiliateLink = searchParams.get('link') || '';
  const productName = searchParams.get('name') || 'this product';
  const navigate = useNavigate();
  const { toast } = useToast();

  const [countdown, setCountdown] = useState(5);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<GiveawayData>({
    email: '',
    orderID: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Countdown timer
  useEffect(() => {
    if (countdown > 0 && !showForm) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !showForm) {
      window.location.href = affiliateLink;
    }
  }, [countdown, affiliateLink, showForm]);

  const handleSkip = () => {
    window.location.href = affiliateLink;
  };

  const handleClaimClick = () => {
    setShowForm(true);
    setCountdown(0); // Stop the countdown
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    try {
      giveawaySchema.parse(formData);
      setErrors({});
      setIsSubmitting(true);

      // Submit to API
      const response = await fetch('/api/giveaway', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "Success!",
          description: "You've been entered into our giveaway!",
        });
        // Redirect to affiliate link
        setTimeout(() => {
          window.location.href = affiliateLink;
        }, 1000);
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.message || "Failed to enter giveaway",
          variant: "destructive",
        });
        setIsSubmitting(false);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path) {
            newErrors[err.path[0]] = err.message;
          }
        });
        setErrors(newErrors);
      }
      setIsSubmitting(false);
    }
  };

  return (
    <Container className="py-12">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <Gift className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">🎉 Surprise Bonus!</h1>
          <p className="text-xl mb-4">Before you visit {productName}...</p>

          {!showForm && (
            <div className="bg-muted p-6 rounded-lg mb-6">
              <p className="text-lg mb-4">
                Enter our exclusive giveaway by sharing your Amazon order ID after purchase. 
                Win gift cards and premium products monthly!
              </p>

              <div className="flex items-center justify-center gap-4 mb-4">
                <Timer className="h-6 w-6 text-primary" />
                <p className="text-2xl font-semibold">Redirecting in {countdown}s</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  onClick={handleClaimClick}
                  size="lg"
                  className="flex items-center gap-2"
                >
                  Claim Bonus
                  <Gift className="h-5 w-5" />
                </Button>

                <Button 
                  variant="outline"
                  onClick={handleSkip}
                  size="lg"
                  className="flex items-center gap-2"
                >
                  Skip to Product
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
          )}

          {showForm && (
            <div className="bg-muted p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Enter the Giveaway</h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="text-left">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className={errors.email ? "border-destructive" : ""}
                  />
                  {errors.email && (
                    <p className="text-destructive text-sm mt-1">{errors.email}</p>
                  )}
                </div>

                <div className="text-left">
                  <Label htmlFor="orderID">Amazon Order ID</Label>
                  <Input
                    id="orderID"
                    name="orderID"
                    type="text"
                    value={formData.orderID}
                    onChange={handleChange}
                    placeholder="Order ID from your Amazon purchase"
                    className={errors.orderID ? "border-destructive" : ""}
                  />
                  {errors.orderID && (
                    <p className="text-destructive text-sm mt-1">{errors.orderID}</p>
                  )}
                  <p className="text-sm text-muted-foreground mt-1">
                    Find this in your order confirmation email or order history
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button 
                    type="submit"
                    disabled={isSubmitting}
                    size="lg"
                    className="flex-1"
                  >
                    {isSubmitting ? "Submitting..." : "Submit & Continue"}
                  </Button>

                  <Button 
                    type="button"
                    variant="outline"
                    onClick={handleSkip}
                    size="lg"
                    className="flex-1"
                  >
                    Skip
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}