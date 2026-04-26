# Occasion Library, Card Inventory & Approval System

## 🎯 Overview

Complete system for managing card occasions, tracking card inventory, and implementing an approval workflow for generated cards.

### Components

1. **Occasion Library Manager** - Create, edit, manage occasions with LoRA model associations
2. **Card Inventory** - Browse and manage all generated cards with filtering and search
3. **Approval Workflow** - Queue-based approval system for new cards

---

## 📋 System Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                    OCCASION LIBRARY                            │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Create/Edit/Delete Occasions                                 │
│  ├─ Name, Slug, Category, Description                         │
│  ├─ Emoji, Color, Seasonal Dates                              │
│  └─ LoRA Model Association                                    │
│                                                                 │
│  Track Occasion Stats                                         │
│  ├─ Total Cards                                               │
│  ├─ Draft Cards                                               │
│  ├─ Approved Cards                                            │
│  └─ Published Cards                                           │
└────────────────────────────────────────────────────────────────┘
           │
           ▼
┌────────────────────────────────────────────────────────────────┐
│                   CARD GENERATION                              │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Select Occasion                                           │
│  2. Select Optional LoRA Style                                │
│  3. Generate Text Variations                                  │
│  4. Generate Images (front + inside)                          │
│  5. Save to Database                                          │
│                                                                 │
│  Cards created with status: 'draft'                           │
└────────────────────────────────────────────────────────────────┘
           │
           ▼
┌────────────────────────────────────────────────────────────────┐
│                   CARD INVENTORY                               │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  View All Generated Cards                                     │
│  ├─ Filter by Status (draft, approved, published)             │
│  ├─ Filter by Occasion                                        │
│  ├─ Search by Text                                            │
│  ├─ Sort by Date                                              │
│  ├─ View Statistics (total, by status)                        │
│  └─ Download Images (front/inside)                            │
│                                                                 │
│  Card States:                                                 │
│  ├─ draft        → Newly generated, awaiting review           │
│  ├─ qc_passed    → Passed quality checks                      │
│  ├─ approved     → Ready for publishing                       │
│  ├─ published    → Live in system                             │
│  └─ rejected     → Marked for deletion                        │
└────────────────────────────────────────────────────────────────┘
           │
           ▼
┌────────────────────────────────────────────────────────────────┐
│               APPROVAL WORKFLOW                                │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Queue-Based Approval System                                  │
│  ├─ List pending cards (draft + qc_passed)                    │
│  ├─ Display front/inside previews                             │
│  ├─ Add review notes                                          │
│  ├─ Actions:                                                  │
│  │  ├─ Approve → Status: approved                             │
│  │  ├─ Reject → Status: rejected + reason                     │
│  │  └─ Skip → Move to next card                               │
│  └─ Track progress (X of Y)                                   │
│                                                                 │
│  Quality Score: Auto-assigned on approval                     │
│  Reviewed By: Tracks approver user ID                         │
│  Reviewed At: Timestamp of approval                           │
└────────────────────────────────────────────────────────────────┘
           │
           ▼
