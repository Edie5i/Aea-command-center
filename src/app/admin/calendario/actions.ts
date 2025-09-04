'use server';

import { getWeeklySchedule as getWeeklyScheduleFlow, type WeeklySchedule } from '@/ai/flows/get-weekly-schedule';

export { type WeeklySchedule };

export async function getWeeklySchedule() {
  try {
    const schedule = await getWeeklyScheduleFlow();
    return { schedule, error: null };
  } catch (error) {
    console.error('Error fetching weekly schedule:', error);
    return { schedule: null, error: 'Hubo un problema al comunicarse con el servicio de calendario.' };
  }
}
