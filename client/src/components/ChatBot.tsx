import { useState } from "react";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendHorizonal, Bot } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatBotProps {
  open: boolean;
  onClose: () => void;
}

export default function ChatBot({ open, onClose }: ChatBotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Get product info to provide context
      const productsResponse = await axios.get('/api/products');
      const products = productsResponse.data;

      // Format products data for the AI
      const productsData = products.map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        category: p.category,
        imageUrl: p.imageUrl
      }));

      // Create a message that includes user input and product data
      const apiMessage = `
User is looking for gift ideas with the following request:
"${input}"

Here are the available products in our catalog:
${JSON.stringify(productsData, null, 2)}

Based on the user's request and available products, suggest appropriate gift options.
      `;

      const response = await axios.post('/api/chat', { message: apiMessage });

      let formattedResponse = response.data.message;

      // Try to parse JSON if the response contains it
      try {
        if (typeof formattedResponse === 'string' && formattedResponse.includes('"recommendations"')) {
          const jsonStart = formattedResponse.indexOf('{');
          const jsonEnd = formattedResponse.lastIndexOf('}') + 1;
          if (jsonStart >= 0 && jsonEnd > jsonStart) {
            const jsonStr = formattedResponse.substring(jsonStart, jsonEnd);
            const data = JSON.parse(jsonStr);

            if (data.recommendations && Array.isArray(data.recommendations)) {
              formattedResponse = "Here are some gift ideas I found for you:\n\n" + 
                data.recommendations.map((rec: any, index: number) => 
                  `${index + 1}. **${rec.name}** - $${rec.price}\n${rec.explanation || rec.description || ''}`
                ).join("\n\n");
            }
          }
        }
      } catch (e) {
        console.log("Error parsing JSON response:", e);
        // Continue with text response if parsing fails
      }

      const assistantMessage: Message = { role: "assistant", content: formattedResponse };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description: "Failed to get a response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Bot className="mr-2 h-5 w-5" />
            Gift Assistant
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground p-4">
              Describe who you're buying for and what they like, and I'll help you find the perfect gift!
            </div>
          ) : (
            messages.map((message, index) => (
              <Card
                key={index}
                className={`p-3 ${
                  message.role === "assistant" ? "bg-primary/10" : "bg-secondary/10"
                }`}
              >
                <div className="font-semibold mb-1">
                  {message.role === "assistant" ? "Gift Assistant" : "You"}
                </div>
                <div className="whitespace-pre-wrap">{message.content}</div>
              </Card>
            ))
          )}
          {isLoading && (
            <Card className="p-3 bg-primary/10">
              <div className="font-semibold mb-1">Gift Assistant</div>
              <div className="animate-pulse">Thinking...</div>
            </Card>
          )}
        </div>

        <div className="border-t p-4">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about gift ideas..."
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="self-end"
            >
              <SendHorizonal className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}