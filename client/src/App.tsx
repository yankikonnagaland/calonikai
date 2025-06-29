import React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Home from "@/pages/home";
import Landing from "@/pages/landing";
import AdminLogin from "@/pages/admin-login";
import OAuthRedirect from "@/pages/oauth-redirect";
import OAuthCallback from "@/pages/oauth-callback";
import PaymentSuccess from "@/pages/payment-success";
import HourlyActivitiesPage from "@/pages/hourly-activities";
import InfluencerDashboard from "@/pages/InfluencerDashboard";
import NotFound from "@/pages/not-found";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsConditions from "@/pages/TermsConditions";
import RefundPolicy from "@/pages/RefundPolicy";
import Footer from "@/components/Footer";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // Handle OAuth popup messages
  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
        console.log('Google authentication successful via popup');
        // Refresh the page to update auth state
        window.location.reload();
      } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
        console.error('Google authentication failed:', event.data.error);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/admin" component={AdminLogin} />
      <Route path="/oauth/google" component={OAuthRedirect} />
      <Route path="/oauth-callback" component={OAuthCallback} />
      <Route path="/payment-success" component={PaymentSuccess} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms-conditions" component={TermsConditions} />
      <Route path="/refund-policy" component={RefundPolicy} />
      <Route path="/hourly-activities" component={HourlyActivitiesPage} />
      <Route path="/admin/influencers" component={InfluencerDashboard} />
      <Route path="/influencer-dashboard" component={InfluencerDashboard} />
      {!isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Home} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="dark min-h-screen bg-background text-foreground flex flex-col">
          <div className="flex-1">
            <Router />
          </div>
          <Footer />
          <Toaster />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
