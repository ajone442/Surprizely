import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, User, Key, History, Shield, Mail, UserCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { insertUserSchema } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const passwordSchema = z.object({
  password: z.string()
    .min(7, "Password must be at least 7 characters")
    .regex(/[A-Z]/, "Password must contain at least one capital letter"),
});

export default function AccountPage() {
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const { toast } = useToast();

  if (!user) {
    setLocation("/auth");
    return null;
  }

  const passwordForm = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: "",
    },
  });

  const handlePasswordChange = async (data: { password: string }) => {
    setIsSubmitting(true);
    setMessage("");

    try {
      // You would need to implement this endpoint on the server
      const response = await fetch("/api/account/password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: data.password }),
      });

      if (response.ok) {
        setMessage("Password updated successfully");
        passwordForm.reset();
      } else {
        setMessage("Failed to update password");
      }
    } catch (error) {
      setMessage("An error occurred");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setLocation("/")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-4xl font-bold">Account Settings</h1>
          </div>
          <Button variant="outline" onClick={() => logoutMutation.mutate()}>
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid grid-cols-3 mb-8">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <UserCircle className="mr-2 h-5 w-5" />
                    Profile Information
                  </CardTitle>
                  <CardDescription>
                    Manage your personal information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="username">Email Address</Label>
                      <Input id="username" value={user.username} disabled />
                    </div>

                    <div>
                      <Label htmlFor="joinedDate">Account Created</Label>
                      <Input id="joinedDate" value="Recently" disabled />
                    </div>

                    <div>
                      <Label htmlFor="accountType">Account Type</Label>
                      <Input id="accountType" value={user.isAdmin ? "Administrator" : "User"} disabled />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="mr-2 h-5 w-5" />
                    Security Settings
                  </CardTitle>
                  <CardDescription>
                    Update your password and manage security settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)}>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="password">New Password</Label>
                        <Input 
                          id="password" 
                          type="password" 
                          {...passwordForm.register("password")} 
                        />
                        {passwordForm.formState.errors.password && (
                          <p className="text-red-500 text-sm mt-1">
                            {passwordForm.formState.errors.password.message}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Password must be at least 7 characters and contain at least one uppercase letter.
                        </p>
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Updating..." : "Update Password"}
                      </Button>
                    </div>
                  </form>

                  <div className="border-t pt-6 mt-6">
                    <h3 className="text-lg font-medium mb-4">Security Options</h3>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Two-factor authentication</h4>
                          <p className="text-sm text-muted-foreground">
                            Add an extra layer of security to your account
                          </p>
                        </div>
                        <Button variant="outline" disabled>Coming Soon</Button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Active sessions</h4>
                          <p className="text-sm text-muted-foreground">
                            Manage your active login sessions
                          </p>
                        </div>
                        <Button variant="outline" disabled>Coming Soon</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preferences">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="mr-2 h-5 w-5" />
                    Preferences
                  </CardTitle>
                  <CardDescription>
                    Customize your account preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      Preference settings will be available soon.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}