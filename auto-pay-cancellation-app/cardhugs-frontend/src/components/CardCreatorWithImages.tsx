import React, { useState } from 'react';
import { Sparkles, Image as ImageIcon, Download, Loader2, RefreshCw, Edit2 } from 'lucide-react';

interface GeneratedCard {
  id: string;
  front_headline: string;
  inside_message: string;
  image_url?: string;
  style: string;
  status: 'generating-text' | 'generating-image' | 'complete' | 'error';
}

interface TextVariation {
  front_headline: string;
  inside_message: string;
  variation_id: number;
}

export function CardCreatorWithImages() {
  // Form state
  const [occasion, setOccasion] = useState('birthday');
  const [tone, setTone] = useState<'heartfelt' | 'funny' | 'formal'>('heartfelt');
  const [audience, setAudience] = useState('friend');
  const [styleName, setStyleName] = useState('watercolor_floral');
  const [quantity, setQuantity] = useState(3);

  // Generation state
  const [textVariations, setTextVariations] = useState<TextVariation[]>([]);
  const [cards, setCards] = useState<GeneratedCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [error, setError] = useState('');

  // Get auth token
  const getAuthToken = () => {
    return localStorage.getItem('cardhugs_token') || '';
  };

  // Step 1: Generate text variations
  const generateTextVariations = async () => {
    setLoading(true);
    setError('');
    setTextVariations([]);
    setCards([]);

    try {
      const response = await fetch('/api/text-generation/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          occasion,
          tone,
          audience,
          style_name: styleName,
          quantity
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate text');
      }

      setTextVariations(data.data.texts);
      setSelectedCardIndex(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate text');
      console.error('Text generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Generate image for selected text
  const generateImageForText = async (textVariation: TextVariation, index: number) => {
    setError('');

    // Create card entry for tracking
    const cardId = `card-${Date.now()}-${index}`;
    const newCard: GeneratedCard = {
      id: cardId,
      front_headline: textVariation.front_headline,
      inside_message: textVariation.inside_message,
      style: styleName,
      status: 'generating-image'
    };

    setCards(prev => {
      const updated = [...prev];
      const existingIndex = updated.findIndex(c => c.front_headline === textVariation.front_headline);
      if (existingIndex >= 0) {
        updated[existingIndex] = newCard;
      } else {
        updated.push(newCard);
      }
      return updated;
    });

    try {
      // Build prompt with text embedded
      const prompt = `${styleName} style greeting card design for ${occasion}. Front text: "${textVariation.front_headline}". Inside text: "${textVariation.inside_message}"`;

      const response = await fetch('/api/images/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          prompt,
          style_name: styleName,
          occasion,
          lora_model: `cardhugs-${styleName}`,
          front_text: textVariation.front_headline,
          inside_text: textVariation.inside_message
        })
      });

      const imageData = await response.json();

      if (!imageData.success) {
        throw new Error(imageData.error || 'Image generation failed');
      }

      // Update card with image
      setCards(prev =>
        prev.map(c =>
          c.front_headline === textVariation.front_headline
            ? {
              ...c,
              image_url: imageData.data.image_url,
              status: 'complete'
            }
            : c
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate image');
      console.error('Image generation error:', err);

      setCards(prev =>
        prev.map(c =>
          c.front_headline === textVariation.front_headline
            ? { ...c, status: 'error' }
            : c
        )
      );
    }
  };

  // Generate all images for selected variations
  const generateAllImages = async () => {
    if (textVariations.length === 0) return;

    setLoading(true);
    setError('');

    for (let i = 0; i < Math.min(textVariations.length, quantity); i++) {
      await generateImageForText(textVariations[i], i);
      // Small delay between generations
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setLoading(false);
  };

  // Download card image
  const downloadCard = (card: GeneratedCard) => {
    if (!card.image_url) return;

    const link = document.createElement('a');
    link.href = card.image_url;
    link.download = `card-${card.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Save card to library
  const saveCardToLibrary = async (card: GeneratedCard) => {
    try {
      const response = await fetch('/api/cards/save-generated', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          occasion_id: occasion,
          front_text: card.front_headline,
          inside_text: card.inside_message,
          front_image_url: card.image_url,
          inside_image_url: card.image_url,
          lora_model_id: styleName,
          style: styleName
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to save card');
      }

      alert(`✅ Card "${card.front_headline}" saved to library!`);
    } catch (err) {
      alert(`Error saving card: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const occasions = [
    { value: 'birthday', label: '🎂 Birthday' },
    { value: 'mothers_day', label: '💐 Mother\'s Day' },
    { value: 'fathers_day', label: '👔 Father\'s Day' },
    { value: 'valentines_day', label: '❤️ Valentine\'s Day' },
    { value: 'christmas', label: '🎄 Christmas' },
    { value: 'thank_you', label: '🙏 Thank You' },
    { value: 'wedding', label: '💍 Wedding' },
    { value: 'anniversary', label: '💕 Anniversary' }
  ];

  const styles = [
    { value: 'watercolor_floral', label: '🎨 Watercolor Floral' },
    { value: 'minimalist_modern', label: '⬜ Minimalist Modern' },
    { value: 'vintage_classic', label: '📖 Vintage Classic' },
    { value: 'hand_drawn_whimsical', label: '✏️ Hand Drawn Whimsical' },
    { value: 'bold_geometric', label: '🔶 Bold Geometric' }
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg shadow-lg p-8">
        <h1 className="text-4xl font-bold mb-2">Create Cards with AI</h1>
        <p className="text-lg opacity-90">Generate beautiful greeting cards with text and images</p>
      </div>

      {/* Configuration Panel */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">Card Configuration</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {/* Occasion */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Occasion</label>
            <select
              value={occasion}
              onChange={(e) => setOccasion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {occasions.map(occ => (
                <option key={occ.value} value={occ.value}>{occ.label}</option>
              ))}
            </select>
          </div>

          {/* Tone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tone</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value as 'heartfelt' | 'funny' | 'formal')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="heartfelt">💝 Heartfelt</option>
              <option value="funny">😄 Funny</option>
              <option value="formal">🎩 Formal</option>
            </select>
          </div>

          {/* Audience */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Audience</label>
            <input
              type="text"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="e.g., mother, friend, colleague"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Style */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Visual Style</label>
            <select
              value={styleName}
              onChange={(e) => setStyleName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {styles.map(style => (
                <option key={style.value} value={style.value}>{style.label}</option>
              ))}
            </select>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Variations: {quantity}</label>
            <input
              type="range"
              min="1"
              max="10"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
            <span>⚠️</span>
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={generateTextVariations}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-gray-400 disabled:to-gray-400 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition"
          >
            {loading && textVariations.length === 0 ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating Text...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate {quantity} Text Variations
              </>
            )}
          </button>

          {textVariations.length > 0 && cards.length < textVariations.length && (
            <button
              onClick={generateAllImages}
              disabled={loading || cards.length >= textVariations.length}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-700 hover:to-pink-800 disabled:from-gray-400 disabled:to-gray-400 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition"
            >
              {loading && cards.length > 0 ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating Images...
                </>
              ) : (
                <>
                  <ImageIcon className="w-5 h-5" />
                  Generate All Images
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Text Variations Panel */}
      {textVariations.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4">Text Variations ({textVariations.length})</h2>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {textVariations.map((variation, index) => (
              <div
                key={index}
                onClick={() => generateImageForText(variation, index)}
                className="p-4 border-2 rounded-lg cursor-pointer transition hover:border-purple-500 hover:bg-purple-50"
              >
                <p className="text-xs text-gray-500 font-medium mb-1">FRONT</p>
                <p className="font-semibold text-gray-900 mb-2">{variation.front_headline}</p>
                <p className="text-xs text-gray-500 font-medium mb-1">INSIDE</p>
                <p className="text-sm text-gray-700">{variation.inside_message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generated Cards Grid */}
      {cards.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-6">Generated Cards ({cards.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map((card) => (
              <div key={card.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition">
                {/* Image */}
                <div className="aspect-[3/4] bg-gradient-to-br from-purple-100 to-pink-100 relative overflow-hidden">
                  {card.status === 'generating-image' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80">
                      <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-purple-600" />
                        <p className="text-sm text-gray-600">Generating image...</p>
                      </div>
                    </div>
                  )}

                  {card.status === 'complete' && card.image_url && (
                    <img
                      src={card.image_url}
                      alt={card.front_headline}
                      className="w-full h-full object-cover"
                    />
                  )}

                  {card.status === 'error' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-red-50">
                      <p className="text-red-600 text-center px-4">❌ Image generation failed</p>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-2 text-gray-900">{card.front_headline}</h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{card.inside_message}</p>

                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <span className="capitalize px-2 py-1 bg-gray-100 rounded">{card.style.replace(/_/g, ' ')}</span>
                    <span className="capitalize">
                      {card.status === 'complete' ? '✅ Ready' : card.status === 'error' ? '❌ Failed' : '⏳ Loading'}
                    </span>
                  </div>

                  {/* Actions */}
                  {card.status === 'complete' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => downloadCard(card)}
                        className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded flex items-center justify-center gap-1 transition"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                      <button
                        onClick={() => saveCardToLibrary(card)}
                        className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded flex items-center justify-center gap-1 transition"
                      >
                        <Sparkles className="w-4 h-4" />
                        Save
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {textVariations.length === 0 && cards.length === 0 && !loading && (
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border-2 border-dashed border-purple-200 p-12 text-center">
          <Sparkles className="w-16 h-16 text-purple-400 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Start Creating Cards</h3>
          <p className="text-gray-600">Configure your card settings and click "Generate Text Variations" to begin</p>
        </div>
      )}
    </div>
  );
}

export default CardCreatorWithImages;
