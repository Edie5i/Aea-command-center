'use server';
/**
 * @fileOverview A simple chatbot flow.
 *
 * - simpleChat - A function that takes a user message and returns a response.
 * - SimpleChatInput - The input type for the simpleChat function.
 * - SimpleChatOutput - The return type for the simpleChat function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SimpleChatInputSchema = z.object({
  message: z.string().describe("The user's message to the chatbot."),
});
export type SimpleChatInput = z.infer<typeof SimpleChatInputSchema>;

const SimpleChatOutputSchema = z.object({
  response: z.string().describe("The chatbot's response."),
});
export type SimpleChatOutput = z.infer<typeof SimpleChatOutputSchema>;

export async function simpleChat(
  input: SimpleChatInput
): Promise<SimpleChatOutput> {
  const { output } = await ai.generate({
    prompt: input.message,
    system: `You are a friendly and helpful virtual assistant for "Auto Escuela Americana", a driving school.`,
  });

  return { response: output?.text || "Sorry, I could not process your request at this moment." };
}
