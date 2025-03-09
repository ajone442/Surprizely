
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
    
    if (!screenshot) {
      toast({
        title: "Receipt screenshot required",
        description: "Please upload a screenshot of your order receipt.",
        variant: "destructive"
      });
      return;
    }
    
    setUploading(true);
    
    try {
      let screenshotUrl = '';
      
      // Upload the screenshot first
      const formData = new FormData();
      formData.append('file', screenshot);
      
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!uploadResponse.ok) {
        throw new Error('Failed to upload screenshot');
      }
      
      const uploadData = await uploadResponse.json();
      screenshotUrl = uploadData.url;
      
      // Now submit the giveaway entry
      const response = await fetch('/api/giveaway', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          orderScreenshot: screenshotUrl
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
        description: error.message || "Something went wrong. Please try again.",
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
          <CardTitle>Thank You!</CardTitle>
          <CardDescription>
            Your giveaway entry has been submitted successfully.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-6">
          <div className="rounded-full bg-primary/10 p-3 text-primary w-12 h-12 mx-auto mb-4 flex items-center justify-center">
            <Check className="h-6 w-6" />
          </div>
          <p>We've received your entry. Good luck!</p>
          <p className="text-sm text-muted-foreground mt-2">
            Winners will be notified via email.
          </p>
        </CardContent>
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
            <Label>Order Receipt</Label>
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
                    Upload a screenshot of your order receipt from Amazon, Etsy, or any other store
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
