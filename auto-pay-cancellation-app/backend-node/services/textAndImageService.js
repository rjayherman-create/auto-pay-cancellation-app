/**
 * Text and Image Generation Service
 * Handles AI text generation and image generation for cards
 */

// Sample templates for text generation
const occasionTemplates = {
  birthday: {
    front: [
      "Happy Birthday!",
      "Time to celebrate you",
      "Another year, another story",
      "Make a wish!",
      "Your special day",
      "Let's celebrate",
    ],
    inside: [
      "Wishing you a day filled with joy and laughter!",
      "Hope your birthday is as amazing as you are!",
      "Another year older, still looking fabulous!",
      "Celebrate yourself today!",
      "You deserve all the happiness today!",
      "Here's to another year of adventures!",
    ],
  },
  anniversary: {
    front: [
      "Happy Anniversary",
      "Celebrating Us",
      "Years of Love",
      "Our Journey Together",
      "Love Grows Stronger",
      "Forever & Always",
    ],
    inside: [
      "Here's to the love we share and the memories we make!",
      "Grateful for every moment with you.",
      "Our love story keeps getting better.",
      "Thanking you for being my greatest adventure.",
      "To many more years of love and laughter!",
      "You are my greatest blessing.",
    ],
  },
  wedding: {
    front: [
      "Congratulations",
      "Two Hearts, One Love",
      "Just Married",
      "New Adventures Begin",
      "Here Comes the Bride",
      "Happily Ever After",
    ],
    inside: [
      "Wishing you a lifetime of love and happiness!",
      "May your marriage be filled with joy and laughter.",
      "Congratulations on finding your perfect match!",
      "Here's to love, laughter, and ever after.",
      "So happy for you both on this special day!",
      "Welcome to married life - enjoy the journey!",
    ],
  },
  congratulations: {
    front: [
      "Congratulations!",
      "You Did It!",
      "What an Achievement",
      "Success at Last",
      "Well Done!",
      "You're Amazing",
    ],
    inside: [
      "You deserve all the success coming your way!",
      "So proud of you and your accomplishments!",
      "Your hard work paid off - you earned this!",
      "Here's to your well-deserved success!",
      "You inspire us all - keep shining!",
      "This is just the beginning of great things!",
    ],
  },
  sympathy: {
    front: [
      "With Sympathy",
      "Thinking of You",
      "Our Deepest Condolences",
      "In Loving Memory",
      "We Remember",
      "Heartfelt Sympathy",
    ],
    inside: [
      "We're here for you during this difficult time.",
      "Wishing you peace and comfort.",
      "Your loved one will always be remembered.",
      "Sending you love and support.",
      "May cherished memories bring you comfort.",
      "Thinking of you and your family.",
    ],
  },
  get_well: {
    front: [
      "Get Well Soon",
      "Feel Better Soon",
      "Thinking of You",
      "Sending Love & Healing",
      "Get Better Vibes",
      "Speedy Recovery",
    ],
    inside: [
      "Wishing you a quick recovery!",
      "Thinking of you and hoping you feel better soon.",
      "Rest up and take care of yourself!",
      "Sending healing thoughts your way!",
      "Can't wait to see you healthy again!",
      "You've got this - get well soon!",
    ],
  },
  thank_you: {
    front: [
      "Thank You",
      "You're Appreciated",
      "Grateful for You",
      "Thanks a Million",
      "Appreciation",
      "With Gratitude",
    ],
    inside: [
      "Thank you for all you do!",
      "Your kindness means so much to us.",
      "We truly appreciate you!",
      "Thanks for being so special.",
      "You make a real difference.",
      "Can't thank you enough!",
    ],
  },
  holiday: {
    front: [
      "Happy Holidays",
      "Season's Greetings",
      "Holiday Cheer",
      "Festive Wishes",
      "Joy & Celebration",
      "Happy Festivities",
    ],
    inside: [
      "Wishing you a magical holiday season!",
      "May your holidays be filled with joy and warmth!",
      "Here's to celebrations and good cheer!",
      "Wishing you peace and happiness this season!",
      "Happy holidays to you and yours!",
      "Celebrating this special season with you!",
    ],
  },
};

/**
 * Generate text variations for cards based on occasion
 */
async function generateCardText({ occasion_name, count = 4, style = 'classic' }) {
  try {
    const occasionKey = occasion_name?.toLowerCase().replace(/\s+/g, '_');
    const template = occasionTemplates[occasionKey] || occasionTemplates.congratulations;

    const variations = [];
    
    for (let i = 0; i < count; i++) {
      // Randomly select front and inside text
      const frontIndex = Math.floor(Math.random() * template.front.length);
      const insideIndex = Math.floor(Math.random() * template.inside.length);

      variations.push({
        front_text: template.front[frontIndex],
        inside_text: template.inside[insideIndex],
        occasion: occasion_name,
        style,
      });
    }

    return variations;
  } catch (error) {
    console.error('Error generating card text:', error);
    throw new Error('Failed to generate card text variations');
  }
}

/**
 * Generate images for card front and inside
 * This is a placeholder - in production, integrate with:
 * - Stable Diffusion API
 * - DALL-E API
 * - FAL.ai
 * - Midjourney API
 * - Custom LoRA models via RunPod/Lambda
 */
async function generateCardImage({ 
  front_text, 
  inside_text, 
  prompt, 
  style = 'classic', 
  lora_model_id 
}) {
  try {
    // TODO: Implement actual image generation
    // For now, return placeholder URLs that simulate generated images

    // In production:
    // 1. Call AI image generation API (FAL.ai, Replicate, etc)
    // 2. If lora_model_id provided, use the trained LoRA model
    // 3. Save generated images to storage
    // 4. Return URLs to saved images

    const mockImageUrl = `https://via.placeholder.com/1024x1024/8B5CF6/FFFFFF?text=${encodeURIComponent(front_text)}`;

    return {
      front_image_url: mockImageUrl,
      inside_image_url: mockImageUrl,
    };
  } catch (error) {
    console.error('Error generating card image:', error);
    throw new Error('Failed to generate card images');
  }
}

/**
 * Batch generate multiple cards
 */
async function generateBatchCards({ 
  occasion_name, 
  count = 10, 
  style = 'classic',
  lora_model_id 
}) {
  try {
    // Generate text variations
    const textVariations = await generateCardText({ 
      occasion_name, 
      count, 
      style 
    });

    // Generate images for each text variation
    const cards = [];
    for (const textVar of textVariations) {
      const { front_image_url, inside_image_url } = await generateCardImage({
        front_text: textVar.front_text,
        inside_text: textVar.inside_text,
        prompt: `${textVar.front_text} | ${style} style`,
        style,
        lora_model_id,
      });

      cards.push({
        front_text: textVar.front_text,
        inside_text: textVar.inside_text,
        front_image_url,
        inside_image_url,
        occasion: occasion_name,
        style,
        lora_model_id,
      });
    }

    return cards;
  } catch (error) {
    console.error('Error generating batch cards:', error);
    throw new Error('Failed to generate batch cards');
  }
}

module.exports = {
  generateCardText,
  generateCardImage,
  generateBatchCards,
};
