import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, Send, Shuffle, List, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface HourlyActivity {
  id: number;
  activityNumber: number;
  description: string;
  emoji: string;
  category: string;
  createdAt: string;
}

export default function HourlyActivitiesDemo() {
  const [testEmail, setTestEmail] = useState("");
  const [testName, setTestName] = useState("");
  const { toast } = useToast();

  // Fetch all hourly activities
  const { data: activities = [], isLoading: activitiesLoading } = useQuery<HourlyActivity[]>({
    queryKey: ["/api/hourly-activities"],
  });

  // Fetch random activity
  const { data: randomActivity, refetch: getRandomActivity, isLoading: randomLoading } = useQuery<HourlyActivity>({
    queryKey: ["/api/hourly-activities/random"],
    enabled: false
  });

  // Test hourly nudge mutation
  const testNudgeMutation = useMutation({
    mutationFn: async (data: { email: string; name?: string }) => {
      const response = await fetch("/api/test-hourly-nudge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error("Failed to send test nudge");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Test Email Sent!",
        description: "Check your inbox for the hourly activity nudge.",
      });
      setTestEmail("");
      setTestName("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send test email",
        variant: "destructive",
      });
    }
  });

  const handleTestNudge = () => {
    if (!testEmail.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter an email address to test the nudge system.",
        variant: "destructive",
      });
      return;
    }
    testNudgeMutation.mutate({ 
      email: testEmail.trim(), 
      name: testName.trim() || undefined 
    });
  };

  const categorizeActivities = (activities: HourlyActivity[]) => {
    const categories = activities.reduce((acc, activity) => {
      if (!acc[activity.category]) {
        acc[activity.category] = [];
      }
      acc[activity.category].push(activity);
      return acc;
    }, {} as Record<string, HourlyActivity[]>);
    return categories;
  };

  const categorizedActivities = categorizeActivities(activities);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'kungfu': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'cleaning': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'general': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (activitiesLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Clock className="h-8 w-8 text-primary" />
          Hourly Activity Nudge System
        </h1>
        <p className="text-muted-foreground">
          130 calorie-burning activities delivered hourly from 10 AM to 9 PM for premium users
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-primary">{activities.length}</div>
            <div className="text-sm text-muted-foreground">Total Activities</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-primary">{Object.keys(categorizedActivities).length}</div>
            <div className="text-sm text-muted-foreground">Categories</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-primary">11</div>
            <div className="text-sm text-muted-foreground">Hours Active</div>
          </CardContent>
        </Card>
      </div>

      {/* Random Activity Demo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shuffle className="h-5 w-5" />
            Random Activity Demo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={() => getRandomActivity()} 
            disabled={randomLoading}
            className="w-full"
          >
            {randomLoading ? "Getting Activity..." : "Get Random Activity"}
          </Button>
          
          {randomActivity && (
            <div className="p-4 border rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
              <div className="flex items-start gap-3">
                <div className="text-3xl">{randomActivity.emoji}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">Activity #{randomActivity.activityNumber}</Badge>
                    <Badge className={getCategoryColor(randomActivity.category)}>
                      {randomActivity.category}
                    </Badge>
                  </div>
                  <p className="text-sm leading-relaxed">{randomActivity.description}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Nudge System */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Test Hourly Nudge Email
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Email Address *</label>
              <Input
                type="email"
                placeholder="test@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Name (Optional)</label>
              <Input
                type="text"
                placeholder="Your name"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
              />
            </div>
          </div>
          <Button 
            onClick={handleTestNudge}
            disabled={testNudgeMutation.isPending}
            className="w-full"
          >
            {testNudgeMutation.isPending ? "Sending..." : "Send Test Nudge Email"}
          </Button>
          <p className="text-xs text-muted-foreground">
            This will send a sample hourly activity email with a random activity and branded design.
          </p>
        </CardContent>
      </Card>

      {/* Activities by Category */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <List className="h-5 w-5" />
            All Activities by Category
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(categorizedActivities).map(([category, categoryActivities]) => (
            <div key={category} className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge className={getCategoryColor(category)}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {categoryActivities.length} activities
                </span>
              </div>
              
              <div className="grid gap-2">
                {categoryActivities.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="text-lg">{activity.emoji}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          #{activity.activityNumber}
                        </Badge>
                      </div>
                      <p className="text-sm">{activity.description}</p>
                    </div>
                  </div>
                ))}
                
                {categoryActivities.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center p-2">
                    ... and {categoryActivities.length - 5} more {category} activities
                  </p>
                )}
              </div>
              
              {Object.keys(categorizedActivities).indexOf(category) < Object.keys(categorizedActivities).length - 1 && (
                <Separator />
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* System Information */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm">Scheduler Status</span>
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              Active
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Active Hours</span>
            <span className="text-sm font-medium">10:00 AM - 9:00 PM</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Check Interval</span>
            <span className="text-sm font-medium">Every 5 minutes</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Target Users</span>
            <span className="text-sm font-medium">Premium subscribers only</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Email Service</span>
            <Badge variant="default">
              SendGrid Email Service
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}