# Implementation: Image + Text Together Generator

## Your Vision vs. Current System

### What You Originally Did ✅
- "I want heartfelt Mother's Day cards, elegant style"
- AI creates beautiful image + matching text together
- Result: Professional, cohesive cards ready to use

### What Current System Does
- Generate text variations first
- Pick one text
- Then generate image separately
- Risk: Image might not match text perfectly

---

## Building Your Vision: Step-by-Step Implementation

### Step 1: Create Multimodal Service

Create new file: `backend-node/services/multimodalCardService.js`

```javascript
const OpenAI = require('openai');
const FAL = require('@fal-ai/serverless-client');
const axios = require('axios');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

FAL.config({
  credentials: process.env.FAL_KEY,
});

/**
 * Generate a complete card (image + text) in one call
 */
async function generateCardConcept(params) {
  const { occasion, tone, style, loraModel } = params;

  const systemPrompt = `You are a greeting card designer for CardHugs.
Your task is to create a cohesive card concept where the image and text work perfectly together.
The image should visually represent the message, and the text should complement the visual.`;

  const userPrompt = `Create a greeting card concept for:
- Occasion: ${occasion}
- Tone: ${tone}
- Visual Style: ${style}
${loraModel ? `- Custom Style: Use "${loraModel.trigger_word}" style` : ''}

Return ONLY valid JSON (no markdown, no explanations):
{
  "concept_title": "Brief title for this card",
  "image_prompt": "Detailed visual description for image generation (60-80 words). Should be specific about composition, colors, mood, and style.",
  "front_text": "Front of card message (8-15 words). Engaging, appropriate for ${tone} tone.",
  "inside_text": "Inside message (5-10 words). Completes the sentiment started on front.",
  "design_notes": "How the image and text work together (1-2 sentences)"
}

Requirements:
- Image prompt should be VERY specific and detailed
- Text should fit the visual perfectly
- Both should match the "${style}" style aesthetic
- Tone should be "${tone}"
- Ready for professional printing
- Appropriate for ${occasion}

JSON ONLY:`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 600,
      temperature: 0.8, // Some creativity
    });

    const responseText = response.choices[0].message.content.trim();
    
    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const concept = JSON.parse(jsonMatch[0]);
    return concept;

  } catch (error) {
    console.error('Error generating concept:', error);
    throw new Error('Failed to generate card concept');
  }
}

/**
 * Generate the actual card image
 */
async function generateCardImage(params) {
  const { prompt, style, loraModel } = params;

  let enhancedPrompt = prompt;
  
  if (loraModel) {
    // Add LoRA trigger word to enhance with custom style
    enhancedPrompt = `${prompt} | ${loraModel.trigger_word} style`;
  }

  try {
    // Try FAL.ai first (better quality, cheaper)
    if (process.env.FAL_KEY) {
      console.log('Using FAL.ai for image generation');
      
      const result = await FAL.run('fal-ai/flux-pro', {
        input: {
          prompt: enhancedPrompt,
          image_size: 'portrait_16_9',
          num_images: 1,
          enable_safety_checker: true,
        }
      });

      if (result.images && result.images.length > 0) {
        return result.images[0].url;
      }
    }

    // Fallback to DALL-E
    console.log('Falling back to DALL-E');
    const image = await openai.images.generate({
      model: 'dall-e-3',
      prompt: enhancedPrompt,
      n: 1,
      size: '1024x1024',
      quality: 'hd',
    });

    return image.data[0].url;

  } catch (error) {
    console.error('Error generating image:', error);
    throw new Error('Failed to generate card image');
  }
}

/**
 * Generate complete card (concept + image) together
 */
async function generateCompleteCard(params) {
  const { occasion, tone, style, loraModel } = params;

  try {
    // Step 1: Generate concept (image prompt + text)
    console.log('Generating card concept...');
    const concept = await generateCardConcept({
      occasion,
      tone,
      style,
      loraModel
    });

    // Step 2: Generate matching image
    console.log('Generating card image...');
    const imageUrl = await generateCardImage({
      prompt: concept.image_prompt,
      style,
      loraModel
    });

    // Step 3: Return complete card
    return {
      front_image_url: imageUrl,
      front_text: concept.front_text,
      inside_text: concept.inside_text,
      concept_title: concept.concept_title,
      design_notes: concept.design_notes,
      image_prompt: concept.image_prompt,
      style,
      occasion,
      tone,
    };

  } catch (error) {
    console.error('Error in generateCompleteCard:', error);
    throw error;
  }
}

/**
 * Generate multiple complete cards (batch)
 */
async function generateMultipleCards(params) {
  const { occasion, tone, style, variations = 3, loraModel } = params;

  const cards = [];
  const errors = [];

  console.log(`Generating ${variations} card variations...`);

  for (let i = 0; i < variations; i++) {
    try {
      console.log(`Generating card ${i + 1}/${variations}...`);
      
      const card = await generateCompleteCard({
        occasion,
        tone,
        style,
        loraModel
      });

      cards.push({
        ...card,
        variation_number: i + 1
      });

      // Small delay to avoid rate limiting
      if (i < variations - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

    } catch (error) {
      console.error(`Failed to generate card ${i + 1}:`, error.message);
      errors.push({
        variation: i + 1,
        error: error.message
      });
    }
  }

  return {
    cards,
    errors,
    successful: cards.length,
    total: variations,
  };
}

module.exports = {
  generateCardConcept,
  generateCardImage,
  generateCompleteCard,
  generateMultipleCards,
};
```

