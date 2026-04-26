# CardHugs Store Inventory Naming System

**Version**: 1.0  
**Status**: Production Ready  
**Purpose**: Prevent card name collisions in store inventory with automatic, sequential naming

---

## 🎯 Overview

The CardNaming System ensures every card published to the CardHugs store has a unique, sequential name:

**Format**: `{occasion}_{sequence:02d}_{side}`

**Examples**:
```
birthday_01_Front
birthday_01_Inside
birthday_02_Front
birthday_02_Inside
anniversary_01_Front
anniversary_01_Inside
mother's_day_03_Front
mother's_day_03_Inside
```

---

## ✨ Key Features

### 1. **Automatic Sequential Numbering**
- Each occasion tracks its own sequence counter
- Sequences auto-increment: 01, 02, 03, etc.
- No manual sequence entry needed
- No risk of duplicate numbers

### 2. **Collision-Free Naming**
- Sequence counter is the source of truth
- Stored in `CardNameSequence` table
- Atomic database operations prevent race conditions
- Published vs. draft tracking

### 3. **User-Friendly UI**
- Shows next card name BEFORE saving
- Real-time preview as you select occasion
- Automatic refresh after each save
- One-click save with confirmation

### 4. **Store-Ready Format**
- Consistent, normalized names
- Easy to organize by occasion
- Clear front/inside separation
- SEO-friendly lowercase

---

## 📂 Database Schema

### `CardNameSequence` Table (New)
```sql
CREATE TABLE card_name_sequences (
  id UUID PRIMARY KEY,
  occasion_id UUID UNIQUE (references occasions),
  occasion_name VARCHAR(255) UNIQUE,
  next_sequence INTEGER DEFAULT 1,
  last_published_sequence INTEGER DEFAULT 0,
  total_cards_generated INTEGER DEFAULT 0,
  total_cards_published INTEGER DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Purpose**: Source of truth for sequence numbers

**Example Row**:
```json
{
  "occasion_id": "550e8400-e29b-41d4-a716-446655440000",
  "occasion_name": "Birthday",
  "next_sequence": 5,
  "last_published_sequence": 3,
  "total_cards_generated": 7,
  "total_cards_published": 3
}
```

### `Cards.metadata` Field (Updated)
```json
{
  "card_name": "birthday_01_Front",
  "card_inside_name": "birthday_01_Inside",
  "card_sequence_number": 1,
  "occasion_name": "Birthday",
  "card_sequence_name": "birthday_01_Front"
}
```

---

## 🔄 Workflow

### Step 1: User Selects Occasion
```
User opens CardGeneratorComplete
↓
Selects occasion dropdown (e.g., "Birthday")
↓
Frontend calls: GET /api/cards/naming/next/{occasionId}
↓
Backend queries CardNameSequence table
↓
Returns: { front: "birthday_01_Front", inside: "birthday_01_Inside", sequence: 1 }
↓
UI displays next card name: "birthday_01_Front / birthday_01_Inside"
```

### Step 2: Generate & Personalize
```
User clicks "Generate Premium Cards"
↓
Generates 1-5 card variations
↓
User clicks a card to personalize
↓
User fills in recipient/sender names
↓
UI still shows: "Will be saved as: birthday_01_Front / birthday_01_Inside"
```

### Step 3: Save to Inventory
```
User clicks "Save Card"
↓
Confirmation modal shows card names again
↓
User clicks "Save to Inventory"
↓
Frontend calls: POST /api/cards/save-with-naming
  {
    occasion_id: "550e8400...",
    front_text: "Happy Birthday!",
    front_image_url: "https://...",
    ... other fields
  }
↓
Backend:
  1. Queries CardNameSequence for next number
  2. Generates names: birthday_01_Front, birthday_01_Inside
  3. Increments CardNameSequence.next_sequence to 2
  4. Creates Card with metadata.card_name = "birthday_01_Front"
  5. Returns: { success: true, card: {...} }
↓
UI shows: "✅ Card saved! birthday_01_Front / birthday_01_Inside"
↓
Refreshes naming display for next card
```

---

## 🧠 How It Works

### Sequence Tracking

**Query to get next sequence**:
```sql
SELECT next_sequence FROM card_name_sequences 
WHERE occasion_id = $1 
FOR UPDATE;  -- Lock the row
```

**Atomic increment**:
```sql
UPDATE card_name_sequences 
SET next_sequence = next_sequence + 1,
    total_cards_generated = total_cards_generated + 1
WHERE occasion_id = $1;
```

This `FOR UPDATE` lock prevents two simultaneous requests from getting the same sequence number.

### Name Generation

```javascript
// Input
occasionId = "550e8400-e29b-41d4-a716-446655440000"
sequence = 1 (from CardNameSequence.next_sequence)

