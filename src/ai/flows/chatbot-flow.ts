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
import { botContextData } from '@/lib/bot-data';

const SimpleChatInputSchema = z.object({
  message: z.string().describe("The user's message to the chatbot."),
});
export type SimpleChatInput = z.infer<typeof SimpleChatInputSchema>;

const SimpleChatOutputSchema = z.object({
  response: z.string().describe("The chatbot's response."),
});
export type SimpleChatOutput = z.infer<typeof SimpleChatOutputSchema>;

// The entire knowledge base is converted to a string.
// This avoids the slow, on-demand indexing process that was causing timeouts.
// The Gemini 1.5 Pro model has a large context window and can handle this efficiently.
const fullContext = JSON.stringify(botContextData);

export async function simpleChat(
  input: SimpleChatInput
): Promise<SimpleChatOutput> {
  try {
    // Call the generative model with the user's message and the full context.
    const result = await ai.generate({
      model: 'googleai/gemini-1.5-pro-latest',
      system: `You are a friendly and helpful virtual assistant for "Auto Escuela Americana", a driving school.
You MUST base your answers EXCLUSIVELY on the information provided in the "CONTEXT" JSON data below. Do not make up information or use external knowledge.
If you cannot answer the question with the provided context, politely say that you don't have that information and suggest they contact an advisor via WhatsApp.
Keep your answers concise and to the point.
When providing links, use the format '[link text](url)'. For example: [Go to the schedule page](/agenda).
Always be friendly and professional.`,
      prompt: `CONTEXT:
---
${fullContext}
---

Based on the context provided, answer the following user question: "${input.message}"`,
    });

    const responseText = result?.text;

    return { response: responseText || "Sorry, I could not process your request at this moment." };
  } catch (error) {
    console.error("Error in simpleChat flow:", error);
    return { response: "An error occurred while processing your request. Please try again." };
  }
}
