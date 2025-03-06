import { useState } from "react";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendHorizonal, Bot } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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

      // Add assistant response to messages
      const assistantMessage: Message = { role: "assistant", content: formattedResponse };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description: "Failed to get response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Gift Recommendation Assistant
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 my-4 max-h-[400px] min-h-[300px]">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground h-full flex items-center justify-center">
              <p>Ask for gift recommendations!</p>
            </div>
          ) : (
            messages.map((message, index) => (
              <Card 
                key={index} 
                className={`p-3 ${message.role === 'user' ? 'bg-primary text-primary-foreground ml-12' : 'bg-muted mr-12'}`}
              >
                {message.content}
              </Card>
            ))
          )}
          {isLoading && (
            <Card className="p-3 bg-muted mr-12">
              <div className="flex items-center space-x-2">
                <div className="h-3 w-3 bg-foreground/20 rounded-full animate-pulse"></div>
                <div className="h-3 w-3 bg-foreground/20 rounded-full animate-pulse delay-75"></div>
                <div className="h-3 w-3 bg-foreground/20 rounded-full animate-pulse delay-150"></div>
              </div>
            </Card>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Textarea 
            value={input} 
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about gift recommendations..."
            className="min-h-[50px] flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
            <SendHorizonal className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}