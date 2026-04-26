const { OpenAI } = require('openai');
const { Occasion } = require('../models');

// Initialize OpenAI if key is available
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

/**
 * Generate card text variations
 * POST /api/text-generation/generate
 */
async function generateCardText(req, res) {
  try {
    const {
      occasion,
      tone = 'heartfelt',
      audience,
      style_name,
      quantity = 1,
      custom_prompt
    } = req.body;

    // Validate required fields
    if (!occasion || !tone || !audience) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: occasion, tone, audience'
      });
    }

    // Validate quantity
    const qty = Math.min(Math.max(parseInt(quantity) || 1, 1), 20);

    let generatedTexts = [];

    if (openai) {
      generatedTexts = await generateWithOpenAI({
        occasion,
        tone,
        audience,
        style_name,
        quantity: qty,
        custom_prompt
      });
    } else {
      console.log('⚠️  No OPENAI_API_KEY found, using mock data');
      generatedTexts = generateMockText({
        occasion,
        tone,
        audience,
        quantity: qty
      });
    }

    res.json({
      success: true,
      data: {
        texts: generatedTexts,
        occasion,
        tone,
        audience,
        count: generatedTexts.length,
        quality: openai ? 'premium' : 'mock'
      }
    });
  } catch (error) {
    console.error('Error generating text:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate card text',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Generate batch of cards for multiple styles
 * POST /api/text-generation/batch
 */
async function generateBatchText(req, res) {
  try {
    const {
      occasion,
      tone,
      audience,
      styles,
      cards_per_style = 10
    } = req.body;

    if (!occasion || !tone || !audience || !styles || !Array.isArray(styles)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: occasion, tone, audience, styles (array)'
      });
    }

    const cardsPerStyle = Math.min(Math.max(parseInt(cards_per_style) || 10, 1), 20);
    const totalCards = styles.length * cardsPerStyle;
    const allTexts = [];

    for (const style of styles) {
      let styleTexts = [];

      if (openai) {
        styleTexts = await generateWithOpenAI({
          occasion,
          tone,
          audience,
          style_name: style.style_name || style,
          quantity: cardsPerStyle
        });
      } else {
        styleTexts = generateMockText({
          occasion,
          tone,
          audience,
          quantity: cardsPerStyle
        });
      }

      allTexts.push(...styleTexts);

      // Small delay between style generations to avoid rate limiting
      if (styles.indexOf(style) < styles.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    res.json({
      success: true,
      data: {
        texts: allTexts,
        total_cards: totalCards,
        styles_count: styles.length,
        cards_per_style: cardsPerStyle,
        quality: openai ? 'premium' : 'mock'
      }
    });
  } catch (error) {
    console.error('Error generating batch text:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate batch text',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Refine existing card text
 * POST /api/text-generation/refine
 */
async function refineCardText(req, res) {
  try {
    const {
      current_headline,
      current_message,
      refinement_request,
      tone = 'heartfelt'
    } = req.body;

    if (!current_headline || !current_message || !refinement_request) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: current_headline, current_message, refinement_request'
      });
    }

    if (!openai) {
      return res.status(503).json({
        success: false,
        error: 'Text refinement requires OpenAI API key',
        hint: 'Set OPENAI_API_KEY environment variable'
      });
    }

    const systemPrompt = `You are an expert greeting card editor. Your job is to refine card messages while keeping the original intent and emotion intact.

Requirements:
1. Keep the message authentic and sincere
2. Maintain the original tone and feel
3. Make it more concise if requested
4. Enhance emotional impact
5. Fix any grammatical issues`;

    const userPrompt = `Current card:
Front Headline: "${current_headline}"
Inside Message: "${current_message}"

Refinement Request: ${refinement_request}
Tone: ${tone}

Please provide ONE refined version with:
- refined_headline: The improved front headline (keep it concise, 2-8 words)
- refined_message: The improved inside message (2-4 sentences, maintain emotion)
- explanation: Brief note on what was improved

Format as JSON with these exact keys.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const refinedContent = response.choices[0].message.content;
    const parsed = parseRefinedResponse(refinedContent);

    res.json({
      success: true,
      data: parsed
    });
  } catch (error) {
    console.error('Error refining text:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refine text',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Get text generation examples for an occasion
 * GET /api/text-generation/examples
 */
async function getExamples(req, res) {
  try {
    const { occasion, tone } = req.query;
    const examples = getMockTemplates(
      (occasion as string) || 'birthday',
      (tone as string) || 'heartfelt'
    );

    res.json({
      success: true,
      data: {
        examples,
        occasion: occasion || 'birthday',
        tone: tone || 'heartfelt',
        count: examples.length
      }
    });
  } catch (error) {
    console.error('Error getting examples:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get examples'
    });
  }
}

/**
 * Internal: Generate text using OpenAI
 */
async function generateWithOpenAI(params) {
  const {
    occasion,
    tone,
    audience,
    style_name,
    quantity = 1,
    custom_prompt
  } = params;

  const systemPrompt = `You are an expert greeting card copywriter. Generate heartfelt, genuine, and original greeting card messages.

RULES:
1. NO copyrighted content or trademarked phrases
2. NO celebrity names or branded character references
3. Keep it original and sincere
4. Front headline: Short, impactful (2-8 words)
5. Inside message: Meaningful, 2-4 sentences (20-60 words)
6. Match the tone: ${tone}
7. Appropriate for: ${audience}
${style_name ? `8. Complement visual style: ${style_name}` : ''}

Generate ${quantity} UNIQUE variations. Each variation should be distinctly different.`;

  const userPrompt = custom_prompt || `Create ${quantity} unique greeting card messages for:

Occasion: ${occasion}
Tone: ${tone}
Audience: ${audience}
${style_name ? `Visual Style: ${style_name}` : ''}

For each card, provide BOTH:
- front_headline: A short, powerful headline (2-8 words)
- inside_message: The main message (2-4 sentences, heartfelt and genuine)

Make each variation distinctly different from the others. Be creative and original. Do NOT repeat content.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.9,
      max_tokens: 2000
    });

    const generatedContent = response.choices[0].message.content;
    const parsed = parseOpenAIResponse(generatedContent, quantity);

    return parsed;
  } catch (error) {
    console.error('OpenAI API error:', error);
    // Fallback to mock data
    return generateMockText({ occasion, tone, audience, quantity });
  }
}

