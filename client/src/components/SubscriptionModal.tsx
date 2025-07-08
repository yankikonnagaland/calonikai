import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { CheckCircle, CreditCard, Smartphone, Wallet, X, Gift, Crown, Activity, Timer, Flame, Camera, Search, TrendingUp, Utensils } from "lucide-react";

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
function RazorpayCheckout({ onSuccess, selectedPlan = 'premium', referralCode }: { onSuccess: () => void; selectedPlan?: 'basic' | 'premium'; referralCode?: string }) {
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

      console.log(`Creating ${selectedPlan} plan order`);
      
      // Create order data with optional referral code
      const orderData: any = {
        planType: selectedPlan, // Backend will fetch secure pricing from database
      };
      
      // Include referral code if provided and validated
      if (referralCode && referralCode.length === 5) {
        orderData.referralCode = referralCode;
        console.log("Including referral code in order:", referralCode);
      }

      const rawResponse = await apiRequest(
        "POST",
        "/api/create-razorpay-order",
        orderData,
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
      const planDescription = selectedPlan === 'basic' 
        ? "Basic Plan - ₹99/month" 
        : "Premium Plan - ₹399/month";
      
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderResponse.amount,
        currency: "INR",
        name: "Calonik.ai",
        description: planDescription,
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
          plan: selectedPlan,
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
          confirm_close: true, // Show confirmation before closing
          escape: true,
          backdrop_close: true, // Allow backdrop closing for better UX
          focus_input: true, // Ensure input focus
        },
        retry: {
          enabled: true,
          max_count: 3,
        },
        timeout: 180, // 3 minutes timeout (reduced for better UX)
      };

      // Log complete Razorpay options including any generated URLs
      console.log("=== RAZORPAY PAYMENT OPTIONS ===");
      console.log("Full Razorpay options:", JSON.stringify(options, null, 2));
      console.log("Razorpay Key ID:", options.key);
      console.log("Order ID:", options.order_id);
      console.log("Amount:", options.amount);
      console.log("Selected Plan:", selectedPlan);
      console.log("Plan Description:", planDescription);
      
      // Create and open Razorpay instance with aggressive performance optimization
      try {
        // Create instance immediately
        razorpayInstanceRef.current = new (window as any).Razorpay(options);
        
        console.log("Razorpay instance created successfully");
        console.log("Opening Razorpay payment modal...");
        
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

  const handleClosePayment = () => {
    if (razorpayInstanceRef.current) {
      try {
        razorpayInstanceRef.current.close();
      } catch (e) {
        console.log("Razorpay instance already closed");
      }
    }
    setIsProcessing(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          onClick={handleRazorpayPayment}
          disabled={!isScriptLoaded || isProcessing}
          className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
        >
          {isProcessing ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Processing...
            </div>
          ) : (
            <>
              <Crown className="w-4 h-4 mr-2" />
              Upgrade to {selectedPlan === 'basic' ? 'Basic' : 'Premium'} - ₹{selectedPlan === 'basic' ? '99' : '399'}/month
            </>
          )}
        </Button>
        
        {isProcessing && (
          <Button
            onClick={handleClosePayment}
            variant="outline"
            className="h-12 px-4 border-red-200 hover:bg-red-50 hover:border-red-300"
          >
            <X className="w-5 h-5 text-red-500" />
          </Button>
        )}
      </div>
      
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
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'premium'>('premium');
  const [referralCode, setReferralCode] = useState('');
  const [referralValidated, setReferralValidated] = useState<boolean | null>(null);

  const handlePaymentSuccess = () => {
    setIsLoading(true);
    // Refresh the page to update subscription status
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const validateReferralCode = async (code: string) => {
    if (!code || code.length !== 5) {
      setReferralValidated(false);
      return;
    }
    
    try {
      const response = await apiRequest("GET", `/api/influencers/${code}`);
      if (response.ok) {
        const data = await response.json();
        if (data.isActive !== false) {
          setReferralValidated(true);
        } else {
          setReferralValidated(false);
        }
      } else {
        setReferralValidated(false);
      }
    } catch (error) {
      setReferralValidated(false);
    }
  };

  const handleReferralCodeChange = (value: string) => {
    const upperValue = value.toUpperCase();
    setReferralCode(upperValue);
    
    if (upperValue.length === 5) {
      validateReferralCode(upperValue);
    } else {
      setReferralValidated(null);
    }
  };

  const basicFeatures = [
    {
      icon: <Camera className="w-4 h-4 text-orange-500" />,
      text: "2 AI photo scans per day",
    },
    {
      icon: <Search className="w-4 h-4 text-orange-500" />,
      text: "5 food searches per day",
    },
    {
      icon: <Utensils className="w-4 h-4 text-orange-500" />,
      text: "Basic meal tracking",
    },
  ];

  const premiumFeatures = [
    {
      icon: <Activity className="w-4 h-4 text-orange-500" />,
      text: "AI-powered exercise analysis",
    },
    {
      icon: <Timer className="w-4 h-4 text-orange-500" />,
      text: "Advanced exercise timer",
    },
    {
      icon: <Flame className="w-4 h-4 text-orange-500" />,
      text: "Calorie burn tracking",
    },
    {
      icon: <TrendingUp className="w-4 h-4 text-orange-500" />,
      text: "Progress analytics",
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
      <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Crown className="w-6 h-6 text-orange-500" />
            Premium Subscription Required
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Upgrade to unlock all advanced features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Plan Selection */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={() => setSelectedPlan('basic')}
              className={`p-4 rounded-lg border text-left transition-all ${
                selectedPlan === 'basic'
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20'
                  : 'border-gray-200 hover:border-orange-300'
              }`}
            >
              <div className="font-semibold text-orange-600">Basic Plan</div>
              <div className="text-lg font-bold text-orange-500">₹99/month</div>
              <div className="text-sm text-gray-600 space-y-1">
                <div>❌ Limited photo search</div>
                <div>❌ Exercise tracking</div>
                <div>❌ Daily Protein tracking</div>
                <div>❌ Daily Calorie progress</div>
                <div>❌ Data visualisation</div>
              </div>

            </button>
            <button
              onClick={() => setSelectedPlan('premium')}
              className={`p-4 rounded-lg border text-left transition-all ${
                selectedPlan === 'premium'
                  ? 'border-red-500 bg-red-50 dark:bg-red-950/20'
                  : 'border-gray-200 hover:border-red-300'
              }`}
            >
              <div className="font-semibold text-red-600">Premium Plan</div>
              <div className="text-lg font-bold text-red-500">₹399/month</div>
              <div className="text-sm text-gray-600">Unlock all features including exercise tracker</div>
            </button>
          </div>

          <div className="space-y-2">
            {(selectedPlan === 'basic' ? basicFeatures : premiumFeatures).map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                {feature.icon}
                <span className="text-sm">{feature.text}</span>
              </div>
            ))}
          </div>

          {/* Referral Code Input */}
          <div className="space-y-2">
            <Label htmlFor="referralCode" className="text-sm font-medium flex items-center gap-2">
              <Gift className="w-4 h-4 text-purple-500" />
              Referral Code (Optional)
            </Label>
            <div className="relative">
              <Input
                id="referralCode"
                type="text"
                placeholder="Enter 5-letter code"
                value={referralCode}
                onChange={(e) => handleReferralCodeChange(e.target.value)}
                maxLength={5}
                className="flex h-10 w-full rounded-md border px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm uppercase border-green-500 dark:bg-green-950/20 bg-[#326632]"
              />
              {referralValidated === true && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
              )}
              {referralValidated === false && referralCode.length === 5 && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-4 h-4 text-red-500" />
                </div>
              )}
            </div>
            {referralValidated === true && (
              <p className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Valid referral code! You'll help support an influencer.
              </p>
            )}
            {referralValidated === false && referralCode.length === 5 && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <X className="w-3 h-3" />
                Invalid referral code. Please check and try again.
              </p>
            )}
          </div>

          <div className="space-y-4">
            <RazorpayCheckout onSuccess={handlePaymentSuccess} selectedPlan={selectedPlan} referralCode={referralCode} />
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
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">👑</span>
            SUBSCRIBE TO CALONIK
          </DialogTitle>
          <DialogDescription>Kickstart your fitness journey</DialogDescription>
        </DialogHeader>

        <SubscriptionContent onClose={onClose} usageData={usageData} />
      </DialogContent>
    </Dialog>
  );
}
