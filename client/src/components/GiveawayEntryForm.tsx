
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, Check } from 'lucide-react';

export function GiveawayEntryForm() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [orderID, setOrderID] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setScreenshot(file);
      
      // Create a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive"
      });
      return;
    }

    if (!orderID && !screenshot) {
      toast({
        title: "Order information required",
        description: "Please enter an order ID or upload a screenshot of your order.",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    
    try {
      let screenshotUrl = '';
      
      // If there's a screenshot, upload it first
      if (screenshot) {
        const formData = new FormData();
        formData.append('file', screenshot);
        
        // This is a placeholder. You would need to implement a file upload endpoint
        // that returns the URL of the uploaded file
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        
        if (!uploadResponse.ok) {
          throw new Error('Failed to upload screenshot');
        }
        
        const uploadData = await uploadResponse.json();
        screenshotUrl = uploadData.url;
      }
      
      // Now submit the giveaway entry
      const response = await fetch('/api/giveaway', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          orderID: orderID || 'Screenshot provided',
          orderScreenshot: screenshotUrl || null
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit entry');
      }
      
      setSubmitted(true);
      toast({
        title: "Entry submitted!",
        description: "You've been entered into the giveaway. Good luck!",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Submission failed",
        description: error.message || "There was an error submitting your entry. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  if (submitted) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Thank You!</CardTitle>
          <CardDescription className="text-center">
            Your giveaway entry has been submitted.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="flex justify-center mb-4">
            <Check className="text-green-500 h-16 w-16" />
          </div>
          <p>We've received your entry for the giveaway. Good luck!</p>
          <p className="mt-2 text-sm text-muted-foreground">
            A confirmation email has been sent to {email}.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button variant="outline" onClick={() => window.location.href = "/"}>
            Return to Home
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Enter the Giveaway</CardTitle>
        <CardDescription>
          Complete the form below to enter our exclusive giveaway.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="orderID">Order ID (optional if screenshot provided)</Label>
            <Input
              id="orderID"
              type="text"
              placeholder="Enter your order ID"
              value={orderID}
              onChange={(e) => setOrderID(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Order Screenshot</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center">
              {previewUrl ? (
                <div className="space-y-2">
                  <img 
                    src={previewUrl} 
                    alt="Order screenshot preview" 
                    className="max-h-40 mx-auto"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setScreenshot(null);
                      setPreviewUrl(null);
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Upload a screenshot of your order receipt
                  </p>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => document.getElementById('screenshot-upload')?.click()}
                  >
                    Select File
                  </Button>
                </div>
              )}
              <input 
                id="screenshot-upload"
                type="file" 
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>
          
          <Button type="submit" className="w-full" disabled={uploading}>
            {uploading ? 'Submitting...' : 'Enter Giveaway'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
