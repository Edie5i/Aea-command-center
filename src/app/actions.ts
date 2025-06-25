'use server';

import { z } from 'zod';
import { generateIdeas } from '@/ai/flows/generate-integration-instructions';

const inputSchema = z.object({
  topic: z.string().min(3, { message: 'Topic must be at least 3 characters long.' }),
});

export async function getIdeasAction(topic: string) {
  try {
    const validatedInput = inputSchema.parse({ topic });
    const result = await generateIdeas({ topic: validatedInput.topic });
    if (!result.ideas || result.ideas.length === 0) {
      return { ideas: null, error: 'Failed to generate ideas. The AI model might be unavailable.' };
    }
    return { ideas: result.ideas, error: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { ideas: null, error: error.errors[0].message };
    }
    console.error('Idea generation error:', error);
    return { ideas: null, error: 'An unexpected error occurred. Please check the server logs.' };
  }
}
