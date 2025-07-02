import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Users, Camera, Search, TrendingUp, Crown } from 'lucide-react';

interface UserUsageData {
  user_id: string;
  email: string;
  first_name: string;
  subscription_status: string;
  subscription_ends_at: string;
  total_photo_scans: number;
  total_food_searches: number;
  photos_last_7_days: number;
  food_searches_last_7_days: number;
  photos_today: number;
  food_searches_today: number;
  user_joined_date: string;
}

interface SubscriptionSummary {
  subscription_status: string;
  total_users: number;
  total_photo_scans_all: number;
  total_food_searches_all: number;
  avg_photos_per_user: number;
  avg_searches_per_user: number;
}

export default function UsageAnalyticsDashboard() {
  const [userUsageData, setUserUsageData] = useState<UserUsageData[]>([]);
  const [subscriptionSummary, setSubscriptionSummary] = useState<SubscriptionSummary[]>([]);
  const [topUsers, setTopUsers] = useState<UserUsageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchUsageData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/usage-analytics');
      const data = await response.json();
      
      setUserUsageData(data.userUsage || []);
      setSubscriptionSummary(data.subscriptionSummary || []);
      setTopUsers(data.topUsers || []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch usage analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsageData();
  }, []);

  const getSubscriptionBadge = (status: string) => {
    switch (status) {
      case 'premium':
        return <Badge className="bg-yellow-100 text-yellow-800"><Crown className="w-3 h-3 mr-1" />Premium</Badge>;
      case 'basic':
        return <Badge className="bg-blue-100 text-blue-800">🔰 Basic</Badge>;
      default:
        return <Badge variant="outline">Free</Badge>;
    }
  };

  const totalUsers = subscriptionSummary.reduce((sum, item) => sum + item.total_users, 0);
  const totalPhotoScans = subscriptionSummary.reduce((sum, item) => sum + item.total_photo_scans_all, 0);
  const totalFoodSearches = subscriptionSummary.reduce((sum, item) => sum + item.total_food_searches_all, 0);

  const todayPhotoScans = userUsageData.reduce((sum, user) => sum + user.photos_today, 0);
  const todayFoodSearches = userUsageData.reduce((sum, user) => sum + user.food_searches_today, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Usage Analytics Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {lastUpdated ? `Last updated: ${lastUpdated.toLocaleString()}` : 'Loading...'}
          </p>
        </div>
        <Button onClick={fetchUsageData} disabled={loading} className="flex items-center gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalUsers}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Camera className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalPhotoScans}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Photo Scans</p>
                <p className="text-xs text-green-600 dark:text-green-400">{todayPhotoScans} today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Search className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalFoodSearches}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Food Searches</p>
                <p className="text-xs text-purple-600 dark:text-purple-400">{todayFoodSearches} today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {totalUsers > 0 ? Math.round((totalPhotoScans + totalFoodSearches) / totalUsers) : 0}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Actions/User</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Usage by Subscription Tier</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3">Subscription</th>
                  <th className="text-left py-3">Users</th>
                  <th className="text-left py-3">Total Photos</th>
                  <th className="text-left py-3">Avg Photos/User</th>
                  <th className="text-left py-3">Total Searches</th>
                  <th className="text-left py-3">Avg Searches/User</th>
                </tr>
              </thead>
              <tbody>
                {subscriptionSummary.map((tier) => (
                  <tr key={tier.subscription_status} className="border-b">
                    <td className="py-3">{getSubscriptionBadge(tier.subscription_status)}</td>
                    <td className="py-3">{tier.total_users}</td>
                    <td className="py-3">{tier.total_photo_scans_all}</td>
                    <td className="py-3">{tier.avg_photos_per_user.toFixed(2)}</td>
                    <td className="py-3">{tier.total_food_searches_all}</td>
                    <td className="py-3">{tier.avg_searches_per_user.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Top Users */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Most Active Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3">User</th>
                  <th className="text-left py-3">Email</th>
                  <th className="text-left py-3">Subscription</th>
                  <th className="text-left py-3">Photo Scans</th>
                  <th className="text-left py-3">Food Searches</th>
                  <th className="text-left py-3">Last 7 Days</th>
                  <th className="text-left py-3">Today</th>
                  <th className="text-left py-3">Joined</th>
                </tr>
              </thead>
              <tbody>
                {topUsers.map((user) => (
                  <tr key={user.user_id} className="border-b">
                    <td className="py-3">
                      <div>
                        <p className="font-medium">{user.first_name || 'Anonymous'}</p>
                        <p className="text-xs text-gray-500">{user.user_id.substring(0, 20)}...</p>
                      </div>
                    </td>
                    <td className="py-3 text-sm">{user.email}</td>
                    <td className="py-3">{getSubscriptionBadge(user.subscription_status)}</td>
                    <td className="py-3">
                      <span className="font-bold text-green-600">{user.total_photo_scans}</span>
                    </td>
                    <td className="py-3">
                      <span className="font-bold text-purple-600">{user.total_food_searches}</span>
                    </td>
                    <td className="py-3">
                      <div className="text-sm">
                        <div>📸 {user.photos_last_7_days}</div>
                        <div>🔍 {user.food_searches_last_7_days}</div>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="text-sm">
                        <div>📸 {user.photos_today}</div>
                        <div>🔍 {user.food_searches_today}</div>
                      </div>
                    </td>
                    <td className="py-3 text-sm">
                      {new Date(user.user_joined_date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* All Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users ({userUsageData.length} total)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto max-h-96">
            <table className="w-full">
              <thead className="sticky top-0 bg-white dark:bg-gray-800">
                <tr className="border-b">
                  <th className="text-left py-3">User</th>
                  <th className="text-left py-3">Email</th>
                  <th className="text-left py-3">Subscription</th>
                  <th className="text-left py-3">Total Photos</th>
                  <th className="text-left py-3">Total Searches</th>
                  <th className="text-left py-3">Today</th>
                  <th className="text-left py-3">Joined</th>
                </tr>
              </thead>
              <tbody>
                {userUsageData.map((user) => (
                  <tr key={user.user_id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-3">
                      <div>
                        <p className="font-medium">{user.first_name || 'Anonymous'}</p>
                        <p className="text-xs text-gray-500">{user.user_id.substring(0, 20)}...</p>
                      </div>
                    </td>
                    <td className="py-3 text-sm">{user.email}</td>
                    <td className="py-3">{getSubscriptionBadge(user.subscription_status)}</td>
                    <td className="py-3">
                      <span className="font-bold text-green-600">{user.total_photo_scans}</span>
                    </td>
                    <td className="py-3">
                      <span className="font-bold text-purple-600">{user.total_food_searches}</span>
                    </td>
                    <td className="py-3">
                      <div className="text-sm">
                        📸{user.photos_today} 🔍{user.food_searches_today}
                      </div>
                    </td>
                    <td className="py-3 text-sm">
                      {new Date(user.user_joined_date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}