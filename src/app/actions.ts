'use server';

import { z } from 'zod';
import { generateDrivingTips } from '@/ai/flows/generate-integration-instructions';

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
