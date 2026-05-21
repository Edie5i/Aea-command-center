'use server';

import { saveFicha } from '@/lib/firestore';

export async function guardarFicha(
  studentName: string,
  phone: string,
  completedTopics: string[],
  pendingTopics: string[],
  totalTopics: number
): Promise<{ ok: boolean }> {
  try {
    await saveFicha({
      studentName,
      phone,
      completedTopics,
      pendingTopics,
      totalTopics,
      completedCount: completedTopics.length,
    });
    return { ok: true };
  } catch (err) {
    console.error('[guardarFicha]', err);
    return { ok: false };
  }
}
