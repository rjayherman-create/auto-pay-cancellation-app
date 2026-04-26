import express from 'express';
import multer from 'multer';
import path from 'path';
import { promises as fs } from 'fs';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/audio');
  },
  filename: (req, file, cb) => {
    const fileId = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `${fileId}${ext}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB max
});

// Upload file
router.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const fileId = path.parse(req.file.filename).name;
    const filePath = `/uploads/audio/${req.file.filename}`;

    res.json({
      success: true,
      fileId,
      filePath,
      filename: req.file.originalname,
      filesize: req.file.size,
      url: `http://localhost:3000${filePath}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error uploading file:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Download file
router.get('/download/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const uploadDir = './uploads/audio';
    const files = await fs.readdir(uploadDir);
    
    const file = files.find(f => f.startsWith(fileId));

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const filePath = path.join(uploadDir, file);
    res.download(filePath);
  } catch (error) {
    console.error('Error downloading file:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Delete file
router.delete('/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const uploadDir = './uploads/audio';
    const files = await fs.readdir(uploadDir);
    
    const file = files.find(f => f.startsWith(fileId));

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const filePath = path.join(uploadDir, file);
    await fs.unlink(filePath);

    res.json({ success: true, message: 'File deleted' });
  } catch (error) {
    console.error('Error deleting file:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
