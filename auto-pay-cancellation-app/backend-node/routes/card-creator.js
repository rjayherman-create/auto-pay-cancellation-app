const express = require('express');
const { protect } = require('../middleware/auth');
const { OpenAI } = require('openai');
const axios = require('axios');

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * POST /api/card-creator/generate-text
 * Generate greeting card text (front or inside)
 */
router.post('/generate-text', protect, async (req, res) => {
  try {
    const { prompt, occasion, tone = 'heartfelt', section = 'front', previousContent } = req.body;

    if (!occasion || !tone) {
      return res.status(400).json({ error: 'Occasion and tone are required' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: 'OpenAI API key not configured'
      });
    }

    let systemPrompt = '';
    let userPrompt = '';

    if (section === 'front') {
      systemPrompt = `You are a professional greeting card copywriter. Generate a short, catchy, emotionally resonant greeting card front message.
Occasion: ${occasion}
Tone: ${tone}

Requirements:
- 3-10 words max (short and impactful)
- Emotionally resonant
- Unique and memorable
- Professional quality
- No punctuation at end`;

      userPrompt = previousContent 
        ? `Generate a DIFFERENT front message (not "${previousContent}") for a ${occasion} card with ${tone} tone.`
        : `Generate a front message for a ${occasion} card with ${tone} tone.`;
    } else {
      systemPrompt = `You are a professional greeting card copywriter. Generate a heartfelt inside message for a greeting card.
Occasion: ${occasion}
Tone: ${tone}

Requirements:
- 2-4 sentences
- Sincere and emotional
- Personal and meaningful
- Include warm sentiment
- Professional quality`;

      userPrompt = previousContent
        ? `Generate a DIFFERENT inside message (not "${previousContent}") for a ${occasion} card with ${tone} tone.`
        : `Generate an inside message for a ${occasion} card with ${tone} tone.`;
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.85,
      max_tokens: section === 'front' ? 50 : 150,
    });

    let text = response.choices[0].message.content.trim();
    
    // Clean up formatting
    if (text.startsWith('"') && text.endsWith('"')) {
      text = text.slice(1, -1);
    }

    res.json({
      success: true,
      text,
      section,
      occasion,
      tone,
      tokens: response.usage.total_tokens
    });
  } catch (error) {
    console.error('Error generating text:', error);
    res.status(500).json({
      error: 'Failed to generate text',
      message: error.message
    });
  }
});

/**
 * POST /api/card-creator/generate-image
 * Generate greeting card image using Replicate or local image generation
 */
router.post('/generate-image', protect, async (req, res) => {
  try {
    const { prompt, occasion, style = 'elegant', section = 'front' } = req.body;

    if (!occasion || !style) {
      return res.status(400).json({ error: 'Occasion and style are required' });
    }

    // Build image generation prompt
    let imagePrompt = '';
    
    if (section === 'front') {
      imagePrompt = `A beautiful, professional greeting card front image for ${occasion}. 
        Style: ${style}
        Visual: Elegant, high-quality, suitable for greeting cards
        Colors: Harmonious and warm
        No text on image
        4K quality, professional design
        Greeting card front page style`;
    } else {
      imagePrompt = `A beautiful, subtle background for greeting card inside page for ${occasion}.
        Style: ${style}
        Visual: Soft, complementary to text
        Colors: Harmonious and soothing
        Minimal details to not interfere with text
        Can include decorative elements
        Greeting card inside page style`;
    }

    // Use Replicate API if available, otherwise generate placeholder
    let imageUrl = '';

    if (process.env.REPLICATE_API_TOKEN) {
      // Using Replicate for image generation
      try {
        const replicateResponse = await axios.post(
          'https://api.replicate.com/v1/predictions',
          {
            version: process.env.REPLICATE_MODEL_VERSION || 'stable-diffusion-v1-5',
            input: {
              prompt: imagePrompt,
              negative_prompt: 'text, words, watermark, low quality, blurry',
              num_inference_steps: 30,
              guidance_scale: 7.5,
              width: 512,
              height: 512
            }
          },
          {
            headers: {
              'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (replicateResponse.data.output && replicateResponse.data.output.length > 0) {
          imageUrl = replicateResponse.data.output[0];
        }
      } catch (replicateError) {
        console.error('Replicate API error:', replicateError);
        // Fall through to placeholder
      }
    }

    // If no image URL, use placeholder
    if (!imageUrl) {
      // Generate a data URL placeholder (solid color based on style)
      const colors = {
        'elegant': '#e8dcc8',
        'modern': '#f0f4f8',
        'playful': '#ffe8cc',
        'minimalist': '#ffffff',
        'vintage': '#f5e6d3',
        'artistic': '#f0e6f6'
      };
      const color = colors[style.toLowerCase()] || '#f0f4f8';
      imageUrl = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='512' height='512'%3E%3Crect fill='${encodeURIComponent(color)}' width='512' height='512'/%3E%3Ctext x='50%25' y='50%25' font-size='24' fill='%23999' text-anchor='middle' dominant-baseline='middle'%3E${encodeURIComponent(section === 'front' ? 'Card Front' : 'Card Inside')}%3C/text%3E%3C/svg%3E`;
    }

    res.json({
      success: true,
      imageUrl,
      section,
      occasion,
      style,
      prompt: imagePrompt
    });
  } catch (error) {
    console.error('Error generating image:', error);
    res.status(500).json({
      error: 'Failed to generate image',
      message: error.message
    });
  }
});

/**
 * POST /api/card-creator/generate-element
 * Generate a single element (text or image) for any section
 * Used by IndividualCardCreator component
 */
router.post('/generate-element', protect, async (req, res) => {
  try {
    const { type, section, occasion, tone, style } = req.body;

    if (!type || !section || !occasion) {
      return res.status(400).json({ error: 'Type, section, and occasion are required' });
    }

    if (type === 'text') {
      // Delegate to generate-text endpoint logic
      const systemPrompt = section === 'front'
        ? `Generate a short (3-10 words), catchy greeting card front for ${occasion} in ${tone} tone. No punctuation.`
        : `Generate a heartfelt inside message (2-4 sentences) for ${occasion} in ${tone} tone.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate for ${section} of card.` }
        ],
        temperature: 0.85,
        max_tokens: section === 'front' ? 50 : 150
      });

      const text = response.choices[0].message.content.trim();
      res.json({ success: true, type: 'text', section, text });
    } else if (type === 'image') {
      // Image generation logic
      let imageUrl = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='512' height='512'%3E%3Crect fill='%23f0f4f8' width='512' height='512'/%3E%3C/svg%3E`;
      
      res.json({ success: true, type: 'image', section, imageUrl });
    }
  } catch (error) {
    console.error('Error generating element:', error);
    res.status(500).json({
      error: 'Failed to generate element',
      message: error.message
    });
  }
});

module.exports = router;
