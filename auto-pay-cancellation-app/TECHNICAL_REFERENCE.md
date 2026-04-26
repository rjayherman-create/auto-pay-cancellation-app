# CARDHUGS TECHNICAL REFERENCE

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)                  │
│                   http://localhost:80                       │
│                                                             │
│  CardGeneration.tsx                                         │
│  ├─ Generate Text (POST /api/cards/generate-text)          │
│  ├─ Select Text & Generate Image                           │
│  │  └─ Embed text in prompt (POST /api/cards/generate-image)│
│  └─ Save Both (POST /api/cards/save-generated)             │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/JSON
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  BACKEND (Node.js + Express)               │
│                   http://localhost:8000                    │
│                                                             │
│  routes/cards.js                                            │
│  ├─ POST /cards/generate-complete → Premium generation    │
│  ├─ POST /cards/save-complete → Save with metadata        │
│  ├─ GET /cards → List all                                 │
│  ├─ GET /cards/:id → Single card                          │
│  └─ PUT/DELETE → Update/Delete                            │
│                                                             │
│  routes/text.js                                             │
│  ├─ POST /text/generate → Text variations (gpt-3.5)       │
│  └─ POST /text/generate-full → Front + inside             │
│                                                             │
│  services/premiumCardService.js                             │
│  ├─ generatePremiumCardConcept() → gpt-4-turbo            │
│  ├─ generatePremiumImage() → dall-e-3 HD                  │
│  └─ generateMultiplePremiumCards() → Batch                │
│                                                             │
│  services/multimodalCardService.js                          │
│  ├─ generateCardConcept()                                  │
│  ├─ generateCardImage() → FAL.ai or dall-e-3             │
│  └─ generateMultipleCards()                                │
└────────────────────────┬────────────────────────────────────┘
                         │ SQL
                         ▼
┌─────────────────────────────────────────────────────────────┐
│           DATABASE (PostgreSQL 15)                         │
│           localhost:5432                                   │
│                                                             │
│  cards (PRIMARY TABLE)                                      │
│  ├─ front_text (TEXT) ✅                                   │
│  ├─ inside_text (TEXT) ✅                                  │
│  ├─ front_image_url (STRING) ✅                            │
│  ├─ inside_image_url (STRING) ✅                           │
│  ├─ metadata (JSONB) ✅                                    │
│  ├─ lora_model_id (FK to training_jobs)                   │
│  ├─ created_by (FK to users)                              │
│  └─ status (ENUM)                                          │
│                                                             │
│  occasions, users, batches, training_jobs, styles          │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow: Text → Image → Database

### 1. Text Generation Flow

```
Frontend
  └─ CardGeneration.tsx: generateTexts()
      └─ POST /api/cards/generate-text
         ├─ Input: {occasion, tone, count, lora_model}
         └─ Body:
            {
              "occasion": "Birthday",
              "occasion_name": "Birthday",
              "count": 4,
              "lora_model": "model-123",
              "lora_trigger_word": "watercolor_style"
            }

Backend
  └─ routes/text.js: POST /text/generate
     └─ Call OpenAI GPT-3.5-turbo
        └─ SystemPrompt: "You are a professional greeting card copywriter"
        └─ UserPrompt: "Generate ${count} unique greeting card messages for: ${occasion}"
        └─ Temperature: 0.9 (creativity)
        └─ Max tokens: 500

Response
  └─ {
      "success": true,
      "variations": [
        "Happy Birthday, beautiful soul!",
        "Wishing you a magical birthday...",
        "May your day be filled with joy...",
        "Another year, another adventure..."
      ],
      "count": 4
    }

Frontend
  └─ setGeneratedCards([...])
  └─ Display in scrollable list
  └─ User selects one
```

### 2. Image Generation Flow (Text Embedded)

```
Frontend
  └─ CardGeneration.tsx: generateCardImages(card)
     └─ Selected card: {front_text: "Happy Birthday...", inside_text: "..."}
     
     CRITICAL STEP: Embed text in prompt
     └─ if (loraModel) {
          prompt = "${card.front_text} | ${loraModel.trigger_word} style"
        } else {
          prompt = card.front_text
        }
     └─ Result: "Happy Birthday, beautiful soul! | watercolor_style"
     
     └─ POST /api/cards/generate-image
        ├─ Input: {prompt, style, lora_model_id, front_text, inside_text}
        └─ Body:
           {
             "prompt": "Happy Birthday, beautiful soul! | watercolor_style",
             "occasion_id": "occ-123",
             "front_text": "Happy Birthday, beautiful soul!",
             "inside_text": "May your day be filled with joy",
             "lora_model_id": "model-123",
             "style": "Birthday"
           }

Backend
  └─ routes/cards.js: POST /cards/generate-image
     └─ Call premiumCardService.generatePremiumImage()
        └─ Enhance prompt with professional photography brief
        └─ Include: style, design_suggestions, lora trigger word
        └─ Call OpenAI DALL-E 3
           ├─ Model: dall-e-3
           ├─ Quality: hd
           ├─ Size: 1024x1024
           └─ Style: vivid

Response
  └─ {
      "front_image_url": "https://oaidalleapiprodscus.blob.core.windows.net/...",
      "inside_image_url": "https://oaidalleapiprodscus.blob.core.windows.net/..."
    }

Frontend
  └─ selectedCard = {
      front_text: "Happy Birthday...",
      inside_text: "May your day...",
      front_image_url: "https://...",
      inside_image_url: "https://...",
      generated: true
    }
  └─ Display side-by-side preview
     ├─ LEFT: image + text
     └─ RIGHT: image + text
```

