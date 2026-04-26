const OpenAI = require('openai');

let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

/**
 * Generate PREMIUM card concepts with emotional depth and engagement
 * This is the key differentiator - better text = better cards
 */
async function generatePremiumCardConcept(params) {
  if (!openai) {
    throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.');
  }

  const { occasion, tone, style, loraModel, recipientContext } = params;

  const systemPrompt = `You are an ELITE greeting card copywriter and designer with 20+ years of experience.
Your cards are published by major greeting card companies and win industry awards.
Your cards are known for:
- Deeply emotional, memorable messages
- Perfect word choice and flow (reads naturally aloud)
- Specific, vivid imagery in text
- Messages that make people cry happy tears
- Professional design guidance

Create card concepts that are:
- UNIQUE and UNEXPECTED (not generic)
- EMOTIONALLY RESONANT (touches the heart)
- VISUALLY GORGEOUS (paints a picture)
- ENGAGING (makes recipient feel truly seen)
- PREMIUM (luxury greeting card quality)`;

  const userPrompt = `Create a PREMIUM greeting card concept for:
- Occasion: ${occasion}
- Tone: ${tone}
- Visual Style: ${style}
- Recipient Context: ${recipientContext || 'General recipient'}
${loraModel ? `- Custom Design Style: "${loraModel.trigger_word}"` : ''}

You are competing against Hallmark, American Greetings, and luxury artisan card makers.
Your card must be BETTER than what they produce.

Return ONLY valid JSON (no markdown):
{
  "concept_title": "Evocative one-liner that captures the essence",
  "front_text": "Front message (10-20 words). Must be poetic, specific, and emotionally powerful. Should make reader pause and feel something.",
  "image_prompt": "Extremely detailed visual description (100-150 words). Professional photographer/artist brief. Include: composition, lighting, mood, colors, specific objects, style, atmosphere. This goes to DALL-E 3 or professional image generator. MUST evoke emotion visually.",
  "inside_personalization": {
    "personalized_message": "Short closing (5-10 words) that completes the emotional journey. Specific, not generic.",
    "design_suggestions": "Specific design notes: typography style, color palette, material suggestions, finishing touches (embossing, foil, texture)"
  },
  "emotional_impact": "Brief note on why this card will resonate (guides the visual design)",
  "uniqueness_factor": "What makes this different from mass-market cards"
}

CRITICAL REQUIREMENTS:
- Front text must be so good people want to frame it
- Image prompt must result in museum-quality photography/art
- Personalization must feel hand-written, not templated
- Every card should feel like a luxury product (like $8-12 retail card)
- Tone must be AUTHENTIC to ${tone} - no clichés
- Style must be clearly reflected in both text and image guidance
- Make recipient feel understood and valued

Return ONLY the JSON object, no explanation:`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 1200,
      temperature: 0.9, // More creativity
    });

    const responseText = response.choices[0].message.content.trim();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      console.error('Response text:', responseText);
      throw new Error('No JSON found in response');
    }

    const concept = JSON.parse(jsonMatch[0]);
    return concept;

  } catch (error) {
    console.error('Error generating premium concept:', error);
    throw new Error('Failed to generate premium card concept');
  }
}

/**
 * Generate HIGH-QUALITY images using premium prompts
 * Better prompts + better model = better images
 */
async function generatePremiumImage(params) {
  const { prompt, style, designSuggestions, occasion, loraModel } = params;

  // Enhance prompt with professional photography brief
  const enhancedPrompt = buildProfessionalImagePrompt({
    basePrompt: prompt,
    style,
    designSuggestions,
    occasion,
    loraModel
  });

  try {
    if (!openai) {
      throw new Error('OpenAI not configured');
    }

    console.log('Generating PREMIUM image with DALL-E 3...');
    
    // Use DALL-E 3 which has superior image quality
    const image = await openai.images.generate({
      model: 'dall-e-3',
      prompt: enhancedPrompt,
      n: 1,
      size: '1024x1024',
      quality: 'hd',  // HD quality
      style: 'vivid', // More creative/artistic
    });

    return image.data[0].url;

  } catch (error) {
    console.error('Error generating premium image:', error);
    throw new Error('Failed to generate premium image');
  }
}

/**
 * Build professional photography brief from design suggestions
 * This is crucial for image quality
 */
function buildProfessionalImagePrompt(params) {
  const { basePrompt, style, designSuggestions, occasion, loraModel } = params;

  const professionalBrief = `
Professional greeting card photography/artwork brief:

${basePrompt}

DESIGN REQUIREMENTS:
${designSuggestions || `
- Premium aesthetic suited for luxury cards
- Professional composition and framing
- Soft, flattering lighting
- Warm color palette that feels upscale
`}

QUALITY STANDARDS:
- Magazine-quality photography
- Professional color grading
- Sophisticated composition
- Emotional resonance through visual storytelling
- Suitable for high-end retail greeting card market

OCCASION CONTEXT: ${occasion}
VISUAL STYLE: ${style}
${loraModel ? `CUSTOM STYLE GUIDANCE: Apply "${loraModel.trigger_word}" artistic influence` : ''}

MUST BE: Unique, memorable, premium, emotionally engaging
MUST AVOID: Clichés, generic stock photo look, cheap appearance
`;

  return professionalBrief;
}

/**
 * Generate a complete PREMIUM card
 */
async function generatePremiumCard(params) {
  const { occasion, tone, style, loraModel, recipientContext } = params;

  try {
    console.log('Generating PREMIUM card concept...');
    const concept = await generatePremiumCardConcept({
      occasion,
      tone,
      style,
      loraModel,
      recipientContext
    });

    console.log('Generating PREMIUM image...');
    const imageUrl = await generatePremiumImage({
      prompt: concept.image_prompt,
      style,
      designSuggestions: concept.inside_personalization.design_suggestions,
      occasion,
      loraModel
    });

    return {
      front_image_url: imageUrl,
      front_text: concept.front_text,
      inside_message: concept.inside_personalization.personalized_message,
      concept_title: concept.concept_title,
      emotional_impact: concept.emotional_impact,
      uniqueness_factor: concept.uniqueness_factor,
      design_suggestions: concept.inside_personalization.design_suggestions,
      image_prompt: concept.image_prompt,
      style,
      occasion,
      tone,
    };

  } catch (error) {
    console.error('Error generating premium card:', error);
    throw error;
  }
}

/**
 * Generate multiple PREMIUM cards
 */
async function generateMultiplePremiumCards(params) {
  const { occasion, tone, style, variations = 3, loraModel, recipientContext } = params;

  const cards = [];
  const errors = [];

  console.log(`Generating ${variations} PREMIUM card variations...`);

  for (let i = 0; i < variations; i++) {
    try {
      console.log(`Generating PREMIUM card ${i + 1}/${variations}...`);
      
      const card = await generatePremiumCard({
        occasion,
        tone,
        style,
        loraModel,
        recipientContext: recipientContext || `Card ${i + 1} variant`
      });

      cards.push({
        ...card,
        variation_number: i + 1
      });

      // Longer delay for API limits
      if (i < variations - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

    } catch (error) {
      console.error(`Failed to generate premium card ${i + 1}:`, error.message);
      errors.push({
        variation: i + 1,
        error: error.message
      });
    }
  }

  return {
    cards,
    errors,
    successful: cards.length,
    total: variations,
  };
}

module.exports = {
  generatePremiumCardConcept,
  generatePremiumImage,
  generatePremiumCard,
  generateMultiplePremiumCards,
};
