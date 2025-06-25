'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating driving tips.
 *
 * - generateDrivingTips - A function that generates tips based on a topic.
 * - GenerateDrivingTipsInput - The input type for the generateDrivingTips function.
 * - GenerateDrivingTipsOutput - The return type for the generateDrivingTips function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateDrivingTipsInputSchema = z.object({
  topic: z.string().describe('The topic to generate driving tips for.'),
});
export type GenerateDrivingTipsInput = z.infer<typeof GenerateDrivingTipsInputSchema>;

const GenerateDrivingTipsOutputSchema = z.object({
  tips: z
    .array(z.string().describe('A single, actionable driving tip.'))
    .describe('A list of 5 driving tips based on the provided topic.'),
});
export type GenerateDrivingTipsOutput = z.infer<typeof GenerateDrivingTipsOutputSchema>;

export async function generateDrivingTips(
  input: GenerateDrivingTipsInput
): Promise<GenerateDrivingTipsOutput> {
  return generateDrivingTipsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDrivingTipsPrompt',
  input: {schema: GenerateDrivingTipsInputSchema},
  output: {schema: GenerateDrivingTipsOutputSchema},
  prompt: `You are an expert driving instructor. Your goal is to provide clear, concise, and helpful tips for drivers looking to improve their skills.
Based on the following topic, please generate 5 specific and actionable tips.

Topic: {{{topic}}}`,
});

const generateDrivingTipsFlow = ai.defineFlow(
  {
    name: 'generateDrivingTipsFlow',
    inputSchema: GenerateDrivingTipsInputSchema,
    outputSchema: GenerateDrivingTipsOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
