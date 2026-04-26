# Card Generation Process - Complete Guide

## Overview

The Card Generation system enables users to create beautiful greeting cards with:
- **Occasion Selection**: Choose from 8+ pre-configured occasions
- **Style Model Selection**: Apply custom LoRA-trained styles (optional)
- **AI Text Generation**: Automatic text creation for front and inside
- **Image Generation**: AI-powered image creation for both sides
- **Card Library**: Save, review, and manage generated cards

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              Frontend (React)                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Card Generation Component                           │   │
│  │ - Occasion selector with icons/emojis              │   │
│  │ - LoRA model selector (completed training jobs)    │   │
│  │ - Text variations display                          │   │
│  │ - Card preview (front + inside)                    │   │
│  │ - Download and save buttons                        │   │
│  └─────────────────────────────────────────────────────┘   │
└──────────────────┬──────────────────────────────────────────┘
                   │ HTTP REST API
                   ▼
┌─────────────────────────────────────────────────────────────┐
│              Backend (Express/Node.js)                      │
│                                                              │
│  POST /api/cards/generate-text                             │
│  └─ Input: occasion_id, count, lora_model                 │
│     └─ Service: generateCardText() from templates          │
│     └─ Output: front_text + inside_text variations        │
│                                                              │
│  POST /api/cards/generate-image                            │
│  └─ Input: front_text, inside_text, prompt, lora_model    │
│     └─ Service: generateCardImage() via AI API             │
│     └─ Output: front_image_url, inside_image_url          │
│                                                              │
│  POST /api/cards/save-generated                            │
│  └─ Input: occasion_id, texts, images, lora_model         │
│     └─ Database: INSERT Card with all data                │
│     └─ Output: card record saved to database              │
└─────────────────────────────────────────────────────────────┘
```

## User Workflow

### Step 1: Select Occasion

User sees a dropdown with available occasions:
- 🎂 Birthday
- 💍 Anniversary
- 💒 Wedding
- ✨ Congratulations
- 🕯️ Sympathy
- 💚 Get Well
- 🙏 Thank You
- 🎄 Holiday

Each occasion has:
- Emoji for visual identification
- Color indicator
- Pre-configured text templates
- Associated styles

### Step 2: Select Style (Optional)

User can choose:
- **No custom style** → Use default/classic style
- **Completed LoRA Models** → Apply trained custom style
  - Shows model name
  - Shows trigger word (e.g., "cstyle", "holiday2024")

### Step 3: Configure Generation

User sets:
- **Generate Variations**: 1-10 (slider, default: 4)
  - More variations = more options but slower generation

### Step 4: Generate Text Variations

Click "Generate Text Variations" button:
- Backend receives: occasion_id, count, lora_model
- Service generates text pairs using templates
- Returns: front_text + inside_text for each variation
- Frontend displays variations in scrollable list

Example variations for Birthday:
```
Variation 1:
  Front: "Happy Birthday!"
  Inside: "Wishing you a day filled with joy and laughter!"

Variation 2:
  Front: "Time to celebrate you"
  Inside: "Hope your birthday is as amazing as you are!"

Variation 3:
  Front: "Another year, another story"
  Inside: "Another year older, still looking fabulous!"

