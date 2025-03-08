
import React from "react";
import { Helmet } from "react-helmet";
import { Container } from "@/components/ui/container";

const PrivacyPage = () => {
  return (
    <>
      <Helmet>
        <title>Privacy Policy | Suprizely</title>
      </Helmet>
      <Container className="py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground mb-6">Last Updated: {new Date().toLocaleDateString()}</p>
          
          <div className="prose prose-slate dark:prose-invert">
            <p>
              At Suprizely, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, 
              and safeguard your information when you visit our website.
            </p>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">Information We Collect</h2>
            <p>
              We collect information that you voluntarily provide to us when you register on the website, 
              express interest in obtaining information about us or our products, when you participate in activities 
              on the website, or otherwise when you contact us.
            </p>
            <p>
              The personal information that we collect depends on the context of your interactions with us and 
              the website, the choices you make, and the products and features you use. The personal information 
              we collect may include the following:
            </p>
            <ul className="list-disc pl-6 mb-6">
              <li>Name and contact data</li>
              <li>Credentials</li>
              <li>Payment data</li>
              <li>Location data</li>
            </ul>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">How We Use Your Information</h2>
            <p>
              We use personal information collected via our website for a variety of business purposes described below:
            </p>
            <ul className="list-disc pl-6 mb-6">
              <li>To facilitate account creation and login process</li>
              <li>To provide you with targeted advertising or marketing communications</li>
              <li>To manage user accounts</li>
              <li>To process your financial transactions</li>
              <li>To protect our services</li>
              <li>To respond to user inquiries/offer support to users</li>
            </ul>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">Contact Us</h2>
            <p>
              If you have questions or comments about this Privacy Policy, please contact us at:
            </p>
            <p className="mt-2">
              <strong>Email:</strong> privacy@suprizely.com
            </p>
          </div>
        </div>
      </Container>
    </>
  );
};

export default PrivacyPage;
