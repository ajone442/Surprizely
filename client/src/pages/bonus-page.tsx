
import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
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
  const params = new URLSearchParams(window.location.search);
  const affiliateLink = params.get('link') || '';
  const productName = params.get('name') || 'this product';
  const { toast } = useToast();

  const [countdown, setCountdown] = useState(10);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<GiveawayData>({ email: "", orderID: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!showForm && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }

    if (!showForm && countdown === 0 && affiliateLink) {
      window.location.href = affiliateLink;
    }
  }, [countdown, showForm, affiliateLink]);

  const handleClaimClick = () => {
    setShowForm(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSkip = () => {
    if (affiliateLink) {
      window.location.href = affiliateLink;
    } else {
      window.location.href = '/';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const validatedData = giveawaySchema.parse(formData);
      
      const response = await fetch('/api/giveaway-entry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedData),
      });

      if (response.ok) {
        toast({
          title: "Entry submitted successfully!",
          description: "You're now eligible for our monthly giveaway.",
        });
        
        // Redirect after successful submission
        setTimeout(() => {
          if (affiliateLink) {
            window.location.href = affiliateLink;
          } else {
            setLocation('/');
          }
        }, 2000);
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Something went wrong');
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Handle validation errors
        error.errors.forEach(err => {
          toast({
            title: "Validation error",
            description: `${err.path}: ${err.message}`,
            variant: "destructive",
          });
        });
      } else if (error instanceof Error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
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
                  onClick={handleSkip} 
                  variant="outline"
                  size="lg"
                  className="flex items-center gap-2"
                >
                  Skip
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
          )}

          {showForm && (
            <form onSubmit={handleSubmit} className="bg-muted p-6 rounded-lg">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="orderID">Amazon Order ID</Label>
                  <Input 
                    id="orderID"
                    name="orderID"
                    type="text"
                    placeholder="123-4567890-1234567"
                    value={formData.orderID}
                    onChange={handleChange}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Found in your order confirmation email or Orders section of your Amazon account
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button 
                    type="submit"
                    size="lg"
                    className="flex-1"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Submitting..." : "Submit Entry"}
                  </Button>
                  <Button 
                    type="button"
                    onClick={handleSkip}
                    variant="outline"
                    size="lg"
                    className="flex-1"
                    disabled={isSubmitting}
                  >
                    Skip to Product
                  </Button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </Container>
  );
}
