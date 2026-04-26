import express from 'express';
import animationService from '../services/animationService.js';

const router = express.Router();

/**
 * Create animation sync timeline
 * POST /api/animation/timeline
 */
router.post('/timeline', async (req, res) => {
  try {
    const { audioPath, sceneBreakpoints } = req.body;

    if (!audioPath) {
      return res.status(400).json({ error: 'Audio path is required' });
    }

    const timeline = await animationService.createSyncTimeline(
      audioPath,
      sceneBreakpoints
    );

    res.json(timeline);
  } catch (error) {
    console.error('Timeline error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Create animation project
 * POST /api/animation/project
 */
router.post('/project', async (req, res) => {
  try {
    const projectConfig = req.body;

    const project = animationService.createAnimationProject(projectConfig);

    res.json(project);
  } catch (error) {
    console.error('Project error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Composite audio with video
 * POST /api/animation/composite
 */
router.post('/composite', async (req, res) => {
  try {
    const { videoPath, audioPath, audioVolume, videoVolume } = req.body;

    if (!videoPath || !audioPath) {
      return res.status(400).json({
        error: 'Video path and audio path are required'
      });
    }

    const result = await animationService.compositeAudioToVideo(
      videoPath,
      audioPath,
      { audioVolume, videoVolume }
    );

    res.json(result);
  } catch (error) {
    console.error('Composite error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Export for platform
 * POST /api/animation/export/:platform
 */
router.post('/export/:platform', async (req, res) => {
  try {
    const { platform } = req.params;
    const { videoPath, fps, bitrate } = req.body;

    if (!videoPath) {
      return res.status(400).json({ error: 'Video path is required' });
    }

    const exported = await animationService.exportForPlatform(
      videoPath,
      platform,
      { fps, bitrate }
    );

    res.json(exported);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
