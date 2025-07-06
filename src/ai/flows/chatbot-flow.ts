'use server';
/**
 * @fileOverview A chatbot flow for Auto Escuela Americana.
 *
 * - chatWithBot - A function that takes a user message and returns a response.
 * - ChatWithBotInput - The input type for the chatWithBot function.
 * - ChatWithBotOutput - The return type for the chatWithBot function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { botContextData } from '@/lib/bot-data';

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

const ChatbotPromptInputSchema = z.object({
    message: z.string(),
    context: z.string(),
});


const prompt = ai.definePrompt({
  name: 'chatbotPrompt',
  input: {schema: ChatbotPromptInputSchema},
  output: {schema: ChatWithBotOutputSchema},
  prompt: `You are "Auto EscuelaBot", an expert, friendly, and helpful virtual assistant for "Auto Escuela Americana", a driving school in Mexico City. Your main goal is to answer user questions concisely and accurately based ONLY on the information provided in the "INFORMACIÓN DISPONIBLE" section.

**Crucial Rules:**
1.  **NEVER invent information.** If the answer is not in the provided context, politely state that you don't have that specific information and suggest contacting an advisor via WhatsApp.
2.  **Answer in the same language as the user's question** (Spanish or English).
3.  **Use formatting for clarity:** Use **bold text** to highlight key terms (like course names or prices) and use lists (\`-\`) for multiple items.
4.  **Be proactive:** If a user's question relates to a specific page (like scheduling or prices), mention the page and its URL (e.g., "Puedes ver todos los detalles en nuestro catálogo en la página /catalogo").
5.  **Pricing questions:** If asked about prices generally, focus on the beginner courses. When giving a price, always mention the course's benefits first, and then the cost. For example: "El Curso Principiante (Automático) es perfecto si nunca has manejado y cuesta **$3900.00 MXN**."
6.  **Keep it brief:** Provide direct and concise answers.

**INFORMACIÓN DISPONIBLE:**
\`\`\`json
{{{context}}}
\`\`\`

**PREGUNTA DEL USUARIO:**
{{{message}}}
`,
});

const chatbotFlow = ai.defineFlow(
  {
    name: 'chatbotFlow',
    inputSchema: ChatWithBotInputSchema,
    outputSchema: ChatWithBotOutputSchema,
  },
  async (input) => {
    const context = JSON.stringify(botContextData, null, 2);

    const {output} = await prompt({
        message: input.message,
        context: context,
    });
    return output!;
  }
);
