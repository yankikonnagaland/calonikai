import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, CreditCard, Smartphone, Wallet } from "lucide-react";

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  usageData?: {
    freeCreditsUsed: number;
    freePhotosUsed: number;
    freeCreditsLimit: number;
    freePhotosLimit: number;
  };
}

// Razorpay payment component
function RazorpayCheckout({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRazorpayPayment = async () => {
    setIsProcessing(true);

    try {
      // Create Razorpay order
      const rawResponse = await apiRequest(
        "POST",
        "/api/create-razorpay-order",
        {
          amount: 39900, // ₹399 in paise
          currency: "INR",
          planType: "monthly",
        },
      );
      const orderResponse = await rawResponse.json();

      const orderId = (orderResponse as any).orderId;

      console.log("Razorpay order created:", orderResponse);

      // Configure Razorpay options
      const options = {
        key:
          import.meta.env.VITE_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID,
        amount: 39900,
        currency: "INR",
        name: "Calonik.ai",
        description: "Premium Subscription",
        order_id: orderId,
        handler: async function (response: any) {
          try {
            console.log("Payment response from Razorpay:", response);

            // Verify payment on backend
            await apiRequest("POST", "/api/verify-razorpay-payment", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            toast({
              title: "Payment Successful",
              description: "Welcome to Premium! Redirecting to tracker...",
            });

            // Close modal and redirect to tracker page
            onSuccess();

            // Add a small delay then redirect to payment success page
            setTimeout(() => {
              window.location.href =
                window.location.origin + "/payment-success";
            }, 1500);
          } catch (error) {
            toast({
              title: "Payment Verification Failed",
              description: "Please contact support if amount was deducted.",
              variant: "destructive",
            });
          }
        },
        prefill: {
          name: "Calonik User",
          email: "user@example.com",
        },
        notes: {
          plan: "monthly",
          app: "calonik.ai",
        },
        theme: {
          color: "#10b981",
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
          },
        },
      };

      // Load Razorpay script and open checkout
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => {
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      };
      document.body.appendChild(script);
    } catch (error) {
      toast({
        title: "Payment Failed",
        description: "Unable to initiate payment. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <div className="text-center space-y-2">
          <h3 className="font-semibold text-lg">₹399/month</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Premium meal tracking and AI photo analysis
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <CreditCard className="w-4 h-4" />
        <span>Cards, UPI, Net Banking, Wallets</span>
      </div>

      <Button
        onClick={handleRazorpayPayment}
        disabled={isProcessing}
        className="w-full bg-emerald-600 hover:bg-emerald-700"
      >
        {isProcessing ? "Processing..." : "Subscribe - ₹399/month"}
      </Button>
    </div>
  );
}

// Removed external Razorpay subscription button - now using integrated checkout

function SubscriptionContent({
  onClose,
  usageData,
}: Omit<SubscriptionModalProps, "isOpen">) {
  const [isLoading, setIsLoading] = useState(false);

  const handlePaymentSuccess = () => {
    setIsLoading(true);
    // Refresh the page to update subscription status
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const features = [
    {
      icon: <Smartphone className="w-5 h-5" />,
      text: "5 AI photo analysis per day",
    },
    {
      icon: <CreditCard className="w-5 h-5" />,
      text: "Exercise and meal analysis",
    },
    {
      icon: <Wallet className="w-5 h-5" />,
      text: "Advanced nutrition insights",
    },
    {
      icon: <CheckCircle className="w-5 h-5" />,
      text: "Track Daily & Monthly Progress",
    },
  ];

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p>Activating your premium subscription...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Usage Summary */}
      {usageData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Free Plan Limits Reached</CardTitle>
            <CardDescription>
              You've used your free quota. Upgrade to continue using all
              features.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>Meal additions:</span>
              <Badge variant="destructive">
                {usageData.freeCreditsUsed}/{usageData.freeCreditsLimit}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Photo analysis:</span>
              <Badge variant="destructive">
                {usageData.freePhotosUsed}/{usageData.freePhotosLimit}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Premium Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">🚀</span>
            Premium Plan
          </CardTitle>
          <CardDescription>
            Unlock premium access to all features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="text-emerald-500">{feature.icon}</div>
                <span>{feature.text}</span>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <RazorpayCheckout onSuccess={handlePaymentSuccess} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SubscriptionModal({
  isOpen,
  onClose,
  usageData,
}: SubscriptionModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">👑</span>
            Upgrade to Premium
          </DialogTitle>
          <DialogDescription>Get access to all features</DialogDescription>
        </DialogHeader>

        <SubscriptionContent onClose={onClose} usageData={usageData} />
      </DialogContent>
    </Dialog>
  );
}
