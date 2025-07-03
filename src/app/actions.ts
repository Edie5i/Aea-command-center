'use server';

import { z } from 'zod';
import { generateDrivingTips } from '@/ai/flows/generate-integration-instructions';
import { chatWithBot } from '@/ai/flows/chatbot-flow';
import { getAuthenticatedCalendarClient, GOOGLE_AUTH_TOKEN_COOKIE_KEY } from '@/lib/google-auth';
import { cookies } from 'next/headers';

const inputSchema = z.object({
  topic: z.string().min(3, { message: 'El tema debe tener al menos 3 caracteres.' }),
});

export async function getDrivingTipsAction(topic: string) {
  try {
    const validatedInput = inputSchema.parse({ topic });
    const result = await generateDrivingTips({ topic: validatedInput.topic });
    if (!result.tips || result.tips.length === 0) {
      return { tips: null, error: 'No se pudieron generar consejos. El modelo de IA podría no estar disponible.' };
    }
    return { tips: result.tips, error: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { tips: null, error: error.errors[0].message };
    }
    console.error('Error al generar consejos:', error);
    return { tips: null, error: 'Ocurrió un error inesperado. Por favor, revisa los registros del servidor.' };
  }
}

const chatbotInputSchema = z.object({
  message: z.string().min(1, { message: 'El mensaje no puede estar vacío.' }),
});

export async function getChatbotResponseAction(message: string) {
  try {
    const validatedInput = chatbotInputSchema.parse({ message });
    const result = await chatWithBot({ message: validatedInput.message });
    if (!result.response) {
      return { response: null, error: 'No se pudo obtener una respuesta. El modelo de IA podría no estar disponible.' };
    }
    return { response: result.response, error: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { response: null, error: error.errors[0].message };
    }
    console.error('Error al obtener respuesta del chatbot:', error);
    return { response: null, error: 'Ocurrió un error inesperado. Por favor, revisa los registros del servidor.' };
  }
}

export async function isGoogleCalendarConnected() {
  const cookieStore = cookies();
  return cookieStore.has(GOOGLE_AUTH_TOKEN_COOKIE_KEY);
}

export async function createCalendarEventAction(eventDetails: {
  summary: string;
  description: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
}) {
  try {
    const calendar = await getAuthenticatedCalendarClient();
    if (!calendar) {
      return { success: false, error: 'El administrador no está autenticado con Google Calendar.' };
    }

    await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        ...eventDetails,
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 120 },
          ],
        },
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error al crear el evento de calendario:', error);
    return { success: false, error: error.message || 'Ocurrió un error desconocido.' };
  }
}