### 3. Save as Single Entity

```
Frontend
  └─ CardGeneration.tsx: saveCard()
     └─ selectedCard contains: front_text, inside_text, front_image_url, inside_image_url
     
     └─ POST /api/cards/save-generated
        └─ Body:
           {
             "occasion_id": "occ-123",
             "front_text": "Happy Birthday, beautiful soul!",
             "inside_text": "May your day be filled with joy",
             "front_image_url": "https://...",
             "inside_image_url": "https://...",
             "lora_model_id": "model-123",
             "style": "Birthday"
           }

Backend
  └─ routes/cards.js: POST /cards/save-generated
     └─ Card.create({
          occasion_id: "occ-123",
          front_text: "Happy Birthday...",      ✅ TEXT
          inside_text: "May your day...",       ✅ TEXT
          front_image_url: "https://...",       ✅ IMAGE
          inside_image_url: "https://...",      ✅ IMAGE
          lora_model_id: "model-123",
          metadata: {
            tone: "heartfelt",
            style: "Birthday",
            generation_method: "premium_multimodal",
            emotional_impact: "...",
            personalization: {}
          },
          created_by: user.userId
        })

Database
  └─ cards table
     └─ INSERT INTO cards (
          id, front_text, inside_text,
          front_image_url, inside_image_url,
          lora_model_id, metadata, created_by, created_at
        ) VALUES (...)

Response
  └─ {
      "success": true,
      "message": "✅ Card saved!",
      "card": {
        "id": "card-uuid",
        "front_text": "Happy Birthday...",
        "front_image_url": "https://...",
        "status": "draft",
        "quality": "premium"
      }
    }

Frontend
  └─ showSuccess("Card saved to library")
  └─ Clear selection
  └─ Ready for next card
```

---

## API Endpoints Reference

### Card Management

```
POST /api/cards/generate-complete
├─ Purpose: Generate premium cards (text + image together)
├─ Auth: Required (Bearer token)
├─ Body: {
    occasion: string (required),
    tone: string (default: "heartfelt"),
    style: string (default: "elegant"),
    variations: number (1-5, default: 3),
    lora_model_id: UUID (optional),
    recipientContext: string (optional)
  }
├─ Response: {
    success: true,
    cards: [{
      front_image_url: string,
      front_text: string,
      inside_message: string,
      concept_title: string,
      emotional_impact: string,
      uniqueness_factor: string,
      design_suggestions: string
    }, ...],
    count: number,
    quality: "PREMIUM"
  }
└─ Errors: 400, 404, 500

POST /api/cards/save-complete
├─ Purpose: Save card with all metadata
├─ Auth: Required
├─ Body: {
    occasion_id: UUID (required),
    front_text: string (required),
    inside_message: string,
    front_image_url: string (required),
    style: string,
    tone: string,
    lora_model_id: UUID (optional),
    personalization: object (optional)
  }
├─ Response: {success: true, card: {...}}
└─ Status: 201 (Created)

GET /api/cards
├─ Purpose: Fetch all cards
├─ Query Params: batch_id, status, style, style_id, skip, limit, search
├─ Response: {cards: [...], total: number, skip: number, limit: number}
└─ Status: 200

GET /api/cards/:id
├─ Purpose: Fetch single card
├─ Response: Card object with all fields
└─ Status: 200

PUT /api/cards/:id
├─ Purpose: Update card
├─ Body: Partial Card object
└─ Status: 200

DELETE /api/cards/:id
├─ Purpose: Delete card
└─ Status: 200
```

### Text Generation

```
POST /api/text/generate
├─ Purpose: Generate text variations
├─ Body: {
    prompt: string (required),
    occasion: string (optional),
    tone: string (default: "heartfelt"),
    count: number (default: 3)
  }
├─ Response: {
    variations: [string, ...],
    count: number,
    total_tokens: number
  }
└─ Status: 200

POST /api/text/generate-full
├─ Purpose: Generate front + inside message
├─ Body: {
    occasion: string (required),
    tone: string,
    recipient: string (optional),
    theme: string (optional)
  }
├─ Response: {
    front_text: string,
    inside_text: string
  }
└─ Status: 200
```

---

## Component Responsibilities

### Frontend

**CardGeneration.tsx**
- ✅ Fetch occasions and training jobs on mount
- ✅ Manage selection state (occasion, lora_model, cardCount)
- ✅ Call text generation API
- ✅ Display text variations
- ✅ Handle text selection
- ✅ Call image generation API (with embedded text)
- ✅ Display preview (text + image side-by-side)
- ✅ Call save API
- ✅ Show success/error messages
- ✅ Handle loading states

