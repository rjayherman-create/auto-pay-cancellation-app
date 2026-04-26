# CardHugs - Optional Enhancements Roadmap

**Status**: App is production-ready. These are prioritized value-adds for post-launch.

---

## 🎯 Priority Matrix

### PHASE 1: Quick Wins (1-2 weeks, high ROI)
These deliver immediate value with minimal complexity.

#### 1.1 **Undo/Redo for Editing** (4 hours)
- **Why**: Fundamental UX expectation. Missing even in your text editor.
- **Effort**: Low (use React context + command pattern)
- **Implementation**:
  ```typescript
  // Add to card editor context
  const useUndoRedo = () => {
    const [history, setHistory] = useState([initialState]);
    const [index, setIndex] = useState(0);
    
    const undo = () => setIndex(Math.max(0, index - 1));
    const redo = () => setIndex(Math.min(history.length - 1, index + 1));
    const setState = (newState) => {
      setHistory([...history.slice(0, index + 1), newState]);
      setIndex(index + 1);
    };
    return { state: history[index], undo, redo, setState };
  };
  ```
- **UI**: Add "↶ Undo" and "↷ Redo" buttons (Ctrl+Z / Ctrl+Y)

#### 1.2 **Bulk Approve/Reject** (3 hours)
- **Why**: Review 50 cards one-by-one is tedious. Bulk actions save time.
- **Effort**: Very Low (add checkboxes + single endpoint call)
- **Changes**:
  - CardReview: Add checkboxes to select multiple cards
  - New endpoint: `POST /api/cards/bulk-status` (status: approved|rejected, cardIds: [])
  - Update only `status` field for selected cards

#### 1.3 **Bulk Download/Export** (4 hours)
- **Why**: Users want to export their cards for printing/sharing.
- **Effort**: Low (use `jszip` or `archiver` library)
- **Features**:
  - Select cards → Download as ZIP
  - Export formats: PDF (via html2pdf), PNG, JPG
  - Batch: `GET /api/batches/:id/export?format=zip`
- **Backend**:
  ```javascript
  app.get('/api/batches/:id/export', async (req, res) => {
    const { format } = req.query; // zip, pdf, png
    const batch = await Batch.findByPk(req.params.id);
    const cards = await Card.findAll({ where: { batch_id: batch.id } });
    
    // Create ZIP archive
    const archive = archiver('zip');
    cards.forEach(card => {
      archive.append(Buffer.from(card.image_data), 
        { name: `card-${card.id}.png` });
    });
    archive.pipe(res);
    await archive.finalize();
  });
  ```

#### 1.4 **Tooltips & Inline Help** (3 hours)
- **Why**: Reduces support questions. New users don't know what "LoRA" means.
- **Effort**: Very Low (use `react-tooltip` or custom component)
- **Implementation**:
  ```typescript
  const Tooltip = ({ text, children }) => (
    <div className="relative group">
      {children}
      <div className="absolute bottom-full left-1/2 hidden group-hover:block 
        bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
        {text}
      </div>
    </div>
  );
  
  // Usage:
  <Tooltip text="LoRA: Fine-tuned AI model for this style">
    <span className="font-bold">LoRA Model</span>
  </Tooltip>
  ```
- **Locations**: Batch creation, style selector, approval workflow

---

### PHASE 2: Core Features (2-3 weeks, medium ROI)
Implemented features that significantly improve workflow.

#### 2.1 **Commenting & Feedback on Cards** (6 hours)
- **Why**: Reviewer → Designer feedback loop is critical for iterations.
- **Effort**: Medium (add comments table, real-time updates optional)
- **Database**:
  ```sql
  CREATE TABLE card_comments (
    id SERIAL PRIMARY KEY,
    card_id INT REFERENCES cards(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id),
    comment TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  );
  ```
- **API**:
  - `POST /api/cards/:id/comments` - Add comment
  - `GET /api/cards/:id/comments` - Get all comments
  - `DELETE /api/cards/:id/comments/:comment_id` - Delete
- **Frontend**:
  ```typescript
  // In CardReview component
  const [comments, setComments] = useState([]);
  const addComment = async (text) => {
    const res = await api.post(`/cards/${card.id}/comments`, { comment: text });
    setComments([...comments, res.data]);
  };
  // Display comments in a sidebar during review
  ```

