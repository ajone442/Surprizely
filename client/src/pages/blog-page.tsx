import React from 'react';
import { Container } from "@/components/ui/container";

export default function BlogPage() {
  return (
    <Container className="py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Our Blog</h1>

        <div className="grid gap-8">
          <article className="border rounded-lg p-6 shadow-sm">
            <h2 className="text-2xl font-semibold mb-2">Top Gift Ideas for 2023</h2>
            <p className="text-muted-foreground mb-4">Published on November 15, 2023</p>
            <p className="mb-4">
              Finding the perfect gift can sometimes feel like searching for a needle in a haystack. 
              This year, we've curated a list of our favorite gift ideas that are sure to impress 
              everyone on your list.
            </p>
            <a href="#" className="text-primary hover:underline">Read more</a>
          </article>

          <article className="border rounded-lg p-6 shadow-sm">
            <h2 className="text-2xl font-semibold mb-2">Gift Wrapping Tips from Experts</h2>
            <p className="text-muted-foreground mb-4">Published on October 22, 2023</p>
            <p className="mb-4">
              A beautifully wrapped gift adds that extra touch of thoughtfulness. In this post, 
              we share some expert tips on how to wrap gifts like a professional.
            </p>
            <a href="#" className="text-primary hover:underline">Read more</a>
          </article>

          <article className="border rounded-lg p-6 shadow-sm">
            <h2 className="text-2xl font-semibold mb-2">Personalized Gifts: Why They Matter</h2>
            <p className="text-muted-foreground mb-4">Published on September 18, 2023</p>
            <p className="mb-4">
              Personalized gifts show that you've put thought and effort into finding something 
              special. Learn why personalized gifts make such a lasting impression.
            </p>
            <a href="#" className="text-primary hover:underline">Read more</a>
          </article>
        </div>
      </div>
    </Container>
  );
}