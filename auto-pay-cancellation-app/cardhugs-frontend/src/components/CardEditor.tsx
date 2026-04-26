import React, { useState, useEffect } from 'react';
import { Save, X, Plus, Trash2, Image as ImageIcon, Type, RefreshCw, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';

interface CardData {
  id?: string;
  front_text: string;
  front_image_url?: string;
  inside_text: string;
  inside_image_url?: string;
  occasion: string;
  style?: string;
  status: 'draft' | 'approved' | 'published';
}

interface TitleSuggestion {
  title: string;
  isDuplicate?: boolean;
}

const CardEditor: React.FC = () => {
  const [cards, setCards] = useState<CardData[]>([]);
  const [selectedCard, setSelectedCard] = useState<CardData | null>(null);
  const [editingCard, setEditingCard] = useState<CardData>({
    front_text: '',
    inside_text: '',
    occasion: 'Birthday',
    status: 'draft'
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'front' | 'inside'>('front');
  const [generatingTitle, setGeneratingTitle] = useState(false);
  const [titleSuggestions, setTitleSuggestions] = useState<TitleSuggestion[]>([]);
  const [showTitlePanel, setShowTitlePanel] = useState(false);
  const [selectedTitleIndex, setSelectedTitleIndex] = useState<number | null>(null);
  const [titleStats, setTitleStats] = useState<any>(null);
  const [duplicateCheck, setDuplicateCheck] = useState<{ title: string; exists: boolean; message: string } | null>(null);

  const occasions = ['Birthday', 'Anniversary', 'Wedding', 'Thank You', 'Congratulations', 'Get Well', 'Baby', 'Holiday'];
  const styles = ['elegant', 'modern', 'playful', 'minimalist', 'vintage', 'artistic'];

  useEffect(() => {
    loadCards();
    loadTitleStats();
  }, []);

  const loadCards = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/cards', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('cardhugs_token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setCards(data.cards || []);
      }
    } catch (error) {
      console.error('Failed to load cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTitleStats = async () => {
    try {
      const response = await fetch('/api/ai/title-stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('cardhugs_token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setTitleStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to load title stats:', error);
    }
  };

  const handleNewCard = () => {
    setEditingCard({
      front_text: '',
      inside_text: '',
      occasion: 'Birthday',
      status: 'draft',
      style: 'elegant'
    });
    setSelectedCard(null);
    setActiveTab('front');
    setTitleSuggestions([]);
    setShowTitlePanel(false);
    setSelectedTitleIndex(null);
  };

  const handleSelectCard = (card: CardData) => {
    setSelectedCard(card);
    setEditingCard(card);
    setActiveTab('front');
    setShowTitlePanel(false);
  };

  const generateAITitles = async () => {
    if (!editingCard.front_text && !editingCard.inside_text) {
      alert('Please enter some text first');
      return;
    }

    try {
      setGeneratingTitle(true);
      const response = await fetch('/api/ai/generate-titles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('cardhugs_token')}`
        },
        body: JSON.stringify({
          frontText: editingCard.front_text,
          insideText: editingCard.inside_text,
          occasion: editingCard.occasion,
          style: editingCard.style || 'elegant',
          tone: 'heartfelt',
          variations: 5
        })
      });

      if (response.ok) {
        const data = await response.json();
        setTitleSuggestions(
          data.titles.map(title => ({
            title,
            isDuplicate: false
          }))
        );
        setShowTitlePanel(true);
        setSelectedTitleIndex(0);
      } else {
        const error = await response.json();
        alert('Error generating titles: ' + error.error);
      }
    } catch (error) {
      alert('Error generating titles: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setGeneratingTitle(false);
    }
  };

  const generateSingleTitle = async () => {
    if (!editingCard.front_text && !editingCard.inside_text) {
      alert('Please enter some text first');
      return;
    }

    try {
      setGeneratingTitle(true);
      const response = await fetch('/api/ai/generate-title', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('cardhugs_token')}`
        },
        body: JSON.stringify({
          frontText: editingCard.front_text,
          insideText: editingCard.inside_text,
          occasion: editingCard.occasion,
          style: editingCard.style || 'elegant',
          tone: 'heartfelt'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setEditingCard({
          ...editingCard,
          front_text: data.title
        });
        setTitleSuggestions(
          data.suggestions.map(title => ({
            title,
            isDuplicate: false
          }))
        );
        setShowTitlePanel(true);
      } else {
        const error = await response.json();
        alert('Error generating title: ' + error.error);
      }
    } catch (error) {
      alert('Error generating title: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setGeneratingTitle(false);
    }
  };

  const checkTitleDuplicate = async (title: string) => {
    try {
      const response = await fetch('/api/ai/check-title', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('cardhugs_token')}`
        },
        body: JSON.stringify({
          title,
          occasion: editingCard.occasion
        })
      });

      if (response.ok) {
        const data = await response.json();
        setDuplicateCheck({
          title: data.title,
          exists: data.exists,
          message: data.message
        });
      }
    } catch (error) {
      console.error('Error checking duplicate:', error);
    }
  };

  const selectTitle = (title: string, index: number) => {
    setEditingCard({
      ...editingCard,
      front_text: title
    });
    setSelectedTitleIndex(index);
    checkTitleDuplicate(title);
  };

  const handleSaveCard = async () => {
    try {
      setSaving(true);
      const method = editingCard.id ? 'PUT' : 'POST';
      const url = editingCard.id ? `/api/cards/${editingCard.id}` : '/api/cards';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('cardhugs_token')}`
        },
        body: JSON.stringify(editingCard)
      });

      if (response.ok) {
        alert('Card saved successfully!');
        await loadCards();
        await loadTitleStats();
        handleNewCard();
      } else {
        throw new Error('Failed to save card');
      }
    } catch (error) {
      alert('Error saving card: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCard = async (cardId: string | undefined) => {
    if (!cardId) return;
    if (!window.confirm('Delete this card? This action cannot be undone.')) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/cards/${cardId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('cardhugs_token')}`
        }
      });

      if (response.ok) {
        alert('Card deleted');
        await loadCards();
        await loadTitleStats();
        handleNewCard();
      } else {
        throw new Error('Failed to delete card');
      }
    } catch (error) {
      alert('Error deleting card: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = (side: 'front' | 'inside', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setEditingCard({
          ...editingCard,
          [side === 'front' ? 'front_image_url' : 'inside_image_url']: dataUrl
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-3xl font-bold mb-2">Card Editor with AI Title Generation</h2>
        <p className="text-gray-600">Design cards with AI-powered title suggestions and duplicate prevention</p>
        
        {titleStats && (
          <div className="mt-4 grid grid-cols-4 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="text-sm text-gray-600">Total Cards</p>
              <p className="text-2xl font-bold text-blue-600">{titleStats.totalCards}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <p className="text-sm text-gray-600">Unique Titles</p>
              <p className="text-2xl font-bold text-green-600">{titleStats.uniqueTitles}</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
              <p className="text-sm text-gray-600">Duplicate Rate</p>
              <p className="text-2xl font-bold text-purple-600">{titleStats.duplicateRate}%</p>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
              <p className="text-sm text-gray-600">Occasions</p>
              <p className="text-2xl font-bold text-orange-600">{Object.keys(titleStats.titlesByOccasion).length}</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-4 gap-6">
        {/* Card List */}
        <div className="col-span-1 bg-white rounded-lg border border-gray-200 p-4 h-screen overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">My Cards</h3>
            <button
              onClick={handleNewCard}
              className="p-2 hover:bg-gray-100 rounded text-indigo-600"
              title="New card"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            {loading ? (
              <div className="text-center py-4 text-gray-500">Loading...</div>
            ) : cards.length === 0 ? (
              <div className="text-center py-4 text-gray-500 text-sm">No cards yet</div>
            ) : (
              cards.map((card, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectCard(card)}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition ${
                    selectedCard?.id === card.id || (selectedCard === null && idx === 0)
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="text-xs font-medium text-gray-700 truncate">{card.occasion}</div>
                  <div className="text-xs text-gray-500 truncate mt-1">{card.front_text?.substring(0, 20)}...</div>
                  <div className="mt-2 flex gap-1">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      card.status === 'approved' ? 'bg-green-100 text-green-800' :
                      card.status === 'published' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {card.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Card Editor */}
        <div className="col-span-3 bg-white rounded-lg border border-gray-200 p-6">
          {!editingCard || Object.keys(editingCard).length === 0 ? (
            <div className="flex items-center justify-center h-96 text-gray-500">
              <div className="text-center">
                <Plus className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Create a new card or select one from the list</p>
              </div>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className="flex gap-4 border-b border-gray-200 mb-6">
                <button
                  onClick={() => setActiveTab('front')}
                  className={`px-4 py-2 font-medium border-b-2 transition ${
                    activeTab === 'front'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Front
                </button>
                <button
                  onClick={() => setActiveTab('inside')}
                  className={`px-4 py-2 font-medium border-b-2 transition ${
                    activeTab === 'inside'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Inside
                </button>
              </div>

              {/* Card Details */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Occasion</label>
                  <select
                    value={editingCard.occasion || ''}
                    onChange={(e) => setEditingCard({ ...editingCard, occasion: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {occasions.map((occ) => (
                      <option key={occ} value={occ}>{occ}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Style</label>
                  <select
                    value={editingCard.style || 'elegant'}
                    onChange={(e) => setEditingCard({ ...editingCard, style: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {styles.map((style) => (
                      <option key={style} value={style}>{style.charAt(0).toUpperCase() + style.slice(1)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={editingCard.status}
                    onChange={(e) => setEditingCard({ ...editingCard, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="approved">Approved</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>

              {/* Front Content */}
              {activeTab === 'front' && (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Type className="w-4 h-4" /> Card Title
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={generateSingleTitle}
                          disabled={generatingTitle || (!editingCard.front_text && !editingCard.inside_text)}
                          className="flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 text-sm font-medium transition"
                        >
                          <Sparkles className="w-4 h-4" />
                          {generatingTitle ? 'Generating...' : 'AI Generate'}
                        </button>
                        <button
                          onClick={generateAITitles}
                          disabled={generatingTitle || (!editingCard.front_text && !editingCard.inside_text)}
                          className="flex items-center gap-1 px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 text-sm font-medium transition"
                        >
                          <RefreshCw className="w-4 h-4" />
                          {generatingTitle ? 'Generating...' : 'Get Variations'}
                        </button>
                      </div>
                    </div>
                    
                    <textarea
                      value={editingCard.front_text}
                      onChange={(e) => {
                        setEditingCard({ ...editingCard, front_text: e.target.value });
                        if (e.target.value.length > 0) {
                          checkTitleDuplicate(e.target.value);
                        }
                      }}
                      placeholder="Enter card title or generate with AI..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-lg"
                    />

                    {duplicateCheck && (
                      <div className={`mt-2 p-2 rounded-lg flex items-center gap-2 text-sm ${
                        duplicateCheck.exists 
                          ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' 
                          : 'bg-green-50 text-green-800 border border-green-200'
                      }`}>
                        {duplicateCheck.exists ? (
                          <AlertCircle className="w-4 h-4" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        {duplicateCheck.message}
                      </div>
                    )}
                  </div>

                  {/* Title Suggestions Panel */}
                  {showTitlePanel && titleSuggestions.length > 0 && (
                    <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                      <h4 className="text-sm font-semibold text-indigo-900 mb-3">Suggested Titles</h4>
                      <div className="space-y-2">
                        {titleSuggestions.map((suggestion, idx) => (
                          <button
                            key={idx}
                            onClick={() => selectTitle(suggestion.title, idx)}
                            className={`w-full text-left p-3 rounded-lg border-2 transition ${
                              selectedTitleIndex === idx
                                ? 'border-indigo-600 bg-white shadow-md'
                                : 'border-indigo-200 bg-white hover:border-indigo-400'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-gray-900">{suggestion.title}</span>
                              {selectedTitleIndex === idx && (
                                <CheckCircle className="w-4 h-4 text-indigo-600" />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => setShowTitlePanel(false)}
                        className="mt-3 w-full px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg"
                      >
                        Hide Suggestions
                      </button>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" /> Front Image
                    </label>
                    {editingCard.front_image_url && (
                      <div className="mb-3 relative">
                        <img src={editingCard.front_image_url} alt="Front" className="w-full h-48 object-cover rounded-lg" />
                        <button
                          onClick={() => setEditingCard({ ...editingCard, front_image_url: undefined })}
                          className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload('front', e)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              )}

              {/* Inside Content */}
              {activeTab === 'inside' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Type className="w-4 h-4" /> Inside Text
                    </label>
                    <textarea
                      value={editingCard.inside_text}
                      onChange={(e) => setEditingCard({ ...editingCard, inside_text: e.target.value })}
                      placeholder="Enter text for the inside of the card..."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" /> Inside Image
                    </label>
                    {editingCard.inside_image_url && (
                      <div className="mb-3 relative">
                        <img src={editingCard.inside_image_url} alt="Inside" className="w-full h-48 object-cover rounded-lg" />
                        <button
                          onClick={() => setEditingCard({ ...editingCard, inside_image_url: undefined })}
                          className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload('inside', e)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-8 flex gap-3 pt-6 border-t border-gray-200">
                <button
                  onClick={handleSaveCard}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 flex items-center justify-center gap-2 font-medium transition"
                >
                  <Save className="w-4 h-4" />
                  Save Card
                </button>

                {editingCard.id && (
                  <button
                    onClick={() => handleDeleteCard(editingCard.id)}
                    disabled={saving}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 flex items-center gap-2 font-medium transition"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                )}

                <button
                  onClick={handleNewCard}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CardEditor;