---

### Step 2: Add Backend Route

Update: `backend-node/routes/cards.js`

Add this new endpoint:

```javascript
const { 
  generateCompleteCard, 
  generateMultipleCards 
} = require('../services/multimodalCardService');

// POST - Generate complete cards (image + text together)
router.post('/generate-complete', protect, async (req, res) => {
  try {
    const { 
      occasion, 
      tone = 'heartfelt',
      style = 'elegant',
      variations = 3,
      lora_model_id 
    } = req.body;

    if (!occasion) {
      return res.status(400).json({ error: 'Occasion is required' });
    }

    // Get occasion details
    const occasionObj = await Occasion.findByPk(occasion);
    if (!occasionObj) {
      return res.status(404).json({ error: 'Occasion not found' });
    }

    // Get LoRA model if specified
    let loraModel = null;
    if (lora_model_id) {
      loraModel = await TrainingJob.findByPk(lora_model_id);
      if (!loraModel) {
        return res.status(404).json({ error: 'LoRA model not found' });
      }
    }

    // Generate cards
    const result = await generateMultipleCards({
      occasion: occasionObj.name,
      tone,
      style,
      variations: Math.min(variations, 10), // Max 10 to prevent abuse
      loraModel
    });

    if (result.cards.length === 0) {
      return res.status(500).json({ 
        error: 'Failed to generate any cards',
        errors: result.errors
      });
    }

    res.json({
      success: true,
      cards: result.cards,
      errors: result.errors,
      count: result.successful,
      total: result.total,
      occasion: occasionObj.name,
      style,
      tone
    });

  } catch (error) {
    console.error('Error in generate-complete:', error);
    res.status(500).json({ 
      error: 'Failed to generate cards',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST - Save complete card to library
router.post('/save-complete', protect, async (req, res) => {
  try {
    const {
      occasion_id,
      front_text,
      inside_text,
      front_image_url,
      inside_image_url,
      concept_title,
      style,
      tone,
      lora_model_id
    } = req.body;

    if (!occasion_id || !front_text || !inside_text || !front_image_url || !inside_image_url) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get occasion
    const occasion = await Occasion.findByPk(occasion_id);
    if (!occasion) {
      return res.status(404).json({ error: 'Occasion not found' });
    }

    // Create card
    const card = await Card.create({
      occasion_id,
      front_text,
      inside_text,
      front_image_url,
      inside_image_url,
      prompt: concept_title || front_text,
      style,
      status: 'draft',
      created_by: req.user.userId,
      lora_model_id,
      metadata: {
        tone,
        concept_title,
        generation_method: 'multimodal'
      }
    });

    res.status(201).json({
      success: true,
      message: 'Card saved successfully',
      card: {
        id: card.id,
        front_text: card.front_text,
        inside_text: card.inside_text,
        front_image_url: card.front_image_url,
        style: card.style,
        status: card.status
      }
    });

  } catch (error) {
    console.error('Error saving card:', error);
    res.status(500).json({ 
      error: 'Failed to save card',
      details: error.message
    });
  }
});
```

---

### Step 3: Create Frontend Component

