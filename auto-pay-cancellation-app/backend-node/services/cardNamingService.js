/**
 * CardNamingService
 * 
 * Manages unique, sequential card naming for the CardHugs store
 * Format: {occasion}_{sequence:02d}_{side}
 * Example: birthday_01_Front, birthday_01_Inside, birthday_02_Front
 * 
 * Ensures:
 * - No duplicate card names in production
 * - Consistent naming across all occasions
 * - Sequential numbering per occasion
 * - Tracks next available sequence number
 */

const { Card, Occasion } = require('../models');
const { sequelize, Op } = require('sequelize');

class CardNamingService {
  /**
   * Get the next available sequence number for an occasion
   * @param {string} occasionId - UUID of the occasion
   * @returns {Promise<number>} Next sequence number (e.g., 1, 2, 3)
   */
  static async getNextSequenceNumber(occasionId) {
    try {
      const occasion = await Occasion.findByPk(occasionId);
      if (!occasion) {
        throw new Error(`Occasion not found: ${occasionId}`);
      }

      // Find highest existing sequence for this occasion
      const result = await sequelize.query(`
        SELECT MAX(
          CAST(
            SUBSTRING(metadata->>'card_sequence_name', 
              POSITION('_' IN metadata->>'card_sequence_name') + 1,
              2
            ) AS INTEGER
          )
        ) as max_seq
        FROM cards
        WHERE 
          occasion = :occasion
          AND metadata->>'card_sequence_name' IS NOT NULL
          AND status != 'rejected'
      `, {
        replacements: { occasion: occasion.name },
        type: sequelize.QueryTypes.SELECT
      });

      const maxSeq = result[0]?.max_seq || 0;
      return maxSeq + 1;
    } catch (err) {
      console.error('Error getting next sequence number:', err);
      throw err;
    }
  }

  /**
   * Generate card filenames for front and inside
   * @param {string} occasionId - UUID of occasion
   * @param {number} sequenceNumber - Card sequence (will auto-increment if not provided)
   * @returns {Promise<{front: string, inside: string, sequence: number}>}
   */
  static async generateCardNames(occasionId, sequenceNumber = null) {
    try {
      const occasion = await Occasion.findByPk(occasionId);
      if (!occasion) {
        throw new Error(`Occasion not found: ${occasionId}`);
      }

      // Auto-calculate if not provided
      const seq = sequenceNumber || await this.getNextSequenceNumber(occasionId);
      const paddedSeq = String(seq).padStart(2, '0');
      const baseName = `${occasion.name.toLowerCase().replace(/'/g, '').replace(/\s+/g, '_')}_${paddedSeq}`;

      return {
        front: `${baseName}_Front`,
        inside: `${baseName}_Inside`,
        sequence: seq,
        occasion: occasion.name,
      };
    } catch (err) {
      console.error('Error generating card names:', err);
      throw err;
    }
  }

  /**
   * Check if a card name is available (not used in published inventory)
   * @param {string} cardName - Full card name (e.g., "birthday_01_Front")
   * @returns {Promise<boolean>} True if name is available
   */
  static async isNameAvailable(cardName) {
    try {
      const existing = await Card.findOne({
        where: sequelize.where(
          sequelize.fn('json_extract', sequelize.col('metadata'), '$.card_name'),
          Op.eq,
          cardName
        ),
        attributes: ['id']
      });
      return !existing;
    } catch (err) {
      console.error('Error checking name availability:', err);
      throw err;
    }
  }

  /**
   * Get all cards for an occasion with their sequence numbers
   * @param {string} occasionId - UUID of occasion
   * @returns {Promise<Array>} List of cards with sequence info
   */
  static async getOccasionSequences(occasionId) {
    try {
      const occasion = await Occasion.findByPk(occasionId);
      if (!occasion) {
        throw new Error(`Occasion not found: ${occasionId}`);
      }

      const cards = await Card.findAll({
        where: {
          occasion: occasion.name,
          status: { [Op.not]: 'rejected' }
        },
        attributes: ['id', 'occasion', 'status', 'created_at', 'metadata'],
        order: [['created_at', 'ASC']],
        raw: true
      });

      return cards.map(card => ({
        id: card.id,
        occasion: card.occasion,
        status: card.status,
        cardName: card.metadata?.card_name || 'unnamed',
        sequence: card.metadata?.card_sequence_number || 0,
        createdAt: card.created_at,
      }));
    } catch (err) {
      console.error('Error getting occasion sequences:', err);
      throw err;
    }
  }

