
import React from "react";
import { Helmet } from "react-helmet";
import { Container } from "@/components/ui/container";

const AboutPage = () => {
  return (
    <>
      <Helmet>
        <title>About Us | Suprizely</title>
      </Helmet>
      <Container className="py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">About Suprizely</h1>
          
          <div className="prose prose-slate dark:prose-invert">
            <p className="text-lg mb-6">
              Welcome to Suprizely, your go-to destination for thoughtful and unique gift ideas for every occasion.
            </p>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">Our Mission</h2>
            <p>
              At Suprizely, we believe that giving the perfect gift is an art. Our mission is to help you find 
              meaningful gifts that create lasting impressions and strengthen your relationships with loved ones.
            </p>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">Our Story</h2>
            <p>
              Suprizely was founded in 2023 by a team of gift enthusiasts who were frustrated with the challenge 
              of finding unique gifts for friends and family. What started as a small curated collection has grown 
              into a comprehensive gift recommendation platform.
            </p>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">What Makes Us Different</h2>
            <ul className="list-disc pl-6 mb-6">
              <li className="mb-2">Thoughtfully curated selection of high-quality products</li>
              <li className="mb-2">Personalized gift recommendations based on recipient interests</li>
              <li className="mb-2">Focus on unique and memorable gifts that stand out</li>
              <li className="mb-2">Commitment to exceptional customer service</li>
            </ul>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">Our Values</h2>
            <p>
              We believe in the power of thoughtful gifting to strengthen relationships and create meaningful moments. 
              Every product we recommend is selected with care, quality, and uniqueness in mind.
            </p>
            
            <p className="mt-8">
              Thank you for choosing Suprizely for your gifting needs. We're excited to help you discover the perfect surprise!
            </p>
          </div>
        </div>
      </Container>
    </>
  );
};

export default AboutPage;