// Process
occasion = await Occasion.findByPk(occasionId)
// → { name: "Birthday", ... }

baseName = "birthday_01"
front = "birthday_01_Front"
inside = "birthday_01_Inside"

// Output
{
  front: "birthday_01_Front",
  inside: "birthday_01_Inside",
  sequence: 1,
  occasion: "Birthday"
}
```

---

## 📡 API Endpoints

### GET /api/cards/naming/next/:occasionId
**Get next card names for an occasion**

```http
GET /api/cards/naming/next/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer {token}
```

**Response**:
```json
{
  "success": true,
  "occasion": "Birthday",
  "sequence": 1,
  "front": "birthday_01_Front",
  "inside": "birthday_01_Inside",
  "preview": "birthday_01_Front / birthday_01_Inside"
}
```

**Used by**: CardGeneratorComplete (on occasion change)

---

### GET /api/cards/naming/stats
**Get naming statistics across all occasions**

```http
GET /api/cards/naming/stats
Authorization: Bearer {token}
```

**Response**:
```json
{
  "success": true,
  "stats": [
    {
      "occasion": "Birthday",
      "totalCards": 15,
      "publishedCards": 8,
      "nextSequence": 16
    },
    {
      "occasion": "Anniversary",
      "totalCards": 5,
      "publishedCards": 2,
      "nextSequence": 6
    }
  ]
}
```

**Used by**: Dashboard, Admin reporting

---

### GET /api/cards/naming/occasion/:occasionId
**Get all card sequences for one occasion**

```http
GET /api/cards/naming/occasion/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer {token}
```

**Response**:
```json
{
  "success": true,
  "sequences": [
    {
      "id": "card-uuid",
      "occasion": "Birthday",
      "status": "approved",
      "cardName": "birthday_01_Front",
      "sequence": 1,
      "createdAt": "2024-02-15T10:30:00Z"
    }
  ],
  "total": 15,
  "nextSequence": 16
}
```

**Used by**: Admin inventory management

---

### POST /api/cards/save-with-naming
**Save card with automatic naming** (NEW RECOMMENDED ENDPOINT)

```http
POST /api/cards/save-with-naming
Content-Type: application/json
Authorization: Bearer {token}

