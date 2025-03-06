import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { Gift } from "lucide-react";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();

  if (user) {
    // Get the previous location from URL search params
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect') || '/';
    setLocation(redirect);
    return null;
  }

  const loginForm = useForm({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

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
                    Login
                  </Button>
                  <Button
                    type="button"
                    variant="link"
                    className="w-full"
                    asChild
                  >
                    <Link href="/forgot-password">
                      Forgot Password?
                    </Link>
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
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password</Label>
                    <Input
                      id="register-password"
                      type="password"
                      {...registerForm.register("password")}
                    />
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
                  <div className="h-4"></div>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <div className="hidden lg:flex flex-1 bg-primary/10 items-center justify-center p-12">
        <div className="max-w-lg">
          <div className="mb-8">
            <Gift className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Welcome to Gift Finder</h1>
          <p className="text-lg text-muted-foreground">
            Create an account to save your favorite gift ideas and get personalized
            suggestions for your loved ones. Join our community of thoughtful gift-givers today!
          </p>
        </div>
      </div>
    </div>
  );
}