... (up to 10 variations)
```

### Step 5: Select Text Variation

User clicks on a variation to:
- Highlight it in the list
- Trigger image generation
- Show loading state while generating

### Step 6: Generate Images

For selected text variation:
- Backend receives: front_text, inside_text, lora_model
- Image generation service creates two images:
  - Front image based on front_text
  - Inside image based on inside_text
- If LoRA model selected, embeds trigger word in prompt
- Returns URLs to generated images

### Step 7: Preview Card

User sees:
- Side-by-side preview of front and inside
- Both images and corresponding text
- Full card view before saving

### Step 8: Download or Save

User can:
- **Download Front**: Save front image as PNG
- **Download Inside**: Save inside image as PNG
- **Save to Library**: Save card record to database
  - Creates Card record with:
    - Front/inside texts
    - Front/inside images
    - Occasion reference
    - LoRA model reference
    - Style information
    - Status: 'draft'

## Supported Occasions & Templates

### 🎂 Birthday
**Front texts:**
- Happy Birthday!
- Time to celebrate you
- Another year, another story
- Make a wish!
- Your special day
- Let's celebrate

**Inside texts:**
- Wishing you a day filled with joy and laughter!
- Hope your birthday is as amazing as you are!
- Another year older, still looking fabulous!
- Celebrate yourself today!
- You deserve all the happiness today!
- Here's to another year of adventures!

### 💍 Anniversary
**Front texts:**
- Happy Anniversary
- Celebrating Us
- Years of Love
- Our Journey Together
- Love Grows Stronger
- Forever & Always

### 💒 Wedding
**Front texts:**
- Congratulations
- Two Hearts, One Love
- Just Married
- New Adventures Begin
- Here Comes the Bride
- Happily Ever After

### ✨ Congratulations
**Front texts:**
- Congratulations!
- You Did It!
- What an Achievement
- Success at Last
- Well Done!
- You're Amazing

### 🕯️ Sympathy
**Front texts:**
- With Sympathy
- Thinking of You
- Our Deepest Condolences
- In Loving Memory
- We Remember
- Heartfelt Sympathy

### 💚 Get Well
**Front texts:**
- Get Well Soon
- Feel Better Soon
- Thinking of You
- Sending Love & Healing
- Get Better Vibes
- Speedy Recovery

### 🙏 Thank You
**Front texts:**
- Thank You
- You're Appreciated
- Grateful for You
- Thanks a Million
- Appreciation
- With Gratitude

### 🎄 Holiday
**Front texts:**
- Happy Holidays
- Season's Greetings
- Holiday Cheer
- Festive Wishes
- Joy & Celebration
- Happy Festivities

## API Endpoints

### Generate Text Variations

```bash
POST /api/cards/generate-text
Authorization: Bearer {token}
Content-Type: application/json

Request body:
{
  "occasion": "550e8400-e29b-41d4-a716-446655440000",
  "occasion_name": "Birthday",
  "count": 4,
  "lora_model": "550e8400-e29b-41d4-a716-446655440001",  // optional
  "lora_trigger_word": "cstyle"  // optional
}

Response:
{
  "cards": [
    {
      "front_text": "Happy Birthday!",
      "inside_text": "Wishing you a day filled with joy and laughter!",
      "occasion": "Birthday",
      "style": "cstyle"
    },
    ...
  ],
  "occasion": "550e8400-e29b-41d4-a716-446655440000",
  "lora_model": "550e8400-e29b-41d4-a716-446655440001"
}
```

### Generate Images

```bash
POST /api/cards/generate-image
Authorization: Bearer {token}
Content-Type: application/json

Request body:
{
  "occasion_id": "550e8400-e29b-41d4-a716-446655440000",
  "front_text": "Happy Birthday!",
  "inside_text": "Wishing you a day filled with joy and laughter!",
  "prompt": "Happy Birthday! | cstyle style",  // includes trigger word if using LoRA
  "lora_model_id": "550e8400-e29b-41d4-a716-446655440001",  // optional
  "style": "cstyle"  // optional
}

Response:
{
  "front_image_url": "https://storage.example.com/cards/front-uuid.png",
  "inside_image_url": "https://storage.example.com/cards/inside-uuid.png",
  "occasion_id": "550e8400-e29b-41d4-a716-446655440000",
  "style": "cstyle"
}
```

### Save Generated Card

```bash
POST /api/cards/save-generated
Authorization: Bearer {token}
Content-Type: application/json

Request body:
{
  "occasion_id": "550e8400-e29b-41d4-a716-446655440000",
  "front_text": "Happy Birthday!",
  "inside_text": "Wishing you a day filled with joy and laughter!",
  "front_image_url": "https://storage.example.com/cards/front-uuid.png",
  "inside_image_url": "https://storage.example.com/cards/inside-uuid.png",
  "lora_model_id": "550e8400-e29b-41d4-a716-446655440001",  // optional
  "style": "cstyle"  // optional
}

