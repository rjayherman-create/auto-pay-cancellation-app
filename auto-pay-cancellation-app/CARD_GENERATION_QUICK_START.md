# 🎴 Card Generation - Quick Start (2 min)

## Access

```
http://localhost
→ Login (use existing credentials)
→ Click "Generate Cards" in sidebar
```

## Generate a Card - 5 Steps

### 1️⃣ Select Occasion
```
Dropdown menu:
🎂 Birthday
💍 Anniversary
💒 Wedding
✨ Congratulations
🕯️ Sympathy
💚 Get Well
🙏 Thank You
🎄 Holiday
```

### 2️⃣ Select Style (Optional)
```
"Style Model" dropdown:
- No custom style (default)
- Or pick completed LoRA training job
```

### 3️⃣ Set Variations
```
Drag slider: 1-10 (default: 4)
- More = more options
- Faster = fewer variations
```

### 4️⃣ Click "Generate Text Variations"
```
Generates 4-10 text pairs:
- Front text (e.g., "Happy Birthday!")
- Inside text (e.g., "Wishing you...")
Takes < 1 second
```

### 5️⃣ Select, Preview, Save/Download
```
Click variation → Generates images → Preview
↓
Download Front    Download Inside    Save to Library
```

## What You Get

| Item | Format | Use |
|------|--------|-----|
| Front Image | PNG | Card cover |
| Inside Image | PNG | Card interior |
| Front Text | String | Card message |
| Inside Text | String | Card message |
| Occasion | Reference | Categorization |
| Style | Tag | LoRA model used |
| Status | draft | Ready for review |

## API Endpoints (for developers)

```bash
# Generate text
POST /api/cards/generate-text
Input: occasion, occasion_name, count, lora_model(opt)
Output: cards[] with front_text + inside_text

# Generate images
POST /api/cards/generate-image
Input: front_text, inside_text, prompt, lora_model(opt)
Output: front_image_url, inside_image_url

# Save card
POST /api/cards/save-generated
Input: texts, images, occasion_id, lora_model(opt)
Output: card record saved
```

## Text Templates (36 per Occasion)

Each of 8 occasions has:
- 6 front text options
- 6 inside text options
- 36 unique combinations

Example Birthday:
```
Front: Happy Birthday!
Inside: Wishing you a day filled with joy and laughter!
```

## Future AI Integration Points

```javascript
// Current: Placeholder images
→ Replace with FAL.ai, Replicate, or local Stable Diffusion

// Current: Template-based text
→ Replace with GPT-4 or Claude for custom generation

// Current: Single occasion selection
→ Add: Custom text input, multiple occasions, batch processing
```

## Common Questions

**Q: Where are my generated cards saved?**
A: Database (when you click "Save to Library"). View in "Card Review".

**Q: Can I edit text after generation?**
A: Not yet (future feature). Click different variation to regenerate.

**Q: Can I use my trained LoRA style?**
A: Yes! Only completed training jobs appear in dropdown.

**Q: Why are images placeholder?**
A: Image generation API integration is next step (easy to add).

**Q: Can I batch generate cards?**
A: Generate up to 10 variations at once, manual selection needed.

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Enter | Generate (when in form) |
| Esc | Close dialogs |
| ↑↓ | Scroll variations |

## Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Card generated ✓ |
| 400 | Missing fields | Check form |
| 401 | Not logged in | Login first |
| 500 | Server error | Check logs |

## Troubleshooting

**No occasions in dropdown:**
```
→ Refresh page
→ Check backend: docker compose logs backend
```

**Image generation stuck:**
```
→ Currently uses placeholder (instant)
→ Future: Will call AI API (~5-15 sec)
```

**Can't save card:**
```
→ Check database connection
→ Verify all required fields filled
```

**LoRA model not showing:**
```
→ Training job must have status: 'completed'
→ Check LoRA Training page
```

## Performance Tips

- Generate 1-2 variations first to test
- Use LoRA model for consistent style
- Batch generate 4-10 for variety
- Download highest resolution available

## Integration Checklist

- ✅ Occasion selection
- ✅ LoRA model integration
- ✅ Text generation
- ✅ Frontend UI
- ✅ API endpoints
- ✅ Database persistence
- 🔲 Real image generation (next)
- 🔲 AI text generation (next)
- 🔲 Batch processing (next)

## File Locations

```
Frontend component: src/components/CardGeneration.tsx
Backend service: services/textAndImageService.js
Routes: routes/cards.js
Database model: models/Card.js
Occasions config: backend-node/models/Occasion.js
```

## Database Schema (Cards Table)

```sql
Cards:
  - id (UUID)
  - occasion_id (FK)
  - lora_model_id (FK, optional)
  - front_text, inside_text (TEXT)
  - front_image_url, inside_image_url (TEXT)
  - style (VARCHAR)
  - status (ENUM: draft, approved, published)
  - created_by (FK to users)
  - created_at, updated_at (TIMESTAMP)
```

---

**Ready to generate!** 🚀
Go to: `http://localhost/generate`
