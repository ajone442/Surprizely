import React from 'react';
import { Container } from "@/components/ui/container";

export default function PrivacyPage() {
  return (
    <Container className="py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>

        <div className="prose prose-lg">
          <p className="mb-4">
            Last Updated: November 15, 2023
          </p>

          <p className="mb-4">
            At Suprizely, we take your privacy seriously. This Privacy Policy describes how we collect, use, and share information about you when you use our website.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">Information We Collect</h2>

          <p className="mb-4">
            We collect information you provide directly to us, such as when you create an account, make a purchase, contact customer support, or otherwise communicate with us.
          </p>

          <p className="mb-4">
            This information may include your name, email address, postal address, phone number, and payment information.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">How We Use Your Information</h2>

          <p className="mb-4">
            We use the information we collect to:
          </p>

          <ul className="list-disc pl-6 mb-6">
            <li className="mb-2">Provide, maintain, and improve our services</li>
            <li className="mb-2">Process transactions and send related information</li>
            <li className="mb-2">Send you technical notices, updates, and administrative messages</li>
            <li className="mb-2">Respond to your comments and questions</li>
            <li className="mb-2">Personalize your experience on our website</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 mb-4">Contact Us</h2>

          <p className="mb-4">
            If you have any questions about this Privacy Policy, please contact us at:
          </p>

          <p className="mb-4">
            <a href="mailto:support@suprizely.com" className="text-primary hover:underline">support@suprizely.com</a>
          </p>
        </div>
      </div>
    </Container>
  );
}