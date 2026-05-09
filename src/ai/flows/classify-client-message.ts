'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const InputSchema = z.object({
  lastMessage: z.string().describe('El último mensaje del cliente, sin modificar.'),
  context: z
    .array(z.string())
    .max(10)
    .describe(
      'Últimos mensajes de la conversación en orden cronológico (más viejo primero). ' +
        'Formato: "Cliente: texto" o "Luz: texto".'
    ),
});

export type ClassifyInput = z.infer<typeof InputSchema>;

const OutputSchema = z.object({
  intent: z.enum([
    'compra',
    'objecion',
    'pide_humano',
    'frustracion',
    'pregunta_normal',
    'saludo',
    'info_personal',
  ]),
  confidence: z.number().min(0).max(1),
  detected_course: z.string().nullable(),
  detected_price: z.string().nullable(),
  reasoning: z.string().max(200),
});

export type ClassifyOutput = z.infer<typeof OutputSchema>;

const CLASSIFY_PROMPT = `Eres un clasificador de intención para una autoescuela en México (CDMX).
Recibes el último mensaje de un cliente de WhatsApp y el contexto reciente de la conversación.

Clasifica el ÚLTIMO MENSAJE del cliente en exactamente uno de estos intents:

- **compra**: El cliente quiere proceder. Señales: "quiero apartar", "cómo pago", "inscríbeme", "vamos", "cuándo empiezo", "me interesa", "dónde pago", "acepto", "va", "ándale", pide datos bancarios para pagar, pregunta cómo reservar.

- **objecion**: El cliente duda por precio, tiempo u otra barrera. Señales: "está caro", "es mucho", "no tengo dinero", "déjame pensarlo", "tengo que ver", "no estoy seguro", "después", "luego te digo", "no sé", duda explícita sobre el valor.

- **pide_humano**: Quiere hablar con una persona real. Señales: "quiero hablar con alguien", "asesor", "con una persona", "no eres real", "dame un número", "me llama alguien", "me comunicas".

- **frustracion**: Irritación o exasperación. Señales: "ya te dije", "no me entiendes", "cuántas veces", "eres un robot", mensajes muy cortos y cortantes después de repetición, mayúsculas agresivas, groserías.

- **info_personal**: El cliente comparte datos personales clave. Señales: da su nombre completo, dirección exacta (calle + número + colonia), horario preferido.

- **saludo**: Primer contacto o saludo sin información adicional. Señales: "hola", "buenos días", "info", "información", mensaje muy corto sin contexto.

- **pregunta_normal**: Cualquier otra pregunta o mensaje informativo que no encaje en los anteriores.

Para detected_course: si el cliente mencionó explícitamente un tipo de curso (Estándar, Automático, Moto, etc.), ponlo. Si no, null.
Para detected_price: si el cliente mencionó o preguntó por un precio concreto, ponlo como string (ej. "$3,400"). Si no, null.
Para confidence: qué tan seguro estás (0.0–1.0).
Para reasoning: máximo 2 frases explicando tu decisión.

IMPORTANTE: Clasifica SOLO el último mensaje. El contexto es solo para entender el hilo, no para re-clasificar mensajes anteriores.`;

const classifyFlow = ai.defineFlow(
  {
    name: 'classifyClientMessage',
    inputSchema: InputSchema,
    outputSchema: OutputSchema,
  },
  async (input) => {
    const contextBlock =
      input.context.length > 0
        ? `\n\nCONTEXTO RECIENTE:\n${input.context.join('\n')}`
        : '';

    const result = await ai.generate({
      model: 'googleai/gemini-2.0-flash',
      system: CLASSIFY_PROMPT,
      prompt: `ÚLTIMO MENSAJE DEL CLIENTE: "${input.lastMessage}"${contextBlock}\n\nResponde SOLO con JSON válido que cumpla el schema.`,
      output: { schema: OutputSchema },
    });

    return result.output!;
  }
);

/**
 * Classifies the intent of a client's WhatsApp message.
 * Uses the last N conversation messages as context.
 */
export async function classifyClientMessage(
  lastMessage: string,
  context: string[] = []
): Promise<ClassifyOutput> {
  return classifyFlow({ lastMessage, context });
}
