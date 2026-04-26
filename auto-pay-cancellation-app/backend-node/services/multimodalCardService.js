let openai = null;

// Initialize OpenAI only if API key is present
if (process.env.OPENAI_API_KEY) {
  const OpenAI = require('openai');
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

let FAL = null;
if (process.env.FAL_KEY) {
  FAL = require('@fal-ai/serverless-client');
  FAL.config({
    credentials: process.env.FAL_KEY,
  });
}

/**
 * Generate a card concept with personalization template
 */
async function generateCardConcept(params) {
  if (!openai) {
    throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.');
  }

  const { occasion, tone, style, loraModel } = params;

  const systemPrompt = `You are a greeting card designer for CardHugs.
Create a cohesive card concept with:
- Front image + front text (main greeting, 8-15 words)
- Inside personalization template with:
  * "Dear ___" field (for recipient name)
  * Personalized message (5-10 words that users can customize)
  * "Love, ___" field (for sender name)
  * Optional signature line`;

  const userPrompt = `Create a greeting card concept for:
- Occasion: ${occasion}
- Tone: ${tone}
- Visual Style: ${style}
${loraModel ? `- Custom Style: Use "${loraModel.trigger_word}" style` : ''}

Return ONLY valid JSON (no markdown, no code blocks):
{
  "concept_title": "Brief title",
  "image_prompt": "Detailed visual description for image generation (60-80 words). Specific about composition, colors, mood, and style.",
  "front_text": "Front greeting (8-15 words)",
  "inside_personalization": {
    "personalized_message": "Short message (5-10 words) that readers can personalize"
  },
  "design_notes": "How the card comes together (1-2 sentences)"
}

Requirements:
- Front text should be a main greeting
- Inside message should be 5-10 words, generic enough for personalization
- Include placeholders for recipient and sender names (users will fill these in)
- Ready for professional printing
- Appropriate for ${occasion}
- Tone should be ${tone}
- Style should be ${style}

Return ONLY the JSON object, nothing else:`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 600,
      temperature: 0.8,
    });

    const responseText = response.choices[0].message.content.trim();
    
    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Response text:', responseText);
      throw new Error('No JSON found in response');
    }

    const concept = JSON.parse(jsonMatch[0]);
    return concept;

  } catch (error) {
    console.error('Error generating concept:', error);
    throw new Error('Failed to generate card concept');
  }
}

/**
 * Generate the actual card image
 */
async function generateCardImage(params) {
  const { prompt, style, loraModel } = params;

  let enhancedPrompt = prompt;
  
  if (loraModel) {
    enhancedPrompt = `${prompt} | ${loraModel.trigger_word} style`;
  }

  try {
    // Try FAL.ai first if available
    if (FAL && process.env.FAL_KEY) {
      console.log('Using FAL.ai for image generation');
      
      try {
        const result = await FAL.run('fal-ai/flux-pro', {
          input: {
            prompt: enhancedPrompt,
            image_size: 'portrait_16_9',
            num_images: 1,
            enable_safety_checker: true,
          }
        });

        if (result.images && result.images.length > 0) {
          return result.images[0].url;
        }
      } catch (falError) {
        console.log('FAL.ai failed, trying DALL-E:', falError.message);
      }
    }

    // Fallback to DALL-E
    if (openai) {
      console.log('Using DALL-E for image generation');
      const image = await openai.images.generate({
        model: 'dall-e-3',
        prompt: enhancedPrompt,
        n: 1,
        size: '1024x1024',
        quality: 'hd',
      });

      return image.data[0].url;
    }

    // No image generation available
    throw new Error('No image generation service configured');

  } catch (error) {
    console.error('Error generating image:', error);
    throw new Error('Failed to generate card image');
  }
}

/**
 * Generate a complete card (concept + image)
 */
async function generateCompleteCard(params) {
  const { occasion, tone, style, loraModel } = params;

  try {
    console.log('Generating card concept...');
    const concept = await generateCardConcept({
      occasion,
      tone,
      style,
      loraModel
    });

    console.log('Generating card image...');
    const imageUrl = await generateCardImage({
      prompt: concept.image_prompt,
      style,
      loraModel
    });

    return {
      front_image_url: imageUrl,
      front_text: concept.front_text,
      inside_message: concept.inside_personalization.personalized_message,
      concept_title: concept.concept_title,
      design_notes: concept.design_notes,
      image_prompt: concept.image_prompt,
      style,
      occasion,
      tone,
    };

  } catch (error) {
    console.error('Error in generateCompleteCard:', error);
    throw error;
  }
}

/**
 * Generate multiple complete cards (batch)
 */
async function generateMultipleCards(params) {
  const { occasion, tone, style, variations = 3, loraModel } = params;

  const cards = [];
  const errors = [];

  console.log(`Generating ${variations} card variations...`);

  for (let i = 0; i < variations; i++) {
    try {
      console.log(`Generating card ${i + 1}/${variations}...`);
      
      const card = await generateCompleteCard({
        occasion,
        tone,
        style,
        loraModel
      });

      cards.push({
        ...card,
        variation_number: i + 1
      });

      // Small delay to avoid rate limiting
      if (i < variations - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

    } catch (error) {
      console.error(`Failed to generate card ${i + 1}:`, error.message);
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
  generateCardConcept,
  generateCardImage,
  generateCompleteCard,
  generateMultipleCards,
};
