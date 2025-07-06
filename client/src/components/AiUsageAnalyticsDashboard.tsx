import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Brain, Search, TrendingUp, DollarSign, Calendar, Activity } from "lucide-react";

interface AiUsageStat {
  id: number;
  sessionId: string | null;
  userId: string | null;
  aiProvider: string;
  aiModel: string;
  requestType: string;
  query: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
  estimatedCost: number | null;
  responseTime: number | null;
  success: boolean;
  errorMessage: string | null;
  date: string;
  createdAt: string;
}

interface AggregatedStats {
  totalCalls: number;
  totalCost: number;
  averageResponseTime: number;
  successRate: number;
  totalTokens: number;
  averageCostPerCall: number;
}

export default function AiUsageAnalyticsDashboard() {
  const [stats, setStats] = useState<AiUsageStat[]>([]);
  const [filteredStats, setFilteredStats] = useState<AiUsageStat[]>([]);
  const [aggregatedStats, setAggregatedStats] = useState<AggregatedStats>({
    totalCalls: 0,
    totalCost: 0,
    averageResponseTime: 0,
    successRate: 0,
    totalTokens: 0,
    averageCostPerCall: 0
  });
  const [dateFilter, setDateFilter] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAiUsageStats();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [stats, dateFilter, serviceFilter, userFilter]);

  const fetchAiUsageStats = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/ai-usage-stats');
      const data = await response.json();
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setStats(data);
      } else {
        console.warn('AI usage stats API returned non-array data:', data);
        setStats([]);
      }
    } catch (error) {
      console.error('Failed to fetch AI usage stats:', error);
      setStats([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    // Ensure stats is an array before filtering
    if (!Array.isArray(stats)) {
      console.warn('Stats is not an array:', stats);
      setFilteredStats([]);
      setAggregatedStats({
        totalCalls: 0,
        totalCost: 0,
        averageResponseTime: 0,
        successRate: 0,
        totalTokens: 0,
        averageCostPerCall: 0,
      });
      return;
    }

    let filtered = stats;

    if (dateFilter) {
      filtered = filtered.filter(stat => stat.date >= dateFilter);
    }

    if (serviceFilter) {
      filtered = filtered.filter(stat => 
        stat.requestType?.toLowerCase().includes(serviceFilter.toLowerCase()) ||
        stat.aiProvider?.toLowerCase().includes(serviceFilter.toLowerCase())
      );
    }

    if (userFilter) {
      filtered = filtered.filter(stat => 
        stat.userId?.toLowerCase().includes(userFilter.toLowerCase())
      );
    }

    setFilteredStats(filtered);

    // Calculate aggregated stats only if filtered is an array
    if (!Array.isArray(filtered)) {
      console.warn('Filtered is not an array:', filtered);
      return;
    }

    const totalCalls = filtered.length;
    const totalCost = filtered.reduce((sum, stat) => sum + (stat.estimatedCost || 0), 0);
    const totalTokens = filtered.reduce((sum, stat) => sum + (stat.totalTokens || 0), 0);
    const successfulCalls = filtered.filter(stat => stat.success).length;
    const totalResponseTime = filtered.reduce((sum, stat) => sum + (stat.responseTime || 0), 0);

    setAggregatedStats({
      totalCalls,
      totalCost,
      totalTokens,
      successRate: totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0,
      averageResponseTime: totalCalls > 0 ? totalResponseTime / totalCalls : 0,
      averageCostPerCall: totalCalls > 0 ? totalCost / totalCalls : 0
    });
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(4)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getServiceBadgeColor = (serviceType: string) => {
    switch (serviceType.toLowerCase()) {
      case 'gemini':
        return 'bg-blue-100 text-blue-800';
      case 'openai':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-blue-600" />
            AI Usage Analytics
          </h1>
          <p className="text-gray-600 mt-1">Monitor AI service usage and optimize costs</p>
        </div>
        <Button onClick={fetchAiUsageStats} disabled={isLoading}>
          <Activity className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Aggregated Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Calls</p>
                <p className="text-2xl font-bold">{aggregatedStats.totalCalls}</p>
              </div>
              <Search className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Cost</p>
                <p className="text-2xl font-bold">{formatCurrency(aggregatedStats.totalCost)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Cost/Call</p>
                <p className="text-2xl font-bold">{formatCurrency(aggregatedStats.averageCostPerCall)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold">{aggregatedStats.successRate.toFixed(1)}%</p>
              </div>
              <Activity className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Tokens</p>
                <p className="text-2xl font-bold">{aggregatedStats.totalTokens.toLocaleString()}</p>
              </div>
              <Brain className="h-8 w-8 text-indigo-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Response</p>
                <p className="text-2xl font-bold">{aggregatedStats.averageResponseTime.toFixed(0)}ms</p>
              </div>
              <Calendar className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="dateFilter">Start Date</Label>
              <Input
                id="dateFilter"
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="serviceFilter">Service Type</Label>
              <Input
                id="serviceFilter"
                placeholder="Filter by service (e.g., Gemini, OpenAI)"
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="userFilter">User ID</Label>
              <Input
                id="userFilter"
                placeholder="Filter by user ID"
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Usage Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent AI Usage</CardTitle>
          <p className="text-sm text-gray-600">
            Showing {filteredStats.length} of {stats.length} records
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading AI usage data...</div>
          ) : filteredStats.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No AI usage data found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Provider</th>
                    <th className="text-left p-2">Request Type</th>
                    <th className="text-left p-2">User</th>
                    <th className="text-right p-2">Tokens</th>
                    <th className="text-right p-2">Cost</th>
                    <th className="text-right p-2">Response Time</th>
                    <th className="text-center p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStats.slice(0, 50).map((stat) => (
                    <tr key={stat.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">{formatDate(stat.createdAt)}</td>
                      <td className="p-2">
                        <Badge className={getServiceBadgeColor(stat.aiProvider)}>
                          {stat.aiProvider}
                        </Badge>
                      </td>
                      <td className="p-2 text-xs font-mono">{stat.requestType}</td>
                      <td className="p-2 text-xs">{stat.userId || 'Anonymous'}</td>
                      <td className="p-2 text-right">{stat.totalTokens?.toLocaleString() || '-'}</td>
                      <td className="p-2 text-right">{stat.estimatedCost ? formatCurrency(stat.estimatedCost) : '-'}</td>
                      <td className="p-2 text-right">{stat.responseTime ? `${stat.responseTime}ms` : '-'}</td>
                      <td className="p-2 text-center">
                        <Badge variant={stat.success ? "default" : "destructive"}>
                          {stat.success ? 'Success' : 'Failed'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredStats.length > 50 && (
                <div className="text-center mt-4 text-sm text-gray-500">
                  Showing first 50 records of {filteredStats.length} total
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}