┌────────────────────────────────────────────────────────────────┐
│              INVENTORY DASHBOARD                               │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Statistics                                                   │
│  ├─ Total cards generated                                     │
│  ├─ By status breakdown                                       │
│  ├─ Top occasions by card count                               │
│  └─ Approval rate                                             │
│                                                                 │
│  Bulk Operations                                              │
│  ├─ Bulk update status                                        │
│  ├─ Bulk delete cards                                         │
│  └─ Export inventory                                          │
└────────────────────────────────────────────────────────────────┘
```

---

## 🎨 User Interface

### 1. Occasion Library Manager

**Left Panel: Create/Edit Form**
- Occasion name (required)
- Slug (required, unique)
- Category dropdown (celebrations, milestones, sympathy, seasonal, business, personal)
- Description (optional)
- Emoji picker
- Color picker
- Seasonal dates (optional)
- LoRA model selector (optional)
- Active toggle

**Right Panel: Occasions Grid**
- Search by name/slug
- Filter by category
- Card display with:
  - Emoji + color badge
  - Name and description
  - Slug and card count
  - Seasonal info
  - Edit/Delete buttons

### 2. Card Inventory

**Top Stats Bar**
- Total Cards
- Draft count
- Approved count
- Published count

**Filters**
- Search by text (front/inside/occasion)
- Filter by status
- Filter by occasion
- Sort by date (newest/oldest)

**Card Grid**
- Image preview
- Front/inside text
- Status badge with icon
- Quality score bar
- Download buttons (front/inside)
- Delete button

### 3. Approval Workflow

**Left Panel: Queue List**
- Numbered list of pending cards
- Card count and occasion
- Selected card highlighting
- Click to select

**Right Panel: Review Interface**
- Front image preview (large)
- Inside image preview (large)
- Card metadata (occasion, style, status, created date)
- Review notes textarea
- Action buttons:
  - ✅ Approve Card
  - ❌ Reject Card (shows reason form)
  - ⏭️ Skip to Next
- Keyboard shortcut hints

---

## 📊 Database Schema

### Cards Table Enhancements
```sql
cards
├─ front_text (TEXT)                    -- Front of card message
├─ inside_text (TEXT)                   -- Inside message
├─ front_image_url (TEXT)               -- Front image URL
├─ inside_image_url (TEXT)              -- Inside image URL
├─ occasion (VARCHAR)                   -- Occasion name
├─ style (VARCHAR)                      -- Style applied
├─ status (ENUM)                        -- draft|qc_passed|approved|published|rejected
├─ quality_score (INTEGER 0-100)        -- Quality rating
├─ rejection_reason (TEXT)              -- Why rejected
├─ reviewed_by (UUID FK users)          -- Approver ID
├─ reviewed_at (TIMESTAMP)              -- Approval timestamp
└─ metadata (JSONB)                     -- Flexible metadata
```

### Occasions Table Enhancements
```sql
occasions
├─ name (VARCHAR unique)                -- Occasion name (e.g., "Birthday")
├─ slug (VARCHAR unique)                -- URL slug (e.g., "birthday")
├─ category (VARCHAR)                   -- Category type
├─ emoji (VARCHAR)                      -- Emoji representation
├─ color (VARCHAR)                      -- Brand color
├─ is_active (BOOLEAN)                  -- Active status
├─ seasonal_start (DATE)                -- Seasonal start date
├─ seasonal_end (DATE)                  -- Seasonal end date
├─ lora_model_id (UUID FK)              -- Associated LoRA model
├─ lora_trigger_word (VARCHAR)          -- Trigger word for LoRA
├─ card_count (INTEGER)                 -- Total cards for occasion
├─ draft_count (INTEGER)                -- Draft cards
├─ approved_count (INTEGER)             -- Approved cards
├─ published_count (INTEGER)            -- Published cards
└─ metadata (JSONB)                     -- Flexible metadata
```

---

## 🔌 API Endpoints

### Inventory Management

#### Dashboard Stats
```bash
GET /api/inventory/dashboard
Response:
{
  "total": 1250,
  "by_status": {
    "draft": 450,
    "qc_passed": 120,
    "approved": 580,
    "published": 100
  },
  "top_occasions": [...]
}
```

#### Approval Queue
```bash
GET /api/inventory/approval-queue?status=draft&limit=50
Response:
{
  "cards": [...],
  "total": 450,
  "limit": 50,
  "skip": 0
}
```

#### Approve Card
```bash
POST /api/inventory/:cardId/approve
Body:
{
  "notes": "Great design",
  "quality_score": 90
}
Response:
{
  "success": true,
  "card": {...}
}
```

#### Reject Card
```bash
POST /api/inventory/:cardId/reject
Body:
{
  "reason": "Text too small"
}
Response:
{
  "success": true,
  "card": {...}
}
```

#### Publish Card
```bash
POST /api/inventory/:cardId/publish
Response:
{
  "success": true,
  "card": {...}
}
```

#### Occasion Stats
```bash
GET /api/inventory/occasions/:occasionId/stats
Response:
{
  "occasion_id": "...",
  "occasion_name": "Birthday",
  "stats": {
    "draft": 120,
    "qc_passed": 30,
    "approved": 200,
    "published": 50,
    "rejected": 10
  }
}
```

#### Bulk Operations
```bash
POST /api/inventory/bulk-delete
Body: { "cardIds": ["uuid1", "uuid2", ...] }

POST /api/inventory/bulk-update-status
Body: { "cardIds": ["uuid1", ...], "status": "approved" }
```

### Occasions Management

#### Create Occasion
```bash
POST /api/occasions
Body:
{
  "name": "Valentine's Day",
  "slug": "valentines",
  "category": "seasonal",
  "emoji": "💕",
  "color": "#ff69b4",
  "description": "Love and romance",
  "lora_model_id": "uuid",
  "seasonal_start": "2026-02-01",
  "seasonal_end": "2026-02-14"
}
```

#### Update Occasion
```bash
PUT /api/occasions/:id
Body: { ...any fields to update... }
```

#### Delete Occasion
```bash
DELETE /api/occasions/:id
```

---

## 🔄 Approval Workflow

### Status Flow

```
┌─────────┐
│  draft  │  ← New card generated
└────┬────┘
     │
     ├─→ ✅ Approve ──────────┐
     │                         │
     ├─→ ❌ Reject ────→ rejected
     │                         │
     └─→ ⏭️  Skip to next      │
                               ▼
                          ┌──────────┐
                          │ approved │  ← Ready to publish
                          └────┬─────┘
                               │
                               ├─→ Publish ──→ ┌─────────┐
                               │               │published│
                               │               └─────────┘
                               │
                               └─→ Keep Draft
