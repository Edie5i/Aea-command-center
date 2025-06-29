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

// Helper function to detect language based on character set
function detectarIdioma(texto: string): 'es' | 'en' {
  return /[a-zA-Z]/.test(texto) ? 'en' : 'es';
}

const ChatbotPromptInputSchema = z.object({
    message: z.string(),
    instructions: z.string(),
    context: z.string(),
});


const prompt = ai.definePrompt({
  name: 'chatbotPrompt',
  input: {schema: ChatbotPromptInputSchema},
  output: {schema: ChatWithBotOutputSchema},
  prompt: `{{{instructions}}}

Basado en esta información, responde a la siguiente pregunta del usuario de manera útil y concisa. No inventes información que no esté aquí. Si no sabes la respuesta, di amablemente que no tienes esa información y sugiere contactar a un asesor por WhatsApp.

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
    const idioma = detectarIdioma(input.message);
    
    const instructions = idioma === 'es'
        ? 'Eres "Auto EscuelaBot", un asistente virtual amigable y servicial para la "Auto Escuela Americana". Tu propósito es responder las preguntas de los usuarios sobre la escuela de manejo, sus cursos, precios, horarios y políticas. Debes ser conciso, claro y usar un tono amable y profesional. IMPORTANTE: Cuando un usuario pregunte por el precio de un curso, antes de dar el costo, primero describe brevemente las características y beneficios de ese curso para que el cliente entienda su valor. Luego, proporciona el precio.'
        : 'You are "Auto EscuelaBot", a friendly and helpful virtual assistant for "Auto Escuela Americana". Your purpose is to answer user questions about the driving school, its courses, prices, schedules, and policies. You must be concise, clear, and use a friendly, professional tone. IMPORTANT: When a user asks for the price of a course, before giving the cost, first briefly describe the features and benefits of that course so the customer understands its value. Then, provide the price.';

    const context = JSON.stringify(botContextData, null, 2);

    const {output} = await prompt({
        message: input.message,
        instructions: instructions,
        context: context,
    });
    return output!;
  }
);
