
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { ExternalLink, Settings, Mail, Gift, Tag, Heart, MapPin, Phone, Instagram, Twitter, Facebook } from "lucide-react";

export default function Footer() {
  const { user } = useAuth();
  
  return (
    <footer className="mt-auto border-t relative z-10 bg-background py-12 shadow-inner">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
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
          
          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-primary">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/">
                  <span className="flex items-center text-sm text-muted-foreground hover:text-primary cursor-pointer">
                    Home
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/products">
                  <span className="flex items-center text-sm text-muted-foreground hover:text-primary cursor-pointer">
                    Products
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/about">
                  <span className="flex items-center text-sm text-muted-foreground hover:text-primary cursor-pointer">
                    About Us
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/blog">
                  <span className="flex items-center text-sm text-muted-foreground hover:text-primary cursor-pointer">
                    Blog
                  </span>
                </Link>
              </li>
              {user?.isAdmin && (
                <li>
                  <Link href="/admin">
                    <span className="flex items-center text-sm text-primary hover:underline cursor-pointer">
                      <Settings className="mr-1 h-4 w-4" />
                      Admin Dashboard
                    </span>
                  </Link>
                </li>
              )}
            </ul>
          </div>
          
          {/* Gift Categories */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-primary">Gift Categories</h3>
            <ul className="space-y-2">
              <li className="flex items-center text-sm text-muted-foreground">
                <Gift className="mr-2 h-4 w-4" />
                Jewelry
              </li>
              <li className="flex items-center text-sm text-muted-foreground">
                <Gift className="mr-2 h-4 w-4" />
                Tech Gadgets
              </li>
              <li className="flex items-center text-sm text-muted-foreground">
                <Gift className="mr-2 h-4 w-4" />
                Home Decor
              </li>
              <li className="flex items-center text-sm text-muted-foreground">
                <Tag className="mr-2 h-4 w-4" />
                Personalized Gifts
              </li>
              <li className="flex items-center text-sm text-muted-foreground">
                <Heart className="mr-2 h-4 w-4" />
                Romantic Gifts
              </li>
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
              <li className="flex items-center text-sm text-muted-foreground">
                <Phone className="mr-2 h-4 w-4 flex-shrink-0" />
                <a href="tel:+1234567890" className="hover:text-primary transition-colors">
                  (123) 456-7890
                </a>
              </li>
              <li className="flex items-start text-sm text-muted-foreground">
                <MapPin className="mr-2 h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>
                  123 Gift Avenue<br />
                  Surprise City, SC 12345
                </span>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Suprizely. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="/privacy">
                <span className="text-sm text-muted-foreground hover:text-primary cursor-pointer">
                  Privacy Policy
                </span>
              </Link>
              <Link href="/terms">
                <span className="text-sm text-muted-foreground hover:text-primary cursor-pointer">
                  Terms of Service
                </span>
              </Link>
              <Link href="/faq">
                <span className="text-sm text-muted-foreground hover:text-primary cursor-pointer">
                  FAQ
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
