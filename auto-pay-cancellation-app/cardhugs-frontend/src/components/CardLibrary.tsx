import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Share2, Eye, BookOpen, Grid3x3, List, Star } from 'lucide-react';

interface Card {
  id: string;
  occasion: string;
  style?: string;
  front_text: string;
  front_image_url?: string;
  inside_text: string;
  inside_image_url?: string;
  status: string;
  quality_score?: number;
  created_at: string;
}

interface FilterOptions {
  occasion: string;
  style: string;
  sortBy: 'newest' | 'oldest' | 'quality';
  viewMode: 'grid' | 'list';
}

const CardLibrary: React.FC = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [filteredCards, setFilteredCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [occasions, setOccasions] = useState<string[]>([]);
  const [styles, setStyles] = useState<string[]>([]);
  
  const [filters, setFilters] = useState<FilterOptions>({
    occasion: '',
    style: '',
    sortBy: 'newest',
    viewMode: 'grid'
  });

  useEffect(() => {
    loadCards();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [cards, searchTerm, filters]);

  const loadCards = async () => {
    try {
      setLoading(true);
      
      // Fetch published cards
      const response = await fetch('/api/cards?status=published&limit=1000', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('cardhugs_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const publishedCards = data.cards || [];
        setCards(publishedCards);

        // Extract unique occasions and styles
        const uniqueOccasions = [...new Set(publishedCards.map((c: Card) => c.occasion))].sort() as string[];
        const uniqueStyles = [...new Set(publishedCards.map((c: Card) => c.style).filter(Boolean))].sort() as string[];
        
        setOccasions(uniqueOccasions);
        setStyles(uniqueStyles);
      }
    } catch (error) {
      console.error('Failed to load cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = cards.filter((card) => {
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        if (
          !card.front_text.toLowerCase().includes(search) &&
          !card.inside_text.toLowerCase().includes(search) &&
          !card.occasion.toLowerCase().includes(search)
        ) {
          return false;
        }
      }

      // Occasion filter
      if (filters.occasion && card.occasion !== filters.occasion) {
        return false;
      }

      // Style filter
      if (filters.style && card.style !== filters.style) {
        return false;
      }

      return true;
    });

    // Sort
    if (filters.sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (filters.sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (filters.sortBy === 'quality') {
      filtered.sort((a, b) => (b.quality_score || 0) - (a.quality_score || 0));
    }

    setFilteredCards(filtered);
  };

  const handleDownloadCard = (card: Card) => {
    // Create a data object with card details
    const cardData = {
      occasion: card.occasion,
      style: card.style,
      front_text: card.front_text,
      front_image_url: card.front_image_url,
      inside_text: card.inside_text,
      inside_image_url: card.inside_image_url,
      quality_score: card.quality_score,
      created_at: card.created_at
    };

    const dataStr = JSON.stringify(cardData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = window.URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `card_${card.occasion}_${card.id}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading card library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="w-8 h-8 text-indigo-600" />
          <h2 className="text-4xl font-bold">Card Library</h2>
        </div>
        <p className="text-gray-600">Browse and manage all finished greeting cards</p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Total Cards</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{cards.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Occasions</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{occasions.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Styles</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{styles.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Displayed</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{filteredCards.length}</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search cards by text, occasion..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Occasion Filter */}
          <select
            value={filters.occasion}
            onChange={(e) => setFilters({ ...filters, occasion: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Occasions</option>
            {occasions.map((occ) => (
              <option key={occ} value={occ}>{occ}</option>
            ))}
          </select>

          {/* Style Filter */}
          <select
            value={filters.style}
            onChange={(e) => setFilters({ ...filters, style: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Styles</option>
            {styles.map((style) => (
              <option key={style} value={style}>{style}</option>
            ))}
          </select>

          {/* Sort & View */}
          <div className="flex gap-2">
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="quality">Best Quality</option>
            </select>

            <button
              onClick={() => setFilters({ ...filters, viewMode: filters.viewMode === 'grid' ? 'list' : 'grid' })}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              title={`Switch to ${filters.viewMode === 'grid' ? 'list' : 'grid'} view`}
            >
              {filters.viewMode === 'grid' ? <List className="w-5 h-5" /> : <Grid3x3 className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Cards Display */}
      {filteredCards.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 text-lg">No cards match your filters</p>
          <p className="text-gray-500 text-sm mt-2">Try adjusting your search or filters</p>
        </div>
      ) : filters.viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCards.map((card) => (
            <div
              key={card.id}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition cursor-pointer group"
              onClick={() => setSelectedCard(card)}
            >
              {/* Card Image */}
              <div className="relative bg-gray-100 h-48 overflow-hidden">
                {card.front_image_url ? (
                  <img
                    src={card.front_image_url}
                    alt={card.occasion}
                    className="w-full h-full object-cover group-hover:scale-105 transition"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-100 to-indigo-200">
                    <span className="text-2xl">🎨</span>
                  </div>
                )}
                {card.quality_score && (
                  <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    {(card.quality_score * 100).toFixed(0)}%
                  </div>
                )}
              </div>

              {/* Card Info */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{card.occasion}</h3>
                  {card.style && (
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
                      {card.style}
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                  {card.front_text}
                </p>

                <div className="text-xs text-gray-500 mb-4">
                  Created {new Date(card.created_at).toLocaleDateString()}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCard(card);
                    }}
                    className="flex-1 px-3 py-1 text-sm border border-indigo-300 text-indigo-600 rounded hover:bg-indigo-50 font-medium"
                  >
                    <Eye className="w-4 h-4 inline mr-1" />
                    View
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadCard(card);
                    }}
                    className="flex-1 px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 font-medium"
                  >
                    <Download className="w-4 h-4 inline mr-1" />
                    Download
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Front Text</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Occasion</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Style</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Quality</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Created</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCards.map((card, idx) => (
                <tr key={card.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                    {card.front_text}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                    {card.occasion}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {card.style || '—'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {card.quality_score ? (
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-yellow-500 h-2 rounded-full"
                            style={{ width: `${(card.quality_score * 100)}%` }}
                          ></div>
                        </div>
                        <span className="font-semibold text-gray-900">
                          {(card.quality_score * 100).toFixed(0)}%
                        </span>
                      </div>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(card.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    <button
                      onClick={() => setSelectedCard(card)}
                      className="text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDownloadCard(card)}
                      className="text-gray-600 hover:text-gray-700 font-medium"
                    >
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Card Detail Modal */}
      {selectedCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
              <h3 className="text-2xl font-bold text-gray-900">{selectedCard.occasion}</h3>
              <button
                onClick={() => setSelectedCard(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-6 mb-6">
                {/* Front */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Front</h4>
                  {selectedCard.front_image_url && (
                    <img
                      src={selectedCard.front_image_url}
                      alt="Front"
                      className="w-full rounded-lg mb-2"
                    />
                  )}
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {selectedCard.front_text}
                  </p>
                </div>

                {/* Inside */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Inside</h4>
                  {selectedCard.inside_image_url && (
                    <img
                      src={selectedCard.inside_image_url}
                      alt="Inside"
                      className="w-full rounded-lg mb-2"
                    />
                  )}
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {selectedCard.inside_text}
                  </p>
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-3 gap-4 mb-6 py-4 border-y border-gray-200">
                <div>
                  <p className="text-xs text-gray-600 font-medium">Style</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    {selectedCard.style || 'None'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium">Quality</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    {selectedCard.quality_score 
                      ? `${(selectedCard.quality_score * 100).toFixed(0)}%` 
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium">Created</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    {new Date(selectedCard.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleDownloadCard(selectedCard)}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download JSON
                </button>
                <button
                  onClick={() => setSelectedCard(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CardLibrary;
