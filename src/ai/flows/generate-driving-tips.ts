
'use server';
/**
 * @fileOverview A Genkit flow for generating driving tips.
 *
 * This flow takes a topic and returns a list of relevant driving tips.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const DrivingTipsInputSchema = z.object({
  topic: z.string().describe('The topic for which to generate driving tips (e.g., "rain", "night", "highway").'),
});
export type DrivingTipsInput = z.infer<typeof DrivingTipsInputSchema>;

const DrivingTipsOutputSchema = z.object({
  tips: z.array(z.string()).describe('A list of driving tips.'),
});
export type DrivingTipsOutput = z.infer<typeof DrivingTipsOutputSchema>;

export async function generateDrivingTips(
  input: DrivingTipsInput
): Promise<DrivingTipsOutput> {
  return generateDrivingTipsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDrivingTipsPrompt',
  input: { schema: DrivingTipsInputSchema },
  output: { schema: DrivingTipsOutputSchema },
  system: `You are an expert driving instructor for Auto Escuela Americana. Your task is to generate a list of 5 to 7 clear, concise, and practical driving tips for the specified topic.
- The tips should be highly practical and easy for a new driver to understand and apply.
- Ensure the tone is helpful, safe, and professional.
- Focus on safety and best practices for driving in a dense urban environment like Mexico City.
- Frame the output as a JSON object with a 'tips' array.
- DO NOT add any introductory or concluding text, only the JSON object.`,
  prompt: `Generate a list of driving tips for the topic: {{{topic}}}.`,
});

const generateDrivingTipsFlow = ai.defineFlow(
  {
    name: 'generateDrivingTipsFlow',
    inputSchema: DrivingTipsInputSchema,
    outputSchema: DrivingTipsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('Failed to generate driving tips.');
    }
    return output;
  }
);
