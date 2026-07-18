'use server';

import { updateChatState, saveBotMessage } from '@/lib/firestore';
import { Timestamp } from 'firebase-admin/firestore';
import { db } from '@/lib/firestore';

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

export async function toggleBotPause(phone: string, paused: boolean): Promise<void> {
  await db.collection('conversations').doc(phone).set(
    { botPaused: paused, ...(paused ? { nextFollowupAt: null } : {}) },
    { merge: true }
  );
}

export async function sendAdminReply(phone: string, text: string): Promise<void> {
  const WA_TOKEN = process.env.META_WHATSAPP_TOKEN ?? '';
  const PHONE_ID = process.env.META_PHONE_NUMBER_ID ?? '';

  if (!WA_TOKEN || !PHONE_ID) throw new Error('WhatsApp no configurado');

  const res = await fetch(`https://graph.facebook.com/v21.0/${PHONE_ID}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${WA_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: phone,
      type: 'text',
      text: { body: text },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`WhatsApp ${res.status}: ${err}`);
  }

  await saveBotMessage(phone, text);
  await updateChatState(
    phone,
    {
      chatState: 'esperando_cliente',
      chatReason: 'Respuesta manual del equipo',
      chatUrgency: 'ninguna',
      chatLastBy: 'humano',
    },
    'manual'
  );
}
