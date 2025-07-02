import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Coffee, Sun, Moon } from "lucide-react";

interface TestNotificationProps {
  sessionId: string;
}

export default function TestNotification({ sessionId }: TestNotificationProps) {
  const { toast } = useToast();

  useEffect(() => {
    if (!sessionId) return;

    // Show a test notification immediately when component loads
    const showTestNotification = () => {
      toast({
        title: "🌟 Daily Motivation Test",
        description: "This is how your 3x daily notifications will look! Morning (8:30am), Afternoon (1:00pm), Evening (7:30pm)",
        duration: 10000,
      });
    };

    // Show test notification after 3 seconds
    const timer = setTimeout(showTestNotification, 3000);

    return () => clearTimeout(timer);
  }, [sessionId, toast]);

  return null;
}