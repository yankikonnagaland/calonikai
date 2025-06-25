import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicy() {
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Privacy Policy</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Last updated: December 23, 2025
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-sm border border-gray-200 dark:border-gray-700">
            
            <h2 className="text-xl font-semibold mb-4">1. Information We Collect</h2>
            <p className="mb-4">
              We collect information you provide directly to us, such as when you create an account, 
              use our services, or contact us for support.
            </p>
            <ul className="list-disc pl-6 mb-6">
              <li>Account information (email, username, password)</li>
              <li>Health and fitness data (weight, height, age, fitness goals)</li>
              <li>Food intake and exercise data you input</li>
              <li>Usage data and analytics</li>
            </ul>

            <h2 className="text-xl font-semibold mb-4">2. How We Use Your Information</h2>
            <p className="mb-4">We use the information we collect to:</p>
            <ul className="list-disc pl-6 mb-6">
              <li>Provide, maintain, and improve our services</li>
              <li>Process transactions and send related information</li>
              <li>Send technical notices and support messages</li>
              <li>Provide personalized nutrition and fitness recommendations</li>
              <li>Monitor and analyze trends and usage</li>
            </ul>

            <h2 className="text-xl font-semibold mb-4">3. Information Sharing</h2>
            <p className="mb-4">
              We do not sell, trade, or otherwise transfer your personal information to third parties 
              without your consent, except as described in this policy.
            </p>
            <ul className="list-disc pl-6 mb-6">
              <li>Service providers who assist us in operating our platform</li>
              <li>Legal requirements or to protect our rights</li>
              <li>Business transfers (merger, acquisition, etc.)</li>
            </ul>

            <h2 className="text-xl font-semibold mb-4">4. Data Security</h2>
            <p className="mb-6">
              We implement appropriate security measures to protect your personal information against 
              unauthorized access, alteration, disclosure, or destruction. However, no method of 
              transmission over the internet is 100% secure.
            </p>

            <h2 className="text-xl font-semibold mb-4">5. Data Retention</h2>
            <p className="mb-6">
              We retain your personal information for as long as necessary to provide our services 
              and as required by law. You may request deletion of your account and associated data 
              at any time.
            </p>

            <h2 className="text-xl font-semibold mb-4">6. Your Rights</h2>
            <p className="mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 mb-6">
              <li>Access and update your personal information</li>
              <li>Request deletion of your data</li>
              <li>Opt-out of promotional communications</li>
              <li>Request data portability</li>
            </ul>

            <h2 className="text-xl font-semibold mb-4">7. Cookies and Tracking</h2>
            <p className="mb-6">
              We use cookies and similar technologies to enhance your experience, analyze usage, 
              and provide personalized content. You can control cookie settings through your 
              browser preferences.
            </p>

            <h2 className="text-xl font-semibold mb-4">8. Children's Privacy</h2>
            <p className="mb-6">
              Our services are not intended for children under 13. We do not knowingly collect 
              personal information from children under 13. If we become aware of such data, 
              we will delete it immediately.
            </p>

            <h2 className="text-xl font-semibold mb-4">9. International Users</h2>
            <p className="mb-6">
              Your information may be transferred to and processed in countries other than your own. 
              By using our services, you consent to such transfers and processing.
            </p>

            <h2 className="text-xl font-semibold mb-4">10. Changes to Privacy Policy</h2>
            <p className="mb-6">
              We may update this privacy policy from time to time. We will notify you of significant 
              changes via email or through our platform. Your continued use constitutes acceptance 
              of the updated policy.
            </p>

            <h2 className="text-xl font-semibold mb-4">11. Contact Us</h2>
            <p className="mb-4">
              If you have questions about this privacy policy or our data practices, please contact us at:
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