import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertUserSchema } from "@shared/schema";
import { Gift } from "lucide-react";
import { useToast } from "@/hooks/use-toast"; // Use the correct import path

// Custom validation schema for password
import React from "react";

const passwordSchema = z.string()
  .min(7, "Password must be at least 7 characters")
  .regex(/[A-Z]/, "Password must contain at least one capital letter");

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Initialize forms outside of any conditional to avoid hooks issues
  const loginForm = useForm({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm({
    resolver: zodResolver(insertUserSchema.extend({
      password: passwordSchema,
    })),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Use effect for redirect instead of conditional return
  React.useEffect(() => {
    if (user) {
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect') || '/';
      setLocation(redirect);
    }
  }, [user, setLocation]);

  // Handle successful login
  React.useEffect(() => {
    if (loginMutation.isSuccess) {
      toast({
        title: "Login Successful",
        description: "You have been logged in successfully.",
      });
    }
  }, [loginMutation.isSuccess, toast]);

  // Handle successful registration
  React.useEffect(() => {
    if (registerMutation.isSuccess) {
      toast({
        title: "Registration Successful",
        description: "Your account has been created successfully.",
      });
    }
  }, [registerMutation.isSuccess, toast]);

  // If user is logged in, render nothing while redirect happens
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center">
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="flex justify-center mb-6">
              {/*<Gift className="h-12 w-12 text-primary" />*/} {/*Removed Gift Icon*/}
              <h1 className="text-3xl font-bold">Suprizely</h1>
            </div>

            <Tabs defaultValue="login" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="min-h-[240px]">
                <div className="mb-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2"
                    onClick={() => {
                      toast({
                        title: "Google Sign In",
                        description: "Google authentication will be implemented by your backend team.",
                      });
                    }}
                  >
                    <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                      <g transform="matrix(1, 0, 0, 1, 0, 0)">
                        <path d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5,16.25 5,12C5,7.9 8.2,4.73 12.2,4.73C15.29,4.73 17.1,6.7 17.1,6.7L19,4.72C19,4.72 16.56,2 12.1,2C6.42,2 2.03,6.8 2.03,12C2.03,17.05 6.16,22 12.25,22C17.6,22 21.5,18.33 21.5,12.91C21.5,11.76 21.35,11.1 21.35,11.1Z" fill="#4285F4"></path>
                      </g>
                    </svg>
                    Sign in with Google
                  </Button>
                </div>
                <div className="relative mb-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or sign in with email</span>
                  </div>
                </div>
                <form
                  onSubmit={loginForm.handleSubmit((data) =>
                    loginMutation.mutate(data)
                  )}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="login-username">Email</Label>
                    <Input
                      id="login-username"
                      type="email"
                      {...loginForm.register("username")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      {...loginForm.register("password")}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? "Logging in..." : "Login"}
                  </Button>
                  {loginMutation.isError && (
                    <div className="text-destructive text-sm mt-2">
                      {loginMutation.error?.message || "Login failed. Please check your credentials."}
                    </div>
                  )}
                  <Button
                    variant="link"
                    className="w-full"
                    asChild
                  >
                    <Link href="/forgot-password">Forgot password?</Link>
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register" className="min-h-[240px]">
                <div className="mb-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2"
                    onClick={() => {
                      toast({
                        title: "Google Sign In",
                        description: "Google authentication will be implemented by your backend team.",
                      });
                    }}
                  >
                    <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                      <g transform="matrix(1, 0, 0, 1, 0, 0)">
                        <path d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5,16.25 5,12C5,7.9 8.2,4.73 12.2,4.73C15.29,4.73 17.1,6.7 17.1,6.7L19,4.72C19,4.72 16.56,2 12.1,2C6.42,2 2.03,6.8 2.03,12C2.03,17.05 6.16,22 12.25,22C17.6,22 21.5,18.33 21.5,12.91C21.5,11.76 21.35,11.1 21.35,11.1Z" fill="#4285F4"></path>
                      </g>
                    </svg>
                    Sign in with Google
                  </Button>
                </div>
                <div className="relative mb-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or register with email</span>
                  </div>
                </div>
                <form
                  onSubmit={registerForm.handleSubmit((data) =>
                    registerMutation.mutate(data)
                  )}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="register-username">Email</Label>
                    <Input
                      id="register-username"
                      type="email"
                      {...registerForm.register("username")}
                    />
                    {registerForm.formState.errors.username && (
                      <p className="text-destructive text-sm">
                        {registerForm.formState.errors.username.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password</Label>
                    <Input
                      id="register-password"
                      type="password"
                      {...registerForm.register("password")}
                    />
                    {registerForm.formState.errors.password && (
                      <p className="text-destructive text-sm">
                        {registerForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? "Registering..." : "Register"}
                  </Button>
                  {registerMutation.isError && (
                    <div className="text-destructive text-sm mt-2">
                      {registerMutation.error?.message || "Registration failed. Please try again."}
                    </div>
                  )}
                  <Button
                    variant="link"
                    className="w-full"
                    asChild
                  >
                    <Link href="/forgot-password">Forgot password?</Link>
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}