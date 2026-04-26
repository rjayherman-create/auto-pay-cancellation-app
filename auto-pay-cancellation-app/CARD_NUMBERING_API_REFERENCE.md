# Card Numbering System - API Reference & Code Examples

**Version**: 1.0  
**Status**: Production Ready  
**Format**: `{occasion}_{sequence:02d}_{side}`

---

## 📋 Table of Contents

1. [API Endpoints](#api-endpoints)
2. [Code Examples](#code-examples)
3. [Naming Format](#naming-format)
4. [Error Handling](#error-handling)
5. [Best Practices](#best-practices)
6. [Common Tasks](#common-tasks)

---

## 🔌 API Endpoints

### 1. Get Next Card Names

**Endpoint**: `GET /api/cards/naming/next/:occasionId`

**Description**: Get the next available card names for an occasion

**Parameters**:
- `occasionId` (string, required) - UUID of the occasion

**Headers**:
```
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "success": true,
  "occasion": "Birthday",
  "sequence": 5,
  "front": "birthday_05_Front",
  "inside": "birthday_05_Inside",
  "preview": "birthday_05_Front / birthday_05_Inside"
}
```

**Example cURL**:
```bash
curl -X GET \
  "http://localhost:8000/api/cards/naming/next/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer eyJhbGc..."
```

**Example JavaScript (Fetch)**:
```javascript
const occasionId = '550e8400-e29b-41d4-a716-446655440000';
const response = await fetch(`/api/cards/naming/next/${occasionId}`, {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('cardhugs_token')}`
  }
});
const data = await response.json();
console.log(`Next card: ${data.front} / ${data.inside}`);
```

**Example Axios**:
```typescript
import { cardAPI } from '../services/api';

const nameData = await fetch(`/api/cards/naming/next/${occasionId}`)
  .then(res => res.json());

console.log(`Sequence ${nameData.sequence}: ${nameData.front}`);
```

---

### 2. Save Card with Automatic Naming

**Endpoint**: `POST /api/cards/save-with-naming`

**Description**: Save a card with automatic, collision-free naming

**Headers**:
```
Content-Type: application/json
Authorization: Bearer {token}
```

**Request Body**:
```json
{
  "occasion_id": "550e8400-e29b-41d4-a716-446655440000",
  "front_text": "Happy Birthday!",
  "inside_message": "Wishing you a wonderful day",
  "front_image_url": "https://cdn.example.com/image.png",
  "concept_title": "Birthday Celebration",
  "style": "Watercolor",
  "tone": "Heartfelt",
  "emotional_impact": "Joyful and warm",
  "uniqueness_factor": "Personal touch with custom message",
  "design_suggestions": "Use pastels and floral elements",
  "lora_model_id": "optional-uuid",
  "personalization": {
    "recipient_name": "Mom",
    "custom_message": "Thank you for everything",
    "sender_name": "Sarah",
    "signature": "Love always"
  }
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "✅ Card saved!\n\n📄 birthday_05_Front\n📄 birthday_05_Inside",
  "card": {
    "id": "card-uuid-123",
    "card_name": "birthday_05_Front",
    "card_inside_name": "birthday_05_Inside",
    "sequence": 5,
    "occasion": "Birthday",
    "front_text": "Happy Birthday!",
    "front_image_url": "https://cdn.example.com/image.png",
    "status": "draft",
    "created_at": "2024-02-16T10:30:00Z"
  }
}
```

**Example cURL**:
```bash
curl -X POST http://localhost:8000/api/cards/save-with-naming \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGc..." \
  -d '{
    "occasion_id": "550e8400-e29b-41d4-a716-446655440000",
    "front_text": "Happy Birthday!",
    "inside_message": "Have a wonderful day",
    "front_image_url": "https://example.com/image.png",
    "style": "Watercolor",
    "tone": "Heartfelt",
    "personalization": {
      "recipient_name": "Mom",
      "sender_name": "Sarah"
    }
  }'
```

---

### 3. Get Naming Statistics

**Endpoint**: `GET /api/cards/naming/stats`

**Description**: Get naming statistics for all occasions

**Headers**:
```
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "success": true,
  "stats": [
    {
      "occasion": "Birthday",
      "totalCards": 42,
      "publishedCards": 28,
      "nextSequence": 43
    },
    {
      "occasion": "Anniversary",
      "totalCards": 17,
      "publishedCards": 12,
      "nextSequence": 18
    },
    {
      "occasion": "Mother's Day",
      "totalCards": 31,
      "publishedCards": 20,
      "nextSequence": 32
    }
  ]
}
```

**Example JavaScript**:
```javascript
const stats = await fetch('/api/cards/naming/stats', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('cardhugs_token')}`
  }
}).then(res => res.json());

stats.stats.forEach(stat => {
  console.log(`${stat.occasion}: ${stat.totalCards} generated, ${stat.publishedCards} published`);
});
```

---

### 4. Get Occasion Card Sequences

**Endpoint**: `GET /api/cards/naming/occasion/:occasionId`

**Description**: Get all card sequences for a specific occasion

**Parameters**:
- `occasionId` (string, required) - UUID of the occasion

**Response** (200 OK):
```json
{
  "success": true,
  "sequences": [
    {
      "id": "card-uuid-1",
      "occasion": "Birthday",
      "status": "approved",
      "cardName": "birthday_01_Front",
      "sequence": 1,
      "createdAt": "2024-02-15T10:30:00Z"
    },
    {
      "id": "card-uuid-2",
      "occasion": "Birthday",
      "status": "draft",
      "cardName": "birthday_02_Front",
      "sequence": 2,
      "createdAt": "2024-02-15T11:00:00Z"
    }
  ],
  "total": 42,
  "nextSequence": 43
}
```

---

## 💻 Code Examples

### Node.js Backend Example

**Using CardNamingService**:
```javascript
const CardNamingService = require('./services/cardNamingService');

// Get next sequence number
const seq = await CardNamingService.getNextSequenceNumber(occasionId);
console.log(`Next sequence: ${seq}`);

// Generate card names
const names = await CardNamingService.generateCardNames(occasionId);
console.log(`Front: ${names.front}`);
console.log(`Inside: ${names.inside}`);
console.log(`Sequence: ${names.sequence}`);

// Check if name is available
const available = await CardNamingService.isNameAvailable('birthday_05_Front');
console.log(`Available: ${available}`);

// Get all sequences for occasion
const sequences = await CardNamingService.getOccasionSequences(occasionId);
console.log(`Total cards: ${sequences.length}`);

// Get statistics
const stats = await CardNamingService.getNamingStats();
stats.forEach(s => {
  console.log(`${s.occasion}: Next #${s.nextSequence}`);
});
```

**Express Route Example**:
```javascript
const express = require('express');
const router = express.Router();
const CardNamingService = require('../services/cardNamingService');
const { Card, Occasion } = require('../models');

