interface ParsedRecipe {
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

export class RecipeParser {
  parseRecipeText(text: string): ParsedRecipe {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    // Extract recipe name (usually first line or largest heading)
    const name = this.extractRecipeName(lines);

    // Extract ingredients section
    const ingredients = this.extractIngredients(text, lines);

    // Extract instructions
    const instructions = this.extractInstructions(text, lines);

    // Extract timing info
    const prepTimeMinutes = this.extractTime(text, /prep(?:aration)?\s*time:?\s*(\d+)\s*(min|minutes?)/i);
    const cookTimeMinutes = this.extractTime(text, /cook(?:ing)?\s*time:?\s*(\d+)\s*(min|minutes?)/i);

    // Extract servings
    const servings = this.extractServings(text);

    // Calculate confidence based on what we found
    const confidence = this.calculateConfidence(name, ingredients, instructions);

    return {
      name,
      instructions,
      prepTimeMinutes,
      cookTimeMinutes,
      servings,
      ingredients,
      confidence,
      rawText: text,
    };
  }

  private extractRecipeName(lines: string[]): string {
    // First non-empty line that looks like a title
    // (not starting with numbers, not too long)
    for (const line of lines) {
      if (line.length > 3 && line.length < 100 && !/^\d/.test(line)) {
        return line;
      }
    }
    return 'Unnamed Recipe';
  }

  private extractIngredients(text: string, lines: string[]): Array<{name: string, quantity?: number, unit?: string}> {
    const ingredients: Array<{name: string, quantity?: number, unit?: string}> = [];

    // Find "Ingredients" section header
    let inIngredientsSection = false;
    for (const line of lines) {
      if (/^ingredients:?$/i.test(line.trim())) {
        inIngredientsSection = true;
        continue;
      }

      // Stop at next section (Instructions, Directions, etc.)
      if (inIngredientsSection && /^(instructions|directions|method|steps):?$/i.test(line.trim())) {
        break;
      }

      if (inIngredientsSection) {
        const parsed = this.parseIngredientLine(line);
        if (parsed) {
          ingredients.push(parsed);
        }
      }
    }

    return ingredients;
  }

  private parseIngredientLine(line: string): {name: string, quantity?: number, unit?: string} | null {
    // Match patterns like:
    // "2 cups flour"
    // "1/2 tsp salt"
    // "3 eggs"
    // "500g tomatoes"

    const match = line.match(/^[-•*]?\s*(\d+(?:[\/\.]\d+)?)\s*(cup|cups|tsp|tbsp|g|kg|ml|l|st|msk|tsk|dl)?\s+(.+)$/i);

    if (match) {
      const [, quantityStr, unit, name] = match;
      const quantity = this.parseQuantity(quantityStr);
      return {
        quantity,
        unit: unit?.toLowerCase(),
        name: name.trim(),
      };
    }

    // If no quantity, just treat whole line as ingredient name
    if (line.length > 2) {
      return { name: line.replace(/^[-•*]\s*/, '').trim() };
    }

    return null;
  }

  private parseQuantity(str: string): number {
    // Handle fractions like "1/2" or "1.5"
    if (str.includes('/')) {
      const [num, den] = str.split('/').map(Number);
      return num / den;
    }
    return parseFloat(str);
  }

  private extractInstructions(text: string, lines: string[]): string {
    // Find instructions section and concatenate all text
    let inInstructionsSection = false;
    const instructionLines: string[] = [];

    for (const line of lines) {
      if (/^(instructions|directions|method|steps):?$/i.test(line.trim())) {
        inInstructionsSection = true;
        continue;
      }

      if (inInstructionsSection) {
        instructionLines.push(line);
      }
    }

    return instructionLines.join('\n').trim() || '';
  }

  private extractTime(text: string, pattern: RegExp): number | undefined {
    const match = text.match(pattern);
    if (match) {
      return parseInt(match[1], 10);
    }
    return undefined;
  }

  private extractServings(text: string): number | undefined {
    const match = text.match(/(?:serves|servings|portions):?\s*(\d+)/i);
    if (match) {
      return parseInt(match[1], 10);
    }
    return undefined;
  }

  private calculateConfidence(name: string, ingredients: any[], instructions: string): 'high' | 'medium' | 'low' {
    let score = 0;
    if (name && name !== 'Unnamed Recipe') score += 3;
    if (ingredients.length > 0) score += 3;
    if (instructions.length > 20) score += 2;

    if (score >= 7) return 'high';
    if (score >= 4) return 'medium';
    return 'low';
  }
}
