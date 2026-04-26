# Card Template with Personalization Fields

## Card Structure (Front & Inside)

### FRONT OF CARD
```
┌─────────────────────────────┐
│                             │
│      [AI GENERATED]         │
│      [IMAGE AREA]           │
│                             │
│      [MAIN TEXT]            │
│   "Mother's Day greeting"   │
│                             │
└─────────────────────────────┘
```

### INSIDE OF CARD
```
┌─────────────────────────────┐
│                             │
│     Dear ___________        │
│                             │
│  [SHORT MESSAGE 5-10 WORDS] │
│  "Wishing you joy today"    │
│                             │
│  Love, ___________          │
│                             │
│     [SIGNATURE AREA]        │
│                             │
└─────────────────────────────┘
```

---

## Implementation

### 1. Update Backend Service

Create/Update: `backend-node/services/multimodalCardService.js`

```javascript
/**
 * Generate a complete card with personalization template
 */
async function generateCardConcept(params) {
  const { occasion, tone, style, loraModel } = params;

  const systemPrompt = `You are a greeting card designer for CardHugs.
Create a cohesive card concept with:
- Front image + front text (main greeting)
- Inside personalization template with:
  * "Dear ___" field (for recipient name)
  * Short personalized message (5-10 words)
  * "Love, ___" field (for sender name)
  * Optional signature line`;

  const userPrompt = `Create a greeting card concept for:
- Occasion: ${occasion}
- Tone: ${tone}
- Visual Style: ${style}
${loraModel ? `- Custom Style: Use "${loraModel.trigger_word}" style` : ''}

Return ONLY valid JSON (no markdown):
{
  "concept_title": "Brief title",
  "image_prompt": "Detailed visual description for image generation (60-80 words)",
  "front_text": "Front greeting (8-15 words)",
  "inside_personalization": {
    "salutation": "Dear ___________",
    "personalized_message": "Short message (5-10 words) that readers can personalize",
    "closing": "Love, ___________",
    "signature_note": "(Sign your name here)"
  },
  "design_notes": "How the card comes together (1-2 sentences)"
}

Requirements:
- Front text should be a main greeting
- Inside message should be generic enough for personalization
- Personalized message should leave room for user customization
- Include placeholders for names (salutation and closing)
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
      max_tokens: 800,
      temperature: 0.8,
    });

    const responseText = response.choices[0].message.content.trim();
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
 * Generate complete card with personalization
 */
