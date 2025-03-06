import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { ExternalLink, Settings, ShoppingBag, Heart, Phone, Mail, MapPin } from "lucide-react";

export function Footer() {
  const { user } = useAuth();
  return (
    <footer className="mt-auto border-t bg-slate-100 py-8 shadow-inner">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-primary">Gift Registry</h3>
            <p className="text-sm text-muted-foreground">
              Find the perfect gift for your loved ones with our curated selection
              of high-quality products.
            </p>
            <p className="text-sm text-muted-foreground">© 2023 Gift Registry. All rights reserved.</p>
            {user?.isAdmin && (
              <Link href="/admin">
                <a className="inline-flex items-center text-sm text-primary hover:underline">
                  <Settings className="mr-1 h-4 w-4" />
                  Admin Dashboard
                </a>
              </Link>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-primary">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/">
                  <a className="text-sm text-muted-foreground hover:text-primary">Home</a>
                </Link>
              </li>
              <li>
                <Link href="/wishlist">
                  <a className="text-sm text-muted-foreground hover:text-primary">
                    <Heart className="mr-1 inline-block h-4 w-4" />
                    Wishlist
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/products">
                  <a className="text-sm text-muted-foreground hover:text-primary">
                    <ShoppingBag className="mr-1 inline-block h-4 w-4" />
                    All Products
                  </a>
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-primary">Categories</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/?category=Electronics">
                  <a className="text-sm text-muted-foreground hover:text-primary">Electronics</a>
                </Link>
              </li>
              <li>
                <Link href="/?category=Clothing">
                  <a className="text-sm text-muted-foreground hover:text-primary">Clothing</a>
                </Link>
              </li>
              <li>
                <Link href="/?category=Home">
                  <a className="text-sm text-muted-foreground hover:text-primary">Home & Garden</a>
                </Link>
              </li>
              <li>
                <Link href="/?category=Books">
                  <a className="text-sm text-muted-foreground hover:text-primary">Books</a>
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-primary">Contact Us</h3>
            <ul className="space-y-2">
              <li className="flex items-center text-sm text-muted-foreground">
                <Phone className="mr-2 h-4 w-4" />
                (555) 123-4567
              </li>
              <li className="flex items-center text-sm text-muted-foreground">
                <Mail className="mr-2 h-4 w-4" />
                support@giftregistry.com
              </li>
              <li className="flex items-center text-sm text-muted-foreground">
                <MapPin className="mr-2 h-4 w-4" />
                123 Gift Street, Registry City
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}