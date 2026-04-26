# Edit Generated Card Text - Simple Implementation

## What You Need

Users should be able to:
1. Generate cards (image + text together)
2. **If text is bad → Edit it**
3. Save the card with edited text

---

## Implementation (Very Simple)

### Frontend: Add Edit Mode to Card Preview

Update `CardGeneratorComplete.tsx` - Add text editing to the preview modal:

```typescript
import React, { useState, useEffect } from 'react';
import { Sparkles, Loader, Download, Save, X, Edit2, Check } from 'lucide-react';

const CardGeneratorComplete: React.FC = () => {
  // ... existing state ...
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedFrontText, setEditedFrontText] = useState('');
  const [editedInsideText, setEditedInsideText] = useState('');

  // When card is selected, initialize editable text
  const handleSelectCard = (card: any) => {
    setSelectedCard(card);
    setEditedFrontText(card.front_text);
    setEditedInsideText(card.inside_text);
    setEditMode(false); // Start in view mode
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    if (editMode) {
      // Exiting edit mode - revert changes
      setEditedFrontText(selectedCard.front_text);
      setEditedInsideText(selectedCard.inside_text);
    }
    setEditMode(!editMode);
  };

  // Apply edits
  const applyEdits = () => {
    if (!editedFrontText.trim()) {
      alert('Front text cannot be empty');
      return;
    }

    // Update the card in state
    setSelectedCard({
      ...selectedCard,
      front_text: editedFrontText,
      inside_text: editedInsideText
    });

    // Also update in the cards array so gallery reflects changes
    const cardIndex = cards.findIndex(
      c => c.variation_number === selectedCard.variation_number
    );
    if (cardIndex !== -1) {
      cards[cardIndex].front_text = editedFrontText;
      cards[cardIndex].inside_text = editedInsideText;
      setCards([...cards]);
    }

    setEditMode(false);
  };

  // Save card with potentially edited text
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
          front_text: card.front_text,  // Will use edited text if available
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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* ... existing UI code ... */}

      {/* Preview Modal - NOW WITH EDIT SUPPORT */}
      {selectedCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                {editMode ? 'Edit Card Text' : 'Card Preview'}
              </h3>
              <div className="flex items-center gap-2">
                {!editMode && (
                  <button
                    onClick={toggleEditMode}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                    title="Edit text"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => {
                    setSelectedCard(null);
                    setEditMode(false);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Image */}
              <img
                src={selectedCard.front_image_url}
                alt="Card preview"
                className="w-full rounded-lg border border-gray-200"
              />

              {/* Front Text - EDITABLE */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm text-gray-500 font-medium">
                    FRONT TEXT
                  </label>
                  {editMode && (
                    <span className="text-xs text-blue-600 font-medium">
                      Click to edit
                    </span>
                  )}
                </div>

                {editMode ? (
                  <textarea
                    value={editedFrontText}
                    onChange={(e) => setEditedFrontText(e.target.value)}
                    className="w-full px-3 py-2 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-indigo-50"
                    rows={3}
                    placeholder="Edit front text..."
                  />
                ) : (
                  <p className="text-xl font-semibold text-gray-900">
                    {selectedCard.front_text}
                  </p>
                )}
              </div>

              {/* Inside Text - EDITABLE */}
              <div>
                <label className="text-sm text-gray-500 font-medium mb-2 block">
                  INSIDE TEXT (Optional)
                </label>

                {editMode ? (
                  <textarea
                    value={editedInsideText}
                    onChange={(e) => setEditedInsideText(e.target.value)}
                    className="w-full px-3 py-2 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-indigo-50"
                    rows={2}
                    placeholder="Edit inside text (optional)..."
                  />
                ) : (
                  <p className="text-lg text-gray-800">
                    {selectedCard.inside_text || '(No inside text)'}
                  </p>
                )}
              </div>

              {/* Design Notes */}
              {selectedCard.design_notes && !editMode && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-600 font-medium mb-1">DESIGN NOTE</p>
                  <p className="text-sm text-blue-900">{selectedCard.design_notes}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                {editMode ? (
                  <>
                    {/* Edit Mode Buttons */}
                    <button
                      onClick={applyEdits}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 font-medium"
                    >
                      <Check className="w-4 h-4" />
                      Apply Changes
                    </button>
                    <button
                      onClick={toggleEditMode}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    {/* View Mode Buttons */}
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
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 font-medium"
                    >
                      <Save className="w-4 h-4" />
                      Save to Library
                    </button>
                  </>
                )}
              </div>

              {/* Info when editing */}
              {editMode && (
                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-xs text-yellow-600 font-medium">💡 TIP</p>
                  <p className="text-sm text-yellow-900">Edit the text if it's not quite right, then click "Apply Changes" to save your edits. The image will stay the same.</p>
                </div>
              )}
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

## How It Works

### User Flow:

1. **Generate Cards** → See gallery
2. **Click Card** → Opens preview modal
3. **Click Edit Icon** (pencil) → Text becomes editable
4. **Edit Text** → Type new text if you don't like it
5. **Click "Apply Changes"** → Saves your edits
6. **Click "Save to Library"** → Saves card with your edited text

### Visual States:

**View Mode:**
```
┌─────────────────────┐
│   Card Preview      │ ✏️ (edit icon)
├─────────────────────┤
│     [IMAGE]         │
├─────────────────────┤
│ FRONT TEXT          │
│ "Your generated..." │
│                     │
│ INSIDE TEXT         │
│ "Love, Mom"         │
├─────────────────────┤
│ [Download] [Save]   │
└─────────────────────┘
```

**Edit Mode:**
```
┌─────────────────────┐
│   Edit Card Text    │ X (close)
├─────────────────────┤
│     [IMAGE]         │
├─────────────────────┤
│ FRONT TEXT          │
│ ┌───────────────────┐
│ │ Edit your text... │
│ │ here...           │
│ └───────────────────┘
│                     │
│ INSIDE TEXT         │
│ ┌───────────────────┐
│ │ Edit...           │
│ └───────────────────┘
├─────────────────────┤
│[Apply] [Cancel]     │
└─────────────────────┘
```

---

## Backend: No Changes Needed!

The backend already accepts any text in `/api/cards/save-complete`, so users can send edited text as-is.

If you want to track edits, optionally add to backend:

```javascript
// Optional: Track if text was edited
POST /api/cards/save-complete
{
  front_text: "User edited text",
  inside_text: "User edited inside",
  text_edited: true,  // Optional flag
  original_front_text: "AI generated text",  // Optional
}
```

But it's not necessary - your backend works as-is.

---

## What You Get

✅ Users can view generated cards
✅ Users can **edit text if it's bad**
✅ Edit inline in preview modal
✅ Apply changes or cancel
✅ Save with edited text to library
✅ Image stays the same (only text changes)

---

## Ready to Deploy?

This requires modifying ONE file:
- `cardhugs-frontend/src/components/CardGeneratorComplete.tsx`

Should I:
1. **Apply this change immediately** to the running containers?
2. **Show the exact file changes** for you to review?
3. **Build and deploy** the updated UI?

Let me know! 🎨
