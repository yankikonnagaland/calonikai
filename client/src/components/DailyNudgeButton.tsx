import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mail, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function DailyNudgeButton() {
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const sendDailyReminder = async () => {
    setIsSending(true);
    try {
      await apiRequest(`/api/send-daily-reminder`, {
        method: "POST",
      });

      toast({
        title: "Reminder Sent",
        description: "Daily calorie reminder has been sent to your email",
      });
    } catch (error) {
      console.error("Error sending reminder:", error);
      toast({
        title: "Error",
        description: "Failed to send daily reminder. Please check your email settings.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Button
      onClick={sendDailyReminder}
      disabled={isSending}
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
    >
      {isSending ? (
        <Bell className="w-4 h-4 animate-pulse" />
      ) : (
        <Mail className="w-4 h-4" />
      )}
      {isSending ? "Sending..." : "Send Daily Reminder"}
    </Button>
  );
}