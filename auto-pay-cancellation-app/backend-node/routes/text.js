const express = require('express');
const { protect } = require('../middleware/auth');
const { OpenAI } = require('openai');

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// POST generate text variations
router.post('/generate', protect, async (req, res) => {
  try {
    const { prompt, occasion, tone = 'heartfelt', count = 3 } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: 'OpenAI API key not configured',
        message: 'Set OPENAI_API_KEY environment variable',
      });
    }

    const systemPrompt = `You are a professional greeting card copywriter. Generate heartfelt, creative, and personalized greeting card messages.
${occasion ? `Occasion: ${occasion}` : ''}
Tone: ${tone}

Requirements:
- Messages should be 1-3 sentences
- Be sincere and emotional
- Include personalization opportunities
- Avoid clichés
- Make each variation unique`;

    const messages = [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: `Generate ${count} unique greeting card messages for: ${prompt}`,
      },
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      temperature: 0.9,
      max_tokens: 500,
    });

    const textContent = response.choices[0].message.content;
    const variations = textContent
      .split('\n')
      .filter(line => line.trim().length > 0)
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .slice(0, count);

    res.json({
      success: true,
      prompt,
      occasion: occasion || 'general',
      tone,
      variations,
      count: variations.length,
      total_tokens: response.usage.total_tokens,
    });
  } catch (error) {
    console.error('Error generating text:', error);
    res.status(500).json({
      error: 'Failed to generate text',
      message: error.message,
    });
  }
});

// POST generate full card message (front + inside)
router.post('/generate-full', protect, async (req, res) => {
  try {
    const { occasion, tone = 'heartfelt', recipient, theme } = req.body;

    if (!occasion) {
      return res.status(400).json({ error: 'Occasion is required' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: 'OpenAI API key not configured',
        message: 'Set OPENAI_API_KEY environment variable',
      });
    }

    const systemPrompt = `You are a professional greeting card copywriter. Create complete greeting card messages with front and inside text.
Occasion: ${occasion}
Tone: ${tone}
${recipient ? `Recipient: ${recipient}` : ''}
${theme ? `Theme: ${theme}` : ''}

Format your response as:
FRONT: [short catchy message for front]
INSIDE: [longer heartfelt message for inside]`;

    const messages = [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: `Create a complete greeting card message for ${occasion}.`,
      },
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      temperature: 0.8,
      max_tokens: 300,
    });

    const textContent = response.choices[0].message.content;
    const frontMatch = textContent.match(/FRONT:\s*(.+?)(?=INSIDE:|$)/is);
    const insideMatch = textContent.match(/INSIDE:\s*(.+?)$/is);

    const front = frontMatch ? frontMatch[1].trim() : '';
    const inside = insideMatch ? insideMatch[1].trim() : '';

    res.json({
      success: true,
      occasion,
      tone,
      recipient: recipient || null,
      theme: theme || null,
      front_text: front,
      inside_text: inside,
      total_tokens: response.usage.total_tokens,
    });
  } catch (error) {
    console.error('Error generating full card:', error);
    res.status(500).json({
      error: 'Failed to generate card text',
      message: error.message,
    });
  }
});

module.exports = router;
