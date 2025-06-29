import { useEffect, useState } from "react";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

export default function PaymentSuccess() {
  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  const isPremium = user?.subscriptionStatus === 'premium';
  const isBasic = user?.subscriptionStatus === 'basic';

  useEffect(() => {
    // Auto-redirect to tracker after 3 seconds
    const timer = setTimeout(() => {
      window.location.href = "/?tab=tracker";
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const planTitle = isPremium ? "Premium" : isBasic ? "Basic" : "Premium";
  const planDescription = isPremium 
    ? "Welcome to Calonik.ai Premium! Your subscription has been activated."
    : isBasic 
    ? "Welcome to Calonik.ai Basic! Your subscription has been activated."
    : "Welcome to Calonik.ai Premium! Your subscription has been activated.";

  const features = isPremium 
    ? [
        "• 5 AI photo analyses per day",
        "• 20 meal searches per day", 
        "• Exercise tracking with enhanced features",
        "• Advanced nutrition insights",
        "• Priority support"
      ]
    : isBasic 
    ? [
        "• 2 AI photo analyses per day",
        "• 5 meal searches per day",
        "• Basic nutrition tracking", 
        "• Food calorie database access"
      ]
    : [
        "• 5 AI photo analyses per day",
        "• 20 meal searches per day",
        "• Advanced nutrition insights", 
        "• Priority support"
      ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="max-w-md mx-auto text-center p-8 bg-gray-800 rounded-lg shadow-lg">
        <div className="mb-6">
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Payment Successful!</h1>
          <p className="text-gray-300">
            {planDescription}
          </p>
        </div>
        
        <div className="space-y-4">
          <div className="bg-emerald-900/30 border border-emerald-500/30 rounded-lg p-4">
            <h3 className="font-semibold text-emerald-400 mb-2">{planTitle} Features Unlocked:</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              {features.map((feature, index) => (
                <li key={index}>{feature}</li>
              ))}
            </ul>
          </div>
          
          <Button 
            onClick={() => window.location.href = "/?tab=tracker"}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            Go to Tracker
          </Button>
          
          <p className="text-sm text-gray-400">
            Redirecting automatically in 3 seconds...
          </p>
        </div>
      </div>
    </div>
  );
}