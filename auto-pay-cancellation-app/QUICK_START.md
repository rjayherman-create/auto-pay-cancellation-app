# Quick Start Guide - CardHugs High-Priority Fixes

## ✅ What's Fixed

All 3 high-priority issues resolved + 6 additional features implemented:

1. ✅ **Occasions** - All required fields now working (slug, category, emoji, color, is_active, lora_model_id)
2. ✅ **Batch Routes** - Verified and working at /api/batches
3. ✅ **Settings CRUD** - Complete POST/PUT/DELETE support
4. ✅ **Text Generation** - OpenAI integration for card text
5. ✅ **Media Management** - Upload, list, delete media files
6. ✅ **AI Suggestions** - Generate text suggestions with alternatives
7. ✅ **Store Operations** - Publish/unpublish cards

---

## 🚀 Running the Application

### Step 1: Configure Environment
```bash
cp .env.example .env
# Edit .env and add:
OPENAI_API_KEY=sk-...    # For text/AI features (optional)
```

### Step 2: Start Docker Services
```bash
docker compose up -d
```

### Step 3: Access Points
- **Frontend**: http://localhost
- **Backend API**: http://localhost:8000
- **PostgreSQL**: localhost:5432

---

## 📝 Key API Endpoints

### Authentication
```bash
POST /api/auth/login
POST /api/auth/register
GET  /api/auth/me
POST /api/auth/logout
```

### Occasions (NOW WITH ALL FIELDS)
```bash
GET    /api/occasions?category=celebrations&is_active=true
POST   /api/occasions
PUT    /api/occasions/:id
DELETE /api/occasions/:id
```

### Text Generation (NEW)
```bash
POST /api/text/generate        # Generate text variations
POST /api/text/generate-full   # Generate front + inside text
```

### AI Suggestions (NEW)
```bash
POST /api/ai/suggest           # Get AI-generated suggestions
```

### Media Management (NEW)
```bash
POST   /api/media/upload       # Upload image
GET    /api/media              # List all media
DELETE /api/media/:id          # Delete media
```

### Store Operations (NEW)
```bash
GET  /api/store/inventory           # List published cards
POST /api/store/cards/:id/publish   # Publish card
POST /api/store/cards/:id/unpublish # Unpublish card
```

### Settings (NOW COMPLETE)
```bash
GET    /api/settings
POST   /api/settings           # Create new setting
PUT    /api/settings/:key      # Update setting
DELETE /api/settings/:key      # Delete setting
```

### Batches (VERIFIED WORKING)
```bash
GET    /api/batches
POST   /api/batches
PUT    /api/batches/:id
DELETE /api/batches/:id
```

---

## 🧪 Test Examples

### 1. Login to Get Token
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cardhugs.com","password":"password123"}'

# Response contains token - save it for other requests
```

### 2. Create Occasion with All Fields
```bash
curl -X POST http://localhost:8000/api/occasions \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Birthday",
    "slug": "birthday",
    "category": "celebrations",
    "emoji": "🎂",
    "color": "#FF69B4",
    "is_active": true,
    "description": "Celebrate birthdays with joy"
  }'
```

### 3. Generate Text (Requires OPENAI_API_KEY)
```bash
curl -X POST http://localhost:8000/api/text/generate \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "I miss you",
    "occasion": "Miss You Card",
    "tone": "heartfelt",
    "count": 3
  }'
```

### 4. Get AI Suggestions (Requires OPENAI_API_KEY)
```bash
curl -X POST http://localhost:8000/api/ai/suggest \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Happy birthday wishes",
    "occasion": "Birthday"
  }'
```

### 5. Upload Media
```bash
curl -X POST http://localhost:8000/api/media/upload \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@/path/to/image.jpg"
```

### 6. Publish Card to Store
```bash
curl -X POST http://localhost:8000/api/store/cards/CARD_ID/publish \
  -H "Authorization: Bearer TOKEN"
```

### 7. Create Setting
```bash
curl -X POST http://localhost:8000/api/settings \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "max_cards_per_batch",
    "value": 50,
    "category": "limits"
  }'
```

---

## 🐳 Docker Commands

### Build Images
```bash
docker compose build
```

### Start All Services
```bash
docker compose up -d
```

### View Logs
```bash
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres
```

### Stop Services
```bash
docker compose down
```

### View Running Containers
```bash
docker ps | Select-String "cardhugs"
```

---

## 📊 What Each Component Does

| Component | Port | Purpose |
|-----------|------|---------|
| Frontend (Nginx) | 80 | React UI + routing |
| Backend (Node.js) | 8000 | API endpoints |
| PostgreSQL | 5432 | Database |

---

## 🔑 Environment Variables

**Minimum Required**:
```
DB_HOST=postgres
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=cardhugs
JWT_SECRET=your-secret-key
```

**For AI Features** (Optional):
```
OPENAI_API_KEY=sk-your-key-here
```

**For Image Generation** (Optional, Phase 2):
```
FAL_KEY=your-fal-key
```

---

## 📚 Full Documentation Files

For detailed information, see:
- `COMPLETION_SUMMARY.md` - Complete feature overview
- `FIXES_IMPLEMENTATION_COMPLETE.md` - Implementation details
- `FEATURES_ANALYSIS.md` - Full feature matrix
- `MISSING_FEATURES.md` - What's still TODO

---

## ✨ What's Working Now

✅ Frontend builds successfully  
✅ Backend builds successfully  
✅ All 7 new route files registered  
✅ Occasions with all fields  
✅ Settings full CRUD  
✅ Media upload/management  
✅ Text generation endpoint  
✅ AI suggestions endpoint  
✅ Store publish/unpublish  
✅ Docker Compose ready to run  

---

## ⚠️ Still TODO (Phase 2)

- Image generation with FAL.ai
- Real training job queuing
- Full approval workflow
- Performance optimization
- Rate limiting

---

## 💡 Pro Tips

1. **Generate a token first** before testing other endpoints
2. **Keep your OPENAI_API_KEY private** - don't commit it
3. **Test locally** before deploying to production
4. **Check logs** if endpoints return errors
5. **Use Postman** for easier API testing

---

## 🆘 Troubleshooting

### Backend won't start
```bash
docker compose logs backend
```

### API returns 401
- Make sure you have a valid token in Authorization header

### AI endpoints return error
- Check if OPENAI_API_KEY is set in .env
- Verify API key is valid

### Media upload fails
- Check file size (max 10MB)
- Verify file is an image
- Check upload directory permissions

---

## 📞 Need Help?

1. Check the log files: `docker compose logs`
2. Review error messages in API responses
3. Check documentation files in root directory
4. Verify .env configuration

---

🎉 **You're all set! Start with:** `docker compose up -d`
