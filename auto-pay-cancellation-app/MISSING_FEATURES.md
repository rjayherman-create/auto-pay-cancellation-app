# CardHugs - Critical Features Not Working

## 🔴 BROKEN FEATURES (Frontend calls endpoints that don't exist)

### 1. **Media Manager** - COMPLETELY BROKEN
**File**: `backend-node/routes/media.js` (EMPTY FILE)

Frontend tries to call:
- `POST /api/media/upload` ← Not implemented
- `GET /api/media` ← Not implemented
- `DELETE /api/media/:id` ← Not implemented

**Result**: Any attempt to upload media will fail with 404

**Fix**: Create proper media.js with multer integration

---

### 2. **Store Inventory** - ENDPOINT MISMATCH
**Frontend expects**:
```javascript
GET /api/store/inventory
POST /api/store/cards/:id/publish
POST /api/store/cards/:id/unpublish
```

**Backend has**:
```javascript
GET /api/inventory/dashboard (different endpoint!)
POST /api/inventory/:id/publish (wrong path!)
```

**Result**: StoreInventory component will fail when loading

**Fix**: Add proper /store routes or fix frontend URLs

---

### 3. **AI Suggestions** - NOT IMPLEMENTED
**Frontend expects**:
```javascript
POST /api/ai/suggest
```

**Backend**: No route exists

**Result**: AISuggestion component will fail with 404

**Fix**: Create /api/ai/suggest endpoint with OpenAI integration

---

### 4. **Card Generation (Text + Image)** - INCOMPLETE
**Frontend calls** (in CardGeneratorComplete):
```javascript
POST /api/cards/generate-text
POST /api/cards/generate-image
POST /api/cards/save-generated
```

**Backend has**:
```javascript
POST /api/cards/generate-complete (different name!)
POST /api/cards/save-complete (different name!)
```

**Also missing**:
- Text-only generation
- Image-only generation
- FAL.ai integration (marked as TODO)

**Result**: CardGeneratorComplete component won't work

**Fix**: Implement missing endpoints or update frontend URLs

---

## ⚠️ INCOMPLETE FEATURES

### 1. **Training Jobs** - Queuing Not Implemented
**File**: `backend-node/routes/training.js`

What works:
- ✅ Upload images with multer
- ✅ Store in database

What doesn't:
- ❌ Actually queue training job with FAL.ai
- ❌ Get training status updates
- ❌ Download trained model

**Code comment**:
```javascript
// TODO: Queue job with FAL.ai or other training service
// await startTrainingJob(job, imageUrls);
```

**Result**: Can create training jobs but they never actually train

---

### 2. **Occasions** - Fields Missing
**Frontend expects** (from types):
```typescript
interface Occasion {
  id: string;
  name: string;
  slug: string;              // ← Missing in route
  category: string;          // ← Missing in route
  emoji: string;             // ← Missing in route
  color: string;             // ← Missing in route
  is_active: boolean;        // ← Missing in route
  lora_model_id: string;     // ← Missing in route
  seasonal_start?: string;   // ← Missing in route
  seasonal_end?: string;     // ← Missing in route
  card_count: number;        // ← Missing in route
}
```

**Backend only supports**:
```javascript
{ name, description }
```

**Result**: Occasion forms will fail validation

---

### 3. **Batch Management** - Route Not Registered
**File**: `backend-node/routes/index.js`

Missing:
```javascript
// NOT in index.js:
router.use('/batches', batchRoutes);  // <-- This line is missing!
```

**Result**: Batch endpoints won't be accessible at /api/batches

---

### 4. **Settings** - Incomplete CRUD
**File**: `backend-node/routes/settings.js`

Missing operations:
- ❌ POST /settings (create new setting)
- ❌ DELETE /settings/:id (delete setting)
- ❌ Filtering by category

**Frontend expects**:
```javascript
settingsAPI.save(settingData)  // POST
settingsAPI.delete(key)        // DELETE
```

---

## 📋 QUICK FIX PRIORITY LIST

### Must Fix (App-breaking):
1. **Create media.js** - MediaManager won't work
2. **Fix store routes** - StoreInventory won't work
3. **Implement /api/ai/suggest** - AISuggestion won't work
4. **Register /batches route** - Batches won't be accessible

### Should Fix Soon:
5. **Fix card generation endpoints** - CardGenerator won't work
6. **Expand Occasions fields** - Occasion forms will fail
7. **Complete Settings CRUD** - Settings management won't work
8. **FAL.ai integration** - Training jobs won't actually train

### Nice to Have:
9. Implement text-only generation
10. Add pagination everywhere
11. Add filtering/search improvements

---

## Routes Currently NOT REGISTERED

**File**: `backend-node/routes/index.js`

Missing from registration:
```javascript
const mediaRoutes = require('./media');        // ← Missing
const storeRoutes = require('./store');        // ← File doesn't exist

// ... should be:
router.use('/media', mediaRoutes);
router.use('/store', storeRoutes);
```

---

## Environment Variables Needed But Probably Not Set

For features to work, these MUST be in .env:
- `OPENAI_API_KEY` - Text generation
- `FAL_KEY` - Image generation via FAL.ai
- Both missing = no AI features work

Check with: `docker exec cardhugs-backend cat .env`

---

## Components Affected

| Component | Issue | Severity |
|---|---|---|
| MediaManager | routes/media.js empty | 🔴 CRITICAL |
| StoreInventory | Wrong endpoint URLs | 🔴 CRITICAL |
| AISuggestion | /api/ai/suggest missing | 🔴 CRITICAL |
| CardGeneratorComplete | Endpoint name mismatch | 🔴 CRITICAL |
| OccasionLibraryManager | Occasion fields incomplete | 🟡 HIGH |
| BatchManagement | /batches route not registered | 🟡 HIGH |
| LoRATraining | Training queuing not implemented | 🟡 HIGH |
| Settings | CRUD incomplete | 🟡 MEDIUM |

---

## Test Instructions

To verify what works:

```bash
# 1. Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cardhugs.com","password":"password123"}'

# 2. Get occasions (should work)
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:8000/api/occasions

# 3. Try to upload media (will fail 404)
curl -X POST http://localhost:8000/api/media/upload \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@image.jpg"

# 4. Try to suggest text (will fail 404)
curl -X POST http://localhost:8000/api/ai/suggest \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"happy birthday","occasion":"Birthday"}'

# 5. Check batches (will fail - route not registered)
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:8000/api/batches
```

All should show which endpoints exist vs which don't.
