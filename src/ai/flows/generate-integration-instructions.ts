'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating creative ideas.
 *
 * - generateIdeas - A function that generates ideas based on a topic.
 * - GenerateIdeasInput - The input type for the generateIdeas function.
 * - GenerateIdeasOutput - The return type for the generateIdeas function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateIdeasInputSchema = z.object({
  topic: z.string().describe('The topic to generate ideas for.'),
});
export type GenerateIdeasInput = z.infer<typeof GenerateIdeasInputSchema>;

const GenerateIdeasOutputSchema = z.object({
  ideas: z
    .array(z.string().describe('A single, creative idea.'))
    .describe('A list of 5 creative ideas based on the provided topic.'),
});
export type GenerateIdeasOutput = z.infer<typeof GenerateIdeasOutputSchema>;

export async function generateIdeas(
  input: GenerateIdeasInput
): Promise<GenerateIdeasOutput> {
  return generateIdeasFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateIdeasPrompt',
  input: {schema: GenerateIdeasInputSchema},
  output: {schema: GenerateIdeasOutputSchema},
  prompt: `You are a creative brainstorming assistant. Your goal is to generate interesting and unique ideas.
Based on the following topic, please generate 5 ideas.

Topic: {{{topic}}}`,
});

const generateIdeasFlow = ai.defineFlow(
  {
    name: 'generateIdeasFlow',
    inputSchema: GenerateIdeasInputSchema,
    outputSchema: GenerateIdeasOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
