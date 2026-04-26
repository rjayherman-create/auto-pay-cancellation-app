import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Cartoon Sound Effects Generator
 * Creates realistic cartoon sound effects using audio synthesis
 */

class CartoonSoundEffectsService {
  constructor() {
    this.uploadsDir = path.join(__dirname, '../../uploads/sound-effects');
    this.effectsDb = path.join(__dirname, '../../data/cartoon-effects.json');
    this.ensureUploadDir();
    this.ensureDatabase();
  }

  ensureUploadDir() {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  ensureDatabase() {
    if (!fs.existsSync(this.effectsDb)) {
      fs.writeFileSync(this.effectsDb, JSON.stringify([], null, 2));
    }
  }

  /**
   * Get all available sound effect templates
   */
  getAvailableEffects() {
    return [
      // Jump/Movement
      {
        id: 'jump',
        name: 'Jump Sound',
        category: 'movement',
        description: 'Classic cartoon jump sound - whoosh upward',
        duration: 0.4,
        type: 'pitched_whoosh',
        parameters: {
          frequency: 400,
          startFreq: 200,
          endFreq: 800,
          envelope: 'rising'
        }
      },
      {
        id: 'land',
        name: 'Landing Thud',
        category: 'movement',
        description: 'Cartoon character landing sound',
        duration: 0.3,
        type: 'impact',
        parameters: {
          frequency: 150,
          decay: 0.2,
          emphasis: 'thump'
        }
      },
      {
        id: 'run',
        name: 'Running Footsteps',
        category: 'movement',
        description: 'Fast cartoon running sound',
        duration: 0.8,
        type: 'rhythmic',
        parameters: {
          tempo: 8,
          pitch: 200,
          variation: 'high'
        }
      },
      
      // Impact/Collision
      {
        id: 'bonk',
        name: 'Bonk (Head Hit)',
        category: 'impact',
        description: 'Character getting bonked on head',
        duration: 0.35,
        type: 'impact',
        parameters: {
          frequency: 300,
          decay: 0.15,
          emphasis: 'sharp'
        }
      },
      {
        id: 'crash',
        name: 'Crash/Explosion',
        category: 'impact',
        description: 'Cartoon crash or explosion',
        duration: 0.5,
        type: 'noise_burst',
        parameters: {
          intensity: 'high',
          decay: 0.3,
          frequency_range: [100, 2000]
        }
      },
      {
        id: 'zap',
        name: 'Zap/Electric',
        category: 'impact',
        description: 'Electric shock effect',
        duration: 0.25,
        type: 'electronic',
        parameters: {
          frequency: 1200,
          modulation: 'fast',
          decay: 0.1
        }
      },

      // Character Voices/Reactions
      {
        id: 'whoosh',
        name: 'Whoosh',
        category: 'motion',
        description: 'Fast movement or sweep effect',
        duration: 0.3,
        type: 'pitched_whoosh',
        parameters: {
          frequency: 500,
          startFreq: 300,
          endFreq: 1500,
          envelope: 'rising'
        }
      },
      {
        id: 'slide',
        name: 'Slide',
        category: 'motion',
        description: 'Character sliding sound',
        duration: 0.4,
        type: 'pitch_sweep',
        parameters: {
          startFreq: 800,
          endFreq: 200,
          envelope: 'descending'
        }
      },
      {
        id: 'zoom',
        name: 'Zoom',
        category: 'motion',
        description: 'Speed/zoom effect',
        duration: 0.2,
        type: 'pitched_whoosh',
        parameters: {
          frequency: 800,
          intensity: 'high',
          envelope: 'sharp'
        }
      },

      // Reactions
      {
        id: 'boing',
        name: 'Boing Spring',
        category: 'reaction',
        description: 'Spring or bounce sound',
        duration: 0.4,
        type: 'pitched_tone',
        parameters: {
          frequency: 600,
          harmonics: [600, 900, 1200],
          decay: 0.2,
          resonance: 'high'
        }
      },
      {
        id: 'confused',
        name: 'Confused/Dizzy',
        category: 'reaction',
        description: 'Confused or dizzy sound',
        duration: 0.6,
        type: 'frequency_wobble',
        parameters: {
          baseFreq: 300,
          modulation: 'circular',
          wobbleSpeed: 'fast'
        }
      },
      {
        id: 'thought',
        name: 'Thought Bubble',
        category: 'reaction',
        description: 'Thinking or realization sound',
        duration: 0.3,
        type: 'pitched_tone',
        parameters: {
          frequency: 1000,
          harmonics: [1000, 1500],
          envelope: 'gentle_rise'
        }
      },

      // Doors/Objects
      {
        id: 'door_open',
        name: 'Door Open',
        category: 'object',
        description: 'Creaky door opening',
        duration: 0.5,
        type: 'pitch_sweep',
        parameters: {
          startFreq: 200,
          endFreq: 400,
          creak: true,
          decay: 0.3
        }
      },
      {
        id: 'door_close',
        name: 'Door Close',
        category: 'object',
        description: 'Door slamming shut',
        duration: 0.35,
        type: 'impact',
        parameters: {
          frequency: 250,
          decay: 0.2,
          emphasis: 'slam'
        }
      },
      {
        id: 'pop',
        name: 'Pop',
        category: 'object',
        description: 'Cork pop or balloon pop',
        duration: 0.15,
        type: 'impact',
        parameters: {
          frequency: 800,
          decay: 0.05,
          emphasis: 'sharp'
        }
      },
      {
        id: 'squeaky',
        name: 'Squeak',
        category: 'object',
        description: 'Squeaky toy or door hinge',
        duration: 0.3,
        type: 'pitched_tone',
        parameters: {
          frequency: 1500,
          variation: 'wobble',
          intensity: 'medium'
        }
      },

      // Cartoon Reactions
      {
        id: 'gasp',
        name: 'Gasp/Shock',
        category: 'reaction',
        description: 'Character gasping in surprise',
        duration: 0.3,
        type: 'vocal_inspired',
        parameters: {
          breathiness: 0.7,
          pitch: 800,
          shock: true
        }
      },
      {
        id: 'laugh',
        name: 'Cartoonish Laugh',
        category: 'reaction',
        description: 'Silly cartoon laugh',
        duration: 0.6,
        type: 'rhythmic',
        parameters: {
          pattern: 'hehehehe',
          frequency: 400,
          variation: 'high'
        }
      },
      {
        id: 'wail',
        name: 'Sad Wail',
        category: 'reaction',
        description: 'Character crying or wailing',
        duration: 0.8,
        type: 'pitch_sweep',
        parameters: {
          startFreq: 600,
          endFreq: 200,
          wobbly: true
        }
      },

      // Machine Sounds
      {
        id: 'beep',
        name: 'Beep',
        category: 'machine',
        description: 'Electronic beep sound',
        duration: 0.15,
        type: 'pitched_tone',
        parameters: {
          frequency: 1000,
          envelope: 'sharp'
        }
      },
      {
        id: 'boop',
        name: 'Boop',
        category: 'machine',
        description: 'Soft electronic boop',
        duration: 0.2,
        type: 'pitched_tone',
        parameters: {
          frequency: 600,
          envelope: 'soft'
        }
      },
      {
        id: 'mechanical',
        name: 'Mechanical Whirr',
        category: 'machine',
        description: 'Mechanical machinery sound',
        duration: 0.6,
        type: 'frequency_wobble',
        parameters: {
          baseFreq: 400,
          modulation: 'rhythmic',
          clicks: true
        }
      },

      // Nature Sounds
      {
        id: 'chirp',
        name: 'Bird Chirp',
        category: 'nature',
        description: 'Cartoon bird chirping',
        duration: 0.3,
        type: 'pitched_tone',
        parameters: {
          frequency: 2000,
          harmonics: [2000, 2500],
          chirp: true
        }
      },
      {
        id: 'buzz',
        name: 'Buzz/Bee',
        category: 'nature',
        description: 'Buzzing bee or insect',
        duration: 0.4,
        type: 'frequency_wobble',
        parameters: {
          baseFreq: 500,
          modulation: 'fast',
          timbre: 'buzzy'
        }
      },
      {
        id: 'splash',
        name: 'Splash',
        category: 'nature',
        description: 'Water splash sound',
        duration: 0.5,
        type: 'noise_burst',
        parameters: {
          intensity: 'medium',
          frequency_range: [1000, 4000],
          decay: 0.3
        }
      },

      // Magic/Special
      {
        id: 'poof',
        name: 'Poof (Smoke)',
        category: 'magic',
        description: 'Puff of smoke effect',
        duration: 0.4,
        type: 'noise_burst',
        parameters: {
          intensity: 'soft',
          frequency_range: [500, 2000],
          decay: 0.4
        }
      },
      {
        id: 'sparkle',
        name: 'Sparkle/Twinkle',
        category: 'magic',
        description: 'Magical sparkle effect',
        duration: 0.3,
        type: 'pitched_tone',
        parameters: {
          frequency: 3000,
          harmonics: [3000, 3500, 4000],
          shimmery: true
        }
      },
      {
        id: 'transform',
        name: 'Transformation',
        category: 'magic',
        description: 'Magical transformation effect',
        duration: 0.8,
        type: 'pitch_sweep',
        parameters: {
          startFreq: 300,
          endFreq: 1500,
          harmonics: true,
          envelope: 'rising'
        }
      },
      {
        id: 'portal',
        name: 'Portal/Warp',
        category: 'magic',
        description: 'Portal or warp effect',
        duration: 0.6,
        type: 'frequency_wobble',
        parameters: {
          baseFreq: 800,
          modulation: 'descending',
          intensity: 'high'
        }
      }
    ];
  }

  /**
   * Generate a cartoon sound effect
   */
  async generateSoundEffect(effectId, customizations = {}) {
    const availableEffects = this.getAvailableEffects();
    const effect = availableEffects.find(e => e.id === effectId);

    if (!effect) {
      throw new Error(`Sound effect "${effectId}" not found`);
    }

    const {
      duration = effect.duration,
      pitch = 1.0,
      intensity = 1.0,
      reverb = 0.2,
      speed = 1.0
    } = customizations;

    // Generate audio buffer (simulated WAV data)
    const audioData = this.synthesizeEffect(effect, {
      duration: duration / speed,
      pitch,
      intensity,
      reverb
    });

    const effectName = `${effect.id}_${uuidv4().slice(0, 8)}`;
    const fileName = `${effectName}.wav`;
    const filePath = path.join(this.uploadsDir, fileName);

    // Write audio file
    fs.writeFileSync(filePath, audioData);

    return {
      id: effectName,
      effectId: effect.id,
      name: effect.name,
      fileName: fileName,
      filePath: filePath,
      audioUrl: `/uploads/sound-effects/${fileName}`,
      duration: duration,
      pitch,
      intensity,
      reverb,
      speed,
      category: effect.category,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Synthesize effect audio (creates WAV-like data)
   */
  synthesizeEffect(effect, options) {
    const sampleRate = 44100;
    const samples = Math.floor((options.duration || 0.5) * sampleRate);
    const channels = 1; // Mono
    const bytesPerSample = 2;
    const buffer = Buffer.alloc(44 + samples * channels * bytesPerSample);

    // Write WAV header
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        buffer.writeUInt8(string.charCodeAt(i), offset + i);
      }
    };

    writeString(0, 'RIFF');
    buffer.writeUInt32LE(36 + samples * channels * bytesPerSample, 4);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    buffer.writeUInt32LE(16, 16);
    buffer.writeUInt16LE(1, 20); // PCM
    buffer.writeUInt16LE(channels, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(sampleRate * channels * bytesPerSample, 28);
    buffer.writeUInt16LE(channels * bytesPerSample, 32);
    buffer.writeUInt16LE(16, 34);
    writeString(36, 'data');
    buffer.writeUInt32LE(samples * channels * bytesPerSample, 40);

    // Generate waveform based on effect type
    let sampleOffset = 44;
    const params = effect.parameters || {};

    for (let i = 0; i < samples; i++) {
      const t = i / sampleRate;
      const progress = t / (options.duration || 0.5);
      let sample = 0;

      // Envelope (fade in/out)
      let envelope = Math.sin(progress * Math.PI);
      envelope = Math.pow(envelope, 0.5);

      // Generate based on effect type
      switch (effect.type) {
        case 'pitched_tone':
          sample = Math.sin(2 * Math.PI * (params.frequency || 440) * t * options.pitch);
          break;
        case 'pitch_sweep':
          const freq = params.startFreq + (params.endFreq - params.startFreq) * progress;
          sample = Math.sin(2 * Math.PI * freq * t * options.pitch);
          break;
        case 'noise_burst':
          sample = Math.random() * 2 - 1;
          break;
        case 'frequency_wobble':
          const wobble = Math.sin(2 * Math.PI * 4 * t) * 100; // 4Hz wobble
          sample = Math.sin(2 * Math.PI * (params.baseFreq + wobble) * t * options.pitch);
          break;
        case 'impact':
          sample = Math.sin(2 * Math.PI * params.frequency * t * options.pitch);
          envelope *= Math.exp(-5 * progress);
          break;
        case 'rhythmic':
          sample = Math.sin(2 * Math.PI * (params.pitch || 440) * t * options.pitch);
          const rhythm = Math.sin(2 * Math.PI * (params.tempo || 4) * t) > 0 ? 1 : 0;
          sample *= rhythm;
          break;
        default:
          sample = Math.sin(2 * Math.PI * 440 * t);
      }

      // Apply envelope and intensity
      sample *= envelope * options.intensity * 0.8;

      // Clamp to 16-bit range
      sample = Math.max(-1, Math.min(1, sample));
      const int16 = Math.round(sample * 32767);

      buffer.writeInt16LE(int16, sampleOffset);
      sampleOffset += 2;
    }

    return buffer;
  }

  /**
   * Save generated effect to library
   */
  saveEffect(effectData) {
    const db = JSON.parse(fs.readFileSync(this.effectsDb, 'utf-8'));
    
    const savedEffect = {
      id: effectData.id,
      name: effectData.name,
      effectId: effectData.effectId,
      category: effectData.category,
      audioUrl: effectData.audioUrl,
      audioPath: effectData.audioPath,
      filePath: effectData.filePath,
      duration: effectData.duration,
      pitch: effectData.pitch,
      intensity: effectData.intensity,
      reverb: effectData.reverb,
      speed: effectData.speed,
      parameters: effectData.parameters || {},
      createdAt: effectData.createdAt,
      usageCount: 0,
      tags: [effectData.category],
      notes: ''
    };

    db.push(savedEffect);
    fs.writeFileSync(this.effectsDb, JSON.stringify(db, null, 2));
    
    return savedEffect;
  }

  /**
   * Get saved effects library
   */
  getSavedEffects() {
    if (!fs.existsSync(this.effectsDb)) {
      return [];
    }
    return JSON.parse(fs.readFileSync(this.effectsDb, 'utf-8'));
  }

  /**
   * Get saved effect by ID
   */
  getSavedEffect(effectId) {
    const effects = this.getSavedEffects();
    return effects.find(e => e.id === effectId);
  }

  /**
   * Update saved effect
   */
  updateSavedEffect(effectId, updates) {
    const effects = this.getSavedEffects();
    const index = effects.findIndex(e => e.id === effectId);

    if (index === -1) {
      throw new Error('Sound effect not found');
    }

    const updated = {
      ...effects[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    effects[index] = updated;
    fs.writeFileSync(this.effectsDb, JSON.stringify(effects, null, 2));

    return updated;
  }

  /**
   * Delete saved effect
   */
  deleteSavedEffect(effectId) {
    const effects = this.getSavedEffects();
    const effect = effects.find(e => e.id === effectId);

    if (effect && effect.filePath && fs.existsSync(effect.filePath)) {
      fs.unlinkSync(effect.filePath);
    }

    const filtered = effects.filter(e => e.id !== effectId);
    fs.writeFileSync(this.effectsDb, JSON.stringify(filtered, null, 2));

    return true;
  }

  /**
   * Layer multiple effects
   */
  async layerEffects(effectIds, customizations = []) {
    // This would require more complex audio processing
    // For now, return metadata about layered effects
    return {
      id: `layer_${uuidv4()}`,
      effects: effectIds,
      customizations: customizations,
      layerUrl: '/uploads/sound-effects/layered_effect.wav',
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Get effects by category
   */
  getEffectsByCategory(category) {
    const availableEffects = this.getAvailableEffects();
    return availableEffects.filter(e => e.category === category);
  }

  /**
   * Search effects
   */
  searchEffects(query) {
    const availableEffects = this.getAvailableEffects();
    const q = query.toLowerCase();
    return availableEffects.filter(e =>
      e.name.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q)
    );
  }

  /**
   * Get statistics
   */
  getStatistics() {
    const savedEffects = this.getSavedEffects();
    const availableEffects = this.getAvailableEffects();
    const categories = [...new Set(availableEffects.map(e => e.category))];

    return {
      totalAvailable: availableEffects.length,
      totalSaved: savedEffects.length,
      categories: categories,
      categoryCounts: categories.reduce((acc, cat) => {
        acc[cat] = availableEffects.filter(e => e.category === cat).length;
        return acc;
      }, {}),
      mostUsed: savedEffects.sort((a, b) => b.usageCount - a.usageCount).slice(0, 5),
      recentlyCreated: savedEffects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5)
    };
  }

  /**
   * Record effect usage
   */
  recordUsage(effectId) {
    const effect = this.getSavedEffect(effectId);
    if (effect) {
      return this.updateSavedEffect(effectId, {
        usageCount: (effect.usageCount || 0) + 1,
        lastUsedAt: new Date().toISOString()
      });
    }
  }
}

export default new CartoonSoundEffectsService();