#### 2.2 **Template System (Save & Reuse)** (8 hours)
- **Why**: Designers want to save successful card layouts as templates.
- **Effort**: Medium (create template schema + UI)
- **Database**:
  ```sql
  CREATE TABLE templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    style_id INT REFERENCES styles(id),
    occasion_id INT REFERENCES occasions(id),
    content JSONB, -- { front_text, inside_text, image_params, etc }
    thumbnail_url VARCHAR(500),
    category VARCHAR(100), -- 'birthday', 'holiday', etc
    is_shared BOOLEAN DEFAULT false, -- community template
    created_by INT REFERENCES users(id),
    created_at TIMESTAMP
  );
  ```
- **Features**:
  - Save current card as template: `POST /api/templates` with card data
  - Apply template to new card: Copy template.content to new card
  - Browse templates by category
  - Share templates with team (toggle `is_shared`)
- **UI**: "Save as Template" button in CardGeneration, template picker in create

#### 2.3 **Guided Onboarding** (5 hours)
- **Why**: First-time users need orientation. Reduces support load.
- **Effort**: Low (use `react-joyride` or custom component)
- **Implementation**:
  ```typescript
  const useOnboarding = () => {
    const [showTour, setShowTour] = useState(
      !localStorage.getItem('tour_completed')
    );
    
    const steps = [
      { target: '.style-selector', content: 'Pick a style for your card' },
      { target: '.occasion-picker', content: 'Select the occasion' },
      { target: '.text-editor', content: 'Customize the greeting text' },
      { target: '.generate-btn', content: 'Generate your card' }
    ];
    
    return { showTour, steps, complete: () => {
      localStorage.setItem('tour_completed', 'true');
      setShowTour(false);
    }};
  };
  ```
- **Trigger**: On first login, show 5-step tour of dashboard

#### 2.4 **Bulk Assign Styles/Occasions** (4 hours)
- **Why**: Reclassifying existing cards is tedious. Bulk operations help.
- **Effort**: Very Low
- **Endpoint**:
  ```javascript
  PUT /api/cards/bulk-update
  { 
    cardIds: [1, 2, 3],
    style_id: 5,
    occasion_id: 10
  }
  ```
- **UI**: In CardInventory, select cards → dropdown "Reassign Style" or "Reassign Occasion"

---

### PHASE 3: Advanced Features (3-4 weeks, long-term value)
These unlock premium workflows but require more effort.

#### 3.1 **WYSIWYG Card Editor (Drag-and-Drop)** (12 hours)
- **Why**: Direct editing is more intuitive than text fields.
- **Effort**: High (use `react-dnd` or similar)
- **Tech Stack**:
  - `react-dnd` for drag-drop
  - Canvas or div-based layout
  - Real-time preview
- **Core Features**:
  - Drag text, images, stickers onto canvas
  - Live front/back preview
  - Click to edit font, color, position
  - Save as card
- **Roadmap**: Build this as a separate "Advanced Editor" page (not required for MVP)

#### 3.2 **Multi-User Roles & Permissions** (8 hours)
- **Why**: Team workflows need clear ownership (designer, reviewer, admin).
- **Current State**: Already have roles (Admin, Designer, Reviewer)
- **Gaps to Fill**:
  - Assign batch to specific designer
  - Route cards to specific reviewer
  - View only own batches (privacy)
- **Database Changes**:
  ```sql
  ALTER TABLE batches ADD assigned_to INT REFERENCES users(id);
  ALTER TABLE batches ADD reviewed_by INT REFERENCES users(id);
  ```
- **API Updates**:
  - `GET /api/batches?assigned_to=me` (show my batches)
  - `POST /api/batches/:id/assign?user_id=123` (admin assigns)

#### 3.3 **Approval Workflow with Notifications** (10 hours)
- **Why**: Designers need to know when their batch is approved/rejected.
- **Effort**: High (requires notifications infrastructure)
- **Implementation**:
  ```sql
  CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    type VARCHAR(50), -- 'batch_approved', 'batch_rejected', 'comment'
    message TEXT,
    related_batch_id INT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP
  );
  ```
