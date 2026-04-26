import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import audioRoutes from './src/routes/audioRoutes.js';
import mixingRoutes from './src/routes/mixingRoutes.js';
import animationRoutes from './src/routes/animationRoutes.js';
import projectRoutes from './src/routes/projectRoutes.js';
import voiceLibraryRoutes from './src/routes/voiceLibraryRoutes.js';
import voiceBlendingRoutes from './src/routes/voiceBlendingRoutes.js';
import soundEffectsRoutes from './src/routes/soundEffectsRoutes.js';
import voicesRoutes from './src/routes/voicesRoutes.js';
import emotionRoutes from './src/routes/emotionRoutes.js';
import mixerRoutes from './src/routes/mixerRoutes.js';
import musicRoutes from './src/routes/musicRoutes.js';
import videoRoutes from './src/routes/videoRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'frontend/dist')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Register routes
app.use('/api/audio', audioRoutes);
app.use('/api/voices', voicesRoutes);
app.use('/api/mixing', mixingRoutes);
app.use('/api/animation', animationRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/voice-library', voiceLibraryRoutes);
app.use('/api/voice-blending', voiceBlendingRoutes);
app.use('/api/sound-effects', soundEffectsRoutes);
app.use('/api/emotions', emotionRoutes);
app.use('/api/mixer', mixerRoutes);
app.use('/api/music', musicRoutes);
app.use('/api/video', videoRoutes);

// Serve frontend for all other routes (SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/dist/index.html'), (err) => {
    if (err) {
      res.status(404).json({ error: 'Frontend not found' });
    }
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// 404 handler (unreachable with wildcard above, but kept for safety)
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🎬 Voice Over Studio running on port ${PORT}`);
  console.log(`📍 API: http://localhost:${PORT}`);
  console.log(`🏥 Health: http://localhost:${PORT}/health`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});

export default app;
