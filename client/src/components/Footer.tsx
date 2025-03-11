import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { ExternalLink, Settings, Mail, Instagram, Twitter, Facebook, Activity } from "lucide-react";

export default function Footer() {
  const { user } = useAuth();
  
  return (
    <footer className="mt-auto border-t relative z-10 bg-background py-12 shadow-inner">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-primary">Suprizely</h3>
            <p className="text-sm text-muted-foreground">
              Find the perfect gift for your loved ones with our curated selection
              of high-quality products.
            </p>
            
            {/* Social Media Links */}
            <div className="flex space-x-4 pt-2">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
                <span className="sr-only">Facebook</span>
              </a>
            </div>
          </div>
          
          {/* Main Pages */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-primary">Pages</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/">
                  <div className="flex items-center text-sm text-muted-foreground hover:text-primary cursor-pointer">
                    Home
                  </div>
                </Link>
              </li>
              <li>
                <Link href="/products">
                  <div className="flex items-center text-sm text-muted-foreground hover:text-primary cursor-pointer">
                    Products
                  </div>
                </Link>
              </li>
              <li>
                <Link href="/about">
                  <div className="flex items-center text-sm text-muted-foreground hover:text-primary cursor-pointer">
                    About Us
                  </div>
                </Link>
              </li>
              <li>
                <Link href="/blog">
                  <div className="flex items-center text-sm text-muted-foreground hover:text-primary cursor-pointer">
                    Blog
                  </div>
                </Link>
              </li>
              <li>
                <Link href="/faq">
                  <div className="flex items-center text-sm text-muted-foreground hover:text-primary cursor-pointer">
                    FAQ
                  </div>
                </Link>
              </li>
              <li>
                <Link href="/status">
                  <div className="flex items-center text-sm text-muted-foreground hover:text-primary cursor-pointer">
                    <Activity className="mr-1 h-4 w-4" />
                    System Status
                  </div>
                </Link>
              </li>
              {user?.isAdmin && (
                <li>
                  <Link href="/admin">
                    <div className="flex items-center text-sm text-primary hover:underline cursor-pointer">
                      <Settings className="mr-1 h-4 w-4" />
                      Admin Dashboard
                    </div>
                  </Link>
                </li>
              )}
            </ul>
          </div>
          
          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-primary">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-center text-sm text-muted-foreground">
                <Mail className="mr-2 h-4 w-4 flex-shrink-0" />
                <a href="mailto:support@suprizely.com" className="hover:text-primary transition-colors">
                  support@suprizely.com
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {new Date().getFullYear()} Suprizely. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="/privacy">
                <div className="text-sm text-muted-foreground hover:text-primary cursor-pointer">
                  Privacy Policy
                </div>
              </Link>
              <Link href="/terms">
                <div className="text-sm text-muted-foreground hover:text-primary cursor-pointer">
                  Terms of Service
                </div>
              </Link>
              <Link href="/faq">
                <div className="text-sm text-muted-foreground hover:text-primary cursor-pointer">
                  FAQ
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
