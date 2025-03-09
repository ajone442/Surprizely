import * as React from "react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Gift, ArrowRight, Timer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GiveawayEntryForm } from "@/components/GiveawayEntryForm";

export default function BonusPage() {
  const params = new URLSearchParams(window.location.search);
  const affiliateLink = params.get('link') || '';
  const productName = params.get('name') || 'this product';
  const { toast } = useToast();

  const [countdown, setCountdown] = useState(10);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ email: "", orderID: "" }); //formData type is removed as it's not used directly here.
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

  const handleSkip = () => {
    if (affiliateLink) {
      window.location.href = affiliateLink;
    } else {
      window.location.href = '/';
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
            <div className="bg-muted p-6 rounded-lg">
              <GiveawayEntryForm onSuccess={handleSkip} />
            </div>
          )}
          <div className="mt-2 text-center">
            <p className="text-muted-foreground">
              You will be redirected to {productName} in {countdown} seconds
            </p>
          </div>
          <Button className="mt-4" onClick={handleSkip}>
            Skip & Continue to Product
          </Button>
        </div>
      </div>
    </Container>
  );
}