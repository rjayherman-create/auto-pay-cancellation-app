import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Voice Emotion Engine
 * Adds emotional depth to AI-generated voices through prosody and modulation
 */

class VoiceEmotionEngine {
  constructor() {
    this.uploadsDir = path.join(__dirname, '../../uploads/emotional-voices');
    this.emotionsDb = path.join(__dirname, '../../data/emotional-voices.json');
    this.ensureUploadDir();
    this.ensureDatabase();
  }

  ensureUploadDir() {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  ensureDatabase() {
    if (!fs.existsSync(this.emotionsDb)) {
      fs.writeFileSync(this.emotionsDb, JSON.stringify([], null, 2));
    }
  }

  /**
   * Get all available emotions and their characteristics
   */
  getAvailableEmotions() {
    return [
      {
        id: 'happy',
        name: 'Happy/Cheerful',
        description: 'Upbeat, positive, energetic, smiling voice',
        characteristics: {
          pitch: 1.2,
          pitchVariation: 0.15,
          speed: 1.15,
          volume: 1.1,
          breathiness: 0.3,
          resonance: 'bright',
          pauseBefore: 0.05,
          pauseAfter: 0.1,
          energyVariation: 0.2
        },
        voiceModulation: {
          toneColor: 'warm',
          vibrancy: 'high',
          naturalness: 'very natural',
          emphasis: 'on positive words'
        },
        examples: ['That\'s amazing!', 'I\'m so excited!', 'What a wonderful day!']
      },
      {
        id: 'sad',
        name: 'Sad/Melancholic',
        description: 'Slow, lower pitch, somber, emotional voice',
        characteristics: {
          pitch: 0.85,
          pitchVariation: 0.08,
          speed: 0.8,
          volume: 0.85,
          breathiness: 0.5,
          resonance: 'hollow',
          pauseBefore: 0.15,
          pauseAfter: 0.2,
          energyVariation: 0.05
        },
        voiceModulation: {
          toneColor: 'dark',
          vibrancy: 'low',
          naturalness: 'deeply natural',
          emphasis: 'trailing off at ends'
        },
        examples: ['I don\'t know what to do...', 'It\'s all gone now...', 'I miss you so much...']
      },
      {
        id: 'angry',
        name: 'Angry/Frustrated',
        description: 'Intense, forceful, sharp, aggressive voice',
        characteristics: {
          pitch: 0.9,
          pitchVariation: 0.25,
          speed: 1.3,
          volume: 1.4,
          breathiness: 0.1,
          resonance: 'harsh',
          pauseBefore: 0.05,
          pauseAfter: 0.05,
          energyVariation: 0.35
        },
        voiceModulation: {
          toneColor: 'sharp',
          vibrancy: 'intense',
          naturalness: 'raw emotion',
          emphasis: 'on strong words'
        },
        examples: ['That\'s completely unacceptable!', 'How dare you!', 'I\'ve had enough!']
      },
      {
        id: 'surprised',
        name: 'Surprised/Shocked',
        description: 'Sharp intake of breath, high pitch, sudden emphasis',
        characteristics: {
          pitch: 1.35,
          pitchVariation: 0.3,
          speed: 1.4,
          volume: 1.2,
          breathiness: 0.4,
          resonance: 'bright',
          pauseBefore: 0.1,
          pauseAfter: 0.15,
          energyVariation: 0.4
        },
        voiceModulation: {
          toneColor: 'bright',
          vibrancy: 'very high',
          naturalness: 'spontaneous',
          emphasis: 'first word emphasis'
        },
        examples: ['Wait, what?!', 'Oh my goodness!', 'I can\'t believe it!']
      },
      {
        id: 'fearful',
        name: 'Fearful/Nervous',
        description: 'Quiet, shaky, hesitant, worried voice',
        characteristics: {
          pitch: 1.15,
          pitchVariation: 0.2,
          speed: 1.1,
          volume: 0.7,
          breathiness: 0.6,
          resonance: 'thin',
          pauseBefore: 0.2,
          pauseAfter: 0.15,
          energyVariation: 0.25
        },
        voiceModulation: {
          toneColor: 'thin',
          vibrancy: 'low-medium',
          naturalness: 'cautious',
          emphasis: 'questioning tone'
        },
        examples: ['Is it really safe?', 'I\'m not sure about this...', 'What if something goes wrong?']
      },
      {
        id: 'confident',
        name: 'Confident/Assertive',
        description: 'Steady, authoritative, powerful, commanding voice',
        characteristics: {
          pitch: 0.95,
          pitchVariation: 0.1,
          speed: 1.0,
          volume: 1.2,
          breathiness: 0.05,
          resonance: 'full',
          pauseBefore: 0.08,
          pauseAfter: 0.12,
          energyVariation: 0.1
        },
        voiceModulation: {
          toneColor: 'warm-deep',
          vibrancy: 'medium-high',
          naturalness: 'commanding',
          emphasis: 'on key points'
        },
        examples: ['This is absolutely the right decision.', 'I know exactly what to do.', 'Leave it to me.']
      },
      {
        id: 'sarcastic',
        name: 'Sarcastic/Cynical',
        description: 'Dry, witty, mocking, ironic voice',
        characteristics: {
          pitch: 1.05,
          pitchVariation: 0.18,
          speed: 1.05,
          volume: 0.95,
          breathiness: 0.15,
          resonance: 'slightly hollow',
          pauseBefore: 0.1,
          pauseAfter: 0.12,
          energyVariation: 0.22
        },
        voiceModulation: {
          toneColor: 'cool',
          vibrancy: 'medium',
          naturalness: 'deliberately artificial',
          emphasis: 'on the sarcasm'
        },
        examples: ['Oh sure, that makes TOTAL sense.', 'Yeah, because THAT worked so well.', 'Brilliant idea, genius.']
      },
      {
        id: 'romantic',
        name: 'Romantic/Tender',
        description: 'Soft, gentle, loving, intimate voice',
        characteristics: {
          pitch: 1.1,
          pitchVariation: 0.12,
          speed: 0.9,
          volume: 0.8,
          breathiness: 0.25,
          resonance: 'warm',
          pauseBefore: 0.12,
          pauseAfter: 0.15,
          energyVariation: 0.08
        },
        voiceModulation: {
          toneColor: 'warm',
          vibrancy: 'soft',
          naturalness: 'intimate',
          emphasis: 'gentle emphasis'
        },
        examples: ['I\'ve been thinking about you...', 'You mean everything to me.', 'I love you.']
      },
      {
        id: 'playful',
        name: 'Playful/Teasing',
        description: 'Light, bouncy, fun, mischievous voice',
        characteristics: {
          pitch: 1.2,
          pitchVariation: 0.2,
          speed: 1.2,
          volume: 1.0,
          breathiness: 0.2,
          resonance: 'bright',
          pauseBefore: 0.08,
          pauseAfter: 0.1,
          energyVariation: 0.25
        },
        voiceModulation: {
          toneColor: 'bright',
          vibrancy: 'high',
          naturalness: 'playful',
          emphasis: 'comedic timing'
        },
        examples: ['Got you!', 'You\'re so silly!', 'Come chase me!']
      },
      {
        id: 'serious',
        name: 'Serious/Grave',
        description: 'Deep, slow, formal, weighty voice',
        characteristics: {
          pitch: 0.88,
          pitchVariation: 0.08,
          speed: 0.85,
          volume: 1.05,
          breathiness: 0.08,
          resonance: 'deep',
          pauseBefore: 0.15,
          pauseAfter: 0.2,
          energyVariation: 0.08
        },
        voiceModulation: {
          toneColor: 'dark-warm',
          vibrancy: 'low',
          naturalness: 'formal',
          emphasis: 'significant pauses'
        },
        examples: ['This is a serious matter.', 'Listen carefully...', 'This changes everything.']
      },
      {
        id: 'exhausted',
        name: 'Exhausted/Tired',
        description: 'Weak, slow, weary, tired voice',
        characteristics: {
          pitch: 0.92,
          pitchVariation: 0.1,
          speed: 0.75,
          volume: 0.75,
          breathiness: 0.4,
          resonance: 'thin',
          pauseBefore: 0.2,
          pauseAfter: 0.25,
          energyVariation: 0.05
        },
        voiceModulation: {
          toneColor: 'flat',
          vibrancy: 'very low',
          naturalness: 'worn out',
          emphasis: 'minimal energy'
        },
        examples: ['I can\'t do this anymore...', 'I\'m so tired...', 'Just let me rest...']
      },
      {
        id: 'determined',
        name: 'Determined/Resolved',
        description: 'Strong, unwavering, focused, dedicated voice',
        characteristics: {
          pitch: 0.95,
          pitchVariation: 0.12,
          speed: 0.95,
          volume: 1.15,
          breathiness: 0.05,
          resonance: 'full-strong',
          pauseBefore: 0.1,
          pauseAfter: 0.12,
          energyVariation: 0.12
        },
        voiceModulation: {
          toneColor: 'strong',
          vibrancy: 'medium-high',
          naturalness: 'resolute',
          emphasis: 'definitive'
        },
        examples: ['I will not give up.', 'No matter what, I\'ll succeed.', 'This WILL happen.']
      },
      {
        id: 'confused',
        name: 'Confused/Bewildered',
        description: 'Uncertain, questioning, uncertain voice',
        characteristics: {
          pitch: 1.1,
          pitchVariation: 0.22,
          speed: 1.05,
          volume: 0.85,
          breathiness: 0.3,
          resonance: 'uncertain',
          pauseBefore: 0.15,
          pauseAfter: 0.18,
          energyVariation: 0.3
        },
        voiceModulation: {
          toneColor: 'wavering',
          vibrancy: 'medium',
          naturalness: 'uncertain',
          emphasis: 'questioning intonation'
        },
        examples: ['Wait, what just happened?', 'I don\'t understand...', 'How is this possible?']
      },
      {
        id: 'proud',
        name: 'Proud/Boastful',
        description: 'Elevated, superior, triumphant voice',
        characteristics: {
          pitch: 0.98,
          pitchVariation: 0.13,
          speed: 0.95,
          volume: 1.25,
          breathiness: 0.08,
          resonance: 'resonant',
          pauseBefore: 0.1,
          pauseAfter: 0.12,
          energyVariation: 0.15
        },
        voiceModulation: {
          toneColor: 'proud',
          vibrancy: 'high',
          naturalness: 'triumphant',
          emphasis: 'on achievements'
        },
        examples: ['I did it! I\'m incredible!', 'Look what I accomplished!', 'I\'m the best!']
      },
      {
        id: 'sympathetic',
        name: 'Sympathetic/Compassionate',
        description: 'Warm, caring, understanding, empathetic voice',
        characteristics: {
          pitch: 1.05,
          pitchVariation: 0.14,
          speed: 0.92,
          volume: 0.9,
          breathiness: 0.2,
          resonance: 'warm',
          pauseBefore: 0.12,
          pauseAfter: 0.15,
          energyVariation: 0.1
        },
        voiceModulation: {
          toneColor: 'warm-caring',
          vibrancy: 'medium',
          naturalness: 'genuinely caring',
          emphasis: 'gentle concern'
        },
        examples: ['I understand how you feel.', 'Don\'t worry, I\'m here for you.', 'Everything will be okay.']
      }
    ];
  }

  /**
   * Get character emotion profiles (pre-built personas)
   */
  getCharacterProfiles() {
    return [
      {
        id: 'hero',
        name: 'Hero Character',
        description: 'Brave, confident, determined leader',
        defaultEmotions: {
          normal: 'confident',
          victory: 'proud',
          challenge: 'determined',
          moment: 'romantic'
        },
        emotionIntensity: 0.85,
        voicePersonality: 'strong and inspiring'
      },
      {
        id: 'villain',
        name: 'Villain Character',
        description: 'Menacing, confident, dramatic antagonist',
        defaultEmotions: {
          normal: 'confident',
          angry: 'angry',
          gloating: 'proud',
          threat: 'serious'
        },
        emotionIntensity: 1.0,
        voicePersonality: 'powerful and threatening'
      },
      {
        id: 'sidekick',
        name: 'Sidekick/Comic Relief',
        description: 'Playful, energetic, funny companion',
        defaultEmotions: {
          normal: 'playful',
          excited: 'happy',
          scared: 'fearful',
          joke: 'sarcastic'
        },
        emotionIntensity: 0.9,
        voicePersonality: 'light and fun'
      },
      {
        id: 'mentor',
        name: 'Mentor/Wise One',
        description: 'Calm, authoritative, knowledgeable guide',
        defaultEmotions: {
          normal: 'confident',
          teaching: 'serious',
          encouragement: 'sympathetic',
          warning: 'determined'
        },
        emotionIntensity: 0.7,
        voicePersonality: 'calm and authoritative'
      },
      {
        id: 'love_interest',
        name: 'Love Interest',
        description: 'Tender, caring, emotionally connected',
        defaultEmotions: {
          normal: 'romantic',
          concerned: 'sympathetic',
          surprised: 'surprised',
          confession: 'romantic'
        },
        emotionIntensity: 0.8,
        voicePersonality: 'warm and intimate'
      },
      {
        id: 'scared_child',
        name: 'Scared Child',
        description: 'Innocent, fearful, vulnerable young character',
        defaultEmotions: {
          normal: 'fearful',
          scared: 'fearful',
          happy: 'happy',
          crying: 'sad'
        },
        emotionIntensity: 0.95,
        voicePersonality: 'innocent and vulnerable'
      },
      {
        id: 'narrator',
        name: 'Narrator',
        description: 'Clear, engaging, authoritative storyteller',
        defaultEmotions: {
          normal: 'serious',
          dramatic: 'serious',
          lighthearted: 'playful',
          climax: 'determined'
        },
        emotionIntensity: 0.6,
        voicePersonality: 'professional and engaging'
      }
    ];
  }

  /**
   * Apply emotion to voice - creates emotional audio metadata
   */
  async applyEmotionToVoice(emotionId, voiceSettings = {}) {
    const emotion = this.getAvailableEmotions().find(e => e.id === emotionId);
    
    if (!emotion) {
      throw new Error(`Emotion "${emotionId}" not found`);
    }

    const {
      text = emotion.examples[0],
      voiceId = 'Rachel',
      intensity = 1.0,
      blendAmount = 1.0
    } = voiceSettings;

    // Calculate emotional modulation
    const modulation = this.calculateEmotionalModulation(emotion, intensity);

    return {
      id: `emotion_${uuidv4().slice(0, 8)}`,
      emotion: emotionId,
      emotionName: emotion.name,
      text: text,
      voiceId: voiceId,
      intensity: intensity,
      blendAmount: blendAmount,
      modulation: modulation,
      characteristics: emotion.characteristics,
      voiceModulation: emotion.voiceModulation,
      prosody: this.generateProsodyData(emotion, text),
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Calculate emotional modulation parameters
   */
  calculateEmotionalModulation(emotion, intensity) {
    const base = emotion.characteristics;
    
    return {
      pitchShift: (base.pitch - 1.0) * intensity,
      speedFactor: 1.0 + ((base.speed - 1.0) * intensity),
      volumeShift: (base.volume - 1.0) * intensity,
      breathinessLevel: base.breathiness * intensity,
      pauseExtension: intensity,
      energyLevel: base.energyVariation * intensity,
      resonanceType: base.resonance,
      naturalness: intensity > 0.8 ? 'very natural' : 'natural'
    };
  }

  /**
   * Generate prosody data (pitch, timing, emphasis contours)
   */
  generateProsodyData(emotion, text) {
    const words = text.split(' ');
    const wordCount = words.length;
    
    return {
      pitchContour: this.generatePitchContour(emotion, wordCount),
      stressPattern: this.generateStressPattern(emotion, words),
      pauseLocations: this.generatePauseLocations(emotion, text),
      durationModifiers: this.generateDurationModifiers(emotion, words),
      emphasisPoints: this.identifyEmphasisPoints(emotion, words)
    };
  }

  /**
   * Generate pitch contour based on emotion
   */
  generatePitchContour(emotion, wordCount) {
    const contour = [];
    const basePitch = emotion.characteristics.pitch;
    const variation = emotion.characteristics.pitchVariation;

    for (let i = 0; i < wordCount; i++) {
      const position = i / Math.max(1, wordCount - 1);
      let pitch = basePitch;

      // Apply different contours based on emotion
      switch (emotion.id) {
        case 'happy':
          // Ascending pitch contour
          pitch += variation * position * 0.3;
          break;
        case 'sad':
          // Descending pitch contour
          pitch -= variation * position * 0.2;
          break;
        case 'surprised':
          // Peak at beginning
          pitch += variation * (position < 0.5 ? 1 - position : position);
          break;
        case 'serious':
          // Flat with slight drop at end
          pitch -= variation * position * 0.15;
          break;
        default:
          // Natural variation
          pitch += variation * Math.sin(position * Math.PI) * 0.2;
      }

      contour.push({
        wordIndex: i,
        pitch: Math.max(0.5, Math.min(2.0, pitch)),
        strength: Math.abs(Math.sin(position * Math.PI))
      });
    }

    return contour;
  }

  /**
   * Generate stress pattern (word emphasis)
   */
  generateStressPattern(emotion, words) {
    return words.map((word, idx) => {
      let stress = 0.5; // Default medium stress

      // Emphasize content words (longer words)
      if (word.length > 5) stress = 0.7;
      if (word.length > 7) stress = 0.85;

      // First word gets initial emphasis
      if (idx === 0 && ['surprised', 'angry', 'happy'].includes(emotion.id)) {
        stress = 0.9;
      }

      // Last word emphasis for statements
      if (idx === words.length - 1) {
        stress *= 0.9;
      }

      return {
        word: word,
        index: idx,
        stressLevel: stress,
        emphasisType: stress > 0.7 ? 'primary' : 'secondary'
      };
    });
  }

  /**
   * Generate pause locations based on emotion
   */
  generatePauseLocations(emotion, text) {
    const punctuation = ['.', ',', '!', '?', '...'];
    const pauses = [];
    let position = 0;

    for (let char of text) {
      if (punctuation.includes(char)) {
        const pauseDuration = emotion.characteristics.pauseAfter;
        const emotionFactor = emotion.id === 'serious' ? 1.5 : 1.0;
        
        pauses.push({
          position: position,
          duration: pauseDuration * emotionFactor,
          punctuation: char,
          type: char === ',' ? 'short' : 'long'
        });
      }
      position++;
    }

    return pauses;
  }

  /**
   * Generate duration modifiers
   */
  generateDurationModifiers(emotion, words) {
    return words.map((word, idx) => {
      const baseDuration = 1.0;
      const speedFactor = emotion.characteristics.speed;
      const durationFactor = 1.0 / speedFactor; // Inverse of speed

      return {
        word: word,
        index: idx,
        durationMultiplier: durationFactor,
        naturalness: 'high'
      };
    });
  }

  /**
   * Identify emphasis points (words that get extra emphasis)
   */
  identifyEmphasisPoints(emotion, words) {
    const emphasisPoints = [];
    const intensiveEmotions = ['angry', 'surprised', 'determined', 'happy'];
    
    if (intensiveEmotions.includes(emotion.id)) {
      // Emphasize adjectives and verbs
      words.forEach((word, idx) => {
        if (word.length > 5) {
          emphasisPoints.push({
            wordIndex: idx,
            word: word,
            type: 'content-emphasis',
            intensity: 0.8
          });
        }
      });
    }

    return emphasisPoints;
  }

  /**
   * Blend emotions (create gradual emotional transitions)
   */
  blendEmotions(emotion1Id, emotion2Id, blendRatio = 0.5, text = '') {
    const emotions = this.getAvailableEmotions();
    const emotion1 = emotions.find(e => e.id === emotion1Id);
    const emotion2 = emotions.find(e => e.id === emotion2Id);

    if (!emotion1 || !emotion2) {
      throw new Error('One or both emotions not found');
    }

    // Blend characteristics
    const blended = {
      pitch: emotion1.characteristics.pitch * (1 - blendRatio) + 
             emotion2.characteristics.pitch * blendRatio,
      speed: emotion1.characteristics.speed * (1 - blendRatio) + 
             emotion2.characteristics.speed * blendRatio,
      volume: emotion1.characteristics.volume * (1 - blendRatio) + 
              emotion2.characteristics.volume * blendRatio,
      breathiness: emotion1.characteristics.breathiness * (1 - blendRatio) + 
                   emotion2.characteristics.breathiness * blendRatio,
      energyVariation: emotion1.characteristics.energyVariation * (1 - blendRatio) + 
                       emotion2.characteristics.energyVariation * blendRatio
    };

    return {
      id: `blend_${uuidv4().slice(0, 8)}`,
      emotion1: emotion1Id,
      emotion2: emotion2Id,
      blendRatio: blendRatio,
      blendedCharacteristics: blended,
      description: `${(1-blendRatio)*100}% ${emotion1.name} + ${blendRatio*100}% ${emotion2.name}`,
      text: text,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Generate character voice (applies character profile to emotions)
   */
  generateCharacterVoice(characterId, scene = 'normal') {
    const profiles = this.getCharacterProfiles();
    const profile = profiles.find(p => p.id === characterId);

    if (!profile) {
      throw new Error(`Character "${characterId}" not found`);
    }

    const emotionId = profile.defaultEmotions[scene] || profile.defaultEmotions.normal;
    const emotion = this.getAvailableEmotions().find(e => e.id === emotionId);

    return {
      id: `character_${uuidv4().slice(0, 8)}`,
      character: characterId,
      characterName: profile.name,
      scene: scene,
      emotion: emotionId,
      emotionName: emotion.name,
      intensity: profile.emotionIntensity,
      voicePersonality: profile.voicePersonality,
      characteristics: {
        ...emotion.characteristics,
        personalityMod: profile.emotionIntensity
      },
      examples: emotion.examples,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Save emotional voice to database
   */
  saveEmotionalVoice(voiceData) {
    const db = JSON.parse(fs.readFileSync(this.emotionsDb, 'utf-8'));
    
    const saved = {
      ...voiceData,
      id: voiceData.id || `voice_${uuidv4()}`,
      savedAt: new Date().toISOString(),
      usageCount: 0
    };

    db.push(saved);
    fs.writeFileSync(this.emotionsDb, JSON.stringify(db, null, 2));

    return saved;
  }

  /**
   * Get saved emotional voices
   */
  getSavedVoices() {
    if (!fs.existsSync(this.emotionsDb)) {
      return [];
    }
    return JSON.parse(fs.readFileSync(this.emotionsDb, 'utf-8'));
  }

  /**
   * Get emotion presets for quick use
   */
  getEmotionPresets() {
    return {
      'storytelling': [
        { emotion: 'serious', intensity: 0.8, context: 'establishing' },
        { emotion: 'determined', intensity: 0.7, context: 'challenge' },
        { emotion: 'happy', intensity: 0.8, context: 'resolution' }
      ],
      'documentary': [
        { emotion: 'serious', intensity: 0.6, context: 'facts' },
        { emotion: 'sympathetic', intensity: 0.7, context: 'human element' },
        { emotion: 'confident', intensity: 0.7, context: 'conclusions' }
      ],
      'commercial': [
        { emotion: 'happy', intensity: 0.8, context: 'product benefit' },
        { emotion: 'confident', intensity: 0.7, context: 'recommendation' },
        { emotion: 'playful', intensity: 0.6, context: 'call to action' }
      ],
      'horror': [
        { emotion: 'fearful', intensity: 0.8, context: 'setup' },
        { emotion: 'serious', intensity: 0.9, context: 'climax' },
        { emotion: 'determined', intensity: 0.7, context: 'resolution' }
      ],
      'comedy': [
        { emotion: 'playful', intensity: 0.9, context: 'setup' },
        { emotion: 'sarcastic', intensity: 0.8, context: 'punchline' },
        { emotion: 'happy', intensity: 0.7, context: 'payoff' }
      ],
      'romantic': [
        { emotion: 'romantic', intensity: 0.85, context: 'intimacy' },
        { emotion: 'tender', intensity: 0.8, context: 'confession' },
        { emotion: 'determined', intensity: 0.7, context: 'commitment' }
      ]
    };
  }

  /**
   * Get vocal techniques
   */
  getVocalTechniques() {
    return {
      'breathiness': 'Add breathiness to voices for intimacy or weakness',
      'resonance': 'Adjust resonance for depth and character',
      'vibrato': 'Add vibrato for emotion and character',
      'glottalization': 'Creates emphasis and raw emotion',
      'pitch-breaks': 'Emotional instability or surprise',
      'creak': 'Low frequency vocal effect',
      'vocal-fry': 'Raspy, tired, or intense effect',
      'harmonics': 'Rich, full sound (use on vowels)',
      'formant-shift': 'Change voice character without pitch',
      'microphone-proximity': 'Close vs distant intimacy',
      'reverb': 'Add space and emotion',
      'echo': 'Delay for effect or isolation',
      'compression': 'Control dynamic range for consistency',
      'equalization': 'Brighten (happy) or darken (sad)'
    };
  }

  /**
   * Generate emotion analysis
   */
  getEmotionAnalysis() {
    const emotions = this.getAvailableEmotions();
    return emotions.map(e => ({
      emotion: e.id,
      name: e.name,
      pitchRange: `${(e.characteristics.pitch * 0.8).toFixed(2)} - ${(e.characteristics.pitch * 1.2).toFixed(2)}x`,
      speedModifier: `${(e.characteristics.speed * 100).toFixed(0)}%`,
      volumeModifier: `${(e.characteristics.volume * 100).toFixed(0)}%`,
      breathiness: `${(e.characteristics.breathiness * 100).toFixed(0)}%`,
      resonance: e.characteristics.resonance,
      bestFor: e.description
    }));
  }

  /**
   * Record emotional voice usage
   */
  recordUsage(voiceId) {
    const voices = this.getSavedVoices();
    const index = voices.findIndex(v => v.id === voiceId);

    if (index !== -1) {
      voices[index].usageCount = (voices[index].usageCount || 0) + 1;
      voices[index].lastUsedAt = new Date().toISOString();
      fs.writeFileSync(this.emotionsDb, JSON.stringify(voices, null, 2));
    }
  }
}

export default new VoiceEmotionEngine();
