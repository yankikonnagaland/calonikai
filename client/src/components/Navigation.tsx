import { Utensils, User, Activity, Calendar, LogOut, Crown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import calonikLogo from "@/assets/calonik-logo.png";
import type { User as UserType } from "@shared/schema";

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: "tracker" | "profile" | "exercise" | "dashboard") => void;
}

export default function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const { logout, user } = useAuth();

  return (
    <>
      {/* Desktop Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <img 
                src={calonikLogo} 
                alt="Calonik Logo"
                className="w-8 h-8 object-contain"
              />
              <div className="flex items-center gap-3">
                <div>
                  <h1 className="text-xl font-semibold">Calonik.ai</h1>
                  {localStorage.getItem('admin_mode') === 'true' && (
                    <span className="text-xs text-emerald-600 font-medium">Admin Mode - Unlimited Access</span>
                  )}
                </div>
                {user && (
                  <div className="flex items-center">
                    <span className="text-sm text-muted-foreground">
                      Welcome, {(user as any)?.email?.split('@')[0] || 'User'}
                      {(user as any)?.subscriptionStatus === 'premium' && (
                        <Crown className="w-3 h-3 text-yellow-500 inline ml-0.5" />
                      )}
                      {(user as any)?.subscriptionStatus === 'basic' && (
                        <span className="inline ml-1">🔰</span>
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <nav className="hidden sm:flex space-x-1">
                <button
                  onClick={() => onTabChange("tracker")}
                  className={`nav-btn px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === "tracker" ? "active" : "hover:bg-muted"
                  }`}
                >
                  <Utensils className="w-4 h-4 mr-2 inline" />
                  Tracker
                </button>
                <button
                  onClick={() => onTabChange("profile")}
                  className={`nav-btn px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === "profile" ? "active" : "hover:bg-muted"
                  }`}
                >
                  <User className="w-4 h-4 mr-2 inline" />
                  Profile
                </button>
                <button
                  onClick={() => onTabChange("exercise")}
                  className={`nav-btn px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === "exercise" ? "active" : "hover:bg-muted"
                  }`}
                >
                  <Activity className="w-4 h-4 mr-2 inline" />
                  Exercise
                </button>
                <button
                  onClick={() => onTabChange("dashboard")}
                  className={`nav-btn px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === "dashboard" ? "active" : "hover:bg-muted"
                  }`}
                >
                  <Calendar className="w-4 h-4 mr-2 inline" />
                  Dashboard
                </button>
              </nav>
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <nav className="sm:hidden bg-card border-t border-border fixed bottom-0 left-0 right-0 z-40">
        <div className="flex justify-around py-2">
          <button
            onClick={() => onTabChange("tracker")}
            className={`mobile-nav-btn flex flex-col items-center py-2 px-4 text-xs ${
              activeTab === "tracker" ? "active" : "text-muted-foreground"
            }`}
          >
            <Utensils className="w-5 h-5 mb-1" />
            <span>Tracker</span>
          </button>
          <button
            onClick={() => onTabChange("profile")}
            className={`mobile-nav-btn flex flex-col items-center py-2 px-4 text-xs ${
              activeTab === "profile" ? "active" : "text-muted-foreground"
            }`}
          >
            <User className="w-5 h-5 mb-1" />
            <span>Profile</span>
          </button>
          <button
            onClick={() => onTabChange("exercise")}
            className={`mobile-nav-btn flex flex-col items-center py-2 px-4 text-xs ${
              activeTab === "exercise" ? "active" : "text-muted-foreground"
            }`}
          >
            <Activity className="w-5 h-5 mb-1" />
            <span>Exercise</span>
          </button>
          <button
            onClick={() => onTabChange("dashboard")}
            className={`mobile-nav-btn flex flex-col items-center py-2 px-4 text-xs ${
              activeTab === "dashboard" ? "active" : "text-muted-foreground"
            }`}
          >
            <Calendar className="w-5 h-5 mb-1" />
            <span>Dashboard</span>
          </button>
        </div>
      </nav>
    </>
  );
}