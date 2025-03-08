
import React from "react";
import { Helmet } from "react-helmet";
import { Container } from "@/components/ui/container";

const TermsPage = () => {
  return (
    <>
      <Helmet>
        <title>Terms of Service | Suprizely</title>
      </Helmet>
      <Container className="py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
          <p className="text-sm text-muted-foreground mb-6">Last Updated: {new Date().toLocaleDateString()}</p>
          
          <div className="prose prose-slate dark:prose-invert">
            <p>
              Welcome to Suprizely. Please read these Terms of Service ("Terms") carefully before using our website.
            </p>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">1. Agreement to Terms</h2>
            <p>
              By accessing our website, you agree to be bound by these Terms and all applicable laws and regulations. 
              If you do not agree with any of these terms, you are prohibited from using or accessing this site.
            </p>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">2. Use License</h2>
            <p>
              Permission is granted to temporarily download one copy of the materials on Suprizely's website for personal, 
              non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under 
              this license you may not:
            </p>
            <ul className="list-disc pl-6 mb-6">
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose</li>
              <li>Attempt to decompile or reverse engineer any software contained on Suprizely's website</li>
              <li>Remove any copyright or other proprietary notations from the materials</li>
              <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
            </ul>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">3. Disclaimer</h2>
            <p>
              The materials on Suprizely's website are provided on an 'as is' basis. Suprizely makes no warranties, 
              expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, 
              implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement 
              of intellectual property or other violation of rights.
            </p>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">4. Limitations</h2>
            <p>
              In no event shall Suprizely or its suppliers be liable for any damages (including, without limitation, 
              damages for loss of data or profit, or due to business interruption) arising out of the use or inability 
              to use the materials on Suprizely's website, even if Suprizely or a Suprizely authorized representative 
              has been notified orally or in writing of the possibility of such damage.
            </p>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">5. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws, and you irrevocably submit 
              to the exclusive jurisdiction of the courts in that location.
            </p>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">Contact Us</h2>
            <p>
              If you have any questions about these Terms, please contact us at legal@suprizely.com.
            </p>
          </div>
        </div>
      </Container>
    </>
  );
};

export default TermsPage;
