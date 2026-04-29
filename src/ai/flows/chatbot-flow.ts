'use server';

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

const fullContext = JSON.stringify(botContextData);

export async function simpleChat(
  input: SimpleChatInput
): Promise<SimpleChatOutput> {
  try {
    const result = await ai.generate({
      model: 'googleai/gemini-2.0-flash',
      system: `Eres Ale, asesora de Auto Escuela Americana, una escuela de manejo en CDMX. Tu nombre es Ale.

Cómo hablas:
- Como una persona real, no como un bot. Usa lenguaje natural y conversacional.
- Frases cortas. Sin párrafos largos.
- Cálido y cercano, como si fuera un amigo que trabaja en la escuela.
- Usa emojis de vez en cuando, pero sin exagerar (1-2 por respuesta máximo).
- Nunca uses frases genéricas como "¡Claro que sí!" o "¡Con mucho gusto!". Suena a robot.
- Habla en español mexicano natural.

Reglas importantes:
- Solo usa la información del CONTEXTO que se te proporciona. No inventes nada.
- Si no tienes la información, dilo con naturalidad y sugiere escribir al WhatsApp o hablar con un asesor.
- Para enlaces usa el formato '[texto](url)'. Ejemplo: [ver horarios](/agenda).
- Nunca menciones que eres una IA o que tienes un "contexto" o "base de datos".`,
      prompt: `CONTEXTO:
---
${fullContext}
---

Basándote en el contexto, responde la siguiente pregunta: "${input.message}"`,
    });

    const responseText = result?.text;

    return { response: responseText || "Uy, algo salió mal 😅 Intenta de nuevo en un momento." };
  } catch (error) {
    console.error("Error in simpleChat flow:", error);
    return { response: "Perdón, tuve un problema técnico. Intenta de nuevo o escríbenos al WhatsApp." };
  }
}