- **Backend Logic**:
  ```javascript
  // When batch is approved
  await Notification.create({
    user_id: batch.created_by,
    type: 'batch_approved',
    message: `Your batch "${batch.name}" was approved!`,
    related_batch_id: batch.id
  });
  ```
- **Frontend**: Notification bell in nav → dropdown list → click to batch

#### 3.4 **Media Library with Tagging & Search** (6 hours)
- **Why**: Organize uploaded images by project, occasion, theme.
- **Effort**: Medium
- **Database**:
  ```sql
  CREATE TABLE media_tags (
    id SERIAL PRIMARY KEY,
    media_id INT REFERENCES media(id),
    tag VARCHAR(50)
  );
  ```
- **Features**:
  - Tag images on upload or bulk-tag later
  - Search by tag: `GET /api/media?tag=birthday`
  - Filter by type (image, icon, background)
  - Grid view with previews

#### 3.5 **Analytics & Reporting Dashboard** (10 hours)
- **Why**: Understand what's working (most popular styles, occasions).
- **Effort**: Medium (mostly frontend visualization)
- **Your Dashboard Already Has**: Card count, batch count, approval rates
- **Enhancements**:
  - **Style Performance**: Which 50 styles generate the most cards? Which convert (get published)?
  - **Occasion Trends**: Birthday vs. Anniversary — which is more popular?
  - **Approval Rates**: Admin can see design quality → feedback to team
  - **Export Reports**: CSV/PDF with charts
- **Implementation**:
  ```javascript
  // New endpoint
  GET /api/analytics/style-performance?start_date=2024-01&end_date=2024-02
  Response: [
    { style_id: 1, style_name: 'Watercolor', 
      cards_created: 250, cards_approved: 200, approval_rate: 80% },
    ...
  ]
  ```
- **Frontend**: Add "Reports" section to dashboard with Chart.js or Recharts

#### 3.6 **Store Integration (Publish & Inventory)** (12 hours)
- **Why**: Your "store" feature needs real inventory management.
- **Current State**: `POST /api/store/cards/:id/publish` exists
- **Gaps**:
  - SKU management (each card variant = SKU)
  - Stock levels (how many of this card in inventory?)
  - Publish metadata (price, description, tags)
  - Sync with external store (Shopify, etc.)
- **Database**:
  ```sql
  ALTER TABLE cards ADD published_at TIMESTAMP;
  ALTER TABLE cards ADD store_sku VARCHAR(100);
  ALTER TABLE cards ADD store_price DECIMAL;
  CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    card_id INT REFERENCES cards(id),
    quantity_available INT,
    quantity_sold INT,
    last_restocked TIMESTAMP
  );
  ```

---

### PHASE 4: Polish & Scale (ongoing)
Advanced features for mature product.

#### 4.1 **AI-Assisted Text Suggestions** (8 hours)
- **Why**: Users often want alternatives. This is a quality-of-life feature.
- **Effort**: Medium (use your existing OpenAI integration)
- **UI**: In text editor, "Get Alternatives" button → shows 3 variants
- **Endpoint**:
  ```javascript
  POST /api/ai/suggest-alternatives
  {
    original_text: "Happy Birthday!",
    tone: "heartfelt",
    occasion: "birthday",
    count: 3
  }
  ```

#### 4.2 **Image Quality Checks** (6 hours)
- **Why**: Prevent publishing blurry or wrong-aspect-ratio cards.
- **Effort**: Low (use `sharp` library + basic validation)
- **Checks**:
  - Min resolution: 300x300px
  - Max: 3000x3000px
  - Aspect ratio: 5:7 (standard card)
  - File size: <5MB
- **Implementation**:
  ```javascript
  const validateImage = (buffer) => {
    const metadata = await sharp(buffer).metadata();
    if (metadata.width < 300) throw new Error('Image too small');
    if (metadata.height / metadata.width < 0.7 || > 1.4) 
      throw new Error('Aspect ratio off');
  };
  ```

#### 4.3 **Rate Limiting & Quotas** (3 hours)
- **Why**: Prevent abuse of expensive API calls (OpenAI, image generation).
- **Implementation**: Use `express-rate-limit`
  ```javascript
  const generateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // 50 generations per hour
    keyGenerator: (req) => req.user.id
  });
  
  app.post('/api/cards/generate', generateLimiter, generateCard);
  ```

