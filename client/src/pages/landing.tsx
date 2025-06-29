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

  const basicFeatures = [
    "2 AI photo scans per day",
    "5 food searches per day", 
    "Basic nutrition tracking",
    "Daily progress reports",
    "Email support"
  ];

  const premiumFeatures = [
    "5+ AI photo scans",
    "20+ food searches",
    "Enhanced exercise tracking",
    "Daily & monthly analytics",
    "Goal and progress tracking"
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
              Choose the perfect plan for your nutrition tracking needs
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
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