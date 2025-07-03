import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
// Simple Google icon component
const GoogleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { toast } = useToast();

  const handleGoogleLogin = () => {
    setIsGoogleLoading(true);
    setError("");
    
    // Use popup window since Google blocks iframe embedding
    console.log('Opening Google OAuth in popup window...');
    
    const popup = window.open(
      '/api/auth/google',
      'googleAuth',
      'width=500,height=600,scrollbars=yes,resizable=yes,status=yes,location=yes,toolbar=no,menubar=no'
    );
    
    if (!popup) {
      setError("Popup blocked. Please allow popups and try again.");
      setIsGoogleLoading(false);
      return;
    }
    
    // Focus the popup
    popup.focus();
    
    // Listen for messages from the popup
    const handleMessage = (event: MessageEvent) => {
      console.log('Received message from popup:', event.data, 'from origin:', event.origin);
      
      if (event.origin !== window.location.origin) {
        console.log('Message ignored - wrong origin');
        return;
      }
      
      if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
        console.log('OAuth success received, cleaning up...');
        
        // Clean up
        clearInterval(authCheckInterval);
        clearInterval(checkClosed);
        window.removeEventListener('message', handleMessage);
        
        // Close popup
        if (!popup.closed) {
          popup.close();
        }
        
        setIsGoogleLoading(false);
        setError("");
        
        // Invalidate auth query to refresh user state
        queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
        onSuccess();
      }
      
      if (event.data.type === 'GOOGLE_AUTH_ERROR') {
        console.log('OAuth error received:', event.data.error);
        
        // Clean up
        clearInterval(authCheckInterval);
        clearInterval(checkClosed);
        window.removeEventListener('message', handleMessage);
        
        setError("Authentication failed");
        setIsGoogleLoading(false);
        
        if (!popup.closed) {
          popup.close();
        }
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Fallback: Poll for authentication success every 2 seconds (in case message doesn't come through)
    const authCheckInterval = setInterval(async () => {
      try {
        // Check if popup is closed
        if (popup.closed) {
          clearInterval(authCheckInterval);
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
          setIsGoogleLoading(false);
          setError("Authentication window was closed");
          return;
        }
        
        const response = await fetch('/api/auth/user', {
          credentials: 'include'
        });
        
        if (response.ok) {
          console.log('Authentication detected via polling, cleaning up...');
          clearInterval(authCheckInterval);
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
          popup.close();
          setIsGoogleLoading(false);
          setError("");
          onSuccess();
        }
      } catch (error) {
        console.log('Auth check failed:', error);
      }
    }, 2000);
    
    // Check if popup is closed manually
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        clearInterval(authCheckInterval);
        window.removeEventListener('message', handleMessage);
        setIsGoogleLoading(false);
      }
    }, 1000);
    
    // Auto-stop polling after 5 minutes
    setTimeout(() => {
      clearInterval(authCheckInterval);
      clearInterval(checkClosed);
      window.removeEventListener('message', handleMessage);
      if (!popup.closed) {
        popup.close();
      }
      setIsGoogleLoading(false);
      setError("Authentication timeout - please try again");
    }, 300000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gray-900 border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-center text-gray-100">Welcome to Calonik.ai</DialogTitle>
        </DialogHeader>
        
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg text-center text-gray-100">Sign In</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="text-red-400 text-sm text-center bg-red-900/20 p-2 rounded">
                {error}
              </div>
            )}
            
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleLogin}
              className="w-full border-gray-600 text-gray-300 hover:bg-gray-700 flex items-center justify-center gap-2"
              disabled={isGoogleLoading}
            >
              {isGoogleLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-transparent" />
              ) : (
                <GoogleIcon className="h-4 w-4" />
              )}
              {isGoogleLoading ? 'Signing in...' : 'Continue with Google'}
            </Button>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}