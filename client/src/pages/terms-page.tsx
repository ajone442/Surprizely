import React from 'react';
import { Container } from "@/components/ui/container";

export default function TermsPage() {
  return (
    <Container className="py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>

        <div className="prose prose-lg">
          <p className="mb-4">
            Last Updated: November 15, 2023
          </p>

          <p className="mb-4">
            Please read these Terms of Service carefully before using the Suprizely website.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">1. Agreement to Terms</h2>

          <p className="mb-4">
            By accessing or using our website, you agree to be bound by these Terms of Service and our Privacy Policy.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">2. Use of Our Services</h2>

          <p className="mb-4">
            You may use our services only as permitted by these terms and applicable laws and regulations.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">3. User Accounts</h2>

          <p className="mb-4">
            To access certain features of our website, you may need to create an account. You are responsible for maintaining the confidentiality of your account information and for all activities under your account.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">4. Purchases and Payments</h2>

          <p className="mb-4">
            By making a purchase through our website, you agree to pay all charges in full by the payment method you specified. You represent and warrant that you have the legal right to use any payment method provided.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">5. Changes to Terms</h2>

          <p className="mb-4">
            We may revise and update these Terms of Service from time to time at our sole discretion. All changes are effective when posted, and your continued use of the website following the posting of revised Terms of Service means you accept the changes.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">6. Contact Us</h2>

          <p className="mb-4">
            If you have any questions about these Terms of Service, please contact us at:
          </p>

          <p className="mb-4">
            <a href="mailto:support@suprizely.com" className="text-primary hover:underline">support@suprizely.com</a>
          </p>
        </div>
      </div>
    </Container>
  );
}