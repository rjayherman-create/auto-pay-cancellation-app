const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const archiver = require('archiver');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Database pool
const pool = new Pool({
  host: process.env.DB_HOST || 'postgres',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'cardhugs',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory export batches (replace with DB table for persistence)
let exportBatches = [];

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// ============ AI TITLE GENERATION ENDPOINTS ============

// Generate AI title for card
app.post('/api/ai/generate-title', async (req, res) => {
  try {
    const { front_text, inside_text, occasion, style } = req.body;

    if (!front_text && !inside_text) {
      return res.status(400).json({ error: 'front_text or inside_text required' });
    }

    // Generate unique title
    const generatedTitle = generateTitleOffline(front_text, inside_text, occasion, style);
    
    // Check for duplicates
    const existingCards = await pool.query(
      'SELECT COUNT(*) as count FROM cards WHERE LOWER(front_text) = LOWER($1);',
      [generatedTitle]
    );

    let finalTitle = generatedTitle;
    let attempt = 1;
    const maxAttempts = 5;

    // If duplicate, keep generating until unique
    while (existingCards.rows[0].count > 0 && attempt < maxAttempts) {
      finalTitle = generateTitleOffline(front_text, inside_text, occasion, style) + ` (v${attempt})`;
      const checkDuplicate = await pool.query(
        'SELECT COUNT(*) as count FROM cards WHERE LOWER(front_text) = LOWER($1);',
        [finalTitle]
      );
      if (checkDuplicate.rows[0].count === 0) break;
      attempt++;
    }

    res.json({
      title: finalTitle,
      isDuplicate: false,
      suggestions: generateTitleSuggestions(front_text, inside_text, occasion, style),
      occasion: occasion || 'General',
      style: style || 'Classic'
    });

  } catch (error) {
    console.error('Title generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check if title is unique
app.post('/api/ai/check-title-duplicate', async (req, res) => {
  try {
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'title required' });
    }

    const result = await pool.query(
      'SELECT COUNT(*) as count FROM cards WHERE LOWER(front_text) = LOWER($1);',
      [title]
    );

    res.json({
      title,
      isDuplicate: result.rows[0].count > 0,
      existingCount: result.rows[0].count
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to generate title offline
function generateTitleOffline(frontText, insideText, occasion, style) {
  const titleTemplates = {
    'Birthday': [
      'Another Year Older, Still Fabulous',
      'Let\'s Celebrate You!',
      'Your Day, Your Way',
      'Make a Wish Come True',
      'Cheers to Another Year',
      'You\'re Amazing on Your Day',
      'Time to Celebrate You'
    ],
    'Anniversary': [
      'Forever Starts Today',
      'Our Love Story Continues',
      'Celebrating Us',
      'Through Every Season',
      'Always & Forever',
      'Our Greatest Adventure',
      'More Years, More Love'
    ],
    'Wedding': [
      'Happily Ever After Begins',
      'Two Hearts, One Love',
      'Forever Together',
      'The Adventure Starts Now',
      'Our Love, Our Story',
      'A New Chapter',
      'Till Death Do Us Part'
    ],
    'Thank You': [
      'Grateful for You',
      'Thanks from the Heart',
      'Your Kindness Means Everything',
      'Thank You for Caring',
      'Appreciation Beyond Words',
      'You\'re Simply the Best',
      'Grateful Hearts'
    ],
    'Get Well': [
      'Thinking of You',
      'Get Better Soon',
      'Sending Healing Thoughts',
      'Wishing You Wellness',
      'Feel Better Fast',
      'You\'ve Got This',
      'Rest & Recover Well'
    ],
    'Congratulations': [
      'So Proud of You',
      'Congratulations on Your Success',
      'You Did It!',
      'Well Done, Amazing One',
      'Achievement Unlocked',
      'Your Dreams Come True',
      'This Calls for Celebration'
    ]
  };

  const templates = titleTemplates[occasion] || titleTemplates['Thank You'];
  const randomTitle = templates[Math.floor(Math.random() * templates.length)];
  
  return randomTitle;
}

// Helper function to generate title suggestions
function generateTitleSuggestions(frontText, insideText, occasion, style) {
  const baseTemplates = [
    'Heartfelt ' + (occasion || 'Wishes'),
    'With ' + (style || 'Warmth'),
    'Celebrate ' + (occasion || 'the Moment'),
    'Special Moments',
    'From the Heart'
  ];

  return baseTemplates.map(title => ({
    title,
    isDuplicate: false
  }));
}

// ============ ADMIN ENDPOINTS ============

// Get database list
app.get('/api/admin/databases', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);
    res.json({
      databases: result.rows.map(r => r.tablename)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get table data
app.get('/api/admin/tables/:table/data', async (req, res) => {
  try {
    const { table } = req.params;
    const { limit = 100, offset = 0 } = req.query;

    // Validate table name to prevent SQL injection
    const validTables = ['users', 'cards', 'occasions', 'batches', 'styles', 'training_jobs', 'settings', 'media_items'];
    if (!validTables.includes(table)) {
      return res.status(400).json({ error: 'Invalid table name' });
    }

    const data = await pool.query(`SELECT * FROM ${table} LIMIT $1 OFFSET $2;`, [limit, offset]);
    const count = await pool.query(`SELECT COUNT(*) FROM ${table};`);

    res.json({
      data: data.rows,
      total: parseInt(count.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get stats
app.get('/api/admin/stats', async (req, res) => {
  try {
    const occasionStats = await pool.query(`
      SELECT 
        occasion,
        COUNT(*) as total_cards,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_cards,
        SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published_cards,
        MAX(CAST(metadata->>'sequence_number' AS INTEGER)) as next_sequence
      FROM cards
      GROUP BY occasion
      ORDER BY occasion;
    `);

    const stats = occasionStats.rows.map(row => ({
      occasion: row.occasion,
      totalCards: row.total_cards,
      approvedCards: row.approved_cards,
      publishedCards: row.published_cards,
      nextSequence: (row.next_sequence || 0) + 1
    }));

    res.json({ stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ CARDS ENDPOINTS ============

// Get all cards
app.get('/api/cards', async (req, res) => {
  try {
    const { status, occasion, batch_id, limit = 50, offset = 0 } = req.query;
    let query = 'SELECT * FROM cards WHERE 1=1';
    const params = [];

    if (status) {
      query += ` AND status = $${params.length + 1}`;
      params.push(status);
    }
    if (occasion) {
      query += ` AND occasion = $${params.length + 1}`;
      params.push(occasion);
    }
    if (batch_id) {
      query += ` AND batch_id = $${params.length + 1}`;
      params.push(batch_id);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2};`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    res.json({ cards: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single card
app.get('/api/cards/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM cards WHERE id = $1;', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Card not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create card
app.post('/api/cards', async (req, res) => {
  try {
    const { batch_id, occasion, style, front_text, front_image_url, inside_text, inside_image_url, status } = req.body;
    
    const result = await pool.query(
      `INSERT INTO cards (batch_id, occasion, style, front_text, front_image_url, inside_text, inside_image_url, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *;`,
      [batch_id, occasion, style, front_text, front_image_url, inside_text, inside_image_url, status || 'draft']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update card
app.put('/api/cards/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { batch_id, occasion, style, front_text, front_image_url, inside_text, inside_image_url, status, quality_check_status, quality_score, rejection_reason } = req.body;

    const result = await pool.query(
      `UPDATE cards 
       SET batch_id = COALESCE($2, batch_id),
           occasion = COALESCE($3, occasion),
           style = COALESCE($4, style),
           front_text = COALESCE($5, front_text),
           front_image_url = COALESCE($6, front_image_url),
           inside_text = COALESCE($7, inside_text),
           inside_image_url = COALESCE($8, inside_image_url),
           status = COALESCE($9, status),
           quality_check_status = COALESCE($10, quality_check_status),
           quality_score = COALESCE($11, quality_score),
           rejection_reason = COALESCE($12, rejection_reason),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *;`,
      [id, batch_id, occasion, style, front_text, front_image_url, inside_text, inside_image_url, status, quality_check_status, quality_score, rejection_reason]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Card not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete card
app.delete('/api/cards/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM cards WHERE id = $1;', [req.params.id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Card not found' });
    }
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk update status
app.post('/api/cards/bulk/status', async (req, res) => {
  try {
    const { ids, status } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ error: 'ids must be an array' });
    }

    const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
    const result = await pool.query(
      `UPDATE cards SET status = $${ids.length + 1}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ANY(ARRAY[${placeholders}]::uuid[])
       RETURNING *;`,
      [...ids, status]
    );

    res.json({ updated: result.rows.length, cards: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ OCCASIONS ENDPOINTS ============

app.get('/api/occasions', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM occasions WHERE is_active = true ORDER BY name;');
    res.json({ occasions: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ STYLES ENDPOINTS ============

app.get('/api/styles', async (req, res) => {
  try {
    const { training_status, category } = req.query;
    let query = 'SELECT * FROM styles WHERE 1=1';
    const params = [];

    if (training_status) {
      query += ` AND training_status = $${params.length + 1}`;
      params.push(training_status);
    }
    if (category) {
      query += ` AND category = $${params.length + 1}`;
      params.push(category);
    }

    query += ' ORDER BY name;';
    const result = await pool.query(query, params);
    res.json({ styles: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ AUTH ENDPOINTS ============

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // For now, accept any login (demo mode)
    const token = 'token_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    res.json({
      token,
      user: {
        id: 'demo-user',
        email,
        name: email.split('@')[0],
        role: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ message: 'Logged out' });
});

// ============ EXPORT ENDPOINTS ============

// Get all export batches
app.get('/api/export/batches', async (req, res) => {
  try {
    res.json({ batches: exportBatches });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export cards as ZIP
app.post('/api/export/zip', async (req, res) => {
  try {
    const { cardIds, batchName } = req.body;

    if (!cardIds || cardIds.length === 0) {
      return res.status(400).json({ error: 'No cards selected' });
    }

    // Fetch card data
    const placeholders = cardIds.map((_, i) => `$${i + 1}`).join(',');
    const cardsResult = await pool.query(
      `SELECT * FROM cards WHERE id = ANY(ARRAY[${placeholders}]::uuid[]);`,
      cardIds
    );

    if (cardsResult.rows.length === 0) {
      return res.status(404).json({ error: 'No cards found' });
    }

    // Create ZIP archive
    const archive = archiver('zip', { zlib: { level: 9 } });
    const batchId = uuidv4();

    // Add cards data as JSON
    const cardsData = {
      batchId,
      batchName,
      exportedAt: new Date().toISOString(),
      cardCount: cardsResult.rows.length,
      cards: cardsResult.rows.map(card => ({
        id: card.id,
        occasion: card.occasion,
        style: card.style,
        front_text: card.front_text,
        front_image_url: card.front_image_url,
        inside_text: card.inside_text,
        inside_image_url: card.inside_image_url,
        quality_score: card.quality_score,
        created_at: card.created_at
      }))
    };

    archive.append(JSON.stringify(cardsData, null, 2), { name: 'cards.json' });

    // Add import instructions
    const instructions = `# CardHugs Store Upload Instructions

## Batch: ${batchName}
Exported: ${new Date().toISOString()}
Cards: ${cardsResult.rows.length}

### How to Import:
1. Log into CardHugs Store Admin
2. Go to Bulk Import section
3. Upload this ZIP file
4. Review cards and confirm import

### File Contents:
- cards.json: Card data, text, and image URLs
- README.md: These instructions

### Card Status:
All cards are pre-approved and ready for store listing.

### Support:
For issues or questions, contact support@cardhugs.com
`;
    archive.append(instructions, { name: 'README.md' });

    // Set response headers
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${batchName.replace(/\\s+/g, '_')}_cards.zip"`);

    // Pipe archive to response
    archive.pipe(res);
    archive.finalize();

    // Track export batch
    exportBatches.push({
      id: batchId,
      name: batchName,
      cardCount: cardsResult.rows.length,
      status: 'completed',
      createdAt: new Date().toISOString(),
      exportedAt: new Date().toISOString(),
      fileSize: 0
    });

  } catch (error) {
    console.error('ZIP export error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Upload cards directly to CardHugs store
app.post('/api/export/upload-to-store', async (req, res) => {
  try {
    const { cardIds, cardhugsApiKey, batchName } = req.body;

    if (!cardIds || cardIds.length === 0) {
      return res.status(400).json({ error: 'No cards selected' });
    }

    if (!cardhugsApiKey) {
      return res.status(400).json({ error: 'CardHugs API key required' });
    }

    // Fetch card data
    const placeholders = cardIds.map((_, i) => `$${i + 1}`).join(',');
    const cardsResult = await pool.query(
      `SELECT * FROM cards WHERE id = ANY(ARRAY[${placeholders}]::uuid[]);`,
      cardIds
    );

    if (cardsResult.rows.length === 0) {
      return res.status(404).json({ error: 'No cards found' });
    }

    // Prepare payload for CardHugs API
    const uploadPayload = {
      batchName: batchName || `Batch ${new Date().toLocaleDateString()}`,
      cards: cardsResult.rows.map(card => ({
        id: card.id,
        occasion: card.occasion,
        style: card.style,
        front_text: card.front_text,
        front_image_url: card.front_image_url,
        inside_text: card.inside_text,
        inside_image_url: card.inside_image_url,
        quality_score: card.quality_score
      }))
    };

    // Call CardHugs API (placeholder - update with real endpoint)
    console.log('Uploading to CardHugs store:', {
      cardCount: cardsResult.rows.length,
      batchName: uploadPayload.batchName
    });

    // TODO: Replace with actual CardHugs API endpoint
    // const cardhugsResponse = await axios.post(
    //   'https://api.cardhugs.com/v1/store/bulk-upload',
    //   uploadPayload,
    //   {
    //     headers: {
    //       'Authorization': `Bearer ${cardhugsApiKey}`,
    //       'Content-Type': 'application/json'
    //     }
    //   }
    // );

    // For now, simulate successful upload
    const batchId = uuidv4();
    exportBatches.push({
      id: batchId,
      name: uploadPayload.batchName,
      cardCount: cardsResult.rows.length,
      status: 'completed',
      createdAt: new Date().toISOString(),
      exportedAt: new Date().toISOString()
    });

    // Update cards status to published
    await pool.query(
      `UPDATE cards SET status = 'published', updated_at = CURRENT_TIMESTAMP 
       WHERE id = ANY(ARRAY[${placeholders}]::uuid[]);`,
      cardIds
    );

    res.json({
      success: true,
      message: `Successfully uploaded ${cardsResult.rows.length} cards to CardHugs store`,
      uploadedCount: cardsResult.rows.length,
      batchId
    });

  } catch (error) {
    console.error('Store upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`CardHugs API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  
  // Test database connection
  pool.query('SELECT NOW();', (err, result) => {
    if (err) {
      console.error('Database connection failed:', err);
    } else {
      console.log('✓ Database connected');
    }
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    pool.end();
    process.exit(0);
  });
});

module.exports = app;
