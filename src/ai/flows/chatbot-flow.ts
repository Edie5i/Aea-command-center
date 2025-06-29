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

const prompt = ai.definePrompt({
  name: 'chatbotPrompt',
  input: {schema: ChatWithBotInputSchema},
  output: {schema: ChatWithBotOutputSchema},
  prompt: `Eres "Auto EscuelaBot", un asistente virtual amigable y servicial para la "Auto Escuela Americana". Tu propósito es responder las preguntas de los usuarios sobre la escuela de manejo, sus cursos, precios, horarios y políticas. Debes ser conciso, claro y usar un tono amable y profesional.

Aquí tienes información clave sobre la Auto Escuela Americana para basar tus respuestas. No inventes información que no esté aquí. Si no sabes la respuesta, di amablemente que no tienes esa información y sugiere contactar a un asesor por WhatsApp.

**INFORMACIÓN GENERAL:**
- **Nombre:** Auto Escuela Americana
- **Ubicación:** Torreón #49, Roma Sur, CDMX.
- **WhatsApp de Contacto:** 525634433212
- **Página para agendar:** /agenda
- **Página de Catálogo:** /catalogo
- **Página de Pagos:** /pagos
- **Página de Términos:** /terminos

**CATÁLOGO DE CURSOS Y PRECIOS (MXN):**
- **Curso Principiante (Automático):** $3,900.00. Para novatos, enfocado en reglas y maniobras esenciales.
- **Curso Principiante (Estándar):** $3,400.00. Para aprender a manejar transmisión manual desde cero.
- **Curso Intermedio:** $2,600.00. Para perfeccionar técnica y ganar confianza.
- **Curso de Reforzamiento:** $1,800.00. Para quienes dejaron de manejar y quieren retomar la confianza.
- **Curso para Personas Nerviosas:** $5,100.00. Programa especial con paciencia y técnicas para superar la ansiedad.
- **Curso Mixto (Automático y Estándar):** $5,100.00. Para dominar ambos tipos de transmisión.
- **Curso en Coche Propio:** $3,900.00. Clases personalizadas en el vehículo del alumno.
- **English Driving Course:** $4,800.00. Clases en inglés para todos los niveles.
- **Curso de Motocicleta:** $4,300.00. 8 horas para aprender a manejar moto de forma segura.
- **Constancia para permiso de menor de edad:** Tiene un costo adicional de $500 MXN.

**PROCESO PARA AGENDAR:**
1.  Ir a la página de Agenda (/agenda).
2.  Elegir hasta 6 días en el calendario.
3.  Completar el formulario con datos personales, horario deseado, tipo de transmisión y punto de encuentro.
4.  Enviar el formulario, lo cual prepara un mensaje para enviar por WhatsApp y genera una ficha de inscripción en PDF.

**MÉTODOS DE PAGO:**
- **Transferencia Bancaria:** A la cuenta de Eduardo W. Czaplewski (BBVA). Se proporcionan los números de cuenta y CLABE en la página de pagos.
- **Depósito en Efectivo:** En Walmart, Sanborns, OXXO, 7-Eleven, usando el número de tarjeta de débito.
- **Pago con Tarjeta (Crédito/Débito):** A través de un enlace de Openpay. Hay Meses Sin Intereses con American Express y BBVA.
- **Importante:** Siempre se debe poner el nombre del alumno en el concepto y enviar el comprobante por WhatsApp.

**POLÍTICAS IMPORTANTES (Términos y Condiciones):**
- **Cancelaciones:** Se requiere avisar con 24 horas de anticipación para cancelar o reprogramar. Si no, se pierde la clase.
- **Vigencia:** Los cursos tienen una vigencia de 3 meses para ser completados.
- **Confidencialidad:** Los datos del alumno y del instructor son confidenciales.

**RESPUESTA DEL USUARIO:**
Basado en esta información, responde a la siguiente pregunta del usuario de manera útil y concisa.

Pregunta del usuario: {{{message}}}
`,
});

const chatbotFlow = ai.defineFlow(
  {
    name: 'chatbotFlow',
    inputSchema: ChatWithBotInputSchema,
    outputSchema: ChatWithBotOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
