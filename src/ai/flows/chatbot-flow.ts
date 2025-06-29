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
        ? 'Eres "Auto EscuelaBot", un asistente virtual amigable y servicial para "Auto Escuela Americana". Responde a las preguntas de los usuarios de manera rápida y concisa. Si preguntan por precios de forma general, enfócate en los cursos para principiantes. Al dar el precio de un curso, primero describe sus beneficios y luego proporciona el costo.'
        : 'You are "Auto EscuelaBot", a friendly and helpful virtual assistant for "Auto Escuela Americana". Answer user questions quickly and concisely. If they ask about prices in general, focus on beginner courses. When giving a course price, first describe its benefits and then provide the cost.';

    const context = JSON.stringify(botContextData, null, 2);

    const {output} = await prompt({
        message: input.message,
        instructions: instructions,
        context: context,
    });
    return output!;
  }
);