// Save card with automatic naming
router.post('/save-with-naming', async (req, res) => {
  try {
    const { occasion_id, front_text, inside_message, front_image_url, ... } = req.body;

    // Get occasion
    const occasion = await Occasion.findByPk(occasion_id);
    if (!occasion) {
      return res.status(404).json({ error: 'Occasion not found' });
    }

    // Generate names automatically
    const names = await CardNamingService.generateCardNames(occasion_id);

    // Create card
    const card = await Card.create({
      occasion_id,
      occasion: occasion.name,
      front_text,
      inside_text: inside_message,
      front_image_url,
      status: 'draft',
      created_by: req.user.userId,
      metadata: {
        card_name: names.front,
        card_inside_name: names.inside,
        card_sequence_number: names.sequence,
        occasion_name: occasion.name
      }
    });

    res.status(201).json({
      success: true,
      card: {
        id: card.id,
        card_name: names.front,
        card_inside_name: names.inside,
        sequence: names.sequence,
        occasion: occasion.name
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
```

---

### React Frontend Example

**Using the Naming API in Component**:
```typescript
import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';

interface CardNamingExampleProps {
  occasionId: string;
}

const CardNamingExample: React.FC<CardNamingExampleProps> = ({ occasionId }) => {
  const [nextNames, setNextNames] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchNextNames();
  }, [occasionId]);

  const fetchNextNames = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/cards/naming/next/${occasionId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('cardhugs_token')}`
        }
      });
      const data = await response.json();
      setNextNames(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch names');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!nextNames) return null;

  return (
    <div className="naming-preview">
      <h3>Next Card Name (Sequence #{nextNames.sequence})</h3>
      <div className="name-display">
        <div className="front-name">
          <strong>Front:</strong>
          <code>{nextNames.front}</code>
        </div>
        <div className="inside-name">
          <strong>Inside:</strong>
          <code>{nextNames.inside}</code>
        </div>
      </div>
      <p className="occasion">{nextNames.occasion}</p>
    </div>
  );
};

export default CardNamingExample;
```

**Saving a Card with Naming**:
```typescript
const handleSaveCard = async (cardData: any) => {
  try {
    const response = await fetch('/api/cards/save-with-naming', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('cardhugs_token')}`
      },
      body: JSON.stringify({
        occasion_id: selectedOccasion,
        front_text: cardData.front_text,
        inside_message: cardData.inside_message,
        front_image_url: cardData.front_image_url,
        style: cardData.style,
        tone: cardData.tone,
        personalization: cardData.personalization
      })
    });

    if (!response.ok) throw new Error('Failed to save card');

    const result = await response.json();
    
    // Show success message with assigned names
    console.log(`✅ Card saved!`);
    console.log(`Front: ${result.card.card_name}`);
    console.log(`Inside: ${result.card.card_inside_name}`);
    
    // Refresh next names for next card
    await fetchNextNames();
  } catch (err) {
    console.error('Error saving card:', err);
  }
};
```

---

### Using adminAPI Service

**From cardhugs-frontend/src/services/api.ts**:
```typescript
export const adminAPI = {
  async getDatabases() {
    const { data } = await api.get('/admin/databases');
    return data;
  },

  async getTables() {
    const { data } = await api.get('/admin/tables');
    return data;
  },

  async getTableSchema(tableName: string) {
    const { data } = await api.get(`/admin/tables/${tableName}/schema`);
    return data;
  },

  async getTableData(tableName: string, limit: number = 50, offset: number = 0) {
    const { data } = await api.get(`/admin/tables/${tableName}/data`, {
      params: { limit, offset }
    });
    return data;
  },

  async getStats() {
    const { data } = await api.get('/admin/stats');
    return data;
  },
};
```

**Usage Example**:
```typescript
// View card naming sequences table
const seqData = await adminAPI.getTableData('card_name_sequences');
seqData.data.forEach(row => {
  console.log(`${row.occasion_name}: Next # ${row.next_sequence}`);
});

