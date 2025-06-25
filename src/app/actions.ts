'use server';

import { z } from 'zod';
import { generateIntegrationInstructions } from '@/ai/flows/generate-integration-instructions';

const inputSchema = z.string().min(1, { message: 'Firebase config cannot be empty.' }).refine(
  (val) => {
    try {
      const parsed = JSON.parse(val.replace(/(\w+):/g, '"$1":'));
      return typeof parsed === 'object' && parsed !== null;
    } catch (e) {
      try {
        // Attempt to parse as a JS object string if JSON.parse fails
        const obj = (new Function(`return ${val}`))();
        return typeof obj === 'object' && obj !== null;
      } catch (e2) {
        return false;
      }
    }
  },
  { message: 'Please provide a valid Firebase config object.' }
);

export async function getInstructionsAction(firebaseConfig: string) {
  try {
    const validatedConfig = inputSchema.parse(firebaseConfig);
    const result = await generateIntegrationInstructions({ firebaseConfig: validatedConfig });
    if (!result.instructions) {
      return { instructions: null, error: 'Failed to generate instructions. The AI model might be unavailable.' };
    }
    return { instructions: result.instructions, error: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { instructions: null, error: error.errors[0].message };
    }
    console.error('Instruction generation error:', error);
    return { instructions: null, error: 'An unexpected error occurred. Please check the server logs.' };
  }
}