/**
 * Parse OpenAI response into structured card data
 */
function parseOpenAIResponse(content, quantity) {
  const results = [];

  // Try to extract JSON if it's structured that way
  const jsonMatch = content.match(/\{[\s\S]*\}/g);
  if (jsonMatch) {
    for (const jsonStr of jsonMatch) {
      try {
        const parsed = JSON.parse(jsonStr);
        if (parsed.front_headline && parsed.inside_message) {
          results.push({
            front_headline: parsed.front_headline,
            inside_message: parsed.inside_message,
            variation_id: results.length + 1
          });
        }
      } catch (e) {
        // Skip invalid JSON
      }
    }
  }

  // If no JSON found, parse by card sections
  if (results.length === 0) {
    const cardSections = content.split(/(?:Card|Variation)\s*\d+:/i).filter(s => s.trim());

    for (const section of cardSections) {
      if (results.length >= quantity) break;

      const headlineMatch = section.match(/(?:front_?headline|headline)[\s:]*["']?(.+?)["']?(?:\n|inside_message|$)/i);
      const messageMatch = section.match(/(?:inside_?message|message)[\s:]*["']?(.+?)["']?\s*$/is);

      if (headlineMatch?.[1] && messageMatch?.[1]) {
        results.push({
          front_headline: headlineMatch[1].trim().replace(/^["'\*\-\•]\s*/, ''),
          inside_message: messageMatch[1].trim().replace(/^["'\*\-\•]\s*/, ''),
          variation_id: results.length + 1
        });
      }
    }
  }

  // Fallback: split by newlines if still empty
  if (results.length === 0) {
    const lines = content.split('\n').filter(l => l.trim());
    for (let i = 0; i < lines.length - 1 && results.length < quantity; i += 2) {
      const line1 = lines[i].replace(/^[\d\.\-\*•]\s*/, '').trim();
      const line2 = lines[i + 1].replace(/^[\d\.\-\*•]\s*/, '').trim();

      if (line1.length > 2 && line2.length > 10) {
        results.push({
          front_headline: line1,
          inside_message: line2,
          variation_id: results.length + 1
        });
      }
    }
  }

  // Fill with defaults if needed
  while (results.length < quantity) {
    results.push({
      front_headline: 'A Special Message',
      inside_message: 'Wishing you all the happiness and joy this special occasion deserves.',
      variation_id: results.length + 1
    });
  }

  return results.slice(0, quantity);
}

/**
 * Parse refined response from OpenAI
 */
function parseRefinedResponse(content) {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    // Continue to fallback
  }

  // Fallback parsing
  return {
    refined_headline: 'Refined Headline',
    refined_message: 'Refined message content',
    explanation: 'Parsing from text format'
  };
}

/**
 * Generate mock text (fallback when no OpenAI key)
 */
function generateMockText(params) {
  const { occasion, tone, audience, quantity } = params;
  const templates = getMockTemplates(occasion, tone);
  const results = [];

  for (let i = 0; i < quantity; i++) {
    const template = templates[i % templates.length];
    results.push({
      ...template,
      variation_id: i + 1
    });
  }

  return results;
}

/**
 * Get mock templates for occasions
 */
function getMockTemplates(occasion, tone) {
  const occasionLower = (occasion || '').toLowerCase();

  // Mother's Day templates
  if (occasionLower.includes('mother')) {
    if (tone === 'funny') {
      return [
        {
          front_headline: 'Mom, Thanks for Not Selling Me',
          inside_message: 'I know there were some rough years, but you kept me anyway. Your patience deserves an award. Happy Mother\'s Day!'
        },
        {
          front_headline: 'You\'re My Favorite Person',
          inside_message: 'Even when I didn\'t listen, you were always right. Thanks for everything, Mom. Love you!'
        }
      ];
    } else if (tone === 'formal') {
      return [
        {
          front_headline: 'To a Remarkable Woman',
          inside_message: 'Your grace, wisdom, and strength have inspired me throughout my life. With deepest gratitude and respect.'
        }
      ];
    } else {
      // heartfelt
      return [
        {
          front_headline: 'To the Woman Who Gave Me Everything',
          inside_message: 'Thank you for your endless love, your gentle wisdom, and the countless ways you\'ve shaped who I am. You\'re not just my mother—you\'re my hero.'
        },
        {
          front_headline: 'Mom, You\'re My Whole Heart',
          inside_message: 'Every laugh we\'ve shared, every lesson you\'ve taught me, every hug that made everything better—these are the moments that define my life.'
        }
      ];
    }
  }

  // Birthday templates
  if (occasionLower.includes('birthday')) {
    if (tone === 'funny') {
      return [
        {
          front_headline: 'You\'re Not Getting Older...',
          inside_message: 'You\'re just becoming a classic! Like fine wine, vintage cars, and those jeans you refuse to throw away. Happy Birthday!'
        },
        {
          front_headline: 'Another Year Older',
          inside_message: 'But don\'t worry, you still look younger than you are. Happy Birthday to someone who\'s aging like fine wine!'
        }
      ];
    } else if (tone === 'formal') {
      return [
        {
          front_headline: 'Celebrating You Today',
          inside_message: 'On your special day, we celebrate the remarkable person you are. Wishing you joy, health, and happiness.'
        }
      ];
    } else {
      // heartfelt
      return [
        {
          front_headline: 'Celebrating You Today',
          inside_message: 'Wishing you a birthday filled with love, laughter, and all the joy you bring to everyone around you. You deserve the very best.'
        },
        {
          front_headline: 'Happy Birthday to Someone Special',
          inside_message: 'Your kindness, your laugh, your presence—these are the gifts that make the world brighter. Have a wonderful day!'
        }
      ];
    }
  }

  // Default templates
  return [
    {
      front_headline: 'Thinking of You',
      inside_message: 'Sending warm wishes and heartfelt thoughts your way. You mean more to me than words can express.'
    },
    {
      front_headline: 'Just Because',
      inside_message: 'Sometimes you just need to know that someone is thinking about you and wishing you well.'
    }
  ];
}

module.exports = {
  generateCardText,
  generateBatchText,
  refineCardText,
  getExamples
};