```

### Approval States

| Status | Meaning | Approver Action | User Can... |
|--------|---------|-----------------|------------|
| draft | Just generated | Review/Approve/Reject | View, Download, Delete |
| qc_passed | Passed QC | Approve/Reject | View, Download |
| approved | Ready to use | Publish | View, Download, Export |
| published | Live | Archive | Download, View |
| rejected | Not accepted | Delete | Not visible in main list |

---

## 📊 Inventory Statistics

### Per-Occasion Stats
```
Occasion: Birthday 🎂
├─ Total: 450 cards
├─ Draft: 120 (26.7%)
├─ Approved: 280 (62.2%)
├─ Published: 50 (11.1%)
└─ Avg Quality: 82/100
```

### Global Stats
```
Total Cards: 5,200
├─ Draft: 1,500 (28.8%)
├─ QC Passed: 400 (7.7%)
├─ Approved: 3,000 (57.7%)
├─ Published: 250 (4.8%)
└─ Rejected: 50 (0.9%)
```

---

## 🎯 Workflow Examples

### Example 1: Create a New Occasion

1. Go to **Occasions** menu
2. Click **New Occasion**
3. Fill form:
   - Name: "Valentine's Day"
   - Slug: "valentines"
   - Category: "seasonal"
   - Emoji: "💕"
   - Color: "#ff69b4"
   - Optional: Select LoRA model for consistent style
4. Click **Create Occasion**
5. Occasion now appears in generation dropdown

### Example 2: Generate Cards for Occasion

1. Go to **Generate Cards**
2. Select **Valentine's Day** occasion
3. (Optional) Select LoRA style model
4. Set variations: 5
5. Click **Generate Text Variations**
6. Select preferred variation
7. Images generate
8. Click **Save to Library**
9. Cards now in **Inventory** with status "draft"

### Example 3: Approve Cards

1. Go to **Approval Queue**
2. Review pending card:
   - View front/inside images
   - Check text content
3. Add notes if needed
4. Click **Approve Card**
5. Card status → "approved"
6. Next card automatically displayed
7. Continue until queue empty

### Example 4: Publish Approved Cards

1. Go to **Card Inventory**
2. Filter by Status: "approved"
3. Select cards to publish
4. Bulk action: **Publish Selected**
5. Cards now available for distribution

---

## 📈 Performance Metrics

### Approval Workflow Metrics
- **Approval Rate**: Cards approved vs rejected
- **Avg Quality Score**: Average quality across approved cards
- **Approval Time**: Time from generation to approval
- **Queue Depth**: Number of cards awaiting review

### Inventory Metrics
- **Card Generation Rate**: Cards created per day/week
- **Status Distribution**: % in each status
- **Occasion Popularity**: Cards per occasion
- **LoRA Model Usage**: Cards using each LoRA style

---

## 🔐 Permissions & Access Control

```
Role: Admin
├─ Create occasions
├─ Edit occasions
├─ Delete occasions
├─ Approve/reject cards
├─ Publish cards
└─ Delete cards

Role: Designer
├─ Generate cards
├─ View inventory
└─ Download cards

Role: Reviewer
├─ Approve/reject cards
├─ View inventory
└─ Add review notes
```

---

## 🚀 Features Ready

✅ **Occasion Library**
- Create/edit/delete occasions
- LoRA model associations
- Category organization
- Seasonal date ranges
- Custom colors and emojis

✅ **Card Inventory**
- Browse all generated cards
- Filter by status, occasion, text
- Download front/inside images
- Bulk operations
- Statistics dashboard

✅ **Approval Workflow**
- Queue-based review system
- Keyboard shortcuts
- Review notes
- Quality scoring
- Rejection reasons

✅ **Analytics**
- Per-occasion statistics
- Global inventory stats
- Status distribution
- Approval metrics

---

## 🔜 Future Enhancements

- [ ] Batch approval (select multiple)
- [ ] Approval templates/checklists
- [ ] Automatic quality scoring (ML)
- [ ] Card versioning
- [ ] A/B testing framework
- [ ] Export to publishing platforms
- [ ] Card analytics (downloads, engagement)
- [ ] Team collaboration features

---

**System Complete and Operational!** 🎉