**API Service (api.ts)**
- ✅ Axios instance with auth interceptor
- ✅ Error handling (401 logout)
- ✅ Typed API calls for all endpoints
- ✅ Bearer token injection

### Backend

**routes/cards.js**
- ✅ POST /generate-complete → Premium generation
- ✅ POST /save-complete → Save with metadata
- ✅ CRUD operations (GET, PUT, DELETE)
- ✅ Filtering and pagination

**routes/text.js**
- ✅ POST /generate → Text variations
- ✅ POST /generate-full → Front + inside

**services/premiumCardService.js**
- ✅ generatePremiumCardConcept() → gpt-4-turbo
- ✅ generatePremiumImage() → dall-e-3 HD
- ✅ generatePremiumCard() → Combine
- ✅ generateMultiplePremiumCards() → Batch

**services/multimodalCardService.js**
- ✅ generateCardConcept() → Card design
- ✅ generateCardImage() → FAL.ai or dall-e-3
- ✅ generateCompleteCard() → Full workflow
- ✅ generateMultipleCards() → Batch

### Database

**Card Model**
- ✅ Store all text fields
- ✅ Store all image URLs
- ✅ Store metadata as JSONB
- ✅ Track relationships (occasion, user, lora_model)
- ✅ Track status and timestamps

---

## Error Handling Strategy

### Frontend Errors
```typescript
try {
  const response = await fetch('/api/cards/generate-text', {...});
  if (!response.ok) {
    throw new Error('Failed to generate text');
  }
  const data = await response.json();
  setGeneratedCards(data.cards);
} catch (err) {
  setError(err.message);
  // Display red toast: "Failed to generate text"
}
```

### Backend Errors
```javascript
// Validation
if (!occasion) return res.status(400).json({ error: 'Occasion is required' });

// Not found
if (!card) return res.status(404).json({ error: 'Card not found' });

// Server error
catch (error) {
  console.error('Error:', error);
  res.status(500).json({ 
    error: 'Failed to generate cards',
    message: 'Check OPENAI_API_KEY environment variable'
  });
}
```

### API Key Errors
```javascript
if (!process.env.OPENAI_API_KEY) {
  return res.status(500).json({
    error: 'OpenAI API key not configured',
    message: 'Set OPENAI_API_KEY environment variable'
  });
}
```

---

## Performance Considerations

### Generation Time
- Text generation: 2-5 seconds (GPT-3.5-turbo)
- Image generation: 10-30 seconds (DALL-E 3 HD)
- Total per card: 15-35 seconds
- Batch 3 cards: 45-105 seconds

### Rate Limiting
- OpenAI: 3 requests/minute for images (varies by key)
- Backend: 1-2 second delays between variations
- Frontend: Disabled button during generation

### Database Performance
- Indexed: batch_id, status, created_by, style_id
- Pagination: 50 cards per request (default)
- JSONB metadata: Can query with operators

### Image Storage
- URLs stored (not files)
- CDN delivery via OpenAI/FAL.ai
- No local file storage needed
- Can optimize with caching headers

---

## Testing Scenarios

### Scenario 1: Basic Workflow
1. Generate text (3 variations)
2. Select first variation
3. Generate image
4. Save card
5. Verify in library

### Scenario 2: LoRA Model Integration
1. Select LoRA model (e.g., "Watercolor")
2. Generate text
3. Select text
4. Generate image (text should show watercolor style)
5. Verify style applied to image

### Scenario 3: Error Handling
1. Missing OPENAI_API_KEY → Should show error
2. Invalid occasion → Should show validation error
3. Network timeout → Should retry gracefully
4. Rate limiting → Should show helpful message

### Scenario 4: Batch Generation
1. Set variations = 5
2. Generate text (5 variations)
3. Select variations 1, 3, 5
4. Generate images for each
5. Save all 3 cards

---

## Security Checklist

- ✅ JWT authentication on all protected routes
- ✅ Non-root Docker users (nodejs:1001)
- ✅ HTTPS-ready (can add SSL reverse proxy)
- ✅ Input validation on backend
- ✅ Error messages don't leak secrets
- ✅ Database password in environment
- ✅ JWT secret in environment (not hardcoded)
- ✅ CORS configured properly
- ✅ No SQL injection (Sequelize ORM)
- ✅ Health checks for availability

---

## References

- **OpenAI API**: https://platform.openai.com/docs/api-reference
- **FAL.ai**: https://fal.ai/docs
- **Sequelize ORM**: https://sequelize.org/docs/v6/
- **Express.js**: https://expressjs.com/
- **React**: https://react.dev/
- **Docker Compose**: https://docs.docker.com/compose/
- **PostgreSQL**: https://www.postgresql.org/docs/

---

**Last Updated**: Feb 15, 2026  
**Status**: Complete & Production Ready ✅
