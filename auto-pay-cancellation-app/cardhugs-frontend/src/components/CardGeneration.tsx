import React, { useEffect, useState } from 'react';
import { Occasion, TrainingJob } from '../types';
import { occasionAPI, trainingAPI } from '../services/api';
import { Sparkles, Loader, X, Eye, Download } from 'lucide-react';

const CardGeneration: React.FC = () => {
  // State
  const [occasions, setOccasions] = useState<Occasion[]>([]);
  const [trainingJobs, setTrainingJobs] = useState<TrainingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Form state
  const [selectedOccasion, setSelectedOccasion] = useState<Occasion | null>(null);
  const [selectedLoraModel, setSelectedLoraModel] = useState<TrainingJob | null>(null);
  const [cardCount, setCardCount] = useState(4);
  
  // Card generation state
  const [generatedCards, setGeneratedCards] = useState<any[]>([]);
  const [selectedCard, setSelectedCard] = useState<any | null>(null);

  // API call state
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [occasionsData, trainingData] = await Promise.all([
        occasionAPI.getAll({ is_active: true, limit: 100 }),
        trainingAPI.getAll({ status: 'completed', limit: 100 }),
      ]);
      setOccasions(occasionsData.occasions || []);
      setTrainingJobs(trainingData.jobs || []);
    } catch (err) {
      setError('Failed to load occasions or training jobs');
    } finally {
      setLoading(false);
    }
  };

  const generateTexts = async () => {
    if (!selectedOccasion) {
      setError('Please select an occasion');
      return;
    }

    try {
      setGenerating(true);
      setError('');

      const response = await fetch('/api/cards/generate-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('cardhugs_token')}`,
        },
        body: JSON.stringify({
          occasion: selectedOccasion.id,
          occasion_name: selectedOccasion.name,
          count: cardCount,
          lora_model: selectedLoraModel?.id,
          lora_trigger_word: selectedLoraModel?.trigger_word,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate text');
      }

      const data = await response.json();
      setGeneratedCards(data.cards || []);
      setSuccess(`Generated ${data.cards?.length || 0} card variations`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate text');
    } finally {
      setGenerating(false);
    }
  };

  const generateCardImages = async (card: any) => {
    if (!selectedOccasion) {
      setError('Please select an occasion');
      return;
    }

    try {
      setGenerating(true);
      setError('');

      const prompt = selectedLoraModel
        ? `${card.front_text} | ${selectedLoraModel.trigger_word} style`
        : card.front_text;

      const response = await fetch('/api/cards/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('cardhugs_token')}`,
        },
        body: JSON.stringify({
          occasion_id: selectedOccasion.id,
          front_text: card.front_text,
          inside_text: card.inside_text,
          prompt,
          lora_model_id: selectedLoraModel?.id,
          style: selectedOccasion.name,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate images');
      }

      const data = await response.json();
      setSelectedCard({
        ...card,
        front_image_url: data.front_image_url,
        inside_image_url: data.inside_image_url,
        generated: true,
      });
      setSuccess('Card images generated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate images');
    } finally {
      setGenerating(false);
    }
  };

  const saveCard = async () => {
    if (!selectedCard) return;

    try {
      const response = await fetch('/api/cards/save-generated', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('cardhugs_token')}`,
        },
        body: JSON.stringify({
          occasion_id: selectedOccasion?.id,
          front_text: selectedCard.front_text,
          inside_text: selectedCard.inside_text,
          front_image_url: selectedCard.front_image_url,
          inside_image_url: selectedCard.inside_image_url,
          lora_model_id: selectedLoraModel?.id,
          style: selectedOccasion?.name,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save card');
      }

      setSuccess('Card saved to library');
      setSelectedCard(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save card');
    }
  };

  const downloadCard = (imageUrl: string): void => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = 'card.png';
    link.click();
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <Loader className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-600" />
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold mb-2">Card Generator</h2>
        <p className="text-gray-600 mb-6">Create custom cards with AI-generated images and text</p>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
            <X className="w-4 h-4" />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel: Configuration */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">Card Configuration</h3>

              {/* Occasion Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Occasion *
                </label>
                <select
                  value={selectedOccasion?.id || ''}
                  onChange={(e) => {
                    const occasion = occasions.find(o => o.id === e.target.value);
                    setSelectedOccasion(occasion || null);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select an occasion...</option>
                  {occasions.map(occasion => (
                    <option key={occasion.id} value={occasion.id}>
                      {occasion.emoji} {occasion.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* LoRA Model Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Style Model (Optional)
                </label>
                <select
                  value={selectedLoraModel?.id || ''}
                  onChange={(e) => {
                    const model = trainingJobs.find(m => m.id === e.target.value);
                    setSelectedLoraModel(model || null);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">No custom style</option>
                  {trainingJobs.map(job => (
                    <option key={job.id} value={job.id}>
                      {job.name} (trigger: {job.trigger_word})
                    </option>
                  ))}
                </select>
              </div>

              {/* Card Count */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Generate Variations: {cardCount}
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={cardCount}
                  onChange={(e) => setCardCount(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Generate Button */}
              <button
                onClick={generateTexts}
                disabled={!selectedOccasion || generating}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 flex items-center justify-center gap-2 font-medium"
              >
                {generating ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Text Variations
                  </>
                )}
              </button>

              {selectedOccasion && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-900">
                    <strong>Selected:</strong> {selectedOccasion.emoji} {selectedOccasion.name}
                  </p>
                  {selectedLoraModel && (
                    <p className="text-sm text-blue-900 mt-1">
                      <strong>Style:</strong> {selectedLoraModel.name}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Text Variations and Card Preview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Generated Variations */}
            {generatedCards.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4">Text Variations ({generatedCards.length})</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {generatedCards.map((card, index) => (
                    <div
                      key={index}
                      onClick={() => generateCardImages(card)}
                      className={`p-4 border rounded-lg cursor-pointer transition ${
                        selectedCard?.front_text === card.front_text
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-gray-500 font-medium">FRONT</p>
                          <p className="text-sm font-semibold text-gray-900">{card.front_text}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-medium">INSIDE</p>
                          <p className="text-sm text-gray-700">{card.inside_text}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Card Preview */}
            {selectedCard && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Card Preview
                </h3>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  {/* Front */}
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-2 uppercase">Front</p>
                    {selectedCard.front_image_url ? (
                      <img
                        src={selectedCard.front_image_url}
                        alt="Front"
                        className="w-full h-64 object-cover rounded-lg border border-gray-200"
                      />
                    ) : (
                      <div className="w-full h-64 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500">
                        <Loader className="w-8 h-8 animate-spin" />
                      </div>
                    )}
                    <p className="text-sm font-medium text-gray-900 mt-2">{selectedCard.front_text}</p>
                  </div>

                  {/* Inside */}
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-2 uppercase">Inside</p>
                    {selectedCard.inside_image_url ? (
                      <img
                        src={selectedCard.inside_image_url}
                        alt="Inside"
                        className="w-full h-64 object-cover rounded-lg border border-gray-200"
                      />
                    ) : (
                      <div className="w-full h-64 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500">
                        <Loader className="w-8 h-8 animate-spin" />
                      </div>
                    )}
                    <p className="text-sm font-medium text-gray-900 mt-2">{selectedCard.inside_text}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {selectedCard.front_image_url && (
                    <button
                      onClick={() => downloadCard(selectedCard.front_image_url)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download Front
                    </button>
                  )}
                  {selectedCard.inside_image_url && (
                    <button
                      onClick={() => downloadCard(selectedCard.inside_image_url)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download Inside
                    </button>
                  )}
                  <button
                    onClick={saveCard}
                    disabled={!selectedCard.front_image_url || !selectedCard.inside_image_url}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium"
                  >
                    Save to Library
                  </button>
                </div>
              </div>
            )}

            {!generatedCards.length && !selectedCard && (
              <div className="bg-gray-50 rounded-lg border border-dashed border-gray-300 p-12 text-center">
                <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">Select an occasion to get started</p>
                <p className="text-sm text-gray-500 mt-1">Choose a style and generate text variations</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardGeneration;
