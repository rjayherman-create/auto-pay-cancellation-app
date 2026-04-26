import React, { useState, useEffect } from 'react';
import { BarChart3, RefreshCw, AlertCircle, CheckCircle2, Edit2, Save, X, Trash2, Search } from 'lucide-react';
import { Tooltip, HelpIcon } from './Tooltip';

interface SequenceData {
  id: string;
  occasion_name: string;
  next_sequence: number;
  last_published_sequence: number;
  total_cards_generated: number;
  total_cards_published: number;
}

interface CardNameRow {
  id: string;
  occasion: string;
  status: string;
  cardName: string;
  sequence: number;
  createdAt: string;
}

interface DuplicateIssue {
  occasion: string;
  cardName: string;
  count: number;
  cardIds: string[];
}

const CardNamingDashboard: React.FC = () => {
  const [sequences, setSequences] = useState<SequenceData[]>([]);
  const [allCardNames, setAllCardNames] = useState<CardNameRow[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'sequences' | 'duplicates' | 'all-names'>('sequences');
  const [editingSequence, setEditingSequence] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch sequences
      const seqResponse = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('cardhugs_token')}`
        }
      });

      if (!seqResponse.ok) throw new Error('Failed to fetch sequences');

      const seqData = await seqResponse.json();
      
      // Extract sequences from stats
      const extractedSequences: SequenceData[] = [];
      if (seqData.stats) {
        seqData.stats.forEach((stat: any) => {
          extractedSequences.push({
            id: stat.occasion,
            occasion_name: stat.occasion,
            next_sequence: stat.nextSequence || 1,
            last_published_sequence: 0,
            total_cards_generated: stat.totalCards || 0,
            total_cards_published: stat.publishedCards || 0
          });
        });
      }

      setSequences(extractedSequences);

      // Fetch all card names from database
      const cardsResponse = await fetch('/api/admin/tables/cards/data?limit=1000&offset=0', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('cardhugs_token')}`
        }
      });

      if (cardsResponse.ok) {
        const cardsData = await cardsResponse.json();
        const cardRows: CardNameRow[] = cardsData.data.map((card: any) => ({
          id: card.id,
          occasion: card.occasion || 'Unknown',
          status: card.status || 'draft',
          cardName: card.metadata?.card_name || card.prompt || 'Unnamed',
          sequence: card.metadata?.card_sequence_number || 0,
          createdAt: card.created_at || ''
        }));
        setAllCardNames(cardRows);

        // Check for duplicates
        const nameCountMap = new Map<string, { count: number; cardIds: string[] }>();
        cardRows.forEach(row => {
          if (row.cardName) {
            const key = row.cardName;
            if (!nameCountMap.has(key)) {
              nameCountMap.set(key, { count: 0, cardIds: [] });
            }
            const entry = nameCountMap.get(key)!;
            entry.count++;
            entry.cardIds.push(row.id);
          }
        });

        // Find duplicates
        const foundDuplicates: DuplicateIssue[] = [];
        nameCountMap.forEach((value, key) => {
          if (value.count > 1) {
            const occasion = key.split('_')[0];
            foundDuplicates.push({
              occasion,
              cardName: key,
              count: value.count,
              cardIds: value.cardIds
            });
          }
        });

        setDuplicates(foundDuplicates);
      }

      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSequence = async (occasionName: string, newValue: number) => {
    try {
      // This would require a new endpoint to update sequences
      // For now, we'll show a confirmation
      if (window.confirm(`Update ${occasionName} next sequence to ${newValue}?`)) {
        console.log(`Would update ${occasionName} to sequence ${newValue}`);
        // After update, refresh data
        await fetchData();
        setEditingSequence(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update sequence');
    }
  };

  const handleDeleteDuplicate = async (cardId: string) => {
    if (window.confirm('Delete this card? This action cannot be undone.')) {
      try {
        const response = await fetch(`/api/cards/${cardId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('cardhugs_token')}`
          }
        });

        if (!response.ok) throw new Error('Failed to delete card');

        await fetchData();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete card');
      }
    }
  };

  // Filter data based on search
  const filteredSequences = sequences.filter(s =>
    s.occasion_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredNames = allCardNames.filter(c =>
    c.cardName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.occasion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading naming system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-indigo-600" />
            <h2 className="text-3xl font-bold">Card Numbering System</h2>
            <HelpIcon text="Monitor card naming sequences, check for duplicates, and manage numbering" />
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <p className="text-gray-600">
          Monitor and manage card naming sequences across all occasions
        </p>
        {lastRefresh && (
          <p className="text-xs text-gray-500 mt-1">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-gray-600 text-sm font-medium">Total Occasions</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{sequences.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-gray-600 text-sm font-medium">Total Cards Named</p>
          <p className="text-3xl font-bold text-indigo-600 mt-2">{allCardNames.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-gray-600 text-sm font-medium">Duplicates Found</p>
          <p className={`text-3xl font-bold mt-2 ${duplicates.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {duplicates.length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-gray-600 text-sm font-medium">Next Avg Sequence</p>
          <p className="text-3xl font-bold text-orange-600 mt-2">
            {sequences.length > 0 
              ? Math.round(sequences.reduce((sum, s) => sum + s.next_sequence, 0) / sequences.length)
              : 0
            }
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('sequences')}
            className={`px-4 py-2 font-medium border-b-2 transition ${
              activeTab === 'sequences'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            📊 Current Sequences ({sequences.length})
          </button>
          <button
            onClick={() => setActiveTab('duplicates')}
            className={`px-4 py-2 font-medium border-b-2 transition ${
              activeTab === 'duplicates'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            ⚠️ Duplicates {duplicates.length > 0 && `(${duplicates.length})`}
          </button>
          <button
            onClick={() => setActiveTab('all-names')}
            className={`px-4 py-2 font-medium border-b-2 transition ${
              activeTab === 'all-names'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            📝 All Card Names ({allCardNames.length})
          </button>
        </div>
      </div>

      {/* Search Box */}
      <div className="mb-6">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search by occasion or card name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'sequences' && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Occasion</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Next #</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Generated</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Published</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Publish Rate</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSequences.map((seq, idx) => {
                const rate = seq.total_cards_generated > 0
                  ? Math.round((seq.total_cards_published / seq.total_cards_generated) * 100)
                  : 0;

                return (
                  <tr
                    key={idx}
                    className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {seq.occasion_name}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {editingSequence === seq.id ? (
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(parseInt(e.target.value) || 0)}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                            min="1"
                          />
                          <button
                            onClick={() => handleEditSequence(seq.occasion_name, editValue)}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingSequence(null)}
                            className="p-1 text-gray-600 hover:bg-gray-200 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="inline-block bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full font-bold text-sm">
                            #{seq.next_sequence}
                          </span>
                          <button
                            onClick={() => {
                              setEditingSequence(seq.id);
                              setEditValue(seq.next_sequence);
                            }}
                            className="p-1 text-gray-500 hover:text-indigo-600"
                            title="Edit sequence"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {seq.total_cards_generated}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                        {seq.total_cards_published}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-indigo-600 h-2 rounded-full"
                            style={{ width: `${rate}%` }}
                          />
                        </div>
                        <span className="font-semibold text-sm">{rate}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => setSearchTerm(seq.occasion_name)}
                        className="text-indigo-600 hover:text-indigo-700 font-medium text-xs"
                      >
                        View Cards
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'duplicates' && (
        <div>
          {duplicates.length === 0 ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <p className="text-lg font-semibold text-green-900">No Duplicates Found!</p>
              <p className="text-sm text-green-700 mt-1">All card names are unique.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {duplicates.map((dup, idx) => (
                <div key={idx} className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-red-900">
                        {dup.cardName}
                        <span className="ml-2 inline-block bg-red-200 text-red-900 px-2 py-1 rounded text-xs">
                          {dup.count} duplicates
                        </span>
                      </p>
                      <p className="text-sm text-red-700 mt-1">
                        Occasion: {dup.occasion}
                      </p>
                    </div>
                    <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                  </div>
                  <div className="space-y-2">
                    {dup.cardIds.map((id, idIdx) => (
                      <div key={idIdx} className="flex items-center justify-between bg-white p-2 rounded text-sm">
                        <code className="text-gray-600">{id}</code>
                        <button
                          onClick={() => handleDeleteDuplicate(id)}
                          className="text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'all-names' && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Card Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Occasion</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Sequence</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Created</th>
              </tr>
            </thead>
            <tbody>
              {filteredNames.slice(0, 100).map((card, idx) => (
                <tr
                  key={idx}
                  className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                >
                  <td className="px-6 py-3 font-mono text-gray-900">{card.cardName}</td>
                  <td className="px-6 py-3 text-gray-600">{card.occasion}</td>
                  <td className="px-6 py-3">
                    <span className="inline-block bg-gray-200 px-2 py-1 rounded text-xs font-bold">
                      {card.sequence}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      card.status === 'approved' ? 'bg-green-100 text-green-800' :
                      card.status === 'published' ? 'bg-blue-100 text-blue-800' :
                      card.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {card.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-600 text-xs">
                    {card.createdAt ? new Date(card.createdAt).toLocaleDateString() : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredNames.length > 100 && (
            <div className="p-4 bg-gray-50 border-t border-gray-200 text-center text-sm text-gray-600">
              Showing first 100 cards. {filteredNames.length - 100} more cards available.
            </div>
          )}
        </div>
      )}

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-900">
          <strong>💡 How It Works:</strong> Card names follow the format: {'{occasion}_{sequence:02d}_{side}'} 
          (e.g., birthday_01_Front). Each occasion maintains its own sequence counter to ensure unique, non-duplicating names.
        </p>
      </div>
    </div>
  );
};

export default CardNamingDashboard;
