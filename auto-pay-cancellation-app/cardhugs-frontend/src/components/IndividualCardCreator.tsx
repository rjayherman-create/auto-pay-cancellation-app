import React, { useState, useEffect } from 'react';
import {
  Sparkles, Loader, Download, Save, X, Printer, RefreshCw, Eye,
  AlertCircle, CheckCircle2, Zap, Settings, ArrowRight, Trash2,
  Copy, Check, Camera
} from 'lucide-react';
import { occasionAPI, tonesAPI, visualStylesAPI } from '../services/api';
import type { Occasion } from '../types';

interface CardContent {
  frontText: string;
  insideText: string;
  frontImage: string;
  insideImage: string;
}

interface CardHistory {
  version: number;
  timestamp: Date;
  content: CardContent;
}

interface GenerationParams {
  occasion: string;
  tone: string;
  style: string;
  frontText?: string;
  insideText?: string;
  imageStyle?: string;
}

const IndividualCardCreator: React.FC = () => {
  // Data
  const [occasions, setOccasions] = useState<Occasion[]>([]);
  const [tones, setTones] = useState<any[]>([]);
  const [visualStyles, setVisualStyles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Main UI State
  const [currentStep, setCurrentStep] = useState<'setup' | 'develop' | 'review'>('setup');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Configuration
  const [selectedOccasion, setSelectedOccasion] = useState('');
  const [selectedTone, setSelectedTone] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('');

  // Card Content
  const [cardContent, setCardContent] = useState<CardContent>({
    frontText: '',
    insideText: '',
    frontImage: '',
    insideImage: ''
  });

  // Development Mode
  const [cardHistory, setCardHistory] = useState<CardHistory[]>([]);
  const [currentVersion, setCurrentVersion] = useState(0);
  const [editMode, setEditMode] = useState<'text' | 'image' | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Preview
  const [showPreview, setShowPreview] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [senderName, setSenderName] = useState('');
  const [customMessage, setCustomMessage] = useState('');

  // Save
  const [isSaving, setIsSaving] = useState(false);
  const [cardName, setCardName] = useState('');
  const [autoGenerateName, setAutoGenerateName] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [occasionsData, tonesData, stylesData] = await Promise.all([
        occasionAPI.getAll({ is_active: true }),
        tonesAPI.getAll({ is_active: true }),
        visualStylesAPI.getAll({ is_active: true })
      ]);
      setOccasions(occasionsData.occasions || []);
      setTones(tonesData.tones || []);
      setVisualStyles(stylesData.styles || []);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load options');
    } finally {
      setLoading(false);
    }
  };

  const generateCardElement = async (type: 'text' | 'image', section: 'front' | 'inside') => {
    if (!selectedOccasion || !selectedTone || !selectedStyle) {
      setError('Please select Occasion, Tone, and Style first');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const endpoint = type === 'text' ? '/api/card-creator/generate-text' : '/api/card-creator/generate-image';
      
      const prompt = type === 'text'
        ? `Generate a ${section === 'front' ? 'greeting card front' : 'inside message'} for a ${selectedOccasion} card with ${selectedTone} tone.`
        : `Generate a beautiful ${section === 'front' ? 'greeting card front' : 'card inside'} image for ${selectedOccasion} in ${selectedStyle} style.`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('cardhugs_token')}`
        },
        body: JSON.stringify({
          prompt,
          occasion: selectedOccasion,
          tone: selectedTone,
          style: selectedStyle,
          section
        })
      });

      if (!response.ok) throw new Error('Generation failed');

      const data = await response.json();

      // Update card content
      const updatedContent = { ...cardContent };
      if (type === 'text') {
        updatedContent[section === 'front' ? 'frontText' : 'insideText'] = data.text;
      } else {
        updatedContent[section === 'front' ? 'frontImage' : 'insideImage'] = data.imageUrl;
      }

      // Add to history
      const newHistory = cardHistory.slice(0, currentVersion + 1);
      newHistory.push({
        version: newHistory.length,
        timestamp: new Date(),
        content: updatedContent
      });

      setCardHistory(newHistory);
      setCardContent(updatedContent);
      setCurrentVersion(newHistory.length - 1);
      setSuccess(`${section === 'front' ? 'Front' : 'Inside'} ${type} generated!`);
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(`Failed to generate ${type}`);
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const regenerateElement = async (type: 'text' | 'image', section: 'front' | 'inside') => {
    // Get current element and modify prompt for variation
    const isCurrentEmpty = type === 'text'
      ? !cardContent[section === 'front' ? 'frontText' : 'insideText']
      : !cardContent[section === 'front' ? 'frontImage' : 'insideImage'];

    if (isCurrentEmpty) {
      generateCardElement(type, section);
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const endpoint = type === 'text' ? '/api/card-creator/generate-text' : '/api/card-creator/generate-image';
      
      const current = type === 'text'
        ? cardContent[section === 'front' ? 'frontText' : 'insideText']
        : cardContent[section === 'front' ? 'frontImage' : 'insideImage'];

      const prompt = type === 'text'
        ? `Generate a different variation (not "${current}") for a ${section === 'front' ? 'greeting card front' : 'inside message'} for ${selectedOccasion} with ${selectedTone} tone.`
        : `Generate a different ${section === 'front' ? 'greeting card front' : 'inside'} image (different composition) for ${selectedOccasion} in ${selectedStyle} style.`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('cardhugs_token')}`
        },
        body: JSON.stringify({
          prompt,
          occasion: selectedOccasion,
          tone: selectedTone,
          style: selectedStyle,
          section,
          previousContent: current
        })
      });

      if (!response.ok) throw new Error('Generation failed');

      const data = await response.json();

      const updatedContent = { ...cardContent };
      if (type === 'text') {
        updatedContent[section === 'front' ? 'frontText' : 'insideText'] = data.text;
      } else {
        updatedContent[section === 'front' ? 'frontImage' : 'insideImage'] = data.imageUrl;
      }

      const newHistory = cardHistory.slice(0, currentVersion + 1);
      newHistory.push({
        version: newHistory.length,
        timestamp: new Date(),
        content: updatedContent
      });

      setCardHistory(newHistory);
      setCardContent(updatedContent);
      setCurrentVersion(newHistory.length - 1);
      setSuccess(`${section === 'front' ? 'Front' : 'Inside'} ${type} regenerated!`);
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(`Failed to regenerate ${type}`);
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const undoVersion = () => {
    if (currentVersion > 0) {
      setCurrentVersion(currentVersion - 1);
      setCardContent(cardHistory[currentVersion - 1].content);
    }
  };

  const redoVersion = () => {
    if (currentVersion < cardHistory.length - 1) {
      setCurrentVersion(currentVersion + 1);
      setCardContent(cardHistory[currentVersion + 1].content);
    }
  };

  const resetCard = () => {
    if (window.confirm('Reset all card content? This cannot be undone.')) {
      setCardContent({
        frontText: '',
        insideText: '',
        frontImage: '',
        insideImage: ''
      });
      setCardHistory([]);
      setCurrentVersion(0);
      setSuccess('Card reset');
      setTimeout(() => setSuccess(''), 2000);
    }
  };

  const handleSaveCard = async () => {
    if (!cardContent.frontText || !cardContent.frontImage) {
      setError('Front text and image are required');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const response = await fetch('/api/cards/save-complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('cardhugs_token')}`
        },
        body: JSON.stringify({
          occasion_id: selectedOccasion,
          name: autoGenerateName ? `${selectedOccasion} Card` : cardName,
          front_text: cardContent.frontText,
          inside_message: cardContent.insideText,
          front_image_url: cardContent.frontImage,
          concept_title: cardName || 'AI Generated Card',
          style: selectedStyle,
          tone: selectedTone,
          emotional_impact: 'high',
          uniqueness_factor: 'unique',
          design_suggestions: [],
          personalization: {
            recipient_name: recipientName,
            sender_name: senderName,
            custom_message: customMessage
          }
        })
      });

      if (!response.ok) throw new Error('Failed to save');

      const data = await response.json();
      setSuccess(`✅ Card saved successfully!\nName: ${data.card.name}`);
      
      setTimeout(() => {
        setSuccess('');
        // Reset form
        setCurrentStep('setup');
        setSelectedOccasion('');
        setSelectedTone('');
        setSelectedStyle('');
        setCardContent({
          frontText: '',
          insideText: '',
          frontImage: '',
          insideImage: ''
        });
        setCardHistory([]);
        setCurrentVersion(0);
      }, 2500);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">✨ AI Card Creator</h1>
          <p className="text-lg text-gray-600">
            Create beautiful greeting cards with AI-generated text and images. Develop iteratively until perfect, then save.
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 flex gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>{error}</div>
            <button
              onClick={() => setError('')}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 flex gap-3">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="whitespace-pre-line">{success}</div>
            <button
              onClick={() => setSuccess('')}
              className="ml-auto text-green-600 hover:text-green-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step Indicator */}
        <div className="flex gap-2 mb-8">
          {(['setup', 'develop', 'review'] as const).map((step) => (
            <button
              key={step}
              onClick={() => {
                if (step === 'setup' || (step === 'develop' && selectedOccasion) || (step === 'review' && cardContent.frontText && cardContent.frontImage)) {
                  setCurrentStep(step);
                }
              }}
              disabled={step === 'develop' && !selectedOccasion || (step === 'review' && (!cardContent.frontText || !cardContent.frontImage))}
              className={`px-6 py-3 rounded-lg font-medium transition flex items-center gap-2 ${
                currentStep === step
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {step === 'setup' && <Settings className="w-4 h-4" />}
              {step === 'develop' && <Sparkles className="w-4 h-4" />}
              {step === 'review' && <Eye className="w-4 h-4" />}
              {step.charAt(0).toUpperCase() + step.slice(1)}
              {currentStep === step && <Check className="w-4 h-4" />}
            </button>
          ))}
        </div>

        {/* STEP 1: SETUP */}
        {currentStep === 'setup' && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6">Step 1: Setup Your Card</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Occasion */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  🎉 Select Occasion
                </label>
                <select
                  value={selectedOccasion}
                  onChange={(e) => setSelectedOccasion(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
                >
                  <option value="">Choose an occasion...</option>
                  {occasions.map((occ) => (
                    <option key={occ.id} value={occ.id}>
                      {occ.emoji} {occ.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  💬 Select Tone
                </label>
                <select
                  value={selectedTone}
                  onChange={(e) => setSelectedTone(e.target.value)}
                  disabled={!selectedOccasion}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition disabled:bg-gray-100"
                >
                  <option value="">Choose a tone...</option>
                  {tones.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.emoji} {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Style */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  🎨 Select Visual Style
                </label>
                <select
                  value={selectedStyle}
                  onChange={(e) => setSelectedStyle(e.target.value)}
                  disabled={!selectedOccasion}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition disabled:bg-gray-100"
                >
                  <option value="">Choose a style...</option>
                  {visualStyles.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.emoji} {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Info Box */}
            {selectedOccasion && selectedTone && selectedStyle && (
              <div className="p-4 bg-indigo-50 border-2 border-indigo-200 rounded-lg mb-6">
                <p className="text-indigo-900">
                  ✅ Great! You've selected <strong>{occasions.find(o => o.id === selectedOccasion)?.name}</strong> with 
                  <strong> {selectedTone}</strong> tone and <strong> {selectedStyle}</strong> style. 
                  Ready to develop your card!
                </p>
              </div>
            )}

            {/* Next Button */}
            <button
              onClick={() => setCurrentStep('develop')}
              disabled={!selectedOccasion || !selectedTone || !selectedStyle}
              className="w-full px-6 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 font-semibold flex items-center justify-center gap-2 transition disabled:cursor-not-allowed"
            >
              Continue to Development
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* STEP 2: DEVELOP */}
        {currentStep === 'develop' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* LEFT: Development Controls */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-6">Step 2: Develop Your Card</h2>

                {/* Front Section */}
                <div className="mb-8 pb-8 border-b-2 border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">
                      🎨 Front of Card
                    </h3>
                    <div className="flex gap-2">
                      {cardContent.frontText && (
                        <button
                          onClick={() => regenerateElement('text', 'front')}
                          disabled={isGenerating}
                          className="p-2 hover:bg-blue-100 rounded-lg transition disabled:opacity-50"
                          title="Generate different text"
                        >
                          <RefreshCw className="w-4 h-4 text-blue-600" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Front Text */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Text (Greeting Message)
                    </label>
                    <div className="relative">
                      <textarea
                        value={cardContent.frontText}
                        onChange={(e) => {
                          setCardContent({ ...cardContent, frontText: e.target.value });
                          const updated = { ...cardContent, frontText: e.target.value };
                          if (cardHistory.length === 0) {
                            setCardHistory([{ version: 0, timestamp: new Date(), content: updated }]);
                            setCurrentVersion(0);
                          }
                        }}
                        placeholder="Enter or generate front text..."
                        rows={3}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
                      />
                      {cardContent.frontText && (
                        <span className="absolute bottom-2 right-2 text-xs text-gray-400">
                          {cardContent.frontText.length} chars
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => generateCardElement('text', 'front')}
                        disabled={isGenerating}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium flex items-center justify-center gap-2 transition"
                      >
                        {isGenerating ? <Loader className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        {isGenerating ? 'Generating...' : 'Generate Text'}
                      </button>
                      {cardContent.frontText && (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(cardContent.frontText);
                            setSuccess('Copied to clipboard!');
                            setTimeout(() => setSuccess(''), 2000);
                          }}
                          className="px-3 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Front Image */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Image
                    </label>
                    {cardContent.frontImage ? (
                      <div className="relative mb-2">
                        <img
                          src={cardContent.frontImage}
                          alt="Front"
                          className="w-full h-48 object-cover rounded-lg border-2 border-gray-300"
                        />
                        <button
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = cardContent.frontImage;
                            link.download = 'card-front.png';
                            link.click();
                          }}
                          className="absolute top-2 right-2 p-2 bg-white rounded-lg shadow hover:bg-gray-50 transition"
                          title="Download image"
                        >
                          <Download className="w-4 h-4 text-gray-700" />
                        </button>
                      </div>
                    ) : (
                      <div className="h-48 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 mb-2">
                        <Camera className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    <button
                      onClick={() => generateCardElement('image', 'front')}
                      disabled={isGenerating}
                      className="w-full px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium flex items-center justify-center gap-2 transition"
                    >
                      {isGenerating ? <Loader className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                      {isGenerating ? 'Generating...' : 'Generate Image'}
                    </button>
                  </div>
                </div>

                {/* Inside Section */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">
                      💌 Inside of Card
                    </h3>
                    <div className="flex gap-2">
                      {cardContent.insideText && (
                        <button
                          onClick={() => regenerateElement('text', 'inside')}
                          disabled={isGenerating}
                          className="p-2 hover:bg-blue-100 rounded-lg transition disabled:opacity-50"
                          title="Generate different text"
                        >
                          <RefreshCw className="w-4 h-4 text-blue-600" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Inside Text */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message
                    </label>
                    <textarea
                      value={cardContent.insideText}
                      onChange={(e) => {
                        setCardContent({ ...cardContent, insideText: e.target.value });
                        const updated = { ...cardContent, insideText: e.target.value };
                        if (cardHistory.length === 0) {
                          setCardHistory([{ version: 0, timestamp: new Date(), content: updated }]);
                          setCurrentVersion(0);
                        }
                      }}
                      placeholder="Enter or generate inside message..."
                      rows={4}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => generateCardElement('text', 'inside')}
                        disabled={isGenerating}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium flex items-center justify-center gap-2 transition"
                      >
                        {isGenerating ? <Loader className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        {isGenerating ? 'Generating...' : 'Generate Text'}
                      </button>
                      {cardContent.insideText && (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(cardContent.insideText);
                            setSuccess('Copied to clipboard!');
                            setTimeout(() => setSuccess(''), 2000);
                          }}
                          className="px-3 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Inside Image */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Image (Optional)
                    </label>
                    {cardContent.insideImage ? (
                      <div className="relative mb-2">
                        <img
                          src={cardContent.insideImage}
                          alt="Inside"
                          className="w-full h-32 object-cover rounded-lg border-2 border-gray-300"
                        />
                        <button
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = cardContent.insideImage;
                            link.download = 'card-inside.png';
                            link.click();
                          }}
                          className="absolute top-2 right-2 p-2 bg-white rounded-lg shadow hover:bg-gray-50 transition"
                          title="Download image"
                        >
                          <Download className="w-4 h-4 text-gray-700" />
                        </button>
                      </div>
                    ) : (
                      <div className="h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 mb-2">
                        <Camera className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <button
                      onClick={() => generateCardElement('image', 'inside')}
                      disabled={isGenerating}
                      className="w-full px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium flex items-center justify-center gap-2 transition"
                    >
                      {isGenerating ? <Loader className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                      {isGenerating ? 'Generating...' : 'Generate Image'}
                    </button>
                  </div>
                </div>

                {/* History Controls */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={undoVersion}
                    disabled={currentVersion === 0 || cardHistory.length === 0}
                    className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
                  >
                    ↶ Undo ({currentVersion}/{cardHistory.length})
                  </button>
                  <button
                    onClick={redoVersion}
                    disabled={currentVersion === cardHistory.length - 1}
                    className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
                  >
                    ↷ Redo
                  </button>
                  <button
                    onClick={resetCard}
                    className="px-3 py-2 border-2 border-red-300 rounded-lg hover:bg-red-50 transition text-red-600 font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Next Button */}
                <button
                  onClick={() => {
                    if (!cardContent.frontText || !cardContent.frontImage) {
                      setError('Front text and image are required');
                      return;
                    }
                    setCurrentStep('review');
                  }}
                  className="w-full px-6 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold flex items-center justify-center gap-2 transition"
                >
                  Review & Save
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* RIGHT: Live Preview */}
            <div className="sticky top-6 h-fit">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold mb-4">Live Preview</h3>

                {/* Front Preview */}
                <div className="mb-6 border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
                  {cardContent.frontImage && (
                    <img src={cardContent.frontImage} alt="Front preview" className="w-full h-40 object-cover" />
                  )}
                  <div className="p-6 text-center">
                    {cardContent.frontText ? (
                      <p className="text-lg font-semibold text-gray-900 italic">"{cardContent.frontText}"</p>
                    ) : (
                      <p className="text-gray-400">Front text will appear here...</p>
                    )}
                  </div>
                </div>

                {/* Inside Preview */}
                <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
                  {cardContent.insideImage && (
                    <img src={cardContent.insideImage} alt="Inside preview" className="w-full h-24 object-cover rounded mb-4" />
                  )}
                  <div className="text-center space-y-3">
                    <p className="text-sm text-gray-600 font-medium">INSIDE</p>
                    {cardContent.insideText ? (
                      <p className="text-sm text-gray-800 italic leading-relaxed">
                        {cardContent.insideText}
                      </p>
                    ) : (
                      <p className="text-gray-400 text-sm">Inside message will appear here...</p>
                    )}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Front text:</span>
                    <span className="font-medium">{cardContent.frontText.length}/200 chars</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Inside text:</span>
                    <span className="font-medium">{cardContent.insideText.length}/500 chars</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Version:</span>
                    <span className="font-medium">{currentVersion + 1}/{cardHistory.length || 1}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: REVIEW & SAVE */}
        {currentStep === 'review' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Card Preview */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                {/* Front Page */}
                <div className="bg-white">
                  <div className="h-80 bg-gray-200 flex items-center justify-center">
                    <img
                      src={cardContent.frontImage}
                      alt="Card front"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-12 text-center">
                    <p className="text-3xl font-bold text-gray-900 leading-relaxed">
                      {cardContent.frontText}
                    </p>
                  </div>
                </div>

                {/* Page Break */}
                <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200"></div>

                {/* Inside Page */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-12">
                  {cardContent.insideImage && (
                    <div className="mb-8 h-40 rounded-lg overflow-hidden">
                      <img
                        src={cardContent.insideImage}
                        alt="Card inside"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="space-y-6 text-center">
                    {recipientName && (
                      <p className="text-lg text-gray-700">
                        <span className="text-gray-600">Dear</span> <span className="font-semibold">{recipientName}</span>,
                      </p>
                    )}

                    <p className="text-lg leading-relaxed text-gray-800 italic">
                      {customMessage || cardContent.insideText}
                    </p>

                    {senderName && (
                      <div className="pt-6">
                        <p className="text-lg text-gray-700">
                          <span className="text-gray-600">With warmest wishes,</span>
                        </p>
                        <p className="text-lg font-semibold text-gray-900 mt-2">{senderName}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => window.print()}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium flex items-center justify-center gap-2 transition"
                >
                  <Printer className="w-5 h-5" />
                  Print
                </button>
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = cardContent.frontImage;
                    link.download = 'greeting-card.png';
                    link.click();
                  }}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium flex items-center justify-center gap-2 transition"
                >
                  <Download className="w-5 h-5" />
                  Download
                </button>
              </div>
            </div>

            {/* Sidebar: Personalization & Save */}
            <div className="space-y-6">
              {/* Personalization */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold mb-4">Personalize (Optional)</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Recipient Name
                    </label>
                    <input
                      type="text"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="Mom, Sarah, etc."
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Custom Message
                    </label>
                    <textarea
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      placeholder="Add a personal touch..."
                      rows={3}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder="Your name"
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 transition"
                    />
                  </div>
                </div>
              </div>

              {/* Save Options */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold mb-4">Save Card</h3>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="autoName"
                      checked={autoGenerateName}
                      onChange={(e) => setAutoGenerateName(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <label htmlFor="autoName" className="text-sm font-medium text-gray-700">
                      Auto-generate name
                    </label>
                  </div>

                  {!autoGenerateName && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Card Name
                      </label>
                      <input
                        type="text"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        placeholder="e.g., Birthday Joy"
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 transition"
                      />
                    </div>
                  )}

                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-sm text-blue-900">
                    <p className="font-medium mb-1">✨ Ready to save</p>
                    <p className="text-xs">Your card will be saved to inventory with collision-free naming.</p>
                  </div>

                  <button
                    onClick={handleSaveCard}
                    disabled={isSaving}
                    className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-semibold flex items-center justify-center gap-2 transition"
                  >
                    {isSaving ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Save to Inventory
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setCurrentStep('develop')}
                    className="w-full px-6 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition"
                  >
                    ← Back to Edit
                  </button>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl shadow-lg p-6 border border-indigo-200">
                <h4 className="font-bold text-indigo-900 mb-2">💡 Tips</h4>
                <ul className="text-xs text-indigo-900 space-y-1">
                  <li>• Generate multiple versions and pick your favorite</li>
                  <li>• Use "Regenerate" to try different variations</li>
                  <li>• Edit text directly for fine-tuning</li>
                  <li>• Personalization is optional</li>
                  <li>• Cards auto-save with unique names</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IndividualCardCreator;
