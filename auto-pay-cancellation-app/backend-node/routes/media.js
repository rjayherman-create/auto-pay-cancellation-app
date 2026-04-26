const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Setup multer for media uploads
const uploadDir = path.join(__dirname, '../uploads/media');
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  // Allow only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
  },
});

// In-memory media store (in production, use database)
const mediaStore = new Map();

// POST upload media
router.post('/upload', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const mediaId = uuidv4();
    const mediaUrl = `/uploads/media/${req.file.filename}`;

    // Store metadata
    mediaStore.set(mediaId, {
      id: mediaId,
      url: mediaUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      uploadedBy: req.user.userId,
      uploadedAt: new Date(),
    });

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      id: mediaId,
      url: mediaUrl,
      filename: req.file.filename,
      size: req.file.size,
    });
  } catch (error) {
    console.error('Error uploading media:', error);
    res.status(500).json({
      error: 'Failed to upload media',
      message: error.message,
    });
  }
});

// GET list all media
router.get('/', protect, async (req, res) => {
  try {
    const { skip = 0, limit = 50 } = req.query;
    const allMedia = Array.from(mediaStore.values());

    const paginatedMedia = allMedia
      .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
      .slice(parseInt(skip), parseInt(skip) + parseInt(limit));

    res.json({
      media: paginatedMedia,
      total: allMedia.length,
      skip: parseInt(skip),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error('Error fetching media:', error);
    res.status(500).json({ error: 'Failed to get media' });
  }
});

// GET single media
router.get('/:id', protect, async (req, res) => {
  try {
    const media = mediaStore.get(req.params.id);

    if (!media) {
      return res.status(404).json({ error: 'Media not found' });
    }

    res.json(media);
  } catch (error) {
    console.error('Error fetching media:', error);
    res.status(500).json({ error: 'Failed to get media' });
  }
});

// DELETE media
router.delete('/:id', protect, async (req, res) => {
  try {
    const media = mediaStore.get(req.params.id);

    if (!media) {
      return res.status(404).json({ error: 'Media not found' });
    }

    // Delete file
    try {
      const filePath = path.join(__dirname, '..', media.url);
      await fs.unlink(filePath);
    } catch (err) {
      console.error('File deletion error:', err);
      // Continue even if file deletion fails
    }

    // Remove from store
    mediaStore.delete(req.params.id);

    res.json({
      success: true,
      message: 'Media deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting media:', error);
    res.status(500).json({
      error: 'Failed to delete media',
      message: error.message,
    });
  }
});

module.exports = router;
