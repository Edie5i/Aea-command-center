
'use server';
/**
 * @fileOverview A chatbot flow for Auto Escuela Americana using Retrieval-Augmented Generation (RAG).
 *
 * - chatWithBot - A function that takes a user message and returns a response.
 * - ChatWithBotInput - The input type for the chatWithBot function.
 * - ChatWithBotOutput - The return type for the chatWithBot function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import './chatbot-indexer'; // Ensure the indexer runs and defines the index

const SCHOOL_KNOWLEDGE_INDEX = 'schoolKnowledge';

const ChatWithBotInputSchema = z.object({
  message: z.string().describe("The user's message to the chatbot."),
});
export type ChatWithBotInput = z.infer<typeof ChatWithBotInputSchema>;

const ChatWithBotOutputSchema = z.object({
  response: z.string().describe("The chatbot's response."),
});
export type ChatWithBotOutput = z.infer<typeof ChatWithBotOutputSchema>;

export async function chatWithBot(
  input: ChatWithBotInput
): Promise<ChatWithBotOutput> {
  return chatbotFlow(input);
}

const chatbotFlow = ai.defineFlow(
  {
    name: 'chatbotFlow',
    inputSchema: ChatWithBotInputSchema,
    outputSchema: ChatWithBotOutputSchema,
  },
  async (input) => {

    const history = await ai.getHistory();
    const augmentedPrompt = await ai.embed({
      content: input.message,
      index: SCHOOL_KNOWLEDGE_INDEX,
    });
    
    const { output } = await ai.generate({
      prompt: augmentedPrompt,
      history,
      system: `You are "Auto EscuelaBot", an expert, friendly, and helpful virtual assistant for "Auto Escuela Americana", a driving school in Mexico City. Your main goal is to answer user questions concisely and accurately based ONLY on the information provided in the context. This includes general information, course catalog, scheduling, payments, policies, FAQs, the detailed driving program, and the official traffic regulations.

**Crucial Rules:**
1.  **NEVER invent information.** If the answer is not in the provided context, politely state that you don't have that specific information and suggest contacting an advisor via WhatsApp.
2.  **Answer in the same language as the user's question** (Spanish or English).
3.  **Use formatting for clarity:** Use **bold text** to highlight key terms (like course names or prices) and use lists (\`-\`) for multiple items.
4.  **Be proactive:** If a user's question relates to a specific page (like scheduling or prices), mention the page and its URL (e.g., "Puedes ver todos los detalles en nuestro catálogo en la página /catalogo").
5.  **Pricing questions:** When giving a price, always mention the course's benefits first, and then the cost. For example: "El Curso Principiante (Automático) es perfecto si nunca has manejado y cuesta **$3900.00 MXN**."
6.  **Keep it brief:** Provide direct and concise answers, unless a detailed explanation from the regulations is required.
7.  **Scheduling & Availability:**
    *   You CANNOT check the calendar in real-time.
    *   If a user asks about availability, specific dates, or schedules, your response should ALWAYS be to direct them to the agenda page to see available days and send their request. For example: "No puedo ver la disponibilidad en tiempo real, pero puedes solicitar las fechas que te interesan en nuestra página de agenda (/agenda) y un asesor te confirmará por WhatsApp."
`,
    });
    
    return { response: output?.text || "Lo siento, no pude procesar tu solicitud en este momento." };
  }
);
