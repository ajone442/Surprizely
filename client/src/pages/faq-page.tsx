
import React from 'react';
import { Container } from "@/components/ui/container";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function FAQPage() {
  return (
    <Container className="py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Frequently Asked Questions</h1>
        
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>How do I use Suprizely to find products?</AccordionTrigger>
            <AccordionContent>
              To find perfect gifts, simply browse our curated product collections or use our search tools. When you find something you like, click on the product link to be redirected to the retailer's website where you can complete your purchase directly with them.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-2">
            <AccordionTrigger>How do purchases work on Suprizely?</AccordionTrigger>
            <AccordionContent>
              Suprizely is an affiliate site that connects you with great products. When you click on a product link, you'll be directed to the retailer's website where you can complete your purchase directly with them. We don't process any payments on our site.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-3">
            <AccordionTrigger>How do delivery and shipping work?</AccordionTrigger>
            <AccordionContent>
              Since Suprizely is an affiliate site, all shipping and delivery are handled by our partner retailers. Delivery times, shipping costs, and policies will vary depending on the specific retailer you purchase from. Please refer to each retailer's website for their specific shipping information.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-4">
            <AccordionTrigger>Can I return or exchange a gift?</AccordionTrigger>
            <AccordionContent>
              Since Suprizely is an affiliate site, all returns and exchanges are handled directly by the retailers you purchase from. Each retailer has their own return policy, so please refer to the specific retailer's website for their return and exchange procedures.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-5">
            <AccordionTrigger>How can I track my order?</AccordionTrigger>
            <AccordionContent>
              Order tracking is handled by the retailer you purchased from. You'll receive tracking information directly from the retailer according to their policies. Suprizely does not process or track orders as we are an affiliate site that connects you to retailers.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-6">
            <AccordionTrigger>Do retailers offer international shipping?</AccordionTrigger>
            <AccordionContent>
              International shipping availability depends entirely on the individual retailer's policies. Some of our affiliate partners offer international shipping while others may not. Please check the retailer's website for their specific shipping information before making a purchase.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        
        <div className="mt-12">
          <h2 className="text-xl font-semibold mb-4">Still have questions?</h2>
          <p className="mb-4">
            If you couldn't find the answer to your question, please contact our customer support team:
          </p>
          <p>
            <a href="mailto:support@suprizely.com" className="text-primary hover:underline">support@suprizely.com</a>
          </p>
        </div>
      </div>
    </Container>
  );
}
