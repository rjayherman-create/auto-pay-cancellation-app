import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Professional Audio Mixer
 * Mix voices, music, and sound effects into polished productions
 */

class ProfessionalAudioMixer {
  constructor() {
    this.uploadsDir = path.join(__dirname, '../../uploads/mixed-audio');
    this.projectsDb = path.join(__dirname, '../../data/mixer-projects.json');
    this.ensureUploadDir();
    this.ensureDatabase();
  }

  ensureUploadDir() {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  ensureDatabase() {
    if (!fs.existsSync(this.projectsDb)) {
      fs.writeFileSync(this.projectsDb, JSON.stringify([], null, 2));
    }
  }

  /**
   * Create a new mixing project
   */
  createMixProject(projectName, settings = {}) {
    const {
      duration = 60,
      sampleRate = 44100,
      bitDepth = 16,
      format = 'wav'
    } = settings;

    const project = {
      id: `mix_${uuidv4().slice(0, 8)}`,
      name: projectName,
      duration: duration,
      sampleRate: sampleRate,
      bitDepth: bitDepth,
      format: format,
      tracks: [],
      masterGain: 1.0,
      masterCompression: {
        enabled: false,
        ratio: 4,
        threshold: -20,
        attack: 0.005,
        release: 0.1
      },
      masterEQ: {
        enabled: false,
        bass: 0,
        mid: 0,
        treble: 0,
        presence: 0
      },
      effects: {
        reverb: { enabled: false, amount: 0.3 },
        delay: { enabled: false, amount: 0.2, time: 0.5 },
        chorus: { enabled: false, amount: 0.5 },
        compression: { enabled: false, ratio: 4 }
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return project;
  }

  /**
   * Add track to mixing project
   */
  addTrack(project, trackData) {
    const {
      type = 'voiceover', // voiceover, music, soundeffect, ambience
      name = `${type} track`,
      audioUrl = '',
      audioPath = '',
      duration = 0,
      volume = 1.0,
      pan = 0, // -1 to 1 (left to right)
      startTime = 0,
      endTime = duration,
      muted = false,
      solo = false
    } = trackData;

    const track = {
      id: `track_${uuidv4().slice(0, 8)}`,
      type: type,
      name: name,
      audioUrl: audioUrl,
      audioPath: audioPath,
      duration: duration,
      volume: volume,
      pan: pan,
      startTime: startTime,
      endTime: endTime,
      muted: muted,
      solo: solo,
      effects: {
        eq: { bass: 0, mid: 0, treble: 0 },
        compression: { enabled: false, ratio: 4, threshold: -20 },
        reverb: { enabled: false, amount: 0 },
        delay: { enabled: false, amount: 0, time: 0.5 },
        fade_in: { enabled: false, duration: 0.5 },
        fade_out: { enabled: false, duration: 0.5 }
      },
      automation: [],
      index: project.tracks.length,
      createdAt: new Date().toISOString()
    };

    project.tracks.push(track);
    return track;
  }

  /**
   * Update track volume
   */
  updateTrackVolume(project, trackId, volume) {
    const track = project.tracks.find(t => t.id === trackId);
    if (track) {
      track.volume = Math.max(0, Math.min(2.0, volume)); // 0 to 2x
      return track;
    }
    throw new Error('Track not found');
  }

  /**
   * Update track pan (stereo position)
   */
  updateTrackPan(project, trackId, pan) {
    const track = project.tracks.find(t => t.id === trackId);
    if (track) {
      track.pan = Math.max(-1, Math.min(1, pan)); // -1 (left) to 1 (right)
      return track;
    }
    throw new Error('Track not found');
  }

  /**
   * Mute/unmute track
   */
  toggleMute(project, trackId, muted) {
    const track = project.tracks.find(t => t.id === trackId);
    if (track) {
      track.muted = muted;
      return track;
    }
    throw new Error('Track not found');
  }

  /**
   * Solo track
   */
  setSolo(project, trackId, solo) {
    // Only one track can be solo at a time
    if (solo) {
      project.tracks.forEach(t => t.solo = false);
    }
    
    const track = project.tracks.find(t => t.id === trackId);
    if (track) {
      track.solo = solo;
      return track;
    }
    throw new Error('Track not found');
  }

  /**
   * Apply EQ to track
   */
  applyTrackEQ(project, trackId, eqSettings) {
    const track = project.tracks.find(t => t.id === trackId);
    if (track) {
      track.effects.eq = {
        bass: Math.max(-12, Math.min(12, eqSettings.bass || 0)),
        mid: Math.max(-12, Math.min(12, eqSettings.mid || 0)),
        treble: Math.max(-12, Math.min(12, eqSettings.treble || 0))
      };
      return track;
    }
    throw new Error('Track not found');
  }

  /**
   * Apply compression to track
   */
  applyCompression(project, trackId, settings) {
    const track = project.tracks.find(t => t.id === trackId);
    if (track) {
      track.effects.compression = {
        enabled: true,
        ratio: settings.ratio || 4,
        threshold: settings.threshold || -20,
        attack: settings.attack || 0.005,
        release: settings.release || 0.1
      };
      return track;
    }
    throw new Error('Track not found');
  }

  /**
   * Apply reverb to track
   */
  applyReverb(project, trackId, amount) {
    const track = project.tracks.find(t => t.id === trackId);
    if (track) {
      track.effects.reverb = {
        enabled: true,
        amount: Math.max(0, Math.min(1, amount))
      };
      return track;
    }
    throw new Error('Track not found');
  }

  /**
   * Apply delay to track
   */
  applyDelay(project, trackId, settings) {
    const track = project.tracks.find(t => t.id === trackId);
    if (track) {
      track.effects.delay = {
        enabled: true,
        amount: Math.max(0, Math.min(1, settings.amount || 0.2)),
        time: Math.max(0.1, Math.min(2, settings.time || 0.5))
      };
      return track;
    }
    throw new Error('Track not found');
  }

  /**
   * Apply fade in to track
   */
  applyFadeIn(project, trackId, duration) {
    const track = project.tracks.find(t => t.id === trackId);
    if (track) {
      track.effects.fade_in = {
        enabled: true,
        duration: Math.max(0.1, Math.min(5, duration))
      };
      return track;
    }
    throw new Error('Track not found');
  }

  /**
   * Apply fade out to track
   */
  applyFadeOut(project, trackId, duration) {
    const track = project.tracks.find(t => t.id === trackId);
    if (track) {
      track.effects.fade_out = {
        enabled: true,
        duration: Math.max(0.1, Math.min(5, duration))
      };
      return track;
    }
    throw new Error('Track not found');
  }

  /**
   * Apply master compression
   */
  applyMasterCompression(project, settings) {
    project.masterCompression = {
      enabled: true,
      ratio: settings.ratio || 4,
      threshold: settings.threshold || -20,
      attack: settings.attack || 0.005,
      release: settings.release || 0.1
    };
    return project.masterCompression;
  }

  /**
   * Apply master EQ
   */
  applyMasterEQ(project, eqSettings) {
    project.masterEQ = {
      enabled: true,
      bass: Math.max(-12, Math.min(12, eqSettings.bass || 0)),
      mid: Math.max(-12, Math.min(12, eqSettings.mid || 0)),
      treble: Math.max(-12, Math.min(12, eqSettings.treble || 0)),
      presence: Math.max(-12, Math.min(12, eqSettings.presence || 0))
    };
    return project.masterEQ;
  }

  /**
   * Set master gain
   */
  setMasterGain(project, gain) {
    project.masterGain = Math.max(0, Math.min(2, gain)); // 0 to 2x
    return project.masterGain;
  }

  /**
   * Get mixing recommendations
   */
  getMixingRecommendations(project) {
    const recommendations = [];
    
    // Check for clipping (volume too high)
    project.tracks.forEach(track => {
      if (track.volume > 1.5) {
        recommendations.push({
          type: 'warning',
          track: track.name,
          message: `Volume is very high (${track.volume.toFixed(1)}x) - may cause clipping`
        });
      }
    });

    // Check for silent tracks
    project.tracks.forEach(track => {
      if (track.volume === 0) {
        recommendations.push({
          type: 'info',
          track: track.name,
          message: 'Track is muted'
        });
      }
    });

    // Check mix balance
    const voiceOverCount = project.tracks.filter(t => t.type === 'voiceover').length;
    const musicCount = project.tracks.filter(t => t.type === 'music').length;
    const sfxCount = project.tracks.filter(t => t.type === 'soundeffect').length;

    if (voiceOverCount === 0) {
      recommendations.push({
        type: 'warning',
        message: 'No voiceover tracks found'
      });
    }

    if (musicCount === 0) {
      recommendations.push({
        type: 'info',
        message: 'Consider adding background music'
      });
    }

    // Check for proper fades
    recommendations.push({
      type: 'tip',
      message: `Apply fade-in/fade-out to ${project.tracks.length} tracks for smooth transitions`
    });

    return recommendations;
  }

  /**
   * Calculate mix levels
   */
  calculateMixLevels(project) {
    const levels = {};
    
    project.tracks.forEach(track => {
      if (!track.muted) {
        const trackLevel = track.volume;
        if (!levels[track.type]) {
          levels[track.type] = [];
        }
        levels[track.type].push({
          name: track.name,
          volume: trackLevel,
          dB: 20 * Math.log10(trackLevel)
        });
      }
    });

    return {
      byType: levels,
      masterGain: project.masterGain,
      masterGainDB: 20 * Math.log10(project.masterGain)
    };
  }

  /**
   * Get EQ presets
   */
  getEQPresets() {
    return {
      'Voiceover': { bass: -2, mid: 2, treble: 1 },
      'Podcast': { bass: -3, mid: 2, treble: 2 },
      'Music_Bright': { bass: 1, mid: 0, treble: 3 },
      'Music_Warm': { bass: 3, mid: 0, treble: -2 },
      'Music_Dark': { bass: 2, mid: -1, treble: -3 },
      'Dialogue_Clear': { bass: -2, mid: 4, treble: 1 },
      'Ambient': { bass: 0, mid: -1, treble: 1 },
      'Bass_Boost': { bass: 6, mid: 0, treble: 0 },
      'Treble_Boost': { bass: 0, mid: 0, treble: 6 },
      'Flat': { bass: 0, mid: 0, treble: 0 }
    };
  }

  /**
   * Get compression presets
   */
  getCompressionPresets() {
    return {
      'Gentle': { ratio: 2, threshold: -20, attack: 0.01, release: 0.1 },
      'Medium': { ratio: 4, threshold: -18, attack: 0.005, release: 0.05 },
      'Heavy': { ratio: 8, threshold: -15, attack: 0.003, release: 0.03 },
      'Limiting': { ratio: 10, threshold: -10, attack: 0.001, release: 0.02 },
      'Vocals': { ratio: 3, threshold: -20, attack: 0.008, release: 0.08 },
      'Drums': { ratio: 6, threshold: -15, attack: 0.002, release: 0.04 },
      'Bass': { ratio: 4, threshold: -20, attack: 0.01, release: 0.1 }
    };
  }

  /**
   * Save mix project
   */
  saveMixProject(project) {
    const db = JSON.parse(fs.readFileSync(this.projectsDb, 'utf-8'));
    
    const existingIndex = db.findIndex(p => p.id === project.id);
    if (existingIndex !== -1) {
      db[existingIndex] = { ...project, updatedAt: new Date().toISOString() };
    } else {
      db.push({ ...project, createdAt: new Date().toISOString() });
    }

    fs.writeFileSync(this.projectsDb, JSON.stringify(db, null, 2));
    return project;
  }

  /**
   * Get saved mix projects
   */
  getSavedProjects() {
    if (!fs.existsSync(this.projectsDb)) {
      return [];
    }
    return JSON.parse(fs.readFileSync(this.projectsDb, 'utf-8'));
  }

  /**
   * Get project by ID
   */
  getProjectById(projectId) {
    const projects = this.getSavedProjects();
    return projects.find(p => p.id === projectId);
  }

  /**
   * Delete project
   */
  deleteProject(projectId) {
    const projects = this.getSavedProjects();
    const filtered = projects.filter(p => p.id !== projectId);
    fs.writeFileSync(this.projectsDb, JSON.stringify(filtered, null, 2));
    return true;
  }

  /**
   * Export mix (create mock export)
   */
  async exportMix(project, format = 'wav') {
    const exportId = uuidv4();
    const fileName = `mix_${exportId}.${format}`;
    const filePath = path.join(this.uploadsDir, fileName);

    // Create mock audio file
    fs.writeFileSync(filePath, Buffer.alloc(1024)); // Mock audio buffer

    return {
      exportId: exportId,
      projectName: project.name,
      fileName: fileName,
      fileUrl: `/uploads/mixed-audio/${fileName}`,
      filePath: filePath,
      format: format,
      duration: project.duration,
      sampleRate: project.sampleRate,
      bitDepth: project.bitDepth,
      trackCount: project.tracks.length,
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * Get mixing statistics
   */
  getMixingStats(project) {
    return {
      projectId: project.id,
      projectName: project.name,
      duration: project.duration,
      totalTracks: project.tracks.length,
      tracksByType: {
        voiceover: project.tracks.filter(t => t.type === 'voiceover').length,
        music: project.tracks.filter(t => t.type === 'music').length,
        soundeffect: project.tracks.filter(t => t.type === 'soundeffect').length,
        ambience: project.tracks.filter(t => t.type === 'ambience').length
      },
      mutedTracks: project.tracks.filter(t => t.muted).length,
      soloTracks: project.tracks.filter(t => t.solo).length,
      averageVolume: (project.tracks.reduce((sum, t) => sum + t.volume, 0) / project.tracks.length).toFixed(2),
      masterGain: project.masterGain,
      effectsEnabled: {
        masterCompression: project.masterCompression.enabled,
        masterEQ: project.masterEQ.enabled,
        trackEffects: project.tracks.filter(t => 
          t.effects.eq.bass !== 0 || 
          t.effects.eq.mid !== 0 || 
          t.effects.eq.treble !== 0
        ).length
      }
    };
  }

  /**
   * Get mixing tutorials
   */
  getMixingTutorials() {
    return {
      'voiceover_mixing': {
        title: 'How to Mix Voiceover',
        steps: [
          'Set voiceover volume to -6dB below other elements',
          'Apply gentle compression (3:1 ratio)',
          'Add slight EQ boost to mids (+2dB around 1-2kHz)',
          'Apply light reverb (20-30ms) for space',
          'Fade in/out for smooth transitions'
        ]
      },
      'music_mixing': {
        title: 'How to Mix Background Music',
        steps: [
          'Set music volume 6-9dB below voiceover',
          'Apply compression for consistency',
          'Use EQ to reduce low-end muddiness',
          'Add subtle reverb for depth',
          'Use automation to duck volume under dialogue'
        ]
      },
      'soundeffect_mixing': {
        title: 'How to Mix Sound Effects',
        steps: [
          'Set SFX volume 3-6dB below music',
          'Pan effects for stereo width',
          'Apply short reverb (10-20ms)',
          'Use compression to control peaks',
          'Add fades to blend with music'
        ]
      },
      'mastering': {
        title: 'Basic Mastering',
        steps: [
          'Apply master compression (4:1 ratio, -20dB threshold)',
          'Use master EQ to balance frequency spectrum',
          'Check levels at -3dB to -6dB on master',
          'A/B test with reference material',
          'Export at 24-bit or higher'
        ]
      }
    };
  }
}

export default new ProfessionalAudioMixer();