async function generateCompleteCard(params) {
  const { occasion, tone, style, loraModel } = params;

  try {
    // Step 1: Generate concept
    console.log('Generating card concept...');
    const concept = await generateCardConcept({
      occasion,
      tone,
      style,
      loraModel
    });

    // Step 2: Generate image
    console.log('Generating card image...');
    const imageUrl = await generateCardImage({
      prompt: concept.image_prompt,
      style,
      loraModel
    });

    // Step 3: Return card with personalization template
    return {
      front_image_url: imageUrl,
      front_text: concept.front_text,
      inside_structure: {
        salutation: concept.inside_personalization.salutation,
        personalized_message: concept.inside_personalization.personalized_message,
        closing: concept.inside_personalization.closing,
        signature_note: concept.inside_personalization.signature_note
      },
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
```

---

### 2. Update Frontend Component

Update: `cardhugs-frontend/src/components/CardGeneratorComplete.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { Sparkles, Loader, Download, Save, X, Edit2, Check, Printer } from 'lucide-react';
import { occasionAPI, trainingAPI } from '../services/api';
import type { Occasion, TrainingJob } from '../types';

const CardGeneratorComplete: React.FC = () => {
  // ... existing state ...
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  
  // Personalization fields
  const [recipientName, setRecipientName] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [senderName, setSenderName] = useState('');
  const [signature, setSignature] = useState('');

  // When card is selected, reset personalization
  const handleSelectCard = (card: any) => {
    setSelectedCard(card);
    setRecipientName('');
    setCustomMessage(card.inside_structure?.personalized_message || '');
    setSenderName('');
    setSignature('');
    setEditMode(false);
  };

  // Save card with personalization
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
          inside_text: card.inside_structure?.personalized_message || '',
          front_image_url: card.front_image_url,
          inside_image_url: card.inside_image_url,
          concept_title: card.concept_title,
          style: card.style,
          tone: card.tone,
          lora_model_id: selectedLoRA || undefined,
          // Save personalization data
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

      setSuccess('Card saved with personalization!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save card');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* ... existing UI ... */}

      {/* Preview Modal - WITH PERSONALIZATION */}
      {selectedCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-4xl w-full my-8">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Card Preview & Personalization</h3>
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
                    {customMessage || '(personalized message appears here)'}
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recipient Name
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Message (Optional)
                  </label>
                  <textarea
                    value={customMessage}
                    onChange={(e) => {
                      const text = e.target.value;
                      // Limit to ~10 words
                      const words = text.split(/\s+/).filter(w => w.length > 0);
                      if (words.length <= 15) {
                        setCustomMessage(text);
                      }
                    }}
                    placeholder="Add a personal message (5-10 words)"
                    maxLength={100}
                    rows={2}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty to use generated message
                  </p>
                </div>

                {/* Sender Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Name / Signature
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Note (Optional)
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
                    <strong>💡 Tip:</strong> Fill in the names and message above, then click "Save" to keep your personalized card.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer - Action Buttons */}
            <div className="bg-gray-50 border-t p-6 flex gap-2 justify-end">
              <button
                onClick={() => {
                  // Print preview
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
                Download
              </button>
              <button
                onClick={() => handleSaveCard(selectedCard)}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 font-medium"
              >
                <Save className="w-4 h-4" />
                Save Card
              </button>
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

### 3. Update Backend Route (to save personalization)

Update: `backend-node/routes/cards.js`

```javascript
// POST - Save complete card with personalization
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
      lora_model_id,
      personalization  // NEW: personalization data
    } = req.body;

    if (!occasion_id || !front_text || !front_image_url || !inside_image_url) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const occasion = await Occasion.findByPk(occasion_id);
    if (!occasion) {
      return res.status(404).json({ error: 'Occasion not found' });
    }

    // Create card
    const card = await Card.create({
      occasion_id,
      front_text,
      inside_text: inside_text || '',
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
        generation_method: 'multimodal',
        personalization: personalization || {}  // NEW: save personalization data
      }
    });

    res.status(201).json({
      success: true,
      message: 'Card saved with personalization!',
      card: {
        id: card.id,
        front_text: card.front_text,
        front_image_url: card.front_image_url,
        personalization: personalization,
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

## Card Template Preview

### What Users See:

```
┌──────────────────────────────────────────────────────────────┐
│                    CARD PREVIEW                              │
├──────────────────────────┬──────────────────────────────────┤
│                          │  PERSONALIZE YOUR CARD           │
│   [FRONT IMAGE]          │                                  │
│                          │  Recipient Name:                 │
│   [MAIN TEXT]            │  ┌──────────────────────────┐    │
│                          │  │ e.g., Mom, Sarah         │    │
│                          │  └──────────────────────────┘    │
│   ────────────────────   │                                  │
│   INSIDE OF CARD:        │  Custom Message (Optional):      │
│                          │  ┌──────────────────────────┐    │
│   Dear ___________       │  │ 5-10 words about them    │    │
│                          │  └──────────────────────────┘    │
│   [personalized message] │                                  │
│                          │  Your Name:                      │
│   Love, ___________      │  ┌──────────────────────────┐    │
│   (Hope to see you!)     │  │ Your name here           │    │
│                          │  └──────────────────────────┘    │
│                          │                                  │
│                          │  Additional Note (Optional):     │
│                          │  ┌──────────────────────────┐    │
│                          │  │ Hope to see you soon!    │    │
│                          │  └──────────────────────────┘    │
└──────────────────────────┴──────────────────────────────────┘
                [Print] [Download] [Save Card]
```

---

## Features

✅ Front of card: AI-generated image + greeting text
✅ Inside of card: Personalization template
  - `Dear ___` field (fill in recipient name)
  - Personalized message (5-10 words, editable)
  - `Love, ___` field (fill in sender name)
  - Optional signature/note line
✅ Live preview updates as user types
✅ Save personalization data with card
✅ Print-friendly layout
✅ Download option

---

## User Workflow

1. **Generate cards** → Get image + text
2. **Click card** → Opens personalization screen
3. **Fill in names:**
   - Recipient name (shows in "Dear ___")
   - Your name (shows in "Love, ___")
4. **Add custom message** (or leave for AI's message)
5. **Add optional note** (bottom signature area)
6. **See live preview** (updates as you type)
7. **Save or Print** → Ready to use!

---

## Ready to Deploy?

I can implement this right now:
1. Update backend service (personalization template)
2. Update frontend component (personalization UI)
3. Update routes (save personalization data)
4. Deploy to containers
5. Test end-to-end

Should I build it? 🎨
