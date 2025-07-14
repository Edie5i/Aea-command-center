
'use server';

import { z } from 'zod';
import { generateDrivingTips } from '@/ai/flows/generate-integration-instructions';
import { chatWithBot } from '@/ai/flows/chatbot-flow';
import { getAuthenticatedSheetsClient } from '@/lib/google-auth';

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

// Schema for adding an appointment to Google Sheets
const appointmentSchema = z.object({
  timestamp: z.string(),
  name: z.string(),
  phone: z.string(),
  transmission: z.string(),
  meetingPoint: z.string(),
  details: z.string(),
  requiresCertificate: z.string(),
  observations: z.string(),
  schedule: z.string(),
});

type AppointmentData = z.infer<typeof appointmentSchema>;

/**
 * Appends a new row with appointment data to a Google Sheet.
 */
export async function addAppointmentToSheet(data: AppointmentData) {
  try {
    const sheets = await getAuthenticatedSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    
    if (!sheets) {
      throw new Error('Google Sheets client is not authenticated.');
    }
    if (!spreadsheetId) {
      throw new Error('GOOGLE_SHEET_ID environment variable is not set.');
    }

    // Validate data with Zod schema
    const validatedData = appointmentSchema.parse(data);

    const range = 'Appointments!A:I'; // Assuming the sheet is named 'Appointments'
    const valueInputOption = 'USER_ENTERED';

    const resource = {
      values: [Object.values(validatedData)], // Must be an array of arrays
    };

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption,
      requestBody: resource,
    });

    console.log('Successfully added appointment to Google Sheet.');
    return { success: true, error: null };

  } catch (error) {
    let errorMessage = 'An unexpected error occurred.';
    if (error instanceof z.ZodError) {
      errorMessage = `Validation error: ${error.errors.map(e => e.message).join(', ')}`;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    console.error('Error adding appointment to Google Sheet:', errorMessage);
    // We return an error but don't throw, so the client-side flow can continue gracefully.
    return { success: false, error: errorMessage };
  }
}
