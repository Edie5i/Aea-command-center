
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
import { schoolKnowledgeRetriever } from './chatbot-indexer';

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
    const result = await ai.generate({
      prompt: input.message,
      model: 'googleai/gemini-1.5-pro-latest',
      tools: [schoolKnowledgeRetriever],
      system: `You are a friendly and helpful virtual assistant for "Auto Escuela Americana", a driving school.
    You MUST use the 'schoolKnowledgeRetriever' tool to look up information and answer the user's questions about courses, prices, schedules, payment methods, policies, and the driving program.
    Base your answers on the information provided by the tool. Do not make up information.
    If the user asks a question you cannot answer with the provided information, politely say that you don't have that information and suggest they contact an advisor via WhatsApp.
    Keep your answers concise and to the point.
    When providing links, use the format '[link text](url)'. For example: [Go to the schedule page](/agenda).
    Always be friendly and professional.`,
    });

    const responseText = result?.text;

    return { response: responseText || "Sorry, I could not process your request at this moment." };
  } catch (error) {
    console.error("Error in simpleChat flow:", error);
    return { response: "An error occurred while processing your request. Please try again." };
  }
}
