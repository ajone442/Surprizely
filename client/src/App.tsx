import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./hooks/use-auth";
import HomePage from "@/pages/home-page";
import AdminPage from "@/pages/admin-page";
import AuthPage from "@/pages/auth-page";
import WishlistPage from "@/pages/wishlist-page";
import NotFound from "@/pages/not-found";
import { ProtectedRoute } from "./lib/protected-route";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ForgotPasswordPage from "@/pages/forgot-password";
import AccountPage from "@/pages/account-page";
import AboutPage from "@/pages/about-page";
import BlogPage from "@/pages/blog-page";
import PrivacyPage from "@/pages/privacy-page";
import TermsPage from "@/pages/terms-page";
import FAQPage from "@/pages/faq-page";
import BonusPage from "@/pages/bonus-page";
import GiveawayEntriesPage from "@/pages/admin/giveaway-entries";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <ProtectedRoute path="/admin" component={AdminPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/wishlist" component={WishlistPage} />
      <Route path="/account" component={AccountPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/blog" component={BlogPage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/faq" component={FAQPage} />
      <Route path="/bonus">
        <BonusPage />
      </Route>
      <Route path="/admin/giveaway-entries" element={<GiveawayEntriesPage />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="min-h-screen flex flex-col">
          <Navigation />
          <main className="flex-1">
            <Router />
          </main>
          <Footer />
        </div>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;