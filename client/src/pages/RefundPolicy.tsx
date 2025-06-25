import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RefundPolicy() {
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Refund Policy</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Last updated: December 23, 2025
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-sm border border-gray-200 dark:border-gray-700">
            
            <h2 className="text-xl font-semibold mb-4">1. General Policy</h2>
            <p className="mb-6">
              At Calonik.ai, we strive to provide excellent service and customer satisfaction. 
              This refund policy outlines the circumstances under which refunds may be granted 
              for our premium subscription services.
            </p>

            <h2 className="text-xl font-semibold mb-4">2. Subscription Services</h2>
            <p className="mb-4">
              Our premium subscription provides enhanced features including:
            </p>
            <ul className="list-disc pl-6 mb-6">
              <li>Increased AI photo analysis limit (5 per day)</li>
              <li>Enhanced food search capabilities (20 per day)</li>
              <li>Advanced nutrition insights</li>
              <li>Priority customer support</li>
            </ul>

            <h2 className="text-xl font-semibold mb-4">3. Refund Eligibility</h2>
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                You may be eligible for a refund if:
              </h3>
              <ul className="list-disc pl-6 text-green-700 dark:text-green-300">
                <li>Technical issues prevent you from accessing premium features</li>
                <li>Billing errors or unauthorized charges</li>
                <li>Service does not match advertised features</li>
                <li>Request is made within 7 days of subscription</li>
              </ul>
            </div>

            <h2 className="text-xl font-semibold mb-4">4. Non-Refundable Circumstances</h2>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                Refunds will not be granted for:
              </h3>
              <ul className="list-disc pl-6 text-red-700 dark:text-red-300">
                <li>Change of mind after using premium features</li>
                <li>Failure to use the service or features</li>
                <li>Account termination due to terms violation</li>
                <li>Requests made after 30 days from payment</li>
                <li>Partial month usage (subscriptions are monthly)</li>
              </ul>
            </div>

            <h2 className="text-xl font-semibold mb-4">5. Refund Process</h2>
            <p className="mb-4">
              To request a refund, please follow these steps:
            </p>
            <ol className="list-decimal pl-6 mb-6">
              <li className="mb-2">Contact our support team at <strong>support@calonik.ai</strong></li>
              <li className="mb-2">Provide your account email and payment details</li>
              <li className="mb-2">Explain the reason for your refund request</li>
              <li className="mb-2">Allow 3-5 business days for review</li>
              <li className="mb-2">Receive confirmation and processing timeline</li>
            </ol>

            <h2 className="text-xl font-semibold mb-4">6. Processing Time</h2>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg mb-6">
              <p className="text-blue-700 dark:text-blue-300">
                <strong>Review:</strong> 3-5 business days for initial review<br/>
                <strong>Processing:</strong> 5-10 business days after approval<br/>
                <strong>Refund:</strong> Returned to original payment method
              </p>
            </div>

            <h2 className="text-xl font-semibold mb-4">7. Partial Refunds</h2>
            <p className="mb-6">
              In some cases, we may offer partial refunds or account credits as an alternative 
              to full refunds. This will be determined on a case-by-case basis and communicated 
              during the review process.
            </p>

            <h2 className="text-xl font-semibold mb-4">8. Subscription Cancellation</h2>
            <p className="mb-6">
              You can cancel your subscription at any time to prevent future charges. Cancellation 
              does not automatically trigger a refund for the current billing period. Access to 
              premium features continues until the end of the paid period.
            </p>

            <h2 className="text-xl font-semibold mb-4">9. Payment Method Issues</h2>
            <p className="mb-6">
              If your payment method is declined or fails, your subscription may be suspended. 
              We do not provide refunds for failed payment attempts or associated bank fees.
            </p>

            <h2 className="text-xl font-semibold mb-4">10. Dispute Resolution</h2>
            <p className="mb-6">
              If you disagree with our refund decision, you may escalate your case by contacting 
              our management team. We are committed to resolving disputes fairly and promptly.
            </p>

            <h2 className="text-xl font-semibold mb-4">11. Third-Party Payments</h2>
            <p className="mb-6">
              Payments processed through third-party services (App Store, Google Play, etc.) 
              are subject to their respective refund policies. Please contact the relevant 
              platform for assistance with those transactions.
            </p>

            <h2 className="text-xl font-semibold mb-4">12. Policy Updates</h2>
            <p className="mb-6">
              This refund policy may be updated periodically. Changes will be communicated 
              via email and platform notifications. Continued use of our service constitutes 
              acceptance of the updated policy.
            </p>

            <h2 className="text-xl font-semibold mb-4">13. Contact Information</h2>
            <p className="mb-4">
              For refund requests or questions about this policy, please contact us:
            </p>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <p className="font-medium">Email: support@calonik.ai</p>
              <p className="font-medium">Subject: Refund Request - [Your Email]</p>
              <p className="font-medium">Response Time: 24-48 hours</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}