
import React from "react";
import { Helmet } from "react-helmet";
import { Container } from "@/components/ui/container";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQPage = () => {
  // Sample FAQ data
  const faqs = [
    {
      question: "How do I create an account?",
      answer: "To create an account, click on the 'Sign Up' button in the top right corner of the website. Fill in your details and follow the prompts to complete the registration process."
    },
    {
      question: "Do you ship internationally?",
      answer: "We don't ship products directly as we are a gift recommendation platform. We partner with various retailers who have their own shipping policies. Please check the retailer's website for specific shipping information."
    },
    {
      question: "How do I save items to my wishlist?",
      answer: "To save items to your wishlist, you need to be logged in. Once logged in, simply click the heart icon on any product you want to save. You can view your wishlist by clicking on 'Wishlist' in the navigation menu."
    },
    {
      question: "How do your gift recommendations work?",
      answer: "Our gift recommendations are based on the recipient's interests, the occasion, your budget, and other preferences you provide. We use a combination of user data and expert curation to suggest the most appropriate gifts."
    },
    {
      question: "Can I return a product?",
      answer: "Since we are a recommendation platform, all purchases are made through our retail partners. Return policies vary by retailer, so please refer to the specific retailer's return policy for details."
    },
    {
      question: "Are the prices shown up-to-date?",
      answer: "We make every effort to display current pricing from our retail partners. However, prices may change without notice. We recommend confirming the price on the retailer's website before making a purchase."
    },
    {
      question: "Do you offer gift wrapping services?",
      answer: "Gift wrapping options depend on the retail partner through which you purchase a product. Many of our partners do offer gift wrapping for an additional fee. Check the retailer's options during checkout."
    }
  ];

  return (
    <>
      <Helmet>
        <title>Frequently Asked Questions | Suprizely</title>
      </Helmet>
      <Container className="py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Frequently Asked Questions</h1>
          <p className="text-lg mb-8">
            Find answers to the most common questions about Suprizely and our services.
          </p>
          
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left font-medium">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          
          <div className="mt-12 bg-muted p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-3">Still have questions?</h2>
            <p className="mb-4">
              If you couldn't find the answer to your question, please feel free to contact our support team.
            </p>
            <a 
              href="mailto:support@suprizely.com" 
              className="inline-block px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
            >
              Contact Support
            </a>
          </div>
        </div>
      </Container>
    </>
  );
};

export default FAQPage;
