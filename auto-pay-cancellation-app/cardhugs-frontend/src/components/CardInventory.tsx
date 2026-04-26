import React, { useEffect, useState } from 'react';
import { Card, Occasion } from '../types';
import { cardAPI, occasionAPI } from '../services/api';
import { Search, Download, Trash2, Eye, CheckCircle, Clock, AlertCircle, CheckSquare, XSquare, Archive } from 'lucide-react';
import { Tooltip, HelpIcon } from './Tooltip';

const CardInventory: React.FC = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [occasions, setOccasions] = useState<Occasion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedOccasion, setSelectedOccasion] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());
  const [downloadInProgress, setDownloadInProgress] = useState(false);

  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    approved: 0,
    published: 0,
  });

  const statuses = ['all', 'draft', 'qc_passed', 'approved', 'published', 'rejected'];
  const statusColors: { [key: string]: string } = {
    draft: 'bg-gray-100 text-gray-800',
    qc_passed: 'bg-blue-100 text-blue-800',
    approved: 'bg-green-100 text-green-800',
    published: 'bg-purple-100 text-purple-800',
    rejected: 'bg-red-100 text-red-800',
  };

  const statusIcons: { [key: string]: React.ReactNode } = {
    draft: <Clock className="w-4 h-4" />,
    qc_passed: <CheckCircle className="w-4 h-4" />,
    approved: <CheckCircle className="w-4 h-4" />,
    published: <CheckCircle className="w-4 h-4" />,
    rejected: <AlertCircle className="w-4 h-4" />,
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cardsData, occasionsData] = await Promise.all([
        cardAPI.getAll({ limit: 500 }),
        occasionAPI.getAll({ limit: 100 }),
      ]);

      const allCards = cardsData.cards || [];
      setCards(allCards);
      setOccasions(occasionsData.occasions || []);

      // Calculate stats
      setStats({
        total: allCards.length,
        draft: allCards.filter((c: Card) => c.status === 'draft').length,
        approved: allCards.filter((c: Card) => c.status === 'approved').length,
        published: allCards.filter((c: Card) => c.status === 'published').length,
      });
    } catch (err) {
      console.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this card?')) return;

    try {
      await cardAPI.delete(id);
      setCards(cards.filter(c => c.id !== id));
      fetchData();
    } catch (err) {
      console.error('Failed to delete card');
    }
  };

  const downloadCard = (imageUrl: string | undefined, filename: string) => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    link.click();
  };

  // Bulk selection
  const toggleCardSelection = (cardId: string) => {
    const newSelection = new Set(selectedCards);
    if (newSelection.has(cardId)) {
      newSelection.delete(cardId);
    } else {
      newSelection.add(cardId);
    }
    setSelectedCards(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedCards.size === filteredCards.length) {
      setSelectedCards(new Set());
    } else {
      setSelectedCards(new Set(filteredCards.map(c => c.id)));
    }
  };

  // Bulk operations
  const handleBulkDelete = async () => {
    if (selectedCards.size === 0 || !window.confirm(`Delete ${selectedCards.size} card(s)?`)) return;

    try {
      await cardAPI.bulkDelete(Array.from(selectedCards));
      const newCards = cards.filter(c => !selectedCards.has(c.id));
      setCards(newCards);
      setSelectedCards(new Set());
      fetchData();
    } catch (err) {
      console.error('Failed to bulk delete cards');
    }
  };

  // Bulk download as ZIP (note: requires backend support for ZIP generation)
  const handleBulkDownload = async () => {
    if (selectedCards.size === 0) return;

    setDownloadInProgress(true);
    try {
      const cardsToDownload = Array.from(selectedCards)
        .map(id => cards.find(c => c.id === id))
        .filter(Boolean) as Card[];

      // Create a simple archive by downloading files one by one
      for (const card of cardsToDownload) {
        if (card.front_image_url) {
          downloadCard(card.front_image_url, `card-${card.id}-front.png`);
          // Small delay to prevent browser throttling
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        if (card.inside_image_url && card.inside_image_url !== card.front_image_url) {
          downloadCard(card.inside_image_url, `card-${card.id}-inside.png`);
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      alert(`Downloaded ${selectedCards.size} card(s)`);
    } catch (err) {
      console.error('Failed to download cards');
    } finally {
      setDownloadInProgress(false);
    }
  };

  // Filter cards
  let filteredCards = cards.filter((card: Card) => {
    const matchesSearch = 
      (card.front_text?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (card.inside_text?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (card.occasion?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = selectedStatus === 'all' || card.status === selectedStatus;
    const matchesOccasion = selectedOccasion === 'all' || card.occasion === selectedOccasion;
    
    return matchesSearch && matchesStatus && matchesOccasion;
  });

  // Sort cards
  filteredCards = filteredCards.sort((a: Card, b: Card) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
  });

  if (loading) {
    return <div className="p-6 text-center text-gray-600">Loading inventory...</div>;
  }

  const hasSelection = selectedCards.size > 0;

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold">Card Inventory</h2>
          <p className="text-gray-600 mt-1">Browse and manage all generated cards</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-gray-600 text-sm font-medium">Total Cards</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-gray-600 text-sm font-medium">Draft</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.draft}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-gray-600 text-sm font-medium">Approved</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{stats.approved}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-gray-600 text-sm font-medium">Published</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">{stats.published}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search cards..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Statuses</option>
              {statuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>

            <select
              value={selectedOccasion}
              onChange={(e) => setSelectedOccasion(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Occasions</option>
              {occasions.map(occ => (
                <option key={occ.id} value={occ.name}>{occ.emoji} {occ.name}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions Toolbar */}
        {hasSelection && (
          <div className="mb-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-indigo-900">
                {selectedCards.size} card(s) selected
              </span>
              <button
                onClick={toggleSelectAll}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                {selectedCards.size === filteredCards.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="flex gap-2">
              <Tooltip text="Download selected cards">
                <button
                  onClick={handleBulkDownload}
                  disabled={downloadInProgress}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-1 text-sm font-medium"
                >
                  <Download className="w-4 h-4" />
                  Download ({selectedCards.size})
                </button>
              </Tooltip>
              <Tooltip text="Delete selected cards">
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-1 text-sm font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete ({selectedCards.size})
                </button>
              </Tooltip>
              <button
                onClick={() => setSelectedCards(new Set())}
                className="px-3 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 text-sm font-medium"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCards.map(card => (
            <div
              key={card.id}
              className={`bg-white rounded-lg border-2 overflow-hidden hover:shadow-lg transition group cursor-pointer ${
                selectedCards.has(card.id)
                  ? 'border-indigo-500 shadow-md'
                  : 'border-gray-200'
              }`}
              onClick={() => toggleCardSelection(card.id)}
            >
              {/* Image Preview */}
              <div className="relative h-48 bg-gray-100 overflow-hidden">
                {card.front_image_url ? (
                  <img
                    src={card.front_image_url}
                    alt={card.front_text}
                    className="w-full h-full object-cover group-hover:scale-105 transition"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Eye className="w-8 h-8" />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex items-center gap-2">
                  {selectedCards.has(card.id) && (
                    <CheckSquare className="w-6 h-6 text-indigo-600 bg-white rounded-full p-0.5" />
                  )}
                  <span className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${statusColors[card.status]}`}>
                    {statusIcons[card.status]}
                    {card.status}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <p className="text-sm text-gray-500 font-medium mb-1">FRONT</p>
                <p className="font-semibold text-gray-900 line-clamp-2 mb-3">
                  {card.front_text}
                </p>

                <p className="text-sm text-gray-500 font-medium mb-1">INSIDE</p>
                <p className="text-sm text-gray-700 line-clamp-2 mb-3">
                  {card.inside_text}
                </p>

                <div className="flex items-center justify-between text-xs text-gray-600 mb-4 py-2 border-t border-gray-200 pt-2">
                  <span>{card.occasion}</span>
                  <span>{new Date(card.created_at).toLocaleDateString()}</span>
                </div>

                {card.quality_score && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-600 font-medium mb-1">Quality</p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full"
                        style={{ width: `${card.quality_score}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t border-gray-200" onClick={(e) => e.stopPropagation()}>
                  {card.front_image_url && (
                    <button
                      onClick={() => downloadCard(card.front_image_url, `card-front-${card.id}.png`)}
                      className="flex-1 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg flex items-center justify-center gap-1 text-xs font-medium"
                      title="Download front"
                    >
                      <Download className="w-3 h-3" />
                      Front
                    </button>
                  )}
                  {card.inside_image_url && (
                    <button
                      onClick={() => downloadCard(card.inside_image_url, `card-inside-${card.id}.png`)}
                      className="flex-1 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg flex items-center justify-center gap-1 text-xs font-medium"
                      title="Download inside"
                    >
                      <Download className="w-3 h-3" />
                      Inside
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(card.id)}
                    className="flex-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg flex items-center justify-center gap-1 text-xs font-medium"
                    title="Delete card"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredCards.length === 0 && (
          <div className="text-center py-12">
            <Eye className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No cards found</p>
          </div>
        )}

        <div className="mt-6 text-center text-sm text-gray-600">
          Showing {filteredCards.length} of {stats.total} cards
        </div>
      </div>
    </div>
  );
};

export default CardInventory;