// Export sequence data
const json = JSON.stringify(seqData.data, null, 2);
const blob = new Blob([json], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'sequences.json';
a.click();
```

---

## 📝 Naming Format

### Format Structure
```
{occasion}_{sequence:02d}_{side}
```

### Components
- **occasion**: Occasion name (lowercase, underscores, no apostrophes)
  - "Birthday" → "birthday"
  - "Mother's Day" → "mother_s_day"
  - "Christmas" → "christmas"

- **sequence**: 2-digit padded number
  - 1 → 01
  - 5 → 05
  - 42 → 42

- **side**: Card side (Front or Inside)
  - "Front" (card cover/front)
  - "Inside" (card message/inside)

### Examples
```
birthday_01_Front
birthday_01_Inside
birthday_02_Front
birthday_02_Inside
anniversary_01_Front
anniversary_01_Inside
mother_s_day_03_Front
mother_s_day_03_Inside
christmas_15_Front
christmas_15_Inside
wedding_42_Front
wedding_42_Inside
```

---

## ⚠️ Error Handling

### Common Errors

**400 Bad Request**:
```json
{
  "error": "Missing required fields: occasion_id, front_text, front_image_url"
}
```

**404 Not Found**:
```json
{
  "error": "Occasion not found"
}
```

**500 Server Error**:
```json
{
  "error": "Failed to save card",
  "details": "Database connection error"
}
```

### Error Handling in Code

**JavaScript/TypeScript**:
```typescript
try {
  const response = await fetch('/api/cards/save-with-naming', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cardData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.details || error.error);
  }

  const result = await response.json();
  console.log(`Card saved: ${result.card.card_name}`);
} catch (err) {
  console.error('Error:', err.message);
  // Show user-friendly error message
  showAlert(`Failed to save card: ${err.message}`, 'error');
}
```

---

## ✅ Best Practices

### 1. Always Use Auto-Naming
✅ **DO**: Use `/api/cards/save-with-naming` endpoint
```javascript
// Automatic naming - CORRECT
const result = await fetch('/api/cards/save-with-naming', {...});
```

❌ **DON'T**: Try to manually assign sequence numbers
```javascript
// Manual naming - INCORRECT
const card = {
  card_name: 'birthday_05_Front', // Don't do this!
  ...
};
```

### 2. Preview Names Before Saving
✅ **DO**: Show user the next names
```typescript
const names = await fetch(`/api/cards/naming/next/${occasionId}`);
// Display to user: "Next: birthday_05_Front / birthday_05_Inside"
```

### 3. Handle Concurrent Saves
✅ **DO**: Database locking handles this automatically
```javascript
// Multiple users can save simultaneously - no collisions
// Database ensures unique sequences via row-level locking
```

### 4. Check for Duplicate Names
✅ **DO**: Verify name availability (optional check)
```javascript
const available = await CardNamingService.isNameAvailable('birthday_05_Front');
if (!available) {
  console.warn('Name is already taken');
  // Get fresh names
  const freshNames = await fetch(`/api/cards/naming/next/${occasionId}`);
}
```

### 5. Monitor Sequence Counters
✅ **DO**: Periodically check stats
```javascript
const stats = await fetch('/api/cards/naming/stats');
// Use to monitor: are sequences advancing properly?
// Are any stuck?
```

---

## 🎯 Common Tasks

### Task 1: Generate and Save a Card

```typescript
// Step 1: Get next names
const namesResponse = await fetch(`/api/cards/naming/next/${occasionId}`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const names = await namesResponse.json();

// Step 2: Show user
console.log(`This card will be saved as: ${names.front} / ${names.inside}`);

// Step 3: Generate card with AI
const card = await generateCardWithAI(occasionId, tone, style);

// Step 4: Save with automatic naming
const saveResponse = await fetch('/api/cards/save-with-naming', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    occasion_id: occasionId,
    front_text: card.front_text,
    inside_message: card.inside_message,
    front_image_url: card.image_url,
    style: card.style,
    tone: card.tone,
    personalization: {
      recipient_name: recipientName
    }
  })
});

