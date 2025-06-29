import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Shield, Key, Users, TrendingUp, Home } from "lucide-react";
import InfluencerDashboard from "./InfluencerDashboard";

export default function AdminLogin() {
  const [adminKey, setAdminKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<'login' | 'dashboard' | 'influencers'>('login');
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Check admin authentication status on component mount
  useEffect(() => {
    const checkAdminAuth = async () => {
      try {
        const response = await fetch('/api/auth/user', {
          credentials: 'include'
        });
        const data = await response.json();
        
        // Check if user is admin (session ID is admin_testing_user)
        if (data.id === 'admin_testing_user') {
          setIsAuthenticated(true);
          setCurrentView('dashboard');
        }
      } catch (error) {
        // Not authenticated, stay on login
      }
    };
    
    checkAdminAuth();
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Important for session cookies
        body: JSON.stringify({ adminKey })
      });
      
      const data = await response.json();

      if (data.success) {
        // Store admin mode flag in localStorage for UI purposes
        localStorage.setItem('admin_mode', 'true');
        
        toast({
          title: "Admin Access Granted",
          description: "You now have unlimited access for testing",
        });

        setIsAuthenticated(true);
        setCurrentView('dashboard');
      } else {
        throw new Error(data.error || 'Invalid admin key');
      }
    } catch (error: any) {
      toast({
        title: "Access Denied",
        description: error.message || "Invalid admin key",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_mode');
    setIsAuthenticated(false);
    setCurrentView('login');
    // Clear admin session
    fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  };

  // Render login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Admin Access</CardTitle>
            <p className="text-gray-600">
              Enter admin key for unlimited testing access
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="adminKey">Admin Key</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="adminKey"
                    type="password"
                    placeholder="Enter admin key"
                    value={adminKey}
                    onChange={(e) => setAdminKey(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoading || !adminKey}
              >
                {isLoading ? "Verifying..." : "Access Admin Mode"}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Admin mode provides unlimited AI scans and food searches for testing
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render admin dashboard if authenticated
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Admin Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Shield className="w-8 h-8 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Calonik Admin Dashboard
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant={currentView === 'dashboard' ? 'default' : 'ghost'}
                onClick={() => setCurrentView('dashboard')}
                className="flex items-center space-x-2"
              >
                <Home className="w-4 h-4" />
                <span>Dashboard</span>
              </Button>
              
              <Button
                variant={currentView === 'influencers' ? 'default' : 'ghost'}
                onClick={() => setCurrentView('influencers')}
                className="flex items-center space-x-2"
              >
                <Users className="w-4 h-4" />
                <span>Influencers</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={handleLogout}
                className="text-red-600 hover:text-red-700"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {currentView === 'dashboard' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>Admin Dashboard</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100">Admin Access</h3>
                    <p className="text-blue-700 dark:text-blue-300 text-sm mt-1">
                      Unlimited testing access granted
                    </p>
                  </div>
                  
                  <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-900 dark:text-green-100">Features</h3>
                    <p className="text-green-700 dark:text-green-300 text-sm mt-1">
                      All premium features enabled
                    </p>
                  </div>
                  
                  <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg">
                    <h3 className="font-semibold text-purple-900 dark:text-purple-100">Management</h3>
                    <p className="text-purple-700 dark:text-purple-300 text-sm mt-1">
                      Influencer tracking & analytics
                    </p>
                  </div>
                </div>
                
                <div className="mt-6 flex space-x-4">
                  <Button 
                    onClick={() => window.location.href = '/'}
                    className="flex items-center space-x-2"
                  >
                    <Home className="w-4 h-4" />
                    <span>Go to Main App</span>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => setCurrentView('influencers')}
                    className="flex items-center space-x-2"
                  >
                    <Users className="w-4 h-4" />
                    <span>Manage Influencers</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {currentView === 'influencers' && (
          <InfluencerDashboard />
        )}
      </div>
    </div>
  );
}