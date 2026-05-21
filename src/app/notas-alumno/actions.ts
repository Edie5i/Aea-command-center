'use server';

import { saveFicha } from '@/lib/firestore';
import { createFichaEvent } from '@/services/calendarService';

export async function guardarFicha(
  studentName: string,
  phone: string,
  completedTopics: string[],
  pendingTopics: string[],
  totalTopics: number
): Promise<{ ok: boolean }> {
  try {
    await Promise.all([
      saveFicha({
        studentName,
        phone,
        completedTopics,
        pendingTopics,
        totalTopics,
        completedCount: completedTopics.length,
      }),
      createFichaEvent({
        studentName,
        studentPhone: phone,
        completedTopics,
        pendingTopics,
        completedCount: completedTopics.length,
        totalTopics,
      }),
    ]);
    return { ok: true };
  } catch (err) {
    console.error('[guardarFicha]', err);
    return { ok: false };
  }
}