const result = await saveResponse.json();
console.log(`✅ Card saved: ${result.card.card_name}`);
```

### Task 2: Export All Card Names for an Occasion

```typescript
// Get all sequences for occasion
const sequences = await fetch(`/api/cards/naming/occasion/${occasionId}`, {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(res => res.json());

// Create CSV
const csv = [
  ['Card Name', 'Status', 'Created', 'ID'],
  ...sequences.sequences.map(seq => [
    seq.cardName,
    seq.status,
    new Date(seq.createdAt).toLocaleDateString(),
    seq.id
  ])
].map(row => row.join(',')).join('\n');

// Download
const blob = new Blob([csv], { type: 'text/csv' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `${occasion}-cards.csv`;
a.click();
```

### Task 3: Monitor Naming Progress

```typescript
setInterval(async () => {
  const stats = await fetch('/api/cards/naming/stats', {
    headers: { 'Authorization': `Bearer ${token}` }
  }).then(res => res.json());

  stats.stats.forEach(stat => {
    const percent = Math.round((stat.publishedCards / stat.totalCards) * 100);
    console.log(`${stat.occasion}: ${stat.totalCards} generated, ${percent}% published`);
  });
}, 5 * 60 * 1000); // Every 5 minutes
```

---

## 📞 Support

For questions about the card numbering system:
- See: `CARD_NAMING_SYSTEM_DOCUMENTATION.md`
- Code: `backend-node/services/cardNamingService.js`
- API: `backend-node/routes/cards.js`
- Database: `card_name_sequences` table

---

**Status**: ✅ Production Ready  
**Latest Update**: 2024-02-16  
**Version**: 1.0
