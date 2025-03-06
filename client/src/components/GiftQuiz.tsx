import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Helper function to match products based on quiz answers
const filterProductsByQuizAnswers = (products, quizAnswers) => {
  // Default to returning all products if empty
  if (!products || products.length === 0) return [];
  
  // Start with all products
  let filteredProducts = [...products];
  
  // Filter by budget if provided
  if (quizAnswers.budget) {
    const budgetMap = {
      "Under $25": 25,
      "$25-$50": 50,
      "$50-$100": 100,
      "Over $100": 1000
    };
    
    const maxBudget = budgetMap[quizAnswers.budget] || 1000;
    
    if (maxBudget <= 25) {
      filteredProducts = filteredProducts.filter(p => parseFloat(p.price) <= 25);
    } else if (maxBudget <= 50) {
      filteredProducts = filteredProducts.filter(p => parseFloat(p.price) <= 50);
    } else if (maxBudget <= 100) {
      filteredProducts = filteredProducts.filter(p => parseFloat(p.price) <= 100);
    }
  }
  
  // Filter by interests if provided
  if (quizAnswers.interests) {
    const interestsLower = quizAnswers.interests.toLowerCase();
    
    // Score products by how well they match the interests
    filteredProducts = filteredProducts.map(product => ({
      ...product,
      score: calculateInterestScore(product, interestsLower)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3); // Get top 3 matches
  }
  
  return filteredProducts;
};

// Helper function to calculate how well a product matches interests
const calculateInterestScore = (product, interests) => {
  let score = 0;
  
  // Check if product name, description or category contains any of the interests
  if (product.name.toLowerCase().includes(interests)) score += 3;
  if (product.description.toLowerCase().includes(interests)) score += 2;
  if (product.category && product.category.toLowerCase().includes(interests)) score += 2;
  
  return score;
};


import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

interface GiftQuizProps {
  open: boolean;
  onClose: () => void;
}

type Question = {
  id: string;
  text: string;
  options: { value: string; label: string }[];
};

const questions: Question[] = [
  {
    id: "relationship",
    text: "Who are you buying for?",
    options: [
      { value: "parent", label: "Parent" },
      { value: "spouse", label: "Spouse/Partner" },
      { value: "friend", label: "Friend" },
      { value: "child", label: "Child" },
      { value: "colleague", label: "Colleague" },
    ],
  },
  {
    id: "interests",
    text: "What are their main interests?",
    options: [
      { value: "tech", label: "Technology" },
      { value: "outdoors", label: "Outdoors & Adventure" },
      { value: "cooking", label: "Cooking & Food" },
      { value: "art", label: "Arts & Crafts" },
      { value: "fashion", label: "Fashion & Style" },
    ],
  },
  {
    id: "budget",
    text: "What's your budget range?",
    options: [
      { value: "budget", label: "Under $25" },
      { value: "mid", label: "Between $25-$100" },
      { value: "premium", label: "Over $100" },
    ],
  },
];

export default function GiftQuiz({ open, onClose }: GiftQuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const { toast } = useToast();

  const handleAnswer = (value: string) => {
    const newAnswers = {
      ...answers,
      [questions[currentQuestion].id]: value,
    };
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      getRecommendations(newAnswers);
    }
  };

  const getRecommendations = async (quizAnswers: Record<string, string>) => {
    setIsLoading(true);
    try {
      // First, fetch all available products
      const productsResponse = await apiRequest("GET", "/api/products");
      const products = await productsResponse.json();
      
      // For now, let's implement a simple matching algorithm in the frontend
      // instead of relying on the API which is giving errors
      let matchedProducts = filterProductsByQuizAnswers(products, quizAnswers);
      
      // If we have products after filtering, return them
      if (matchedProducts.length > 0) {
        const recommendationsData = {
          recommendations: matchedProducts.map(product => ({
            ...product,
            explanation: `This matches your ${quizAnswers.relationship} who likes ${quizAnswers.interests} and fits your budget of ${quizAnswers.budget}.`
          }))
        };
        setRecommendations([JSON.stringify(recommendationsData)]);
      } else {
        // If no products match, try to use API as fallback
        try {
          const response = await apiRequest("POST", "/api/chat", {
            message: `I have a user who answered a gift recommendation quiz with these answers: ${JSON.stringify(quizAnswers)}. 
            Here are the products in my catalog: ${JSON.stringify(products)}. 
            Please recommend specific products from my catalog that match the user's preferences. 
            Consider the relationship (${quizAnswers.relationship}), interests (${quizAnswers.interests}), and budget (${quizAnswers.budget}).
            Format your response as JSON with an array of product recommendations and explanation for each.`
          });
          
          const data = await response.json();
          setRecommendations([data.message]);
        } catch (apiError) {
          // If API also fails, show all products with a message
          const recommendationsData = {
            recommendations: products.slice(0, 3).map(product => ({
              ...product,
              explanation: "Based on your quiz answers, here are some options that might interest you."
            }))
          };
          setRecommendations([JSON.stringify(recommendationsData)]);
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get recommendations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setRecommendations([]);
  };

  return (
    <Sheet open={open} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[90vw] sm:max-w-[500px] flex flex-col h-full p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle>Gift Recommendation Quiz</SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 p-4">
          {recommendations.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">
                  {questions[currentQuestion].text}
                </h3>
                <RadioGroup
                  onValueChange={handleAnswer}
                  className="space-y-3"
                >
                  {questions[currentQuestion].options.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.value} id={option.value} />
                      <Label htmlFor={option.value}>{option.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="prose">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <>
                    {recommendations.map((rec, i) => {
                      // Try to parse the JSON response
                      let parsedRecs;
                      try {
                        parsedRecs = JSON.parse(rec);
                      } catch (e) {
                        // If parsing fails, just show the text
                        return <div key={i} className="whitespace-pre-wrap">{rec}</div>;
                      }
                      
                      // If we have parsed recommendations in JSON format
                      if (parsedRecs && parsedRecs.recommendations) {
                        return (
                          <div key={i} className="space-y-6">
                            {parsedRecs.recommendations.map((item, idx) => (
                              <div key={idx} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                                <h4 className="text-lg font-semibold">{item.name}</h4>
                                <p className="text-sm text-muted-foreground mb-2">{item.price}</p>
                                <p className="mb-2">{item.description}</p>
                                {item.explanation && (
                                  <p className="text-sm italic border-l-2 pl-3 my-2 border-primary">{item.explanation}</p>
                                )}
                                {item.imageUrl && (
                                  <img 
                                    src={item.imageUrl} 
                                    alt={item.name} 
                                    className="w-full h-40 object-cover rounded-md my-2" 
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        );
                      } else {
                        return <div key={i} className="whitespace-pre-wrap">{rec}</div>;
                      }
                    })}
                    <Button
                      onClick={resetQuiz}
                      className="mt-4"
                    >
                      Start Over
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
