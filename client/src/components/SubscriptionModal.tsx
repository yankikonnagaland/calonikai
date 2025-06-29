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

// Razorpay payment component with aggressive performance optimization
function RazorpayCheckout({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isModalReady, setIsModalReady] = useState(false);
  const razorpayInstanceRef = useRef<any>(null);
  const preloadTimeoutRef = useRef<NodeJS.Timeout>();

  // Pre-load Razorpay script only when modal opens
  useEffect(() => {
    let loadingTimeout: NodeJS.Timeout;
    
    const loadRazorpayScript = () => {
      // Check if script is already loaded
      if ((window as any).Razorpay) {
        setIsScriptLoaded(true);
        return;
      }

      // Set a loading timeout to prevent infinite waiting
      loadingTimeout = setTimeout(() => {
        if (!isScriptLoaded) {
          toast({
            title: "Payment Service Slow",
            description: "Payment service is taking longer than expected. Please try again.",
            variant: "destructive",
          });
        }
      }, 8000);

      // Check for existing script first
      let script = document.querySelector('script[src*="checkout.razorpay.com"]') as HTMLScriptElement;
      
      if (script) {
        // Script exists, check if Razorpay is available
        if ((window as any).Razorpay) {
          setIsScriptLoaded(true);
          clearTimeout(loadingTimeout);
          return;
        }
        // Script exists but not loaded, wait for it
        script.onload = () => {
          setIsScriptLoaded(true);
          clearTimeout(loadingTimeout);
        };
        return;
      }

      // Create new script with optimizations
      script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.defer = true; // Defer loading to reduce blocking
      
      script.onload = () => {
        setIsScriptLoaded(true);
        clearTimeout(loadingTimeout);
      };
      
      script.onerror = () => {
        clearTimeout(loadingTimeout);
        toast({
          title: "Payment Service Error",
          description: "Failed to load payment service. Please refresh and try again.",
          variant: "destructive",
        });
      };
      
      // Use requestIdleCallback for non-blocking insertion with performance optimization
      const insertScript = () => {
        document.head.appendChild(script);
        
        // Preload Razorpay resources after script loads
        if ('requestIdleCallback' in window) {
          requestIdleCallback(() => {
            preloadRazorpayResources();
          });
        }
      };

      if ('requestIdleCallback' in window) {
        requestIdleCallback(insertScript, { timeout: 2000 });
      } else {
        setTimeout(insertScript, 150);
      }
    };

    loadRazorpayScript();

    // Preload Razorpay resources to reduce modal load time
    const preloadRazorpayResources = () => {
      try {
        // Preload common Razorpay resources
        const preloadUrls = [
          'https://cdn.razorpay.com/static/assets/css/checkout.css',
          'https://cdn.razorpay.com/static/assets/js/checkout.js'
        ];
        
        preloadUrls.forEach(url => {
          const link = document.createElement('link');
          link.rel = 'preload';
          link.href = url;
          link.as = url.includes('.css') ? 'style' : 'script';
          link.crossOrigin = 'anonymous';
          document.head.appendChild(link);
        });
        
        setIsModalReady(true);
      } catch (e) {
        // Ignore preload errors
        setIsModalReady(true);
      }
    };

    return () => {
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
      if (preloadTimeoutRef.current) {
        clearTimeout(preloadTimeoutRef.current);
      }
      // Cleanup razorpay instance
      if (razorpayInstanceRef.current) {
        try {
          razorpayInstanceRef.current.close();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, [toast]);

  const handleRazorpayPayment = async () => {
    if (!isScriptLoaded) {
      toast({
        title: "Payment Service Loading",
        description: "Please wait for payment service to load and try again.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    // Add a small delay to prevent UI blocking during order creation
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      // Create Razorpay order with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const rawResponse = await apiRequest(
        "POST",
        "/api/create-razorpay-order",
        {
          amount: 39900, // ₹399 in paise
          currency: "INR",
          planType: "monthly",
        },
      );

      clearTimeout(timeoutId);

      if (!rawResponse.ok) {
        throw new Error(`Order creation failed: ${rawResponse.status}`);
      }

      const orderResponse = await rawResponse.json();
      const orderId = orderResponse.orderId;

      if (!orderId) {
        throw new Error("Invalid order response");
      }

      console.log("Razorpay order created:", orderResponse);

      // Configure Razorpay options with better error handling
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: 39900,
        currency: "INR",
        name: "Calonik.ai",
        description: "Premium Subscription - ₹399/month",
        order_id: orderId,
        handler: async function (response: any) {
          setIsProcessing(true);
          try {
            console.log("Payment response from Razorpay:", response);

            // Verify payment on backend with timeout
            const verifyController = new AbortController();
            const verifyTimeoutId = setTimeout(() => verifyController.abort(), 15000);

            await apiRequest("POST", "/api/verify-razorpay-payment", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            clearTimeout(verifyTimeoutId);

            toast({
              title: "Payment Successful",
              description: "Welcome to Premium! Redirecting...",
            });

            // Close modal and redirect
            onSuccess();

            setTimeout(() => {
              window.location.href = window.location.origin + "/payment-success";
            }, 1500);
          } catch (error) {
            console.error("Payment verification error:", error);
            toast({
              title: "Payment Verification Failed",
              description: "Please contact support if amount was deducted.",
              variant: "destructive",
            });
            setIsProcessing(false);
          }
        },
        prefill: {
          name: "Calonik User",
          email: "user@calonik.ai",
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
            console.log("Razorpay modal dismissed");
            setIsProcessing(false);
          },
          animation: false, // Disable animations to reduce performance overhead
          confirm_close: false,
          escape: true,
          backdrop_close: false, // Prevent accidental backdrop closing
          focus_input: true, // Ensure input focus
        },
        retry: {
          enabled: true,
          max_count: 3,
        },
        timeout: 180, // 3 minutes timeout (reduced for better UX)
      };

      // Create and open Razorpay instance with aggressive performance optimization
      try {
        // Create instance immediately
        razorpayInstanceRef.current = new (window as any).Razorpay(options);
        
        // Open immediately and ensure focus
        razorpayInstanceRef.current.open();
        
        // Force focus and interaction after modal opens
        setTimeout(() => {
          // Try to focus the modal iframe
          const razorpayModal = document.querySelector('[data-checkout]') || 
                               document.querySelector('iframe[src*="razorpay"]') ||
                               document.querySelector('.razorpay-checkout-frame');
          
          if (razorpayModal) {
            // Simulate a click to activate the modal properly
            const clickEvent = new MouseEvent('click', {
              view: window,
              bubbles: true,
              cancelable: true
            });
            razorpayModal.dispatchEvent(clickEvent);
            
            // Try to focus the modal
            if (razorpayModal instanceof HTMLElement) {
              razorpayModal.focus();
            }
          }
          
          // Alternative: simulate background click to activate modal
          const backdrop = document.querySelector('.razorpay-backdrop') ||
                          document.querySelector('[data-checkout-backdrop]');
          if (backdrop && backdrop instanceof HTMLElement) {
            backdrop.click();
          }
        }, 200);
        
      } catch (rzpError) {
        console.error("Razorpay initialization error:", rzpError);
        throw new Error("Failed to initialize payment gateway");
      }

    } catch (error) {
      console.error("Payment initiation error:", error);
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "Unable to initiate payment. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <div className="text-center space-y-2">
          <h3 className="font-semibold text-lg text-[#083b6e]">₹399/month</h3>
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
        disabled={isProcessing || !isScriptLoaded}
        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-all duration-200 razorpay-payment-button"
      >
        {!isScriptLoaded ? "Loading Payment Service..." : 
         isProcessing ? "Opening Payment Gateway..." : 
         "Subscribe - ₹399/month"}
      </Button>
      {!isScriptLoaded && (
        <div className="text-center text-xs text-gray-500 flex items-center justify-center gap-2">
          <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
          Loading secure payment gateway...
        </div>
      )}
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
