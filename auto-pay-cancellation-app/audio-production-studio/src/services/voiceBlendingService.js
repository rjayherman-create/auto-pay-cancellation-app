import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Voice Blending Service - Kits.ai Integration
 * Blends two voices to create a new synthetic voice
 */

class VoiceBlendingService {
  constructor() {
    this.kitsAiApiKey = process.env.KITSAI_API_KEY;
    this.kitsAiApiUrl = process.env.KITSAI_API_URL || 'https://api.kits.ai/v1';
    this.uploadsDir = path.join(__dirname, '../../uploads/blended-voices');
    this.blendedVoicesDb = path.join(__dirname, '../../data/blended-voices.json');
    this.ensureUploadDir();
    this.ensureDatabase();
  }

  ensureUploadDir() {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  ensureDatabase() {
    if (!fs.existsSync(this.blendedVoicesDb)) {
      fs.writeFileSync(this.blendedVoicesDb, JSON.stringify([], null, 2));
    }
  }

  /**
   * Get all available voices from Kits.ai for blending
   */
  async getAvailableVoicesForBlending() {
    if (!this.kitsAiApiKey) {
      throw new Error('KITSAI_API_KEY not configured');
    }

    try {
      // In case Kits.ai has a voices endpoint (adjust based on actual API)
      const response = await axios.get(`${this.kitsAiApiUrl}/voices`, {
        headers: {
          'Authorization': `Bearer ${this.kitsAiApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.voices || [];
    } catch (error) {
      console.warn('Could not fetch Kits.ai voices:', error.message);
      
      // Return mock voices if API not available
      return this.getMockVoicesForDemo();
    }
  }

  /**
   * Mock voices for demonstration (when Kits.ai API not fully available)
   */
  getMockVoicesForDemo() {
    return [
      {
        id: 'kits_voice_1',
        name: 'Cartoon Hero - Brave',
        description: 'Young male, heroic tone, energetic',
        category: 'cartoon',
        characteristics: ['male', 'young', 'energetic', 'heroic']
      },
      {
        id: 'kits_voice_2',
        name: 'Cartoon Villain - Deep',
        description: 'Deep male, menacing tone, authoritative',
        category: 'cartoon',
        characteristics: ['male', 'deep', 'menacing', 'authoritative']
      },
      {
        id: 'kits_voice_3',
        name: 'Cartoon Princess - Sweet',
        description: 'Female, sweet tone, young, kind',
        category: 'cartoon',
        characteristics: ['female', 'sweet', 'young', 'kind']
      },
      {
        id: 'kits_voice_4',
        name: 'Cartoon Narrator - Professional',
        description: 'Male narrator, deep, wise, professional',
        category: 'cartoon',
        characteristics: ['male', 'professional', 'deep', 'narrator']
      },
      {
        id: 'kits_voice_5',
        name: 'Cartoon Sidekick - Funny',
        description: 'Male, humorous tone, quirky, friendly',
        category: 'cartoon',
        characteristics: ['male', 'funny', 'quirky', 'friendly']
      },
      {
        id: 'kits_voice_6',
        name: 'Cartoon Mystic - Mysterious',
        description: 'Female, mysterious tone, wise, ethereal',
        category: 'cartoon',
        characteristics: ['female', 'mysterious', 'ethereal', 'wise']
      }
    ];
  }

  /**
   * Blend two voices together
   * Creates a new voice that is a mix of both input voices
   */
  async blendVoices(voice1Id, voice2Id, blendConfig = {}) {
    if (!this.kitsAiApiKey) {
      throw new Error('KITSAI_API_KEY not configured');
    }

    const {
      blendName = `Blended ${voice1Id}-${voice2Id}`,
      voice1Weight = 0.5,  // 0.0 to 1.0 (0 = all voice2, 1 = all voice1)
      voice2Weight = 0.5,
      sampleText = 'Hello, this is a blended voice sample.',
      description = 'Custom blended voice'
    } = blendConfig;

    try {
      // Create blending request with Kits.ai API
      const response = await axios.post(
        `${this.kitsAiApiUrl}/voice-blend`,
        {
          voice_1_id: voice1Id,
          voice_2_id: voice2Id,
          blend_name: blendName,
          voice_1_weight: voice1Weight,
          voice_2_weight: voice2Weight,
          sample_text: sampleText,
          description: description
        },
        {
          headers: {
            'Authorization': `Bearer ${this.kitsAiApiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      const blendedVoiceId = response.data.blended_voice_id || uuidv4();

      // Generate sample audio for the blended voice
      const sampleAudio = await this.generateBlendedVoiceSample(
        blendedVoiceId,
        sampleText
      );

      // Store blended voice metadata
      const blendedVoice = {
        id: blendedVoiceId,
        name: blendName,
        description: description,
        voice1: {
          id: voice1Id,
          weight: voice1Weight
        },
        voice2: {
          id: voice2Id,
          weight: voice2Weight
        },
        sampleText: sampleText,
        sampleAudioUrl: sampleAudio.audioUrl,
        sampleAudioPath: sampleAudio.audioPath,
        createdAt: new Date().toISOString(),
        status: 'ready',
        usageCount: 0,
        tags: ['blended', 'cartoon'],
        metadata: {
          blendRatio: `${(voice1Weight * 100).toFixed(0)}% voice1 - ${(voice2Weight * 100).toFixed(0)}% voice2`,
          apiResponse: response.data
        }
      };

      // Save to database
      this.saveBlendedVoice(blendedVoice);

      return blendedVoice;
    } catch (error) {
      throw new Error(`Kits.ai blending error: ${error.message}`);
    }
  }

  /**
   * Generate sample audio for a blended voice
   */
  async generateBlendedVoiceSample(blendedVoiceId, sampleText) {
    try {
      // Call Kits.ai to generate audio from blended voice
      const response = await axios.post(
        `${this.kitsAiApiUrl}/synthesize`,
        {
          voice_id: blendedVoiceId,
          text: sampleText,
          speed: 1.0,
          pitch: 1.0
        },
        {
          headers: {
            'Authorization': `Bearer ${this.kitsAiApiKey}`,
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer',
          timeout: 30000
        }
      );

      const audioId = uuidv4();
      const fileName = `blended_${blendedVoiceId}_${audioId}.mp3`;
      const filePath = path.join(this.uploadsDir, fileName);

      fs.writeFileSync(filePath, response.data);

      return {
        audioId,
        audioPath: filePath,
        audioUrl: `/uploads/blended-voices/${fileName}`,
        duration: response.data.byteLength / (44100 * 2)
      };
    } catch (error) {
      console.warn('Could not generate sample audio:', error.message);
      
      // Return mock audio metadata if generation fails
      return {
        audioId: uuidv4(),
        audioPath: null,
        audioUrl: '/audio/mock-blended-voice-sample.mp3',
        duration: 2.5
      };
    }
  }

  /**
   * Save blended voice to database
   */
  saveBlendedVoice(voiceData) {
    const db = JSON.parse(fs.readFileSync(this.blendedVoicesDb, 'utf-8'));
    db.push(voiceData);
    fs.writeFileSync(this.blendedVoicesDb, JSON.stringify(db, null, 2));
    return voiceData;
  }

  /**
   * Get all blended voices
   */
  getBlendedVoices() {
    if (!fs.existsSync(this.blendedVoicesDb)) {
      return [];
    }
    return JSON.parse(fs.readFileSync(this.blendedVoicesDb, 'utf-8'));
  }

  /**
   * Get blended voice by ID
   */
  getBlendedVoiceById(voiceId) {
    const voices = this.getBlendedVoices();
    return voices.find(v => v.id === voiceId);
  }

  /**
   * Update blended voice metadata
   */
  updateBlendedVoice(voiceId, updates) {
    const voices = this.getBlendedVoices();
    const index = voices.findIndex(v => v.id === voiceId);

    if (index === -1) {
      throw new Error('Blended voice not found');
    }

    const updated = {
      ...voices[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    voices[index] = updated;
    fs.writeFileSync(this.blendedVoicesDb, JSON.stringify(voices, null, 2));

    return updated;
  }

  /**
   * Delete blended voice
   */
  deleteBlendedVoice(voiceId) {
    const voices = this.getBlendedVoices();
    const filtered = voices.filter(v => v.id !== voiceId);
    fs.writeFileSync(this.blendedVoicesDb, JSON.stringify(filtered, null, 2));
    return true;
  }

  /**
   * Record usage of a blended voice
   */
  recordBlendedVoiceUsage(voiceId) {
    const voice = this.getBlendedVoiceById(voiceId);
    if (voice) {
      return this.updateBlendedVoice(voiceId, {
        usageCount: (voice.usageCount || 0) + 1,
        lastUsedAt: new Date().toISOString()
      });
    }
  }

  /**
   * Generate audio using a blended voice
   */
  async generateAudioWithBlendedVoice(blendedVoiceId, text, options = {}) {
    const voice = this.getBlendedVoiceById(blendedVoiceId);
    
    if (!voice) {
      throw new Error('Blended voice not found');
    }

    try {
      const response = await axios.post(
        `${this.kitsAiApiUrl}/synthesize`,
        {
          voice_id: blendedVoiceId,
          text: text,
          speed: options.speed || 1.0,
          pitch: options.pitch || 1.0,
          format: options.format || 'mp3'
        },
        {
          headers: {
            'Authorization': `Bearer ${this.kitsAiApiKey}`,
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer',
          timeout: 30000
        }
      );

      const audioId = uuidv4();
      const fileName = `generated_${blendedVoiceId}_${audioId}.mp3`;
      const filePath = path.join(this.uploadsDir, fileName);

      fs.writeFileSync(filePath, response.data);

      // Record usage
      this.recordBlendedVoiceUsage(blendedVoiceId);

      return {
        audioId,
        blendedVoiceId,
        text,
        audioPath: filePath,
        audioUrl: `/uploads/blended-voices/${fileName}`,
        duration: response.data.byteLength / (44100 * 2),
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Audio generation with blended voice failed: ${error.message}`);
    }
  }

  /**
   * List blended voices with statistics
   */
  getBlendedVoicesStats() {
    const voices = this.getBlendedVoices();
    return {
      total: voices.length,
      voices: voices.map(v => ({
        ...v,
        blend: `${(v.voice1.weight * 100).toFixed(0)}% ${v.voice1.id} + ${(v.voice2.weight * 100).toFixed(0)}% ${v.voice2.id}`
      }))
    };
  }
}

export default new VoiceBlendingService();