  /**
   * Rename a card (admin only - for fixing naming errors)
   * @param {string} cardId - UUID of card
   * @param {string} newName - New card name
   * @returns {Promise<Object>} Updated card
   */
  static async renameCard(cardId, newName) {
    try {
      // Validate name format
      if (!this.isValidCardName(newName)) {
        throw new Error(`Invalid card name format. Expected: {occasion}_{seq:02d}_{side}`);
      }

      // Check availability
      const available = await this.isNameAvailable(newName);
      if (!available) {
        throw new Error(`Card name already in use: ${newName}`);
      }

      const card = await Card.findByPk(cardId);
      if (!card) {
        throw new Error(`Card not found: ${cardId}`);
      }

      const metadata = card.metadata || {};
      metadata.card_name = newName;
      metadata.renamed_at = new Date().toISOString();

      await card.update({ metadata });
      return card;
    } catch (err) {
      console.error('Error renaming card:', err);
      throw err;
    }
  }

  /**
   * Validate card name format
   * @param {string} name - Card name to validate
   * @returns {boolean} True if valid format
   */
  static isValidCardName(name) {
    // Format: {occasion}_{seq:02d}_{side}
    // Example: birthday_01_Front
    const regex = /^[a-z_]+_\d{2}_(Front|Inside)$/i;
    return regex.test(name);
  }

  /**
   * Get naming statistics for dashboard
   * @returns {Promise<Object>} Stats on card naming
   */
  static async getNamingStats() {
    try {
      const result = await sequelize.query(`
        SELECT 
          occasion,
          COUNT(*) as total_cards,
          COUNT(CASE WHEN status = 'published' THEN 1 END) as published_cards,
          MAX(
            CAST(
              SUBSTRING(metadata->>'card_sequence_name', 
                POSITION('_' IN metadata->>'card_sequence_name') + 1,
                2
              ) AS INTEGER
            )
          ) as next_sequence
        FROM cards
        WHERE metadata->>'card_sequence_name' IS NOT NULL
        GROUP BY occasion
        ORDER BY occasion
      `, {
        type: sequelize.QueryTypes.SELECT
      });

      return result.map(row => ({
        occasion: row.occasion,
        totalCards: row.total_cards,
        publishedCards: row.published_cards,
        nextSequence: (row.next_sequence || 0) + 1,
      }));
    } catch (err) {
      console.error('Error getting naming stats:', err);
      return [];
    }
  }

  /**
   * Migrate existing cards to new naming scheme (if upgrading)
   * Only renames cards that don't have card_name in metadata
   * @returns {Promise<number>} Number of cards migrated
   */
  static async migrateExistingCards() {
    try {
      const cardsToMigrate = await Card.findAll({
        where: sequelize.where(
          sequelize.fn('json_extract', sequelize.col('metadata'), '$.card_name'),
          Op.is,
          null
        ),
        attributes: ['id', 'occasion', 'metadata'],
        order: [['created_at', 'ASC']],
      });

      let migratedCount = 0;

      for (const card of cardsToMigrate) {
        try {
          const occasionData = await Occasion.findOne({
            where: { name: card.occasion }
          });

          if (!occasionData) continue;

          const existingSeq = await sequelize.query(`
            SELECT COUNT(*) as count
            FROM cards
            WHERE occasion = :occasion AND id != :cardId
          `, {
            replacements: { occasion: card.occasion, cardId: card.id },
            type: sequelize.QueryTypes.SELECT
          });

          const seq = (existingSeq[0]?.count || 0) + 1;
          const names = await this.generateCardNames(occasionData.id, seq);

          card.metadata = card.metadata || {};
          card.metadata.card_name = names.front;
          card.metadata.card_sequence_number = seq;

          await card.save();
          migratedCount++;
        } catch (err) {
          console.error(`Failed to migrate card ${card.id}:`, err);
        }
      }

      console.log(`✅ Migrated ${migratedCount} existing cards to new naming scheme`);
      return migratedCount;
    } catch (err) {
      console.error('Error during card migration:', err);
      throw err;
    }
  }
}

module.exports = CardNamingService;