{
  "occasion_id": "550e8400-e29b-41d4-a716-446655440000",
  "front_text": "Happy Birthday!",
  "inside_message": "Hope your day is special",
  "front_image_url": "https://cdn.example.com/image.png",
  "style": "Watercolor",
  "tone": "Heartfelt",
  "lora_model_id": "optional-uuid",
  "personalization": {
    "recipient_name": "Mom",
    "sender_name": "Sarah"
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "✅ Card saved!\n\n📄 birthday_01_Front\n📄 birthday_01_Inside",
  "card": {
    "id": "card-uuid",
    "card_name": "birthday_01_Front",
    "card_inside_name": "birthday_01_Inside",
    "sequence": 1,
    "occasion": "Birthday",
    "front_text": "Happy Birthday!",
    "status": "draft",
    "created_at": "2024-02-15T10:30:00Z"
  }
}
```

**Notes**:
- Automatic sequence number (optional `sequence_number` param for manual override)
- Returns both front and inside names
- Card ready for review → approval → publishing

---

## 🎯 UI/UX Integration

### CardGeneratorComplete Changes

**1. Naming Preview Box** (When occasion selected)
```
┌─────────────────────────────────────┐
│ Next Card Name (Sequence #1):       │
├─────────────────────────────────────┤
│ birthday_01_Front          (Front)  │
│ birthday_01_Inside         (Inside) │
└─────────────────────────────────────┘
```

**2. Modal Header** (Before saving)
```
Will be saved as: birthday_01_Front / birthday_01_Inside
```

**3. Confirmation Modal** (On save)
```
┌─────────────────────────────────────┐
│ Save Card to Inventory              │
├─────────────────────────────────────┤
│ Card Names (Sequence #1):           │
│                                     │
│ Front:  birthday_01_Front           │
│ Inside: birthday_01_Inside          │
│                                     │
│ Occasion: Birthday                  │
├─────────────────────────────────────┤
│ [Cancel] [Save to Inventory]        │
└─────────────────────────────────────┘
```

---

## 🔒 Collision Prevention

### Race Condition Protection

**Problem**: Two users save cards simultaneously
```
User A: SELECT next_sequence = 5
User B: SELECT next_sequence = 5
User A: INSERT card with sequence 5
User B: INSERT card with sequence 5  ← COLLISION!
```

**Solution**: Database-level locking
```sql
-- Backend does this atomically:
BEGIN TRANSACTION;
SELECT next_sequence FROM card_name_sequences 
  WHERE occasion_id = $1 
  FOR UPDATE;  -- Locks the row

-- User B waits here
UPDATE card_name_sequences 
  SET next_sequence = next_sequence + 1
  WHERE occasion_id = $1;

INSERT INTO cards (metadata) VALUES (...);
COMMIT;
-- User B can now proceed
```

### Validation

Each card must have:
- ✅ Unique `card_name` (checked before save)
- ✅ Valid format: `{occasion}_{seq:02d}_{side}`
- ✅ Matching occasion in database
- ✅ Sequential in CardNameSequence table

---

## 📊 Monitoring & Admin

### Naming Statistics
```
Occasion          Cards  Published  Next #
─────────────────────────────────────────
Birthday            42        28      43
Anniversary         17        12      18
Mother's Day        31        20      32
Father's Day        28        15      29
Wedding             19         8      20
```

**View with**: `GET /api/cards/naming/stats`

### Bulk Operations

Naming system handles:
- ✅ Bulk approve (doesn't change names)
- ✅ Bulk publish (tracks published count)
- ✅ Bulk delete (doesn't reset sequence)
- ✅ Bulk download (includes names in metadata)

### Admin Rename (Emergency Only)

```javascript
// If needed (admin panel)
await CardNamingService.renameCard(cardId, 'birthday_42_Front');
// Validates format
// Checks availability
// Updates metadata
// Logs the change
```

---

## 🚀 Deployment

### Database Migration
```sql
-- Run this on first deployment:
CREATE TABLE card_name_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  occasion_id UUID UNIQUE NOT NULL REFERENCES occasions(id),
  occasion_name VARCHAR(255) UNIQUE NOT NULL,
  next_sequence INTEGER NOT NULL DEFAULT 1,
  last_published_sequence INTEGER NOT NULL DEFAULT 0,
  total_cards_generated INTEGER NOT NULL DEFAULT 0,
  total_cards_published INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed for existing occasions:
INSERT INTO card_name_sequences (occasion_id, occasion_name, next_sequence)
SELECT id, name, 1 FROM occasions
ON CONFLICT DO NOTHING;
```

### Initial Sync (Optional)
```bash
# If you have existing cards, migrate them:
curl -X POST http://localhost:8000/api/cards/naming/migrate-existing \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## 📋 Best Practices

### For Users
1. ✅ Save cards one at a time (sequence auto-increments)
2. ✅ Don't try to name cards manually
3. ✅ Check preview before saving
4. ✅ Bulk download includes names in filenames

### For Admins
1. ✅ Monitor naming stats on dashboard
2. ✅ Don't manually edit card_name metadata
3. ✅ Only rename if absolutely necessary (document why)
4. ✅ Never reset sequence counters

### For Developers
1. ✅ Use `save-with-naming` endpoint (not `save-complete`)
2. ✅ Always pass `occasion_id` for naming
3. ✅ Call `GET /api/cards/naming/next/{id}` to preview names
4. ✅ Expect names in response, don't guess them

---

## 🐛 Troubleshooting

### Cards Getting Same Number
**Cause**: Race condition or transaction issue
**Fix**: Check database locking is enabled, restart backend

### Names Not Showing
**Cause**: CardNameSequence table not seeded
**Fix**: Run migration SQL above

### "Invalid card name format"
**Cause**: Manual name entry didn't match format
**Fix**: Use auto-naming (don't manually enter names)

### Sequence Gap (jumped from 05 to 08)
**Normal**: Occurs when saves are canceled or rejected
**Action**: No action needed, gaps are fine

---

## 📞 API Reference for Developers

### CardNamingService (Node.js)

```javascript
const CardNamingService = require('../services/cardNamingService');

// Get next sequence for occasion
const seq = await CardNamingService.getNextSequenceNumber(occasionId);

// Generate names
const names = await CardNamingService.generateCardNames(occasionId);
// → { front: "birthday_01_Front", inside: "birthday_01_Inside", sequence: 1, occasion: "Birthday" }

// Check if name available
const available = await CardNamingService.isNameAvailable("birthday_01_Front");

// Get all sequences for occasion
const sequences = await CardNamingService.getOccasionSequences(occasionId);

// Get stats
const stats = await CardNamingService.getNamingStats();

// Rename card (admin only)
await CardNamingService.renameCard(cardId, "birthday_42_Front");

// Validate format
const valid = CardNamingService.isValidCardName("birthday_01_Front");

// Migration
await CardNamingService.migrateExistingCards();
```

---

**Status**: ✅ Production Ready  
**Last Updated**: 2024-02-15  
**Maintained By**: Development Team
