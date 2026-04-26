const { OpenAI } = require('openai');
const { Card } = require('../models');
const { Op } = require('sequelize');

class TitleGenerationService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Generate AI-powered card titles with duplicate prevention
   * @param {Object} options - Generation options
   * @param {string} options.occasion - Card occasion
   * @param {string} options.frontText - Front card text
   * @param {string} options.insideText - Inside card text
   * @param {string} options.style - Card style
   * @param {string} options.tone - Card tone
   * @param {number} options.variations - Number of title variations
   * @returns {Promise<Array>} Array of generated titles
   */
  async generateTitles(options) {
    const {
      occasion,
      frontText,
      insideText,
      style = 'general',
      tone = 'heartfelt',
      variations = 5,
      userId
    } = options;

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      // Build context from card content
      const context = `
Occasion: ${occasion}
Style: ${style}
Tone: ${tone}
Front Text: ${frontText || 'N/A'}
Inside Text: ${insideText || 'N/A'}
      `.trim();

      const systemPrompt = `You are a professional greeting card naming expert. Generate creative, unique, and memorable titles for greeting cards.

Guidelines:
- Titles should be concise (2-5 words max)
- Titles should be unique and memorable
- Titles should reflect the card's emotion and occasion
- Avoid generic names
- Each title should be distinct from others

Context: ${context}

Generate ${variations} unique card titles. Return ONLY the titles, one per line, without numbering or extra formatting.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: `Generate ${variations} unique titles for a ${occasion} card with ${tone} tone and ${style} style.`,
          },
        ],
        temperature: 0.9,
        max_tokens: 300,
      });

      const titles = response.choices[0].message.content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .slice(0, variations);

      // Filter out duplicates and existing titles
      const uniqueTitles = await this.filterDuplicates(titles, userId, occasion);

      return {
        titles: uniqueTitles,
        context,
        occasion,
        style,
        tone,
        total_tokens: response.usage.total_tokens,
      };
    } catch (error) {
      console.error('Error generating titles:', error);
      throw new Error(`Failed to generate titles: ${error.message}`);
    }
  }

  /**
   * Filter out duplicate titles from database
   * @param {Array<string>} titles - Titles to check
   * @param {string} userId - User ID for context
   * @param {string} occasion - Occasion name
   * @returns {Promise<Array>} Filtered unique titles
   */
  async filterDuplicates(titles, userId, occasion) {
    try {
      // Get existing titles for this user and occasion
      const existingCards = await Card.findAll({
        where: {
          created_by: userId,
          occasion: {
            [Op.iLike]: `%${occasion}%`
          }
        },
        attributes: ['front_text', 'metadata'],
        raw: true,
      });

      const existingTitles = new Set();
      existingCards.forEach(card => {
        if (card.front_text) existingTitles.add(this.normalizeTitleForComparison(card.front_text));
        if (card.metadata?.card_name) {
          existingTitles.add(this.normalizeTitleForComparison(card.metadata.card_name));
        }
      });

      // Filter to keep only new titles
      const filtered = titles.filter(
        title => !existingTitles.has(this.normalizeTitleForComparison(title))
      );

      return filtered.length > 0 ? filtered : titles.slice(0, 3);
    } catch (error) {
      console.error('Error filtering duplicates:', error);
      return titles; // Return unfiltered if error
    }
  }

  /**
   * Normalize title for duplicate comparison
   * @param {string} title - Title to normalize
   * @returns {string} Normalized title
   */
  normalizeTitleForComparison(title) {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' '); // Normalize whitespace
  }

  /**
   * Check if a title already exists
   * @param {string} title - Title to check
   * @param {string} userId - User ID
   * @param {string} occasion - Occasion
   * @returns {Promise<boolean>} True if title exists
   */
  async titleExists(title, userId, occasion) {
    try {
      const normalized = this.normalizeTitleForComparison(title);

      const existing = await Card.findOne({
        where: {
          created_by: userId,
          occasion: {
            [Op.iLike]: `%${occasion}%`
          }
        },
        attributes: ['front_text', 'metadata'],
        raw: true,
      });

      if (existing) {
        const existingNormalized = this.normalizeTitleForComparison(
          existing.front_text || existing.metadata?.card_name || ''
        );
        return normalized === existingNormalized;
      }

      return false;
    } catch (error) {
      console.error('Error checking title existence:', error);
      return false;
    }
  }

  /**
   * Generate a single best title based on card content
   * @param {Object} options - Generation options
   * @returns {Promise<string>} Single best title
   */
  async generateBestTitle(options) {
    const {
      occasion,
      frontText,
      insideText,
      style = 'general',
      tone = 'heartfelt',
      userId
    } = options;

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const systemPrompt = `You are a professional greeting card naming expert. Generate a single, perfect title for a greeting card.

Guidelines:
- Title should be concise (2-5 words max)
- Title should be unique and memorable
- Title should reflect the card's emotion and occasion
- Avoid generic names
- Be creative and emotional

Return ONLY the title, nothing else.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: `Generate a perfect title for a ${occasion} card with ${tone} tone, ${style} style. Front: "${frontText}". Inside: "${insideText}"`,
          },
        ],
        temperature: 0.8,
        max_tokens: 50,
      });

      let title = response.choices[0].message.content.trim();

      // Remove quotes if present
      if (title.startsWith('"') && title.endsWith('"')) {
        title = title.slice(1, -1);
      }

      // Check if title already exists
      const exists = await this.titleExists(title, userId, occasion);
      if (exists && userId) {
        // Generate alternatives
        const alternatives = await this.generateTitles({
          occasion,
          frontText,
          insideText,
          style,
          tone,
          variations: 3,
          userId
        });
        return alternatives.titles[0] || title;
      }

      return title;
    } catch (error) {
      console.error('Error generating best title:', error);
      throw new Error(`Failed to generate title: ${error.message}`);
    }
  }

  /**
   * Get title statistics for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Title statistics
   */
  async getTitleStats(userId) {
    try {
      const allCards = await Card.findAll({
        where: { created_by: userId },
        attributes: ['front_text', 'occasion', 'metadata'],
        raw: true,
      });

      const titlesByOccasion = {};
      const uniqueTitles = new Set();

      allCards.forEach(card => {
        const occasion = card.occasion || 'Unknown';
        const title = card.front_text || card.metadata?.card_name || 'Untitled';

        if (!titlesByOccasion[occasion]) {
          titlesByOccasion[occasion] = 0;
        }
        titlesByOccasion[occasion]++;
        uniqueTitles.add(this.normalizeTitleForComparison(title));
      });

      return {
        totalCards: allCards.length,
        uniqueTitles: uniqueTitles.size,
        titlesByOccasion,
        duplicateRate: ((allCards.length - uniqueTitles.size) / allCards.length * 100).toFixed(2),
      };
    } catch (error) {
      console.error('Error getting title stats:', error);
      return null;
    }
  }
}

module.exports = new TitleGenerationService();
