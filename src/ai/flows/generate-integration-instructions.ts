// use server'
'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating Firebase integration instructions.
 *
 * - generateIntegrationInstructions - A function that generates Firebase integration instructions.
 * - GenerateIntegrationInstructionsInput - The input type for the generateIntegrationInstructions function.
 * - GenerateIntegrationInstructionsOutput - The return type for the generateIntegrationInstructions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateIntegrationInstructionsInputSchema = z.object({
  firebaseConfig: z
    .string()
    .describe('The Firebase config object as a JSON string.'),
});
export type GenerateIntegrationInstructionsInput = z.infer<
  typeof GenerateIntegrationInstructionsInputSchema
>;

const GenerateIntegrationInstructionsOutputSchema = z.object({
  instructions: z
    .string()
    .describe(
      'Clear, step-by-step instructions on how to integrate Firebase into a Next.js project.'
    ),
});
export type GenerateIntegrationInstructionsOutput = z.infer<
  typeof GenerateIntegrationInstructionsOutputSchema
>;

export async function generateIntegrationInstructions(
  input: GenerateIntegrationInstructionsInput
): Promise<GenerateIntegrationInstructionsOutput> {
  return generateIntegrationInstructionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateIntegrationInstructionsPrompt',
  input: {schema: GenerateIntegrationInstructionsInputSchema},
  output: {schema: GenerateIntegrationInstructionsOutputSchema},
  prompt: `You are an expert in Firebase and Next.js. You will take the provided Firebase config and generate clear, step-by-step instructions on how to integrate Firebase into a Next.js project.

Firebase Config:
{{{firebaseConfig}}}',
});

const generateIntegrationInstructionsFlow = ai.defineFlow(
  {
    name: 'generateIntegrationInstructionsFlow',
    inputSchema: GenerateIntegrationInstructionsInputSchema,
    outputSchema: GenerateIntegrationInstructionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
