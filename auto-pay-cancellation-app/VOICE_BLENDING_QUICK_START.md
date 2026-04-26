# 🎨 VOICE BLENDING QUICK START - 5 MINUTES

## ⚡ Setup (2 minutes)

### 1. Get Kits.ai API Key
1. Go to https://kits.ai
2. Sign up / Log in
3. Settings → API Keys
4. Copy your API key

### 2. Add to .env
```env
KITSAI_API_KEY=your_api_key_here
```

### 3. Restart Server
```bash
npm run dev
```

---

## 🚀 Create Your First Blended Voice (3 minutes)

### Step 1: Open Voice Blending
- Go to: http://localhost:5173
- Click: **🎨 Voice Blending** tab
- Click: **➕ Create Blend**

### Step 2: Select Two Voices
```
Voice 1: "Cartoon Hero - Brave"
Voice 2: "Cartoon Villain - Deep"
```

### Step 3: Set Blend Ratio
- Move slider to **70%** (70% Hero, 30% Villain)
- Preview blend ratio display updates

### Step 4: Name Your Blend
```
Name: "Heroic Villain"
Description: "Brave but menacing voice"
```

### Step 5: Create
- Click: **✨ Create Blended Voice**
- Wait for completion
- You'll see: ✅ "Voice blended successfully!"

---

## 🎤 Generate Audio (1 minute)

### Step 1: Switch to Generate Tab
- Click: **🎤 Generate Audio**

### Step 2: Select Blended Voice
- Choose: "Heroic Villain" from dropdown
- Hear: Sample audio preview

### Step 3: Enter Text
```
Text: "Let's save the kingdom!"
```

### Step 4: Generate
- Click: **🎤 Generate Audio**
- Listen to generated audio
- Click: **📥 Download Audio**

---

## ✨ Done!

You now have:
✅ Custom blended voice  
✅ Generated audio file  
✅ Ready to use in projects  

### Next: Use in Your Project
- Go to: **📁 Projects**
- Assign blended voice to character
- Generate all dialogue with blended voice
- Mix, sync, and export!

---

## 📚 Try These Blends

| Blend | Voices | Ratio | Use Case |
|-------|--------|-------|----------|
| **Heroic** | Hero + Narrator | 70/30 | Main character |
| **Villain** | Villain + Mystic | 75/25 | Antagonist |
| **Funny** | Sidekick + Hero | 65/35 | Comic relief |
| **Sweet** | Princess + Narrator | 60/40 | Kind character |
| **Dark** | Villain + Deep | 80/20 | Scary moments |

---

## 🔧 API Quick Reference

```bash
# Create blend
curl -X POST http://localhost:3000/api/voice-blending/blend \
  -H "Content-Type: application/json" \
  -d '{
    "voice1Id": "v1",
    "voice2Id": "v2",
    "voice1Weight": 0.7,
    "voice2Weight": 0.3,
    "blendName": "My Blend"
  }'

# Generate audio
curl -X POST http://localhost:3000/api/voice-blending/generate \
  -H "Content-Type: application/json" \
  -d '{
    "blendedVoiceId": "blend_id",
    "text": "Hello!",
    "speed": 1.0,
    "pitch": 1.0
  }'

# Get all blends
curl http://localhost:3000/api/voice-blending/blended

# Delete blend
curl -X DELETE http://localhost:3000/api/voice-blending/blended/blend_id
```

---

## 💡 Pro Tips

1. **Always preview first** - Listen to sample before using
2. **Save successful blends** - Reuse for consistency
3. **Adjust speed/pitch** - Fine-tune per dialogue line
4. **Layer with music** - Enhance in Audio Mixer
5. **Combine with effects** - Add reverb, compression, etc.

---

**You're all set! Start blending voices now! 🎨🎤✨**
