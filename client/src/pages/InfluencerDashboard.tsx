import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, TrendingUp, DollarSign, UserPlus, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Influencer {
  id: number;
  name: string;
  email: string;
  phone: string;
  referralCode: string;
  totalSubscriptions: number;
  totalRevenue: number;
  totalCommission: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface InfluencerReferral {
  id: number;
  influencerId: number;
  userId: string;
  subscriptionAmount: number;
  commissionAmount: number;
  createdAt: string;
}

interface NewInfluencerForm {
  name: string;
  email: string;
  phoneNumber: string;
}

export default function InfluencerDashboard() {
  const [selectedInfluencer, setSelectedInfluencer] = useState<Influencer | null>(null);
  const [newInfluencer, setNewInfluencer] = useState<NewInfluencerForm>({
    name: '',
    email: '',
    phoneNumber: ''
  });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all influencers
  const { data: influencers = [], isLoading } = useQuery({
    queryKey: ['/api/influencers'],
    queryFn: async () => {
      const response = await fetch('/api/influencers');
      if (!response.ok) throw new Error('Failed to fetch influencers');
      return response.json();
    }
  });

  // Fetch referrals for selected influencer
  const { data: referrals = [] } = useQuery({
    queryKey: ['/api/influencers', selectedInfluencer?.id, 'referrals'],
    queryFn: async () => {
      if (!selectedInfluencer) return [];
      const response = await fetch(`/api/influencers/${selectedInfluencer.id}/referrals`);
      if (!response.ok) throw new Error('Failed to fetch referrals');
      return response.json();
    },
    enabled: !!selectedInfluencer
  });

  // Create new influencer mutation
  const createInfluencerMutation = useMutation({
    mutationFn: async (data: NewInfluencerForm) => {
      const response = await fetch('/api/influencers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create influencer');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/influencers'] });
      setIsCreateDialogOpen(false);
      setNewInfluencer({ name: '', email: '', phoneNumber: '' });
      toast({
        title: "Success",
        description: "Influencer created successfully with 5-letter referral code"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create influencer",
        variant: "destructive"
      });
    }
  });

  // Calculate total stats
  const totalStats = influencers.reduce((acc, influencer) => ({
    totalInfluencers: acc.totalInfluencers + 1,
    totalSubscriptions: acc.totalSubscriptions + influencer.totalSubscriptions,
    totalRevenue: acc.totalRevenue + influencer.totalRevenue,
    totalCommissions: acc.totalCommissions + influencer.totalCommission
  }), {
    totalInfluencers: 0,
    totalSubscriptions: 0,
    totalRevenue: 0,
    totalCommissions: 0
  });

  const handleCreateInfluencer = () => {
    if (!newInfluencer.name || !newInfluencer.email || !newInfluencer.phoneNumber) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }
    createInfluencerMutation.mutate(newInfluencer);
  };

  const copyReferralCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
    toast({
      title: "Copied",
      description: `Referral code ${code} copied to clipboard`
    });
  };

  const formatCurrency = (amount: number) => {
    return `₹${(amount / 100).toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Influencer Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage influencer referrals and track commission earnings
            </p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Add Influencer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Influencer</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter influencer name"
                    value={newInfluencer.name}
                    onChange={(e) => setNewInfluencer(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email address"
                    value={newInfluencer.email}
                    onChange={(e) => setNewInfluencer(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="+91-XXXXXXXXXX"
                    value={newInfluencer.phoneNumber}
                    onChange={(e) => setNewInfluencer(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  />
                </div>
                <Button 
                  onClick={handleCreateInfluencer} 
                  className="w-full"
                  disabled={createInfluencerMutation.isPending}
                >
                  {createInfluencerMutation.isPending ? 'Creating...' : 'Create Influencer'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Influencers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStats.totalInfluencers}</div>
              <p className="text-xs text-muted-foreground">Active partners</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Subscriptions</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStats.totalSubscriptions}</div>
              <p className="text-xs text-muted-foreground">Referred customers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalStats.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">Generated by referrals</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Commissions</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalStats.totalCommissions)}</div>
              <p className="text-xs text-muted-foreground">10% commission earned</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Influencers List */}
          <Card>
            <CardHeader>
              <CardTitle>Influencer Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {influencers.map((influencer) => (
                  <div 
                    key={influencer.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedInfluencer?.id === influencer.id 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedInfluencer(influencer)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{influencer.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{influencer.email}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="secondary" 
                            className="cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyReferralCode(influencer.referralCode);
                            }}
                          >
                            {copiedCode === influencer.referralCode ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                            {influencer.referralCode}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {influencer.totalSubscriptions} referrals
                        </p>
                      </div>
                    </div>
                    <Separator className="my-2" />
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Revenue: </span>
                        <span className="font-semibold">{formatCurrency(influencer.totalRevenue)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Commission: </span>
                        <span className="font-semibold text-green-600">{formatCurrency(influencer.totalCommission)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Referral Details */}
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedInfluencer ? `${selectedInfluencer.name}'s Referrals` : 'Select an Influencer'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedInfluencer ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                      <p className="font-semibold">{selectedInfluencer.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Join Date</p>
                      <p className="font-semibold">
                        {new Date(selectedInfluencer.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Recent Referrals</h4>
                    {referrals.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>User ID</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Commission</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {referrals.map((referral) => (
                            <TableRow key={referral.id}>
                              <TableCell className="font-mono text-xs">
                                {referral.userId.slice(0, 12)}...
                              </TableCell>
                              <TableCell>{formatCurrency(referral.subscriptionAmount)}</TableCell>
                              <TableCell className="text-green-600">
                                {formatCurrency(referral.commissionAmount)}
                              </TableCell>
                              <TableCell>
                                {new Date(referral.createdAt).toLocaleDateString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                        No referrals yet
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                  Click on an influencer to view their referral details
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}