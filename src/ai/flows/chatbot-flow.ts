'use server';
/**
 * @fileOverview A simple chatbot flow.
 *
 * - simpleChat - A function that takes a user message and returns a response.
 * - SimpleChatInput - The input type for the simpleChat function.
 * - SimpleChatOutput - The return type for the simpleChat function.
 */

import { ai } from '@/ai/genkit';
import { Document, z } from 'genkit';
import { retrieveSchoolKnowledge } from './chatbot-indexer';

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
  try {
    // Step 1: Explicitly retrieve relevant context from the knowledge base.
    const contextDocuments = await retrieveSchoolKnowledge(input.message);
    
    // Convert documents to a single string context, using a robust helper.
    const contextText = contextDocuments.map(doc => Document.contentAsString(doc)).join('\n\n---\n\n');

    // Step 2: Call the generative model with the user's message and the retrieved context.
    const result = await ai.generate({
      model: 'googleai/gemini-1.5-pro-latest',
      system: `You are a friendly and helpful virtual assistant for "Auto Escuela Americana", a driving school.
You MUST base your answers on the information provided in the "CONTEXT" section below. Do not make up information.
If you cannot answer the question with the provided context, politely say that you don't have that information and suggest they contact an advisor via WhatsApp.
Keep your answers concise and to the point.
When providing links, use the format '[link text](url)'. For example: [Go to the schedule page](/agenda).
Always be friendly and professional.`,
      prompt: `CONTEXT:
---
${contextText}
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
