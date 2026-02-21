import Anthropic from '@anthropic-ai/sdk';

interface ExtractedRecipe {
  name: string;
  description?: string;
  instructions?: string;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  servings?: number;
  ingredients: Array<{
    name: string;
    quantity?: number;
    unit?: string;
  }>;
  confidence: 'high' | 'medium' | 'low';
  rawText: string;
}

export class AIExtractor {
  private client: Anthropic;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set');
    }
    this.client = new Anthropic({ apiKey });
  }

  async extractFromImage(imageBuffer: Buffer, mimeType: string): Promise<ExtractedRecipe> {
    try {
      const base64Image = imageBuffer.toString('base64');

      const message = await this.client.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                  data: base64Image,
                },
              },
              {
                type: 'text',
                text: `Extract recipe information from this image and return it as JSON.

Return a JSON object with this exact structure:
{
  "name": "Recipe name",
  "description": "Brief description if visible",
  "instructions": "Step by step instructions as a single string",
  "prepTimeMinutes": number or null,
  "cookTimeMinutes": number or null,
  "servings": number or null,
  "ingredients": [
    {
      "name": "ingredient name",
      "quantity": number or null,
      "unit": "unit name" or null
    }
  ],
  "confidence": "high" | "medium" | "low",
  "rawText": "All text extracted from the image"
}

Rules:
- If no recipe is visible, return null
- Parse quantities as numbers when possible
- Use common units in Swedish when possible (g, kg, ml, dl, l, msk, tsk, st)
- If text is unclear, include it in rawText
- Set confidence based on image clarity (high = clear printed text, medium = somewhat unclear, low = handwritten or blurry)
- Return ONLY the JSON object, no additional text

IMPORTANT: Make sure all text from the image is captured in the rawText field for user review.`,
              },
            ],
          },
        ],
      });

      const textContent = message.content.find((c) => c.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text response from Claude');
      }

      // Extract JSON from response
      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const extracted = JSON.parse(jsonMatch[0]);

      if (!extracted || extracted === null) {
        throw new Error('No recipe found in image');
      }

      if (!extracted.name) {
        throw new Error('Recipe name not found in image');
      }

      return extracted;
    } catch (error: any) {
      console.error('AI extraction error:', error);
      throw new Error(`Failed to extract recipe with AI: ${error.message}`);
    }
  }
}
