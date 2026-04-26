# CardHugs Testing Plan & Guide

## 🧪 Testing Strategy

### Test Categories
1. **Unit Tests** - Individual components/functions
2. **Integration Tests** - Component interactions
3. **Workflow Tests** - End-to-end processes
4. **UI/UX Tests** - User interactions
5. **Performance Tests** - Speed & optimization

---

## ✅ TEST SCENARIOS

### 1. AUTHENTICATION & SETUP
```
✓ Test Case 1.1: Login with demo credentials
  - Navigate to http://localhost
  - Enter any email and password
  - Verify dashboard loads
  
✓ Test Case 1.2: Check session persistence
  - Log in and refresh page
  - Verify user stays logged in
  
✓ Test Case 1.3: Logout functionality
  - Click logout button
  - Verify redirect and session clear
```

### 2. ADMIN DASHBOARD (http://localhost/admin)
```
✓ Test Case 2.1: Dashboard loads with data
  - Page should load without errors
  - Verify KPI cards display
  - Confirm activity log populated
  
✓ Test Case 2.2: Real-time updates
  - Leave dashboard open for 30+ seconds
  - Verify auto-refresh updates numbers
  
✓ Test Case 2.3: Quick action links
  - Click "Go to Review" link
  - Verify navigates to /review
  - Repeat for QC and Store Upload
  
✓ Test Case 2.4: Chart/statistics rendering
  - Verify progress bars display correctly
  - Check percentage calculations
```

### 3. CARD EDITOR (http://localhost/card-editor)
```
✓ Test Case 3.1: Create new card
  - Click "Create New Card" or plus button
  - Fill front text
  - Fill inside text
  - Select occasion
  - Click Save
  - Verify card appears in list
  
✓ Test Case 3.2: Image upload
  - Click image upload button
  - Select image from computer
  - Verify image displays in preview
  - Save and reload
  - Verify image persists
  
✓ Test Case 3.3: Edit existing card
  - Select card from list
  - Modify text
  - Click Save
  - Verify changes saved
  
✓ Test Case 3.4: Delete card
  - Select card
  - Click Delete
  - Confirm deletion
  - Verify card removed from list
```

### 4. CARD LIBRARY (http://localhost/library)
```
✓ Test Case 4.1: View published cards
  - Navigate to library
  - Verify cards display in grid
  - Check card images and info show correctly
  
✓ Test Case 4.2: Search functionality
  - Type in search box
  - Verify results filter in real-time
  - Test with occasion names and card text
  
✓ Test Case 4.3: Filter by occasion
  - Click occasion dropdown
  - Select an occasion
  - Verify only those cards show
  
✓ Test Case 4.4: Sort options
  - Test "Newest" - verify by date
  - Test "Oldest" - verify reverse order
  - Test "Best Quality" - verify by quality score
  
✓ Test Case 4.5: View mode toggle
  - Click grid/list toggle button
  - Verify switches between grid and list
  - Confirm data same in both views
  
✓ Test Case 4.6: Card detail modal
  - Click "View" on a card
  - Verify modal opens with full details
  - Check front and inside display
  - Click Download JSON
  - Verify file downloads
  
✓ Test Case 4.7: Mobile view
  - Resize to mobile screen
  - Verify library still functional
  - Test search and filters on mobile
```

### 5. CARD REVIEW (http://localhost/review)
```
✓ Test Case 5.1: Quick review mode
  - Navigate to review
  - Verify draft cards load
  - See front and inside text
  - See occasional images
  
✓ Test Case 5.2: Single card approval
  - Click "Approve" button
  - Verify card marked approved
  - Advance to next card
  
✓ Test Case 5.3: Single card rejection
  - Click "Reject" button
  - Verify card marked rejected
  
✓ Test Case 5.4: Navigation
  - Click Previous/Next buttons
  - Verify proper navigation
  - Check progress bar updates
  
✓ Test Case 5.5: Keyboard shortcuts
  - Use Arrow Left/Right to navigate
  - Use "A" to approve
  - Use "R" to reject
  
✓ Test Case 5.6: Bulk mode
  - Click "Bulk Mode" button
  - Select multiple cards with checkboxes
  - Click "Approve All" or "Reject All"
  - Verify all selected cards updated
  
✓ Test Case 5.7: Undo/Redo
  - Make bulk selections
  - Click Undo button
  - Verify selections revert
  - Click Redo
  - Verify selections restored
```

### 6. QC APPROVAL DASHBOARD (http://localhost/qc-approval)
```
✓ Test Case 6.1: QC dashboard loads
  - Navigate to QC approval
  - Verify pending cards list appears
  - Check stats display
  
✓ Test Case 6.2: Quality scoring
  - Drag quality score slider
  - Verify percentage updates
  - Score ranges 0-100%
  
✓ Test Case 6.3: Rejection reason
  - Type rejection reason in text area
  - Click "Reject Card"
  - Verify reason saved
  
✓ Test Case 6.4: Comments
  - Add QC comments
  - Save card
  - Verify comments persist
  
✓ Test Case 6.5: Approve workflow
  - Set quality score to 80%+
  - Click "Approve for Store"
  - Verify card status changes
  - Check it moves to approved list
  
✓ Test Case 6.6: Card navigation
  - Use Previous/Next buttons
  - Navigate through pending cards
  - Verify data loads correctly
```

