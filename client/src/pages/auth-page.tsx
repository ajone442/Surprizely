
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
              <Gift className="h-12 w-12 text-primary" />
            </div>

            <Tabs defaultValue="login" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="min-h-[240px]">
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
