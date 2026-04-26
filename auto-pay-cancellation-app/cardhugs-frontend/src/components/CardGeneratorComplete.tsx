import React, { useState, useEffect } from 'react';
import { Sparkles, Loader, Download, Save, X, Printer, Share2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { occasionAPI, trainingAPI, tonesAPI, visualStylesAPI } from '../services/api';
import { Tooltip, HelpIcon } from './Tooltip';
import type { Occasion, TrainingJob } from '../types';

const CardGeneratorComplete: React.FC = () => {
  const [occasions, setOccasions] = useState<Occasion[]>([]);
  const [tones, setTones] = useState<any[]>([]);
  const [visualStyles, setVisualStyles] = useState<any[]>([]);
  const [trainingJobs, setTrainingJobs] = useState<TrainingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Form state
  const [selectedOccasion, setSelectedOccasion] = useState('');
  const [tone, setTone] = useState('Heartfelt');
  const [style, setStyle] = useState('Elegant');
  const [variations, setVariations] = useState(3);
  const [selectedLoRA, setSelectedLoRA] = useState('');

  // Naming state
  const [nextCardNames, setNextCardNames] = useState<{ front: string; inside: string; sequence: number } | null>(null);
  const [loadingNames, setLoadingNames] = useState(false);

  // Results
  const [cards, setCards] = useState<any[]>([]);
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showNamingModal, setShowNamingModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Personalization fields
  const [recipientName, setRecipientName] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [senderName, setSenderName] = useState('');
  const [signature, setSignature] = useState('');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [occasionsData, tonesData, stylesData, trainingData] = await Promise.all([
        occasionAPI.getAll({ is_active: true }),
        tonesAPI.getAll({ is_active: true }),
        visualStylesAPI.getAll({ is_active: true }),
        trainingAPI.getAll({ status: 'completed' })
      ]);
      setOccasions(occasionsData.occasions || []);
      setTones(tonesData.tones || []);
      setVisualStyles(stylesData.styles || []);
      setTrainingJobs(trainingData.jobs || []);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load options');
    } finally {
      setLoading(false);
    }
  };

  // Load next card names when occasion changes
  useEffect(() => {
    if (selectedOccasion) {
      fetchNextCardNames();
    }
  }, [selectedOccasion]);

  const fetchNextCardNames = async () => {
    if (!selectedOccasion) return;
    
    try {
      setLoadingNames(true);
      const response = await fetch(`/api/cards/naming/next/${selectedOccasion}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('cardhugs_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNextCardNames({
          front: data.front,
          inside: data.inside,
          sequence: data.sequence
        });
      }
    } catch (err) {
      console.error('Error fetching card names:', err);
    } finally {
      setLoadingNames(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedOccasion) {
      setError('Please select an occasion');
      return;
    }

    setGenerating(true);
    setError('');
    setSuccess('');
    setCards([]);

    try {
      const response = await fetch('/api/cards/generate-complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('cardhugs_token')}`
        },
        body: JSON.stringify({
          occasion: selectedOccasion,
          tone,
          style,
          variations,
          lora_model_id: selectedLoRA || undefined
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate cards');
      }

      const data = await response.json();
      setCards(data.cards);
      setSuccess(`Generated ${data.count} premium cards!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate cards');
    } finally {
      setGenerating(false);
    }
  };

  const handleSelectCard = (card: any) => {
    setSelectedCard(card);
    setRecipientName('');
    setCustomMessage(card.inside_message || '');
    setSenderName('');
    setSignature('');
  };

  const handleSaveCard = async () => {
    if (!selectedCard || !nextCardNames) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/cards/save-with-naming', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('cardhugs_token')}`
        },
        body: JSON.stringify({
          occasion_id: selectedOccasion,
          front_text: selectedCard.front_text,
          inside_message: customMessage || selectedCard.inside_message,
          front_image_url: selectedCard.front_image_url,
          concept_title: selectedCard.concept_title,
          style,
          tone,
          emotional_impact: selectedCard.emotional_impact,
          uniqueness_factor: selectedCard.uniqueness_factor,
          design_suggestions: selectedCard.design_suggestions,
          lora_model_id: selectedLoRA || undefined,
          personalization: {
            recipient_name: recipientName,
            custom_message: customMessage,
            sender_name: senderName,
            signature: signature
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save card');
      }

      const data = await response.json();
      setSuccess(`✅ Card saved!\n\n📄 ${data.card.card_name}\n📄 ${data.card.card_inside_name}`);
      
      setTimeout(() => {
        setSuccess('');
        setShowNamingModal(false);
        setSelectedCard(null);
        // Refresh card names for next save
        fetchNextCardNames();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save card');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold mb-2">Premium Card Generator 🏆</h2>
      <p className="text-gray-600 mb-6">
        Generate professional-quality greeting cards organized by occasion. Cards are automatically named for store inventory.
      </p>

      {/* Alerts */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 whitespace-pre-line flex gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 whitespace-pre-line font-mono text-sm flex gap-2">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>{success}</div>
        </div>
      )}

      {/* Configuration */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Card Configuration</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {/* Occasion */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
              Occasion <HelpIcon text="Select the occasion for the card (Birthday, Anniversary, etc.)" />
            </label>
            <select
              value={selectedOccasion}
              onChange={(e) => setSelectedOccasion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select...</option>
              {occasions.map(occ => (
                <option key={occ.id} value={occ.id}>
                  {occ.emoji} {occ.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
              Tone <HelpIcon text="Emotional tone: Heartfelt, Funny, Formal, Casual, etc." />
            </label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              {tones.map(t => (
                <option key={t.id} value={t.name}>
                  {t.emoji} {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Style */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
              Visual Style <HelpIcon text="Choose the visual look of the card (Watercolor, Modern, Elegant, etc.)" />
            </label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              {visualStyles.map(s => (
                <option key={s.id} value={s.name}>
                  {s.emoji} {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* LoRA Model */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
              Custom Style <HelpIcon text="LoRA models are fine-tuned AI models trained on specific visual styles for consistent branding" />
            </label>
            <select
              value={selectedLoRA}
              onChange={(e) => setSelectedLoRA(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">None</option>
              {trainingJobs.map(job => (
                <option key={job.id} value={job.id}>
                  {job.name}
                </option>
              ))}
            </select>
          </div>

          {/* Variations */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
              Variations <HelpIcon text="Generate multiple card designs (1-5). More variations = longer processing time" />
            </label>
            <div className="space-y-2">
              <input
                type="range"
                min="1"
                max="5"
                value={variations}
                onChange={(e) => setVariations(parseInt(e.target.value))}
                className="w-full"
              />
              <p className="text-center text-sm font-bold text-indigo-600">{variations}</p>
            </div>
          </div>
        </div>

        {/* Next Card Names Preview */}
        {nextCardNames && (
          <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200 mb-6">
            <p className="text-sm font-semibold text-indigo-900 mb-2">Next Card Name (Sequence #{nextCardNames.sequence}):</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-mono bg-white px-3 py-1 rounded border border-indigo-300 text-indigo-900">
                  {nextCardNames.front}
                </span>
                <span className="text-gray-600">(Front)</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-mono bg-white px-3 py-1 rounded border border-indigo-300 text-indigo-900">
                  {nextCardNames.inside}
                </span>
                <span className="text-gray-600">(Inside)</span>
              </div>
            </div>
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={!selectedOccasion || generating}
          className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 flex items-center justify-center gap-2 font-medium"
        >
          {generating ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Generating Premium Cards... (2-3 minutes per card)
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate Premium Cards
            </>
          )}
        </button>
      </div>

      {/* Cards Grid */}
      {cards.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-4">Generated Premium Cards ({cards.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map((card, idx) => (
              <div
                key={idx}
                className={`border-2 rounded-lg overflow-hidden transition cursor-pointer shadow-md ${
                  selectedCard?.variation_number === card.variation_number
                    ? 'border-indigo-500 shadow-lg'
                    : 'border-gray-200 hover:border-indigo-300'
                }`}
                onClick={() => handleSelectCard(card)}
              >
                {/* Image */}
                <div className="bg-gray-100 h-64 overflow-hidden">
                  <img
                    src={card.front_image_url}
                    alt="Card"
                    className="w-full h-full object-cover hover:scale-105 transition"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Image+Failed';
                    }}
                  />
                </div>

                {/* Text Content */}
                <div className="p-4 bg-white">
                  <p className="text-xs text-gray-500 font-medium mb-1">Premium Card {card.variation_number}</p>
                  <p className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {card.front_text}
                  </p>
                  <p className="text-sm text-gray-600 italic line-clamp-2">
                    {card.inside_message}
                  </p>
                </div>

                {/* Click Hint */}
                <div className="px-4 py-2 bg-indigo-50 text-center text-xs text-indigo-600 font-medium">
                  Click to personalize & save →
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview & Personalization Modal */}
      {selectedCard && !showNamingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-4xl w-full my-8">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Card Preview & Personalization</h3>
                {nextCardNames && (
                  <p className="text-xs text-indigo-600 font-mono mt-1">
                    Will be saved as: {nextCardNames.front} / {nextCardNames.inside}
                  </p>
                )}
              </div>
              <button
                onClick={() => setSelectedCard(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content - Two Column Layout */}
            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* LEFT: Card Preview */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 mb-4">Card Preview</h4>
                
                {/* Front of Card */}
                <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-white">
                  <div className="bg-gray-100 h-64 overflow-hidden">
                    <img
                      src={selectedCard.front_image_url}
                      alt="Card front"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6 text-center space-y-4">
                    <p className="text-xl font-semibold text-gray-900">
                      {selectedCard.front_text}
                    </p>
                  </div>
                </div>

                {/* Inside of Card Preview */}
                <div className="border-2 border-gray-200 rounded-lg p-6 bg-gradient-to-br from-blue-50 to-indigo-50 space-y-6 text-center">
                  <div className="text-sm text-gray-600 font-medium">
                    INSIDE OF CARD
                  </div>

                  {/* Salutation with fill-in */}
                  <div className="text-lg">
                    <span className="text-gray-700">Dear</span>
                    <span className="ml-2 px-2 py-1 border-b-2 border-gray-400 min-w-32 inline-block text-gray-900 font-semibold">
                      {recipientName || '___________'}
                    </span>
                  </div>

                  {/* Personalized Message */}
                  <div className="py-6 px-4 bg-white bg-opacity-50 rounded-lg italic text-gray-700 min-h-12">
                    {customMessage || selectedCard.inside_message || '(personalized message)'}
                  </div>

                  {/* Closing with signature */}
                  <div className="text-lg space-y-2">
                    <div>
                      <span className="text-gray-700">Love,</span>
                      <span className="ml-2 px-2 py-1 border-b-2 border-gray-400 min-w-32 inline-block text-gray-900 font-semibold">
                        {senderName || '___________'}
                      </span>
                    </div>
                    {signature && (
                      <div className="text-xs text-gray-500 italic pt-2">
                        {signature}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT: Personalization Fields */}
              <div className="space-y-6">
                <h4 className="font-semibold text-gray-900">Personalize Your Card</h4>

                {/* Recipient Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    Recipient Name <HelpIcon text="The name that appears after 'Dear'" />
                  </label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="e.g., Mom, Sarah, Friend"
                    maxLength={30}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This fills in the "Dear ___" line
                  </p>
                </div>

                {/* Custom Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    Custom Message <HelpIcon text="Add a personal touch with your own message" />
                  </label>
                  <textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Add a personal message (5-10 words)"
                    maxLength={100}
                    rows={2}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty to use premium generated message
                  </p>
                </div>

                {/* Sender Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    Your Name <HelpIcon text="The name that appears after 'Love'" />
                  </label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="e.g., Your name"
                    maxLength={30}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This fills in the "Love, ___" line
                  </p>
                </div>

                {/* Optional Signature Note */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    Additional Note <HelpIcon text="Optional message that appears at the bottom of the card" />
                  </label>
                  <input
                    type="text"
                    value={signature}
                    onChange={(e) => setSignature(e.target.value)}
                    placeholder="e.g., Hope to see you soon!"
                    maxLength={50}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Appears at the bottom (optional)
                  </p>
                </div>

                {/* Info Box */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-900">
                    <strong>✨ Premium Quality:</strong> This card was created using elite AI copywriting and professional-grade image generation.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer - Action Buttons */}
            <div className="bg-gray-50 border-t p-6 flex gap-2 justify-end">
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = selectedCard.front_image_url;
                  link.download = 'card-front.png';
                  link.click();
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download Image
              </button>
              <button
                onClick={() => setShowNamingModal(true)}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 font-medium"
              >
                <Save className="w-4 h-4" />
                Save Card
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showNamingModal && nextCardNames && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full shadow-xl">
            {/* Header */}
            <div className="border-b p-4">
              <h3 className="text-lg font-semibold">Save Card to Inventory</h3>
              <p className="text-sm text-gray-600 mt-1">
                Confirm the card names for store inventory
              </p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Card Names */}
              <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200 space-y-3">
                <p className="text-sm font-semibold text-indigo-900">Card Names (Sequence #{nextCardNames.sequence}):</p>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-indigo-700 font-medium mb-1">Front:</p>
                    <p className="font-mono bg-white px-3 py-2 rounded border border-indigo-300 text-indigo-900 text-sm">
                      {nextCardNames.front}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-indigo-700 font-medium mb-1">Inside:</p>
                    <p className="font-mono bg-white px-3 py-2 rounded border border-indigo-300 text-indigo-900 text-sm">
                      {nextCardNames.inside}
                    </p>
                  </div>
                </div>
              </div>

              {/* Occasion Info */}
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-600 font-semibold">Occasion:</p>
                <p className="text-sm text-gray-900">
                  {occasions.find(o => o.id === selectedOccasion)?.name}
                </p>
              </div>

              {/* Info */}
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-900">
                  <strong>ℹ️ Note:</strong> This card will be automatically named and saved to your store inventory with collision-free naming.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 border-t p-4 flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowNamingModal(false);
                  setSelectedCard(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCard}
                disabled={isSaving}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-2 font-medium"
              >
                {isSaving ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Save to Inventory
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CardGeneratorComplete;