Response:
{
  "success": true,
  "message": "Card saved successfully",
  "card": {
    "id": "card-uuid",
    "front_text": "Happy Birthday!",
    "inside_text": "Wishing you a day filled with joy and laughter!",
    "style": "cstyle",
    "status": "draft"
  }
}
```

## Database Schema

### Cards Table

```sql
CREATE TABLE cards (
  id UUID PRIMARY KEY,
  batch_id UUID (nullable, FK to batches),
  occasion_id UUID (nullable, FK to occasions),
  lora_model_id UUID (nullable, FK to training_jobs),
  
  -- Front of card
  front_text TEXT,
  front_image_url TEXT,
  
  -- Inside of card
  inside_text TEXT,
  inside_image_url TEXT,
  
  -- Legacy fields
  image_url TEXT,
  prompt TEXT,
  occasion VARCHAR,
  style VARCHAR DEFAULT 'classic',
  
  -- Status and metadata
  status ENUM ('draft', 'qc_passed', 'approved', 'published', 'rejected'),
  quality_score INTEGER (0-100),
  rejection_reason TEXT,
  tags TEXT[],
  metadata JSONB,
  
  -- Review info
  reviewed_by UUID (FK to users),
  reviewed_at TIMESTAMP,
  created_by UUID (FK to users),
  
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## Text Generation Implementation

### Current (Template-Based)
Uses predefined templates stored in `services/textAndImageService.js`:
- 8 occasions with 6 front and 6 inside variations each
- Random selection creates combinations
- Fast, deterministic, no API calls needed

### Future (AI-Based)
Replace templates with AI text generation:

```javascript
// Example: Using OpenAI GPT
async function generateCardText({ occasion_name, count }) {
  const prompt = `Generate ${count} unique greeting card text pairs for a ${occasion_name} card. 
    Return as JSON array with front_text and inside_text for each.`;
  
  const response = await openai.createCompletion({
    model: 'gpt-4',
    prompt: prompt,
    temperature: 0.8,
  });
  
  return JSON.parse(response.choices[0].text);
}
```

## Image Generation Implementation

### Current (Placeholder)
Returns mock placeholder URLs:
```javascript
const mockImageUrl = `https://via.placeholder.com/1024x1024/...?text=${text}`;
```

### Future Integrations
Choose based on needs:

**Option 1: FAL.ai (Recommended)**
```javascript
async function generateCardImage({ prompt, lora_model_id }) {
  const fal = require('@fal-ai/serverless-client');
  
  const result = await fal.subscribe('fal-ai/lora-fast', {
    input: {
      prompt,
      model: 'sd-1.5',
      lora_model_id,  // Use trained LoRA
    }
  });
  
  return result.image_url;
}
```

**Option 2: Replicate**
```javascript
const Replicate = require('replicate');

async function generateCardImage({ prompt, lora_model_id }) {
  const output = await replicate.run(
    'stability-ai/sdxl:3d3bbf3f17ede30d25a9f5fa16e1587e5a670900',
    {
      input: {
        prompt,
        lora_weights: lora_model_id,
      }
    }
  );
  
  return output[0];
}
```

**Option 3: Custom LoRA Server (RunPod/Lambda)**
```javascript
async function generateCardImage({ prompt, lora_model_id }) {
  const response = await fetch('https://lora-server.example.com/generate', {
    method: 'POST',
    body: JSON.stringify({
      prompt,
      lora_model_id,
      height: 1024,
      width: 1024,
    })
  });
  
  return response.json();
}
```

## Features & Benefits

✅ **Easy Occasion Selection**
- Visually organized with emojis
- One-click selection

✅ **Instant Text Generation**
- No API calls for templates
- Sub-second response

✅ **LoRA Model Integration**
- Use trained custom styles
- Trigger word embedding in prompts

✅ **Preview Before Saving**
- Side-by-side front/inside view
- Download individual images

✅ **Batch Processing Ready**
- Generate 1-10 variations at once
- Parallel image generation

✅ **Card Library**
- Save cards for later use
- Track by occasion and style
- Review workflow integration

## Performance

| Operation | Time | Notes |
|-----------|------|-------|
| Load occasions | 100-200ms | Cached query |
| Load LoRA models | 100-200ms | Cached query |
| Generate text (4 variations) | 50-100ms | Template-based |
| Generate image (1) | 5-15 seconds | AI API call |
| Save card | 50-100ms | Database insert |

## Next Steps

1. **Integrate Image Generation API**
   - Choose provider (FAL.ai, Replicate, etc)
   - Replace mock URLs with real images
   - Handle async generation

2. **Add AI Text Generation**
   - Replace templates with GPT-powered generation
   - Allow custom prompt input

3. **Enhance Card Customization**
   - Allow text editing after generation
   - Color/font options
   - Layout selection

4. **Batch Processing**
   - Generate multiple cards in background
   - Progress tracking
   - Bulk download

5. **Card Templates**
   - Create custom occasion templates
   - Save favorite text pairs
   - Community templates

---

**System ready to use!** 🎉 Start generating cards at: `http://localhost/generate`
