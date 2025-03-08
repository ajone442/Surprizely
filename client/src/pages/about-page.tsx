import React from 'react';
import { Container } from "@/components/ui/container";

export default function AboutPage() {
  return (
    <Container className="py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">About Suprizely</h1>

        <div className="prose prose-lg">
          <p className="mb-4">
            Suprizely was founded with a simple mission: to help people find the perfect gifts for their loved ones.
          </p>

          <p className="mb-4">
            We understand that finding the right gift can be challenging. That's why we've created a curated selection of high-quality products across various categories to make your gift-giving experience seamless and memorable.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">Our Values</h2>

          <ul className="list-disc pl-6 mb-6">
            <li className="mb-2">Quality over quantity - we handpick only the best products</li>
            <li className="mb-2">Thoughtfulness - we believe gifts should be meaningful</li>
            <li className="mb-2">Convenience - making gift shopping stress-free</li>
            <li className="mb-2">Customer satisfaction - your happiness is our priority</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 mb-4">Our Team</h2>

          <p className="mb-4">
            Suprizely is run by a team of passionate individuals who love finding unique and thoughtful gifts. Our team combines expertise in product curation, customer service, and technology to deliver the best gift-finding experience.
          </p>

          <p className="mb-4">
            We're constantly exploring new products and gift ideas to keep our selection fresh and exciting.
          </p>
        </div>
      </div>
    </Container>
  );
}