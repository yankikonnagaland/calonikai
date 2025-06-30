import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TermsConditions() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Terms & Conditions</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Last updated: December 23, 2025
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-sm border border-gray-200 dark:border-gray-700">
            
            <h2 className="text-xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="mb-6">
              By accessing and using Calonik.ai ("the Service"), you accept and agree to be bound by 
              the terms and provision of this agreement. If you do not agree to abide by the above, 
              please do not use this service.
            </p>

            <h2 className="text-xl font-semibold mb-4">2. Description of Service</h2>
            <p className="mb-4">
              Calonik.ai is a calorie tracking and weight management platform that provides:
            </p>
            <ul className="list-disc pl-6 mb-6">
              <li>Calorie and nutrition tracking tools</li>
              <li>AI-powered food recognition</li>
              <li>Exercise and fitness tracking</li>
              <li>Weight management features</li>
              <li>Personalized nutrition insights</li>
            </ul>

            <h2 className="text-xl font-semibold mb-4">3. User Accounts</h2>
            <p className="mb-4">
              To access certain features, you must create an account. You agree to:
            </p>
            <ul className="list-disc pl-6 mb-6">
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain and update your information</li>
              <li>Keep your password secure and confidential</li>
              <li>Be responsible for all activities under your account</li>
              <li>Notify us immediately of unauthorized use</li>
            </ul>

            <h2 className="text-xl font-semibold mb-4">4. Acceptable Use</h2>
            <p className="mb-4">You agree not to:</p>
            <ul className="list-disc pl-6 mb-6">
              <li>Use the service for illegal or unauthorized purposes</li>
              <li>Violate any international, federal, provincial, or local laws</li>
              <li>Transmit viruses, malware, or malicious code</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with or disrupt the service</li>
              <li>Share false, misleading, or harmful content</li>
            </ul>

            <h2 className="text-xl font-semibold mb-4">5. Premium Services</h2>
            <p className="mb-4">
              We offer premium features through paid subscriptions:
            </p>
            <ul className="list-disc pl-6 mb-6">
              <li>Enhanced AI photo analysis capabilities</li>
              <li>Increased daily usage limits</li>
              <li>Advanced nutrition insights</li>
              <li>Priority customer support</li>
            </ul>
            <p className="mb-6">
              Subscription fees are charged monthly and automatically renew unless cancelled. 
              All fees are non-refundable except as required by law.
            </p>

            <h2 className="text-xl font-semibold mb-4">6. Health Disclaimer</h2>
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg mb-6">
              <p className="font-medium text-gray-400 dark:text-gray-400">
                <strong>Important:</strong> Calonik.ai provides general informational purposes only—not medical advice, diagnosis, or treatment. Calorie estimates, nutritional data, and health suggestions are approximations and may not suit everyone. Always consult a qualified healthcare professional before altering your diet or exercise. Individual results vary, and Calonik.ai is not liable for health outcomes related to app use.
              </p>
            </div>

            <h2 className="text-xl font-semibold mb-4">7. Intellectual Property</h2>
            <p className="mb-6">
              All content, features, and functionality of the service are owned by Calonik.ai and 
              protected by copyright, trademark, and other intellectual property laws. You may not 
              reproduce, distribute, or create derivative works without permission.
            </p>

            <h2 className="text-xl font-semibold mb-4">8. Privacy</h2>
            <p className="mb-6">
              Your privacy is important to us. Please review our Privacy Policy, which governs 
              how we collect, use, and protect your information.
            </p>

            <h2 className="text-xl font-semibold mb-4">9. Limitation of Liability</h2>
            <p className="mb-6">
              To the maximum extent permitted by law, Calonik.ai shall not be liable for any indirect, 
              incidental, special, consequential, or punitive damages, including loss of profits, 
              data, or use, incurred by you or any third party.
            </p>

            <h2 className="text-xl font-semibold mb-4">10. Indemnification</h2>
            <p className="mb-6">
              You agree to indemnify and hold harmless Calonik.ai from any claims, damages, losses, 
              liabilities, and expenses arising from your use of the service or violation of these terms.
            </p>

            <h2 className="text-xl font-semibold mb-4">11. Termination</h2>
            <p className="mb-6">
              We may terminate or suspend your account immediately, without prior notice, for conduct 
              that we believe violates these terms or is harmful to other users, us, or third parties.
            </p>

            <h2 className="text-xl font-semibold mb-4">12. Governing Law</h2>
            <p className="mb-6">
              These terms shall be governed by and construed in accordance with applicable laws, 
              without regard to conflict of law provisions.
            </p>

            <h2 className="text-xl font-semibold mb-4">13. Changes to Terms</h2>
            <p className="mb-6">
              We reserve the right to modify these terms at any time. We will notify users of significant 
              changes via email or platform notifications. Continued use constitutes acceptance of modified terms.
            </p>

            <h2 className="text-xl font-semibold mb-4">14. Contact Information</h2>
            <p className="mb-4">
              For questions about these terms, please contact us at:
            </p>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <p className="font-medium">Email: support@calonik.ai</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}