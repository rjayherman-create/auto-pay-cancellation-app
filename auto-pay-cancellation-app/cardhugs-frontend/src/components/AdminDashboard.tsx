import React, { useState, useEffect } from 'react';
import { BarChart3, Users, Package, TrendingUp, AlertCircle, CheckCircle2, Clock, Activity } from 'lucide-react';

interface DashboardStats {
  totalCards: number;
  draftCards: number;
  approvedCards: number;
  publishedCards: number;
  rejectedCards: number;
  totalOccasions: number;
  totalStyles: number;
  recentActivity: ActivityLog[];
}

interface ActivityLog {
  id: string;
  type: 'create' | 'approve' | 'reject' | 'publish' | 'export';
  cardTitle: string;
  occasion: string;
  timestamp: string;
  user?: string;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalCards: 0,
    draftCards: 0,
    approvedCards: 0,
    publishedCards: 0,
    rejectedCards: 0,
    totalOccasions: 0,
    totalStyles: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'draft' | 'approved' | 'published'>('all');

  useEffect(() => {
    loadDashboardData();
    // Refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch cards stats
      const cardsResponse = await fetch('/api/cards?limit=1000', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('cardhugs_token')}`
        }
      });

      // Fetch occasions
      const occasionsResponse = await fetch('/api/occasions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('cardhugs_token')}`
        }
      });

      // Fetch styles
      const stylesResponse = await fetch('/api/styles', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('cardhugs_token')}`
        }
      });

      if (cardsResponse.ok && occasionsResponse.ok && stylesResponse.ok) {
        const cardsData = await cardsResponse.json();
        const occasionsData = await occasionsResponse.json();
        const stylesData = await stylesResponse.json();

        const cards = cardsData.cards || [];

        // Generate activity logs from card data
        const activityLogs: ActivityLog[] = cards.slice(0, 10).map((card: any, idx: number) => ({
          id: card.id,
          type: card.status === 'published' ? 'publish' : card.status === 'approved' ? 'approve' : 'create',
          cardTitle: card.front_text?.substring(0, 30) + '...' || 'Untitled',
          occasion: card.occasion,
          timestamp: card.updated_at || card.created_at,
          user: 'Admin'
        }));

        setStats({
          totalCards: cards.length,
          draftCards: cards.filter((c: any) => c.status === 'draft').length,
          approvedCards: cards.filter((c: any) => c.status === 'approved').length,
          publishedCards: cards.filter((c: any) => c.status === 'published').length,
          rejectedCards: cards.filter((c: any) => c.status === 'rejected').length,
          totalOccasions: occasionsData.occasions?.length || 0,
          totalStyles: stylesData.styles?.length || 0,
          recentActivity: activityLogs
        });
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'publish':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'approve':
        return <CheckCircle2 className="w-4 h-4 text-blue-600" />;
      case 'reject':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'export':
        return <Package className="w-4 h-4 text-purple-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'publish':
        return 'bg-green-50 border-green-200';
      case 'approve':
        return 'bg-blue-50 border-blue-200';
      case 'reject':
        return 'bg-red-50 border-red-200';
      case 'export':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 className="w-8 h-8 text-indigo-600" />
          <h2 className="text-4xl font-bold">Admin Dashboard</h2>
        </div>
        <p className="text-gray-600">Overview of CardHugs system activity and statistics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {/* Total Cards */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Cards</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalCards}</p>
            </div>
            <Package className="w-10 h-10 text-indigo-200" />
          </div>
          <p className="text-xs text-gray-500 mt-4">
            Across all statuses
          </p>
        </div>

        {/* Draft Cards */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Draft</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.draftCards}</p>
            </div>
            <Clock className="w-10 h-10 text-orange-200" />
          </div>
          <p className="text-xs text-orange-600 mt-4">
            {stats.draftCards > 0 ? 'Awaiting review' : 'All caught up'}
          </p>
        </div>

        {/* Approved Cards */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Approved</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{stats.approvedCards}</p>
            </div>
            <CheckCircle2 className="w-10 h-10 text-blue-200" />
          </div>
          <p className="text-xs text-blue-600 mt-4">
            Ready for store
          </p>
        </div>

        {/* Published Cards */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Published</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.publishedCards}</p>
            </div>
            <TrendingUp className="w-10 h-10 text-green-200" />
          </div>
          <p className="text-xs text-green-600 mt-4">
            Live in store
          </p>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {/* Rejected Cards */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <p className="text-gray-600 text-xs font-medium">Rejected</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{stats.rejectedCards}</p>
        </div>

        {/* Total Occasions */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <p className="text-gray-600 text-xs font-medium">Occasions</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{stats.totalOccasions}</p>
        </div>

        {/* Total Styles */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <p className="text-gray-600 text-xs font-medium">Styles</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{stats.totalStyles}</p>
        </div>
      </div>

      {/* Activity & Status Section */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        {/* Status Breakdown */}
        <div className="col-span-1 bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Card Distribution</h3>
          
          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">Draft</span>
                <span className="text-sm font-semibold text-gray-900">{Math.round((stats.draftCards / stats.totalCards) * 100) || 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-orange-500 h-2 rounded-full"
                  style={{ width: `${(stats.draftCards / stats.totalCards) * 100 || 0}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">Approved</span>
                <span className="text-sm font-semibold text-gray-900">{Math.round((stats.approvedCards / stats.totalCards) * 100) || 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${(stats.approvedCards / stats.totalCards) * 100 || 0}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">Published</span>
                <span className="text-sm font-semibold text-gray-900">{Math.round((stats.publishedCards / stats.totalCards) * 100) || 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${(stats.publishedCards / stats.totalCards) * 100 || 0}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">Rejected</span>
                <span className="text-sm font-semibold text-gray-900">{Math.round((stats.rejectedCards / stats.totalCards) * 100) || 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full"
                  style={{ width: `${(stats.rejectedCards / stats.totalCards) * 100 || 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="col-span-2 bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {stats.recentActivity.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No recent activity</p>
            ) : (
              stats.recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className={`p-3 rounded-lg border flex items-start gap-3 ${getActivityColor(activity.type)}`}
                >
                  <div className="mt-1">{getActivityIcon(activity.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {activity.type === 'publish' && '✓ Published'}
                        {activity.type === 'approve' && '✓ Approved'}
                        {activity.type === 'reject' && '✗ Rejected'}
                        {activity.type === 'export' && '📦 Exported'}
                        {activity.type === 'create' && '+ Created'}
                      </p>
                      <span className="text-xs text-gray-600 whitespace-nowrap">
                        {formatTime(activity.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 truncate">
                      {activity.cardTitle} • {activity.occasion}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <button
            onClick={loadDashboardData}
            className="w-full mt-4 px-4 py-2 text-sm border border-indigo-300 text-indigo-600 rounded-lg hover:bg-indigo-50 font-medium"
          >
            Refresh Activity
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-indigo-50 rounded-lg border border-indigo-200 p-6">
        <h3 className="text-lg font-semibold text-indigo-900 mb-4">Next Steps</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border border-indigo-100">
            <p className="font-semibold text-gray-900 mb-2">{stats.draftCards} Cards Need Review</p>
            <p className="text-sm text-gray-600 mb-3">Review draft cards and move them through the workflow</p>
            <a href="/review" className="text-indigo-600 hover:text-indigo-700 font-medium text-sm">
              Go to Review →
            </a>
          </div>
          <div className="bg-white rounded-lg p-4 border border-indigo-100">
            <p className="font-semibold text-gray-900 mb-2">{stats.approvedCards} Cards Ready</p>
            <p className="text-sm text-gray-600 mb-3">QC approve cards before uploading to store</p>
            <a href="/qc-approval" className="text-indigo-600 hover:text-indigo-700 font-medium text-sm">
              QC Dashboard →
            </a>
          </div>
          <div className="bg-white rounded-lg p-4 border border-indigo-100">
            <p className="font-semibold text-gray-900 mb-2">{stats.approvedCards} Cards to Export</p>
            <p className="text-sm text-gray-600 mb-3">Export approved cards as ZIP or upload to store</p>
            <a href="/store-upload" className="text-indigo-600 hover:text-indigo-700 font-medium text-sm">
              Store Upload →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