Create: `cardhugs-frontend/src/components/CardGeneratorComplete.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { Sparkles, Loader, Download, Save, X, Eye } from 'lucide-react';
import { occasionAPI, trainingAPI } from '../services/api';
import type { Occasion, TrainingJob } from '../types';

const CardGeneratorComplete: React.FC = () => {
  const [occasions, setOccasions] = useState<Occasion[]>([]);
  const [trainingJobs, setTrainingJobs] = useState<TrainingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Form state
  const [selectedOccasion, setSelectedOccasion] = useState('');
  const [tone, setTone] = useState('heartfelt');
  const [style, setStyle] = useState('elegant');
  const [variations, setVariations] = useState(3);
  const [selectedLoRA, setSelectedLoRA] = useState('');

  // Results
  const [cards, setCards] = useState<any[]>([]);
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [occasions, trainedModels] = await Promise.all([
        occasionAPI.getAll({ is_active: true }),
        trainingAPI.getAll({ status: 'completed' })
      ]);
      setOccasions(occasions.occasions || []);
      setTrainingJobs(trainedModels.jobs || []);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
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
      setSuccess(`Generated ${data.count} cards!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate cards');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveCard = async (card: any) => {
    try {
      const response = await fetch('/api/cards/save-complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('cardhugs_token')}`
        },
        body: JSON.stringify({
          occasion_id: selectedOccasion,
          front_text: card.front_text,
          inside_text: card.inside_text,
          front_image_url: card.front_image_url,
          inside_image_url: card.inside_image_url,
          concept_title: card.concept_title,
          style: card.style,
          tone: card.tone,
          lora_model_id: selectedLoRA || undefined
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save card');
      }

      setSuccess('Card saved to library!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save card');
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
      <h2 className="text-3xl font-bold mb-2">Card Generator</h2>
      <p className="text-gray-600 mb-6">
        Generate beautiful greeting cards with perfectly matched images and text
      </p>

      {/* Alerts */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {success}
        </div>
      )}

      {/* Configuration */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Card Configuration</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {/* Occasion */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Occasion *
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tone
            </label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="heartfelt">Heartfelt</option>
              <option value="funny">Funny</option>
              <option value="formal">Formal</option>
              <option value="playful">Playful</option>
              <option value="inspirational">Inspirational</option>
            </select>
          </div>

          {/* Style */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Visual Style
            </label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="elegant">Elegant</option>
              <option value="playful">Playful</option>
              <option value="modern">Modern</option>
              <option value="vintage">Vintage</option>
              <option value="minimalist">Minimalist</option>
              <option value="colorful">Colorful</option>
            </select>
          </div>

          {/* LoRA Model */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Style (Optional)
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Variations: {variations}
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={variations}
              onChange={(e) => setVariations(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={!selectedOccasion || generating}
          className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 flex items-center justify-center gap-2 font-medium"
        >
          {generating ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Generating Your Cards...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate Cards
            </>
          )}
        </button>
      </div>

      {/* Cards Grid */}
      {cards.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-4">Generated Cards ({cards.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map((card, idx) => (
              <div
                key={idx}
                className={`border-2 rounded-lg overflow-hidden transition cursor-pointer ${
                  selectedCard?.variation_number === card.variation_number
                    ? 'border-indigo-500 shadow-lg'
                    : 'border-gray-200 hover:border-indigo-300'
                }`}
                onClick={() => setSelectedCard(card)}
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
                  <p className="text-xs text-gray-500 font-medium mb-1">Variation {card.variation_number}</p>
                  <p className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {card.front_text}
                  </p>
                  <p className="text-sm text-gray-600 italic line-clamp-2">
                    {card.inside_text}
                  </p>
                  {card.concept_title && (
                    <p className="text-xs text-gray-400 mt-2 line-clamp-1">
                      "{card.concept_title}"
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="px-4 py-3 bg-gray-50 border-t flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const link = document.createElement('a');
                      link.href = card.front_image_url;
                      link.download = `card-${idx + 1}.png`;
                      link.click();
                    }}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-100 flex items-center justify-center gap-1"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSaveCard(card);
                    }}
                    className="flex-1 px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 flex items-center justify-center gap-1"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {selectedCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Card Preview</h3>
              <button
                onClick={() => setSelectedCard(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <img
                src={selectedCard.front_image_url}
                alt="Card preview"
                className="w-full rounded-lg border border-gray-200"
              />
              
              <div>
                <p className="text-sm text-gray-500 mb-1">FRONT TEXT</p>
                <p className="text-xl font-semibold text-gray-900">{selectedCard.front_text}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">INSIDE TEXT</p>
                <p className="text-lg text-gray-800">{selectedCard.inside_text}</p>
              </div>

              {selectedCard.design_notes && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-600 font-medium mb-1">DESIGN NOTE</p>
                  <p className="text-sm text-blue-900">{selectedCard.design_notes}</p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = selectedCard.front_image_url;
                    link.download = 'card.png';
                    link.click();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={() => handleSaveCard(selectedCard)}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save to Library
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CardGeneratorComplete;
```

---

### Step 4: Update Navigation & Routes

Update: `cardhugs-frontend/src/App.tsx`

```typescript
import CardGeneratorComplete from './components/CardGeneratorComplete';

// In Routes:
<Route path="/generate" element={<CardGeneratorComplete />} />
```

Update: `cardhugs-frontend/src/components/Layout.tsx`

```typescript
<Link to="/generate" className="hover:underline">Generate Cards</Link>
```

---

## ✅ Implementation Checklist

- [ ] Create `multimodalCardService.js`
- [ ] Add `/api/cards/generate-complete` endpoint
- [ ] Add `/api/cards/save-complete` endpoint
- [ ] Create `CardGeneratorComplete.tsx` component
- [ ] Add route in `App.tsx`
- [ ] Add navigation link in `Layout.tsx`
- [ ] Test with GPT-4 + DALL-E
- [ ] Test with FAL.ai (if credentials available)
- [ ] Test with LoRA models

---

## 🚀 Next Steps

Ready to implement? I can:

1. **Apply all changes immediately** - Have it running in 5 minutes
2. **Test it** - Generate sample cards
3. **Refine it** - Add any tweaks you want

Which would you like?

---

**This is your vision. Let's build it!** 🎨✨