---

## 📊 Implementation Priority Table

| Feature | Phase | Effort | ROI | Timeline | Impact |
|---------|-------|--------|-----|----------|--------|
| Undo/Redo | 1 | 4h | High | Day 1 | UX |
| Bulk Approve/Reject | 1 | 3h | High | Day 1 | Workflow |
| Bulk Download/Export | 1 | 4h | High | Day 2 | User Value |
| Tooltips & Help | 1 | 3h | High | Day 2 | Onboarding |
| Commenting | 2 | 6h | High | Week 1 | Collaboration |
| Template System | 2 | 8h | Medium | Week 1 | Reusability |
| Onboarding Tour | 2 | 5h | Medium | Week 1 | UX |
| Bulk Reassign | 2 | 4h | Medium | Week 1 | Workflow |
| WYSIWYG Editor | 3 | 12h | High | Week 3 | Core Feature |
| Role-Based Access | 3 | 8h | Medium | Week 2 | Security |
| Approval Notifications | 3 | 10h | High | Week 2 | Workflow |
| Media Tagging | 3 | 6h | Medium | Week 2 | Organization |
| Analytics Dashboard | 3 | 10h | High | Week 3 | Insights |
| Store Integration | 3 | 12h | High | Week 3 | Revenue |
| Text Alternatives | 4 | 8h | Low | Week 4 | Polish |
| Image Quality Checks | 4 | 6h | Medium | Week 4 | Quality |
| Rate Limiting | 4 | 3h | High | Week 4 | Stability |

---

## 🎯 Recommended Approach

### For MVP Launch (Do This Week):
1. **Undo/Redo** (4h) — Essential UX
2. **Bulk Approve/Reject** (3h) — Workflow booster
3. **Bulk Download** (4h) — User value
4. **Tooltips** (3h) — Onboarding helper

**Total: 14 hours = 2-3 days of work**

This gives your users:
- ✅ Professional editing experience
- ✅ Efficient batch operations
- ✅ Export functionality
- ✅ Clear guidance

### For Week 1 Post-Launch:
5. **Commenting** (6h) — Feedback loop
6. **Template System** (8h) — Reusability
7. **Onboarding Tour** (5h) — First-time UX

### For Month 1:
8. **WYSIWYG Editor** (12h) — Advanced feature
9. **Analytics** (10h) — Insights
10. **Approval Notifications** (10h) — Workflow

---

## 🚀 Quick Implementation Checklist

### Phase 1 (This Week):
- [ ] Add undo/redo context to card editor
- [ ] Add checkboxes to card review list
- [ ] Create `POST /api/cards/bulk-status` endpoint
- [ ] Add download button with ZIP generation
- [ ] Add tooltip component + deploy to 5 key areas
- [ ] Deploy to staging
- [ ] Test with team

### Phase 2 (Next Week):
- [ ] Create comments table + API
- [ ] Add comment UI to card review
- [ ] Create templates table + API
- [ ] Build template picker in card generation
- [ ] Implement onboarding tour
- [ ] Deploy to staging

### Phase 3 (Weeks 3-4):
- [ ] Start WYSIWYG editor branch (complex)
- [ ] Build analytics queries
- [ ] Create notifications infrastructure
- [ ] Deploy role-based filtering

---

## 📝 What NOT to Do (Yet)

❌ **WYSIWYG Editor**: Complex, can wait 3-4 weeks
❌ **Store Sync**: Depends on store choice (Shopify? Custom?)
❌ **Real-time Updates**: Requires WebSockets, overkill for MVP
❌ **Advanced AI**: Style transfer is cool but not essential
❌ **Mobile App**: Desktop first, then mobile

---

## 🎊 Summary

Your app is **ready to ship**. Before adding features, launch and gather user feedback.

**My recommendation:**
1. **Ship today** with Phase 1 enhancements (14h)
2. **Listen to users** for 1 week
3. **Prioritize** based on actual feedback
4. **Iterate** with Phase 2-3 features

This way you're building what users actually need, not guessing.

---

**Next step?** Pick Phase 1 and I'll implement it. Which feature should we start with?
