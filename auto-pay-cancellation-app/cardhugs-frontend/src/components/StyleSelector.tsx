import React, { useEffect, useState } from 'react';
import { Palette, Search, Filter } from 'lucide-react';

interface Style {
  id: string;
  name: string;
  slug: string;
  emoji?: string;
  category?: string;
  color?: string;
  training_status?: 'trained' | 'training' | 'pending';
  popularity_score?: number;
  style_keywords?: string[];
}

interface StyleSelectorProps {
  value?: string | string[];
  onChange?: (styleId: string) => void;
  onSelectMultiple?: (styleIds: string[]) => void;
  multiSelect?: boolean;
  category?: string;
  showStats?: boolean;
  showOnlyTrained?: boolean;
}

export const StyleSelector: React.FC<StyleSelectorProps> = ({
  value,
  onChange,
  onSelectMultiple,
  multiSelect = false,
  category,
  showStats = true,
  showOnlyTrained = true,
}) => {
  const [styles, setStyles] = useState<Style[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(category || 'all');
  const [selectedStyles, setSelectedStyles] = useState<Set<string>>(
    new Set(multiSelect && Array.isArray(value) ? value : [])
  );

  const categories = ['all', 'illustration', 'aesthetic', 'theme', 'effect', 'demographic'];

  useEffect(() => {
    fetchStyles();
  }, [selectedCategory]);

  const fetchStyles = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      if (showOnlyTrained) {
        params.append('training_status', 'trained');
      }

      const response = await fetch(`/api/visual-styles?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('cardhugs_token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStyles(data.styles || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredStyles = styles.filter(
    (style) =>
      style.name.toLowerCase().includes(search.toLowerCase()) ||
      style.slug.toLowerCase().includes(search.toLowerCase()) ||
      (style.style_keywords && style.style_keywords.some((k: string) => k.toLowerCase().includes(search.toLowerCase())))
  );

  const handleStyleSelect = (styleId: string) => {
    if (multiSelect) {
      const newSelection = new Set(selectedStyles);
      if (newSelection.has(styleId)) {
        newSelection.delete(styleId);
      } else {
        newSelection.add(styleId);
      }
      setSelectedStyles(newSelection);
      onSelectMultiple?.(Array.from(newSelection));
    } else {
      onChange?.(styleId);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Palette className="w-5 h-5 text-indigo-600" />
        <h3 className="text-lg font-semibold">{multiSelect ? 'Select Styles' : 'Choose Style'}</h3>
        {showStats && (
          <span className="ml-auto text-sm text-gray-600">
            {selectedCategory === 'all' ? styles.length : filteredStyles.length} available
          </span>
        )}
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === cat
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
        <input
          type="text"
          placeholder="Search styles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {/* Loading */}
      {loading ? (
        <div className="text-center py-8 text-gray-600">Loading styles...</div>
      ) : (
        <>
          {/* Styles Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto">
            {filteredStyles.map((style) => (
              <button
                key={style.id}
                onClick={() => handleStyleSelect(style.id)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  (multiSelect ? selectedStyles.has(style.id) : value === style.id)
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 bg-white hover:border-indigo-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2 flex-1">
                    <span className="text-2xl">{style.emoji}</span>
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">{style.name}</h4>
                      <p className="text-xs text-gray-600 mt-1">
                        {style.category?.charAt(0).toUpperCase() + style.category?.slice(1)}
                      </p>
                    </div>
                  </div>
                  {(multiSelect ? selectedStyles.has(style.id) : value === style.id) && (
                    <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </div>

                {/* Style Details */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div
                    className="w-full h-2 rounded mb-2"
                    style={{ backgroundColor: style.color }}
                  />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">
                      {style.training_status === 'trained' && '✅ Ready'}
                      {style.training_status === 'training' && '🔄 Training'}
                      {style.training_status === 'pending' && '⏳ Pending'}
                    </span>
                    {style.popularity_score && (
                      <span className="text-gray-600">⭐ {style.popularity_score}</span>
                    )}
                  </div>
                </div>

                {/* Keywords */}
                {style.style_keywords && style.style_keywords.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {style.style_keywords.slice(0, 2).map((keyword: string) => (
                      <span
                        key={keyword}
                        className="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>

          {filteredStyles.length === 0 && (
            <div className="text-center py-8 text-gray-600">
              <Filter className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No styles match your search</p>
            </div>
          )}

          {/* Selected Summary */}
          {multiSelect && selectedStyles.size > 0 && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
              <p className="text-sm font-medium text-indigo-900">
                {selectedStyles.size} style{selectedStyles.size !== 1 ? 's' : ''} selected
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {Array.from(selectedStyles).map((styleId) => {
                  const style = styles.find((s) => s.id === styleId);
                  return (
                    style && (
                      <div
                        key={styleId}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded border border-indigo-200 text-sm"
                      >
                        <span>{style.emoji}</span>
                        <span className="font-medium">{style.name}</span>
                        <button
                          onClick={() => handleStyleSelect(styleId)}
                          className="ml-1 text-indigo-600 hover:text-indigo-700 font-bold"
                        >
                          ✕
                        </button>
                      </div>
                    )
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StyleSelector;