### 7. STORE UPLOAD (http://localhost/store-upload)
```
✓ Test Case 7.1: Card selection
  - View approved cards grid
  - Click "Select All" button
  - Verify all cards selected
  - Deselect some
  - Verify selection count updates
  
✓ Test Case 7.2: Batch naming
  - Enter batch name
  - Verify name appears in export
  
✓ Test Case 7.3: ZIP export
  - Select cards
  - Enter batch name
  - Click "Export as ZIP"
  - Verify ZIP file downloads
  - Extract ZIP and verify contents
  
✓ Test Case 7.4: Export history
  - Check export history table
  - Verify batches listed with counts
  - Verify status shows "completed"
  
✓ Test Case 7.5: Direct upload (placeholder test)
  - Enter CardHugs API key
  - Click "Save API Key"
  - Verify saved to localStorage
  - Select cards and click "Upload to Store"
  - Verify confirmation message
```

### 8. CARD NUMBERING (http://localhost/card-naming)
```
✓ Test Case 8.1: Dashboard loads
  - Navigate to numbering dashboard
  - Verify stats cards display
  - Check sequence numbers load
  
✓ Test Case 8.2: View sequences
  - Check current sequences per occasion
  - Verify next number increments properly
  
✓ Test Case 8.3: Duplicate detection
  - Check duplicates tab
  - Verify lists any duplicate card names
  - Click "Delete" on duplicate
  - Confirm deletion
  
✓ Test Case 8.4: All card names
  - View "All Card Names" tab
  - Verify table displays all cards
  - Test sorting and filtering
```

### 9. DATABASE BROWSER (http://localhost/database-browser)
```
✓ Test Case 9.1: View tables
  - Navigate to database browser
  - Select different tables from dropdown
  - Verify data displays for each
  
✓ Test Case 9.2: Pagination
  - View table with data
  - Check pagination controls
  - Navigate pages if more than 100 rows
  
✓ Test Case 9.3: Column display
  - Verify all columns display correctly
  - Check data types (UUID, timestamps, etc)
```

### 10. WORKFLOW INTEGRATION (FULL E2E)
```
✓ Test Case 10.1: Complete card lifecycle
  1. Create card in Editor
  2. Quick review in Review system
  3. QC approval in QC Dashboard
  4. Export and verify

Steps:
  - Go to Card Editor
  - Create: Fill text, upload image, save
  - Go to Review
  - Approve: Rate and approve card
  - Go to QC
  - Score: Set quality 85%, approve
  - Go to Store Upload
  - Export: Select, name, export ZIP
  - Verify: Open ZIP and check files
  - Go to Library
  - View: Find card in library
  
Expected: Card should move through all stages successfully
```

---

## 🔧 MANUAL TESTING CHECKLIST

### UI/Navigation
- [ ] All menu items clickable and navigate correctly
- [ ] Mobile menu opens/closes
- [ ] Responsive design at 320px, 768px, 1024px
- [ ] No console errors on navigation
- [ ] Breadcrumbs or nav indicators (if present)
- [ ] Loading spinners display during data load

### Forms & Input
- [ ] Text inputs accept text
- [ ] File uploads work
- [ ] Dropdowns open and select
- [ ] Sliders/range inputs work
- [ ] Checkboxes toggle
- [ ] Form validation shows errors
- [ ] Success messages display

### Data Display
- [ ] Tables display without overflow issues
- [ ] Cards display with images
- [ ] Pagination works correctly
- [ ] Search filters in real-time
- [ ] Sort options work
- [ ] No data duplication

### Performance
- [ ] Page loads in <3 seconds
- [ ] Scrolling smooth
- [ ] Search responsive (no lag)
- [ ] Images load quickly
- [ ] No memory leaks (browser dev tools)

### Accessibility
- [ ] Tab navigation works
- [ ] Buttons have hover states
- [ ] Text readable (contrast)
- [ ] Images have alt text
- [ ] Keyboard shortcuts documented

---

## 🐛 COMMON ISSUES TO TEST

```
1. Empty State Handling
   - What displays when no cards exist?
   - What shows in library with 0 published cards?
   - Error messages clear?

2. Network Error Handling
   - Lose connection - does app handle gracefully?
   - Slow network - do timeouts occur?
   - Failed API calls - error shown?

3. Edge Cases
   - Very long text strings
   - Large file uploads
   - Special characters in names
   - Duplicate card names
   - Concurrent operations

4. Session Management
   - Tab refresh - session persists?
   - Multiple tabs - sync?
   - Logout from one tab - affects others?
   - Token expiration - handled?
```

---

## 📊 TEST RESULTS TEMPLATE

```
Test Date: __________
Tester: __________
Environment: http://localhost
Browser: __________ Version: __________

TEST RESULTS:
┌──────────────────┬─────────┬──────────────────┐
│ Test Case        │ Status  │ Notes            │
├──────────────────┼─────────┼──────────────────┤
│ 1.1 Login        │ ✅ PASS │                  │
│ 2.1 Dashboard    │ ✅ PASS │                  │
│ 3.1 Card Create  │ ✅ PASS │ Image upload ok  │
│ ...              │ ...     │ ...              │
└──────────────────┴─────────┴──────────────────┘

ISSUES FOUND:
- Issue 1: Description
- Issue 2: Description

RECOMMENDATIONS:
- Recommendation 1
- Recommendation 2
```

---

## 🚀 BROWSER TESTING

Test on:
- [ ] Chrome 90+
- [ ] Firefox 88+
- [ ] Safari 14+
- [ ] Edge 90+
- [ ] Mobile Chrome
- [ ] Mobile Safari

---

## 📈 PERFORMANCE BENCHMARKS (Target)

| Metric | Target | Status |
|--------|--------|--------|
| Initial Load | < 3s | ? |
| Dashboard Load | < 2s | ? |
| Card List Load (100+) | < 2s | ? |
| Search Response | < 500ms | ? |
| Export ZIP | < 5s | ? |
| Image Upload | < 2s | ? |

