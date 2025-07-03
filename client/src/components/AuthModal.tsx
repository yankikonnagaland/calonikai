import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Mail, Lock, User, RefreshCw } from "lucide-react";
import { FaGoogle } from "react-icons/fa";
import { apiRequest } from "@/lib/queryClient";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  
  // Human verification CAPTCHA
  const [captcha, setCaptcha] = useState({ num1: 0, num2: 0, answer: 0 });
  const [userAnswer, setUserAnswer] = useState("");
  
  const { toast } = useToast();

  // Generate new CAPTCHA when switching to registration mode
  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    setCaptcha({ num1, num2, answer: num1 + num2 });
    setUserAnswer("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!isLogin) {
        if (formData.password !== formData.confirmPassword) {
          toast({
            title: "Error",
            description: "Passwords don't match",
            variant: "destructive",
          });
          return;
        }
        
        // Verify CAPTCHA for registration
        if (parseInt(userAnswer) !== captcha.answer) {
          toast({
            title: "Verification Failed",
            description: "Please solve the math problem correctly to prove you're human",
            variant: "destructive",
          });
          generateCaptcha(); // Generate new CAPTCHA on failed attempt
          return;
        }
      }

      const endpoint = isLogin ? "/api/login" : "/api/register";
      const data = isLogin 
        ? { email: formData.email, password: formData.password }
        : { email: formData.email, password: formData.password, confirmPassword: formData.confirmPassword };

      const response = await apiRequest("POST", endpoint, data);
      const result = await response.json();

      toast({
        title: "Success",
        description: result.message,
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      const errorMessage = error.message.includes("400:") 
        ? "Please check your input and try again"
        : error.message.includes("401:")
        ? "Invalid email or password"
        : error.message.includes("User already exists")
        ? "An account with this email already exists"
        : "Something went wrong. Please try again.";

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      confirmPassword: "",
    });
    setUserAnswer("");
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    resetForm();
    if (!isLogin) {
      // Generate CAPTCHA when switching to registration
      generateCaptcha();
    }
  };

  // Generate initial CAPTCHA when switching to registration mode
  useEffect(() => {
    if (!isLogin) {
      generateCaptcha();
    }
  }, [isLogin]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-gray-800 border-gray-700">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-white">
            {isLogin ? "Welcome Back" : "Create Account"}
          </CardTitle>
          <p className="text-gray-400">
            {isLogin ? "Sign in to your account" : "Start your fitness journey today"}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-10 pr-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-gray-300">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                {/* Human Verification CAPTCHA */}
                <div className="space-y-2">
                  <Label className="text-gray-300">Human Verification</Label>
                  <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-gray-300 text-sm">Prove you're human:</span>
                      <Button
                        type="button"
                        onClick={generateCaptcha}
                        variant="outline"
                        size="sm"
                        className="text-xs border-gray-600 text-gray-300 hover:bg-gray-600"
                      >
                        New Question
                      </Button>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="bg-gray-800 px-4 py-2 rounded border border-gray-600 font-mono text-white text-lg">
                        {captcha.num1} + {captcha.num2} = ?
                      </div>
                      <Input
                        type="number"
                        placeholder="Answer"
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        className="w-24 bg-gray-600 border-gray-500 text-white text-center"
                        required
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : isLogin ? "Sign In" : "Sign Up"}
              </Button>
            </div>
          </form>

          {/* Google Sign-In Option */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-600" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-gray-800 px-2 text-gray-400">Or continue with</span>
              </div>
            </div>
            
            <div className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const popup = window.open(
                    '/api/auth/google',
                    'google-oauth',
                    'width=500,height=600,scrollbars=yes,resizable=yes'
                  );
                  
                  // Listen for messages from popup
                  const handleMessage = async (event: MessageEvent) => {
                    if (event.origin !== window.location.origin) return;
                    
                    if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
                      const { token, email } = event.data;
                      
                      // Multiple strategies to establish session in main window
                      if (token) {
                        // Strategy 1: Validate the auth token from popup
                        try {
                          const response = await fetch('/api/auth/validate-token', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            credentials: 'include',
                            body: JSON.stringify({ token })
                          });
                          
                          if (response.ok) {
                            console.log('Token validation successful');
                            window.location.reload();
                            return;
                          }
                        } catch (error) {
                          console.log('Token validation failed, trying alternative methods');
                        }
                      }
                      
                      // Strategy 2: Try session establishment by email
                      if (email) {
                        try {
                          const response = await fetch('/api/auth/establish-session', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            credentials: 'include',
                            body: JSON.stringify({ email })
                          });
                          
                          if (response.ok) {
                            console.log('Session establishment successful');
                            window.location.reload();
                            return;
                          }
                        } catch (error) {
                          console.log('Session establishment failed, trying refresh');
                        }
                      }
                      
                      // Strategy 3: Try multiple session refresh attempts
                      let attempts = 0;
                      const maxAttempts = 5;
                      
                      const tryRefresh = async () => {
                        attempts++;
                        try {
                          const response = await fetch('/api/auth/refresh', {
                            credentials: 'include'
                          });
                          
                          if (response.ok) {
                            console.log(`Session refresh successful on attempt ${attempts}`);
                            window.location.reload();
                            return;
                          }
                        } catch (error) {
                          console.log(`Session refresh failed on attempt ${attempts}`);
                        }
                        
                        if (attempts < maxAttempts) {
                          setTimeout(tryRefresh, 500 * attempts); // Increasing delay
                        } else {
                          console.log('All attempts failed, reloading anyway');
                          window.location.reload();
                        }
                      };
                      
                      // Start refresh attempts after a brief delay
                      setTimeout(tryRefresh, 200);
                      
                    } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
                      console.error('Google auth error:', event.data.error);
                      // Show error message to user
                    }
                  };
                  
                  window.addEventListener('message', handleMessage);
                  
                  // Fallback: check if popup is closed manually
                  const checkClosed = setInterval(() => {
                    if (popup?.closed) {
                      clearInterval(checkClosed);
                      window.removeEventListener('message', handleMessage);
                      
                      // Give a bit more time then try to refresh
                      setTimeout(async () => {
                        try {
                          const response = await fetch('/api/auth/refresh', {
                            credentials: 'include'
                          });
                          
                          if (response.ok) {
                            window.location.reload();
                          }
                        } catch (error) {
                          // Silent fail for fallback
                        }
                      }, 1000);
                    }
                  }, 1000);
                  
                  // Auto-close after 5 minutes
                  setTimeout(() => {
                    if (!popup?.closed) {
                      popup?.close();
                      clearInterval(checkClosed);
                      window.removeEventListener('message', handleMessage);
                    }
                  }, 300000);
                }}
                className="w-full border-gray-600 text-gray-300 hover:bg-gray-700 flex items-center justify-center gap-2"
                disabled={isLoading}
              >
                <FaGoogle className="w-4 h-4" />
                Continue with Google
              </Button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={switchMode}
              className="text-emerald-400 hover:text-emerald-300 text-sm"
              disabled={isLoading}
            >
              {isLogin 
                ? "Don't have an account? Sign up" 
                : "Already have an account? Sign in"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}