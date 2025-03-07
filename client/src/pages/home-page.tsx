import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Product } from "@shared/schema";
import GiftCard from "@/components/GiftCard";
import GiftFilters from "@/components/GiftFilters";
import ChatBot from "@/components/ChatBot";
import GiftQuiz from "@/components/GiftQuiz";
import { Button } from "@/components/ui/button";
import { MessageCircle, BrainCircuit } from "lucide-react";
import { ProductCard } from "@/components/ProductCard"; // Added import for ProductCard

export default function HomePage() {
  const [showChat, setShowChat] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });
  
  // Ensure products is always an array
  const products = Array.isArray(data) ? data : [];

  const filteredProducts = products.filter((product) => {
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-pink-600 text-transparent bg-clip-text">
            Suprizely
          </h1>
          <p className="mt-2 text-muted-foreground">
            Find the perfect gift for your loved ones
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-64">
            <GiftFilters
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
            />
          </aside>

          <div className="flex-1">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <div className="fixed bottom-24 right-4 flex flex-col gap-2 z-10">
        <Button
          size="lg"
          onClick={() => setShowQuiz(true)}
          className="shadow-lg"
        >
          <BrainCircuit className="mr-2 h-5 w-5" />
          Take Gift Quiz
        </Button>
        <Button
          size="lg"
          onClick={() => setShowChat(true)}
          className="shadow-lg"
        >
          <MessageCircle className="mr-2 h-5 w-5" />
          Get Gift Ideas
        </Button>
      </div>

      <ChatBot open={showChat} onClose={() => setShowChat(false)} />
      <GiftQuiz open={showQuiz} onClose={() => setShowQuiz(false)} />
    </div>
  );
}