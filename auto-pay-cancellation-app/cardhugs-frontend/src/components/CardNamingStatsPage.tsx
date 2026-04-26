import React, { useState, useEffect } from 'react';
import { BarChart3, RefreshCw, AlertCircle } from 'lucide-react';
import { Tooltip, HelpIcon } from './Tooltip';

const CardNamingStatsPage: React.FC = () => {
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/cards/naming/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('cardhugs_token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to load stats');

      const data = await response.json();
      setStats(data.stats || []);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  const totalCards = stats.reduce((sum, s) => sum + s.totalCards, 0);
  const totalPublished = stats.reduce((sum, s) => sum + s.publishedCards, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading naming statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-indigo-600" />
            <h2 className="text-3xl font-bold">Card Naming Statistics</h2>
          </div>
          <Tooltip text="Refresh statistics">
            <button
              onClick={fetchStats}
              disabled={loading}
              className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </Tooltip>
        </div>
        <p className="text-gray-600">
          Monitor card sequence counters and inventory status across all occasions
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-gray-600 text-sm font-medium">Total Cards Generated</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{totalCards}</p>
          <p className="text-xs text-gray-500 mt-2">Across all occasions</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-gray-600 text-sm font-medium">Published to Store</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{totalPublished}</p>
          <p className="text-xs text-gray-500 mt-2">
            {totalCards > 0 ? Math.round((totalPublished / totalCards) * 100) : 0}% publish rate
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-gray-600 text-sm font-medium">Occasions Active</p>
          <p className="text-3xl font-bold text-indigo-600 mt-2">{stats.length}</p>
          <p className="text-xs text-gray-500 mt-2">
            {lastRefresh ? `Last updated: ${lastRefresh.toLocaleTimeString()}` : 'Never'}
          </p>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            Sequence Counter by Occasion
            <HelpIcon text="Shows the next available sequence number for each occasion. These counters prevent card name collisions." />
          </h3>
        </div>

        {stats.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No card naming data available yet. Start generating cards to see statistics.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Occasion</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Total Cards</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Published</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Publish Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Next #</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Example Name</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((stat, idx) => {
                  const publishRate = stat.totalCards > 0
                    ? Math.round((stat.publishedCards / stat.totalCards) * 100)
                    : 0;
                  const baseName = stat.occasion.toLowerCase().replace(/\s+/g, '_').replace(/'/g, '');
                  const exampleName = `${baseName}_${String(stat.nextSequence).padStart(2, '0')}_Front`;

                  return (
                    <tr
                      key={idx}
                      className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {stat.occasion}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <span className="font-bold">{stat.totalCards}</span> cards
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                          {stat.publishedCards}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-indigo-600 h-2 rounded-full"
                              style={{ width: `${publishRate}%` }}
                            />
                          </div>
                          <span className="font-semibold">{publishRate}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="inline-block bg-indigo-100 text-indigo-800 px-3 py-1 rounded font-mono font-bold">
                          {stat.nextSequence}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                        <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                          {exampleName}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-900">
          <strong>ℹ️ How it works:</strong> Each occasion maintains a sequence counter that auto-increments with each card save. This ensures card names like "birthday_01_Front", "birthday_02_Front", etc. Never repeat, even with concurrent saves. The "Next #" column shows what the next card for that occasion will be named.
        </p>
      </div>

      {/* Legend */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="font-semibold text-sm mb-2">📝 Card Name Format</p>
          <p className="text-xs text-gray-600 font-mono">
            {`{occasion}_{sequence:02d}_{side}`}
          </p>
          <p className="text-xs text-gray-600 mt-2">
            Example: <span className="font-mono bg-gray-200 px-1 rounded">birthday_05_Front</span>
          </p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="font-semibold text-sm mb-2">🎯 Next # Meaning</p>
          <p className="text-xs text-gray-600">
            The next card for this occasion will be saved with this sequence number. Increments automatically after each save.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CardNamingStatsPage;
