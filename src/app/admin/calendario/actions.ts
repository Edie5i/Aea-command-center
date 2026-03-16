
'use server';

import { getWeeklySchedule as getWeeklyScheduleFlow, type WeeklySchedule } from '@/ai/flows/get-weekly-schedule';

export { type WeeklySchedule };

export async function getWeeklySchedule() {
  try {
    const schedule = await getWeeklyScheduleFlow();
    return { schedule, error: null };
  } catch (error) {
    console.error('Error fetching weekly schedule:', error);
    // Provide a more specific error message if possible
    const errorMessage = error instanceof Error ? error.message : 'Hubo un problema al comunicarse con el servicio de calendario.';
    return { schedule: null, error: errorMessage };
  }
}
