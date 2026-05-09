'use server';

import { updateChatState } from '@/lib/firestore';
import { Timestamp } from 'firebase-admin/firestore';

export async function closeLead(phone: string, outcome: 'ganado' | 'perdido') {
  await updateChatState(
    phone,
    {
      chatState: 'cerrado',
      chatReason: outcome === 'ganado' ? 'Inscripción confirmada' : 'Lead no convertido',
      chatUrgency: 'ninguna',
      closedAt: Timestamp.now(),
      closedOutcome: outcome,
    },
    'manual'
  );
}

export async function setLeadTuTurno(phone: string) {
  await updateChatState(
    phone,
    {
      chatState: 'tu_turno',
      chatReason: 'Reactivado manualmente',
      chatUrgency: 'alta',
    },
    'manual'
  );
}
