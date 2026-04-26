import express from 'express';
import professionalAudioMixer from '../services/professionalAudioMixer.js';

const router = express.Router();

/**
 * Create new mixing project
 * POST /api/mixer/project/create
 */
router.post('/project/create', (req, res) => {
  try {
    const { projectName, duration = 60, sampleRate = 44100, format = 'wav' } = req.body;

    if (!projectName) {
      return res.status(400).json({
        success: false,
        error: 'projectName is required'
      });
    }

    const project = professionalAudioMixer.createMixProject(projectName, {
      duration,
      sampleRate,
      format
    });

    res.json({
      success: true,
      project: project
    });
  } catch (error) {
    console.error('Project creation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Add track to project
 * POST /api/mixer/track/add
 */
router.post('/track/add', (req, res) => {
  try {
    const { projectId, trackData } = req.body;
    const projects = professionalAudioMixer.getSavedProjects();
    const project = projects.find(p => p.id === projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    const track = professionalAudioMixer.addTrack(project, trackData);
    professionalAudioMixer.saveMixProject(project);

    res.json({
      success: true,
      track: track,
      project: project
    });
  } catch (error) {
    console.error('Add track error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Update track volume
 * PUT /api/mixer/track/:trackId/volume
 */
router.put('/track/:trackId/volume', (req, res) => {
  try {
    const { projectId, volume } = req.body;
    const projects = professionalAudioMixer.getSavedProjects();
    const project = projects.find(p => p.id === projectId);

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const track = professionalAudioMixer.updateTrackVolume(project, req.params.trackId, volume);
    professionalAudioMixer.saveMixProject(project);

    res.json({ success: true, track: track });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Update track pan
 * PUT /api/mixer/track/:trackId/pan
 */
router.put('/track/:trackId/pan', (req, res) => {
  try {
    const { projectId, pan } = req.body;
    const projects = professionalAudioMixer.getSavedProjects();
    const project = projects.find(p => p.id === projectId);

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const track = professionalAudioMixer.updateTrackPan(project, req.params.trackId, pan);
    professionalAudioMixer.saveMixProject(project);

    res.json({ success: true, track: track });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Toggle mute
 * PUT /api/mixer/track/:trackId/mute
 */
router.put('/track/:trackId/mute', (req, res) => {
  try {
    const { projectId, muted } = req.body;
    const projects = professionalAudioMixer.getSavedProjects();
    const project = projects.find(p => p.id === projectId);

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const track = professionalAudioMixer.toggleMute(project, req.params.trackId, muted);
    professionalAudioMixer.saveMixProject(project);

    res.json({ success: true, track: track });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Set solo
 * PUT /api/mixer/track/:trackId/solo
 */
router.put('/track/:trackId/solo', (req, res) => {
  try {
    const { projectId, solo } = req.body;
    const projects = professionalAudioMixer.getSavedProjects();
    const project = projects.find(p => p.id === projectId);

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const track = professionalAudioMixer.setSolo(project, req.params.trackId, solo);
    professionalAudioMixer.saveMixProject(project);

    res.json({ success: true, track: track });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Apply EQ to track
 * POST /api/mixer/track/:trackId/eq
 */
router.post('/track/:trackId/eq', (req, res) => {
  try {
    const { projectId, bass, mid, treble } = req.body;
    const projects = professionalAudioMixer.getSavedProjects();
    const project = projects.find(p => p.id === projectId);

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const track = professionalAudioMixer.applyTrackEQ(project, req.params.trackId, { bass, mid, treble });
    professionalAudioMixer.saveMixProject(project);

    res.json({ success: true, track: track });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Apply compression
 * POST /api/mixer/track/:trackId/compression
 */
router.post('/track/:trackId/compression', (req, res) => {
  try {
    const { projectId, ratio, threshold, attack, release } = req.body;
    const projects = professionalAudioMixer.getSavedProjects();
    const project = projects.find(p => p.id === projectId);

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const track = professionalAudioMixer.applyCompression(project, req.params.trackId, {
      ratio, threshold, attack, release
    });
    professionalAudioMixer.saveMixProject(project);

    res.json({ success: true, track: track });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Apply reverb
 * POST /api/mixer/track/:trackId/reverb
 */
router.post('/track/:trackId/reverb', (req, res) => {
  try {
    const { projectId, amount } = req.body;
    const projects = professionalAudioMixer.getSavedProjects();
    const project = projects.find(p => p.id === projectId);

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const track = professionalAudioMixer.applyReverb(project, req.params.trackId, amount);
    professionalAudioMixer.saveMixProject(project);

    res.json({ success: true, track: track });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Apply delay
 * POST /api/mixer/track/:trackId/delay
 */
router.post('/track/:trackId/delay', (req, res) => {
  try {
    const { projectId, amount, time } = req.body;
    const projects = professionalAudioMixer.getSavedProjects();
    const project = projects.find(p => p.id === projectId);

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const track = professionalAudioMixer.applyDelay(project, req.params.trackId, { amount, time });
    professionalAudioMixer.saveMixProject(project);

    res.json({ success: true, track: track });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Apply fade in
 * POST /api/mixer/track/:trackId/fadein
 */
router.post('/track/:trackId/fadein', (req, res) => {
  try {
    const { projectId, duration } = req.body;
    const projects = professionalAudioMixer.getSavedProjects();
    const project = projects.find(p => p.id === projectId);

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const track = professionalAudioMixer.applyFadeIn(project, req.params.trackId, duration);
    professionalAudioMixer.saveMixProject(project);

    res.json({ success: true, track: track });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Apply fade out
 * POST /api/mixer/track/:trackId/fadeout
 */
router.post('/track/:trackId/fadeout', (req, res) => {
  try {
    const { projectId, duration } = req.body;
    const projects = professionalAudioMixer.getSavedProjects();
    const project = projects.find(p => p.id === projectId);

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const track = professionalAudioMixer.applyFadeOut(project, req.params.trackId, duration);
    professionalAudioMixer.saveMixProject(project);

    res.json({ success: true, track: track });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Apply master compression
 * POST /api/mixer/master/compression
 */
router.post('/master/compression', (req, res) => {
  try {
    const { projectId, ratio, threshold, attack, release } = req.body;
    const projects = professionalAudioMixer.getSavedProjects();
    const project = projects.find(p => p.id === projectId);

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const compression = professionalAudioMixer.applyMasterCompression(project, {
      ratio, threshold, attack, release
    });
    professionalAudioMixer.saveMixProject(project);

    res.json({ success: true, compression: compression });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Apply master EQ
 * POST /api/mixer/master/eq
 */
router.post('/master/eq', (req, res) => {
  try {
    const { projectId, bass, mid, treble, presence } = req.body;
    const projects = professionalAudioMixer.getSavedProjects();
    const project = projects.find(p => p.id === projectId);

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const eq = professionalAudioMixer.applyMasterEQ(project, { bass, mid, treble, presence });
    professionalAudioMixer.saveMixProject(project);

    res.json({ success: true, eq: eq });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Set master gain
 * POST /api/mixer/master/gain
 */
router.post('/master/gain', (req, res) => {
  try {
    const { projectId, gain } = req.body;
    const projects = professionalAudioMixer.getSavedProjects();
    const project = projects.find(p => p.id === projectId);

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const masterGain = professionalAudioMixer.setMasterGain(project, gain);
    professionalAudioMixer.saveMixProject(project);

    res.json({ success: true, masterGain: masterGain });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get EQ presets
 * GET /api/mixer/presets/eq
 */
router.get('/presets/eq', (req, res) => {
  try {
    const presets = professionalAudioMixer.getEQPresets();
    res.json({ success: true, presets: presets });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get compression presets
 * GET /api/mixer/presets/compression
 */
router.get('/presets/compression', (req, res) => {
  try {
    const presets = professionalAudioMixer.getCompressionPresets();
    res.json({ success: true, presets: presets });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get mixing recommendations
 * POST /api/mixer/recommendations
 */
router.post('/recommendations', (req, res) => {
  try {
    const { projectId } = req.body;
    const projects = professionalAudioMixer.getSavedProjects();
    const project = projects.find(p => p.id === projectId);

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const recommendations = professionalAudioMixer.getMixingRecommendations(project);
    res.json({ success: true, recommendations: recommendations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get mix levels
 * POST /api/mixer/levels
 */
router.post('/levels', (req, res) => {
  try {
    const { projectId } = req.body;
    const projects = professionalAudioMixer.getSavedProjects();
    const project = projects.find(p => p.id === projectId);

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const levels = professionalAudioMixer.calculateMixLevels(project);
    res.json({ success: true, levels: levels });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get project
 * GET /api/mixer/project/:projectId
 */
router.get('/project/:projectId', (req, res) => {
  try {
    const project = professionalAudioMixer.getProjectById(req.params.projectId);

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    res.json({ success: true, project: project });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get all projects
 * GET /api/mixer/projects
 */
router.get('/projects', (req, res) => {
  try {
    const projects = professionalAudioMixer.getSavedProjects();
    res.json({ success: true, projects: projects, total: projects.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Delete project
 * DELETE /api/mixer/project/:projectId
 */
router.delete('/project/:projectId', (req, res) => {
  try {
    professionalAudioMixer.deleteProject(req.params.projectId);
    res.json({ success: true, message: 'Project deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Export mix
 * POST /api/mixer/export
 */
router.post('/export', async (req, res) => {
  try {
    const { projectId, format = 'wav' } = req.body;
    const projects = professionalAudioMixer.getSavedProjects();
    const project = projects.find(p => p.id === projectId);

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const exported = await professionalAudioMixer.exportMix(project, format);
    res.json({ success: true, export: exported });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get statistics
 * POST /api/mixer/stats
 */
router.post('/stats', (req, res) => {
  try {
    const { projectId } = req.body;
    const projects = professionalAudioMixer.getSavedProjects();
    const project = projects.find(p => p.id === projectId);

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const stats = professionalAudioMixer.getMixingStats(project);
    res.json({ success: true, stats: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get mixing tutorials
 * GET /api/mixer/tutorials
 */
router.get('/tutorials', (req, res) => {
  try {
    const tutorials = professionalAudioMixer.getMixingTutorials();
    res.json({ success: true, tutorials: tutorials });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
