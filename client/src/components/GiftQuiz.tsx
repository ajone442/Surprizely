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
      const response = await apiRequest("POST", "/api/chat", {
        message: `Based on this quiz data: ${JSON.stringify(quizAnswers)}, suggest some gift ideas.`
      });
      const data = await response.json();
      setRecommendations([data.message]);
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
                    {recommendations.map((rec, i) => (
                      <div key={i} className="whitespace-pre-wrap">{rec}</div>
                    ))}
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
