import { Apple, Camera, BarChart3, Crown, Check, Zap, LogIn, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function Landing() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleReplitLogin = async () => {
    setIsLoading(true);
    toast({
      title: "Redirecting to Replit",
      description: "Opening secure authentication",
    });
    
    try {
      // Redirect to Replit Auth login
      window.location.href = '/api/login';
    } catch (error: any) {
      console.error("Replit auth error:", error);
      toast({
        title: "Login Failed",
        description: "Please try again",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: <Apple className="w-6 h-6" />,
      title: "250,000+ Foods",
      description: "Comprehensive database of regional cuisines including international, local, and global specialties"
    },
    {
      icon: <Camera className="w-6 h-6" />,
      title: "AI Food Scanner",
      description: "Take photos to automatically detect calories and nutrients with AI vision technology"
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Smart Analytics",
      description: "Track daily progress with BMR/TDEE calculations and personalized nutrition insights"
    }
  ];

  const pricingFeatures = [
    "1 free meal tracking per day",
    "1 free photo analysis per day",
    "Access to 250+ Indian foods database",
    "Basic nutrition tracking"
  ];

  const premiumFeatures = [
    "Unlimited meal tracking",
    "Unlimited AI photo analysis",
    "Advanced nutrition insights",
    "Exercise tracking with calorie burn",
    "Daily summary analytics",
    "Healthy food alternatives",
    "Priority support"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-emerald-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-emerald-600/20 rounded-full border border-emerald-500/30">
                <Apple className="w-12 h-12 text-emerald-400" />
              </div>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              All Food Calorie Tracker
            </h1>
            
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Track your nutrition with AI-powered food recognition, comprehensive all food database, 
              and personalized insights for a healthier lifestyle.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={handleReplitLogin}
                size="lg" 
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 text-lg flex items-center gap-2"
                disabled={isLoading}
              >
                <LogIn className="w-5 h-5" />
                Sign in with Replit
              </Button>
            </div>
            
            <p className="text-sm text-gray-400 mt-4">
              Secure authentication through Replit • No additional registration required
            </p>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">
              Powerful Features for Optimizing Nutrition
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Everything you need to track calories and maintain a healthy diet with all kind of foods
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-emerald-600/20 rounded-lg text-emerald-400">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-white">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-gray-400">
              Start free, upgrade when you need more
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-xl">Free Plan</CardTitle>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-white">₹0</span>
                  <span className="text-gray-400 ml-2">/forever</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {pricingFeatures.map((feature, index) => (
                    <li key={index} className="flex items-center text-gray-300">
                      <Check className="w-4 h-4 text-emerald-400 mr-3 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                {/* Authentication */}
                <div className="space-y-3">
                  <Button 
                    onClick={handleReplitLogin}
                    variant="outline" 
                    className="w-full border-emerald-600 text-emerald-400 hover:bg-emerald-600/10 flex items-center justify-center gap-2"
                    disabled={isLoading}
                  >
                    <LogIn className="w-4 h-4" />
                    Sign in with Replit
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Premium Plan */}
            <Card className="bg-gradient-to-br from-emerald-900/30 to-emerald-800/30 border-emerald-600 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-emerald-600 text-white px-3 py-1">
                  <Crown className="w-3 h-3 mr-1" />
                  Most Popular
                </Badge>
              </div>
              <CardHeader>
                <CardTitle className="text-white text-xl">Premium Plan</CardTitle>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-white">₹999</span>
                  <span className="text-gray-300 ml-2">/year</span>
                </div>
                <p className="text-sm text-emerald-300">Just ₹83/month</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {premiumFeatures.map((feature, index) => (
                    <li key={index} className="flex items-center text-gray-200">
                      <Check className="w-4 h-4 text-emerald-400 mr-3 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                {/* Premium Authentication Options */}
                <div className="space-y-3">
                  <Button 
                    onClick={handleGoogleLogin}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2"
                    disabled={isLoading}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Start with Google
                  </Button>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-emerald-600/30" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-gray-900 px-2 text-emerald-300">or</span>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleQuickAccess}
                    variant="outline" 
                    className="w-full border-emerald-600 text-emerald-400 hover:bg-emerald-600/10 flex items-center justify-center gap-2"
                    disabled={isLoading}
                  >
                    <User className="w-4 h-4" />
                    Quick Start Premium
                  </Button>
                </div>
                <p className="text-xs text-center text-gray-400">
                  Razorpay • UPI, Cards, Net Banking, Wallets
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-emerald-900/30 to-blue-900/30">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Your Health Journey?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of users tracking their nutrition
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={handleGoogleLogin}
              size="lg" 
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 text-lg flex items-center gap-2"
              disabled={isLoading}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Start with Google
            </Button>
            
            <Button 
              onClick={handleQuickAccess}
              size="lg" 
              variant="outline"
              className="border-emerald-600 text-emerald-400 hover:bg-emerald-600/10 px-8 py-3 text-lg flex items-center gap-2"
              disabled={isLoading}
            >
              <Zap className="w-5 h-5" />
              Quick Start Free
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-8 bg-gray-900/80 border-t border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">
            © 2025 All Food Calorie Tracker by Kikonic Tech. Built with ❤️ for healthy living.
          </p>
        </div>
      </div>
    </div>
  );
}