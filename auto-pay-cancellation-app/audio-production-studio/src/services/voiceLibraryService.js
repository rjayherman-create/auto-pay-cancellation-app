import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Voice Library Service
 * Manages saved voices from ElevenLabs
 * Stores favorite voices for reuse across projects
 */

class VoiceLibraryService {
  constructor() {
    this.dataDir = path.join(__dirname, '../../projects-data');
    this.libraryFile = path.join(this.dataDir, 'voice-library.json');
    this.ensureDataDir();
    this.loadLibrary();
  }

  ensureDataDir() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  loadLibrary() {
    try {
      if (fs.existsSync(this.libraryFile)) {
        const data = fs.readFileSync(this.libraryFile, 'utf8');
        this.library = JSON.parse(data);
      } else {
        this.library = [];
      }
    } catch (error) {
      console.error('Error loading voice library:', error);
      this.library = [];
    }
  }

  saveLibrary() {
    try {
      fs.writeFileSync(this.libraryFile, JSON.stringify(this.library, null, 2), 'utf8');
    } catch (error) {
      console.error('Error saving voice library:', error);
    }
  }

  // ============ VOICE LIBRARY OPERATIONS ============

  /**
   * Add voice to library
   */
  addVoiceToLibrary(voiceData) {
    // Check if voice already in library
    if (this.library.find(v => v.voiceId === voiceData.voiceId)) {
      throw new Error('Voice already in library');
    }

    const savedVoice = {
      id: uuidv4(),
      voiceId: voiceData.voiceId,
      voiceName: voiceData.voiceName,
      category: voiceData.category || 'general',
      description: voiceData.description || '',
      previewUrl: voiceData.previewUrl || null,
      favorite: false,
      tags: voiceData.tags || [],
      notes: voiceData.notes || '',
      stability: voiceData.stability || 0.5,
      similarityBoost: voiceData.similarityBoost || 0.75,
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0,
      lastUsedAt: null
    };

    this.library.push(savedVoice);
    this.saveLibrary();
    return savedVoice;
  }

  /**
   * Get all voices in library
   */
  getAllVoices() {
    return this.library;
  }

  /**
   * Get voice from library
   */
  getVoice(voiceId) {
    return this.library.find(v => v.id === voiceId);
  }

  /**
   * Update voice in library
   */
  updateVoice(voiceId, updates) {
    const voice = this.getVoice(voiceId);
    if (!voice) throw new Error('Voice not found in library');

    const updated = {
      ...voice,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    const index = this.library.findIndex(v => v.id === voiceId);
    this.library[index] = updated;
    this.saveLibrary();
    return updated;
  }

  /**
   * Delete voice from library
   */
  deleteVoice(voiceId) {
    this.library = this.library.filter(v => v.id !== voiceId);
    this.saveLibrary();
    return true;
  }

  /**
   * Toggle favorite status
   */
  toggleFavorite(voiceId) {
    const voice = this.getVoice(voiceId);
    if (!voice) throw new Error('Voice not found');

    return this.updateVoice(voiceId, {
      favorite: !voice.favorite
    });
  }

  /**
   * Record voice usage
   */
  recordUsage(voiceId) {
    const voice = this.getVoice(voiceId);
    if (!voice) throw new Error('Voice not found');

    return this.updateVoice(voiceId, {
      usageCount: (voice.usageCount || 0) + 1,
      lastUsedAt: new Date().toISOString()
    });
  }

  /**
   * Search voices
   */
  searchVoices(query) {
    const q = query.toLowerCase();
    return this.library.filter(v =>
      v.voiceName.toLowerCase().includes(q) ||
      v.category.toLowerCase().includes(q) ||
      v.tags.some(tag => tag.toLowerCase().includes(q)) ||
      v.notes.toLowerCase().includes(q)
    );
  }

  /**
   * Get favorite voices
   */
  getFavoriteVoices() {
    return this.library.filter(v => v.favorite);
  }

  /**
   * Get voices by category
   */
  getVoicesByCategory(category) {
    return this.library.filter(v => v.category === category);
  }

  /**
   * Get recently used voices
   */
  getRecentlyUsed(limit = 10) {
    return this.library
      .filter(v => v.lastUsedAt)
      .sort((a, b) => new Date(b.lastUsedAt) - new Date(a.lastUsedAt))
      .slice(0, limit);
  }

  /**
   * Add tags to voice
   */
  addTag(voiceId, tag) {
    const voice = this.getVoice(voiceId);
    if (!voice) throw new Error('Voice not found');

    if (voice.tags.includes(tag)) {
      throw new Error('Tag already exists');
    }

    return this.updateVoice(voiceId, {
      tags: [...voice.tags, tag]
    });
  }

  /**
   * Remove tag from voice
   */
  removeTag(voiceId, tag) {
    const voice = this.getVoice(voiceId);
    if (!voice) throw new Error('Voice not found');

    return this.updateVoice(voiceId, {
      tags: voice.tags.filter(t => t !== tag)
    });
  }

  /**
   * Get statistics
   */
  getStatistics() {
    return {
      totalVoices: this.library.length,
      favoriteCount: this.library.filter(v => v.favorite).length,
      mostUsed: this.library.reduce((max, v) => 
        (v.usageCount || 0) > (max.usageCount || 0) ? v : max, 
        this.library[0] || null
      ),
      categories: [...new Set(this.library.map(v => v.category))],
      allTags: [...new Set(this.library.flatMap(v => v.tags))]
    };
  }
}

export default new VoiceLibraryService();
