import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Get video project
router.get('/project/:projectId', (req, res) => {
  try {
    const { projectId } = req.params;
    
    res.json({
      id: projectId,
      name: 'Untitled Video',
      duration: 180,
      fps: 24,
      resolution: '1920x1080',
      tracks: [
        { id: 'track-1', label: 'Animation', type: 'animation' },
        { id: 'track-2', label: 'Voice', type: 'audio' },
        { id: 'track-3', label: 'Music', type: 'audio' },
        { id: 'track-4', label: 'Effects', type: 'audio' },
        { id: 'track-5', label: 'Text', type: 'text' }
      ],
      timeline: []
    });
  } catch (error) {
    console.error('Project fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new video project
router.post('/project', (req, res) => {
  try {
    const { name = 'Untitled Video', duration = 180 } = req.body;
    const projectId = uuidv4();
    
    res.json({
      success: true,
      projectId,
      name,
      duration,
      created: new Date().toISOString()
    });
  } catch (error) {
    console.error('Project creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add track to project
router.post('/project/:projectId/track', (req, res) => {
  try {
    const { projectId } = req.params;
    const { label, type } = req.body;
    const trackId = uuidv4();
    
    res.json({
      success: true,
      trackId,
      label,
      type,
      projectId
    });
  } catch (error) {
    console.error('Track creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export video
router.post('/project/:projectId/export', (req, res) => {
  try {
    const { projectId } = req.params;
    const { format = 'mp4', quality = 'high' } = req.body;
    
    res.json({
      success: true,
      projectId,
      format,
      quality,
      status: 'pending',
      exportId: uuidv4(),
      message: 'Video export queued'
    });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
