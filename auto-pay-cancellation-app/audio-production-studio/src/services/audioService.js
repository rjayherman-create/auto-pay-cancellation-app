import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Audio Service - Voice Generation & Management
 * Integrates ElevenLabs and Kits.ai
 */

class AudioService {
  constructor() {
    this.elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
    this.kitsAiApiKey = process.env.KITSAI_API_KEY;
    this.uploadsDir = path.join(__dirname, '../../uploads/audio');
    this.ensureUploadDir();
  }

  ensureUploadDir() {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  /**
   * Generate voice with ElevenLabs
   */
  async generateVoiceElevenLabs(text, voiceId = 'Rachel', options = {}) {
    if (!this.elevenLabsApiKey) {
      throw new Error('ELEVENLABS_API_KEY not configured');
    }

    const {
      model_id = 'eleven_monolingual_v1',
      stability = 0.5,
      similarity_boost = 0.75,
      format = 'mp3'
    } = options;

    try {
      const response = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          text,
          model_id,
          voice_settings: {
            stability,
            similarity_boost
          }
        },
        {
          headers: {
            'xi-api-key': this.elevenLabsApiKey,
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer'
        }
      );

      const audioId = uuidv4();
      const fileName = `elevenlabs_${audioId}.${format}`;
      const filePath = path.join(this.uploadsDir, fileName);

      fs.writeFileSync(filePath, response.data);

      return {
        audioId,
        audioPath: filePath,
        audioUrl: `/uploads/audio/${fileName}`,
        service: 'elevenlabs',
        voiceId,
        text,
        duration: response.data.byteLength / (44100 * 2), // Estimate
        metadata: {
          model: model_id,
          stability,
          similarity_boost,
          format
        }
      };
    } catch (error) {
      throw new Error(`ElevenLabs API error: ${error.message}`);
    }
  }

  /**
   * Get available voices from ElevenLabs
   */
  async getElevenLabsVoices() {
    if (!this.elevenLabsApiKey) {
      throw new Error('ELEVENLABS_API_KEY not configured');
    }

    try {
      const response = await axios.get('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'xi-api-key': this.elevenLabsApiKey
        }
      });

      return response.data.voices.map(voice => ({
        id: voice.voice_id,
        name: voice.name,
        category: voice.category,
        description: voice.description,
        labels: voice.labels,
        previewUrl: voice.preview_url
      }));
    } catch (error) {
      throw new Error(`Failed to fetch voices: ${error.message}`);
    }
  }

  /**
   * Create character voice
   */
  createCharacterVoice(characterName, samples, personality = {}) {
    return {
      id: uuidv4(),
      name: characterName,
      samples: samples || [],
      personality: {
        age: personality.age || 'adult',
        gender: personality.gender || 'neutral',
        accent: personality.accent || 'neutral',
        tone: personality.tone || 'friendly',
        speed: personality.speed || 1.0,
        pitch: personality.pitch || 1.0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Generate commercial/promo audio
   */
  async generateCommercial(commercialConfig) {
    const {
      productName,
      tagline,
      callToAction,
      duration = 30,
      voiceId = 'Rachel',
      includeMusic = true,
      musicStyle = 'upbeat'
    } = commercialConfig;

    const script = `${productName}. ${tagline}. ${callToAction}`;

    const voiceover = await this.generateVoiceElevenLabs(script, voiceId, {
      stability: 0.7,
      similarity_boost: 0.8
    });

    return {
      commercialId: uuidv4(),
      productName,
      voiceover,
      script,
      duration,
      voiceoverDuration: voiceover.duration,
      musicStyle: includeMusic ? musicStyle : null,
      status: 'ready_for_mixing',
      createdAt: new Date()
    };
  }

  /**
   * List all audio files
   */
  listAudioFiles() {
    if (!fs.existsSync(this.uploadsDir)) {
      return [];
    }

    return fs.readdirSync(this.uploadsDir)
      .filter(file => /\.(mp3|wav|m4a|ogg)$/.test(file))
      .map(file => ({
        filename: file,
        path: path.join(this.uploadsDir, file),
        url: `/uploads/audio/${file}`,
        size: fs.statSync(path.join(this.uploadsDir, file)).size
      }));
  }

  /**
   * Delete audio file
   */
  deleteAudioFile(filename) {
    const filePath = path.join(this.uploadsDir, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  }
}

export default new AudioService();
