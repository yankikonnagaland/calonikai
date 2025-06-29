import { Apple, Camera, BarChart3, Crown, Check, Zap, LogIn, AlertTriangle, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import AuthModal from "@/components/AuthModal";
import { useQueryClient } from "@tanstack/react-query";

export default function Landing() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const queryClient = useQueryClient();

  const handleLogin = () => {
    setShowAuthModal(true);
  };

  const handleAuthSuccess = () => {
    // Refresh the auth state
    queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
  };





  const features = [
    {
      icon: <Camera className="w-6 h-6" />,
      title: "AI Camera Recognition",
      description: "Snap a photo of your food and get instant nutritional analysis with AI-powered recognition."
    },
    {
      icon: <Apple className="w-6 h-6" />,
      title: "All Food Database",
      description: "Comprehensive database covering cuisines from around the world with accurate nutritional data."
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Smart Analytics",
      description: "Track calories in vs out, monitor your progress, and get personalized recommendations."
    }
  ];

  const freeFeatures = [
    "Basic food tracking",
    "Manual food entry",
    "Daily calorie counting",
    "Basic exercise logging"
  ];

  const basicFeatures = [
    "2 AI photo scans per day",
    "5 food searches per day", 
    "Basic nutrition tracking",
    "Daily progress reports",
    "Email support"
  ];

  const premiumFeatures = [
    "Unlimited AI photo scans",
    "Unlimited food searches",
    "Advanced exercise tracking",
    "Daily & monthly analytics",
    "Priority support",
    "Export data features"
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Domain copied successfully",
    });
  };

  return (
    <>
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">


      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-blue-600/20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500">
                Calonik.ai
              </span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Track calories, manage weight, and achieve fitness goals with AI-powered food recognition. 
              Personalized nutrition insights for healthier living with comprehensive exercise tracking.
            </p>
            
            <div className="flex flex-col gap-4 justify-center max-w-md mx-auto">
              <Button 
                onClick={handleLogin}
                size="lg" 
                className="bg-white hover:bg-gray-100 text-gray-900 px-8 py-3 text-lg flex items-center gap-2 border w-full"
                disabled={isLoading}
              >
                <LogIn className="w-5 h-5" />
                Get Started
              </Button>
            </div>
            
            <p className="text-sm text-gray-400 mt-4">
              Create your account or sign in to continue
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
      <div className="py-20 bg-gray-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">
              Choose Your Plan
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Start with our free plan or upgrade to premium for advanced features
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free Plan */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-xl">Free Plan</CardTitle>
                <div className="text-2xl font-bold text-white">
                  ₹0 <span className="text-sm font-normal text-gray-400">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {freeFeatures.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  onClick={handleLogin}
                  variant="outline" 
                  className="w-full border-emerald-600 text-emerald-400 hover:bg-emerald-600/10 flex items-center justify-center gap-2"
                  disabled={isLoading}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Start Free
                </Button>
              </CardContent>
            </Card>

            {/* Basic Plan */}
            <Card className="bg-gray-800/50 border-blue-600 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-blue-600 text-white px-3 py-1">
                  🔰 Basic
                </Badge>
              </div>
              <CardHeader>
                <CardTitle className="text-white text-xl">Basic Plan</CardTitle>
                <div className="text-2xl font-bold text-white">
                  ₹99 <span className="text-sm font-normal text-gray-400">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {basicFeatures.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-blue-400" />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  onClick={handleLogin}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
                  disabled={isLoading}
                >
                  🔰 Get Basic Plan
                </Button>
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
                <div className="text-2xl font-bold text-white">
                  ₹399 <span className="text-sm font-normal text-gray-400">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {premiumFeatures.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  onClick={handleLogin}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2"
                  disabled={isLoading}
                >
                  <Crown className="w-4 h-4" />
                  Get Premium Access
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="py-20 bg-gradient-to-r from-emerald-900/30 to-blue-900/30">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Your Nutrition Journey?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of users who are already tracking their calories and achieving their health goals.
          </p>
          <Button 
            onClick={handleLogin}
            size="lg"
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 text-lg flex items-center gap-2 mx-auto"
            disabled={isLoading}
          >
            <Zap className="w-5 h-5" />
            Get Started Now
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">
            © 2025 Calonik by Pikonik and Kikonic Tech. All rights reserved.
          </p>
        </div>
      </footer>
      </div>
    </>
  );
}