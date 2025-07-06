import { useEffect, useState } from "react";
import { AlertCircle, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DailyLimitNotificationProps {
  show: boolean;
  message: string;
  onDismiss: () => void;
}

export function DailyLimitNotification({ show, message, onDismiss }: DailyLimitNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onDismiss, 300); // Wait for animation to complete
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [show, onDismiss]);

  if (!show) return null;

  return (
    <div 
      className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md mx-4 transition-all duration-300 ${
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}
    >
      <Alert className="bg-orange-50 border-orange-200 text-orange-800 shadow-lg">
        <AlertCircle className="h-4 w-4 text-orange-600" />
        <AlertDescription className="flex items-center justify-between">
          <span className="font-medium">{message}</span>
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onDismiss, 300);
            }}
            className="ml-2 p-1 hover:bg-orange-100 rounded-full transition-colors"
          >
            <X className="h-4 w-4 text-orange-600" />
          </button>
        </AlertDescription>
      </Alert>
    </div>
  );
}