import { NextRequest, NextResponse } from 'next/server';
import { db, updateChatState, logStateChange } from '@/lib/firestore';
import { Timestamp } from 'firebase-admin/firestore';

const TOKEN = process.env.META_VERIFY_TOKEN ?? 'aea_webhook_2026';
const WA_TOKEN = process.env.META_WHATSAPP_TOKEN ?? '';
const PHONE_ID = process.env.META_PHONE_NUMBER_ID ?? '';

const FRIO_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

// 2h → dentro de ventana 24h, se puede mandar como texto libre
// 24h, 72h, 7d → fuera de ventana, requieren template aprobado por Meta
const FOLLOWUP_SEQUENCE = ['2h', '24h', '72h', '7d'] as const;

// Nombres de templates registrados en Meta Business Manager
// Cambiar a true en TEMPLATES_ACTIVE cuando Meta los apruebe
const TEMPLATES_ACTIVE = process.env.WA_TEMPLATES_ACTIVE === 'true';

const TEMPLATE_NAMES: Record<string, string> = {
  '24h': 'aea_followup_24h',
  '72h': 'aea_followup_72h',
  '7d':  'aea_followup_7d',
};

// Texto de fallback para el 2h (siempre dentro de ventana)
const MSG_2H = '¡Hola! Por aquí Luz de Auto Escuela Americana 😊 ¿Pudiste checar la info? Con gusto te ayudo a resolver cualquier duda.';

async function sendText(to: string, text: string): Promise<void> {
  const res = await fetch(`https://graph.facebook.com/v21.0/${PHONE_ID}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${WA_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text },
    }),
  });
  if (!res.ok) throw new Error(`WhatsApp API ${res.status}: ${await res.text()}`);
}

async function sendTemplate(to: string, templateName: string): Promise<void> {
  const res = await fetch(`https://graph.facebook.com/v21.0/${PHONE_ID}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${WA_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'es_MX' },
      },
    }),
  });
  if (!res.ok) throw new Error(`WhatsApp Template API ${res.status}: ${await res.text()}`);
}

async function sendFollowup(to: string, type: string): Promise<void> {
  if (type === '2h') {
    return sendText(to, MSG_2H);
  }
  if (!TEMPLATES_ACTIVE) {
    console.warn(`[CRON] Templates no activos — follow-up ${type} omitido para ${to}`);
    return;
  }
  return sendTemplate(to, TEMPLATE_NAMES[type]);
}

// GET /api/cron/advance-chat-states?token=...
export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.get('token') !== TOKEN) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const now = Date.now();
  const nowTs = Timestamp.fromMillis(now);
  const results = { followups: 0, frio: 0, errors: 0 };

  // ── 1. Follow-ups pendientes ───────────────────────────────────────────────
  // Busca chats esperando_cliente con nextFollowupAt ya vencido
  const followupSnap = await db
    .collection('conversations')
    .where('chatState', '==', 'esperando_cliente')
    .where('nextFollowupAt', '<=', nowTs)
    .get();

  for (const doc of followupSnap.docs) {
    const data = doc.data();
    const phone: string = data.phone ?? doc.id;
    const followUpsSent: Array<{ at: Timestamp; type: string }> = data.followUpsSent ?? [];

    const nextType = FOLLOWUP_SEQUENCE[followUpsSent.length];
    if (!nextType) {
      // Agotamos todos los follow-ups → frío
      await updateChatState(
        phone,
        { chatState: 'frio', chatReason: 'Follow-ups agotados sin respuesta', chatUrgency: 'ninguna', nextFollowupAt: null },
        'cron'
      ).catch(e => console.error('[CRON] Error marcando frio:', phone, e));
      results.frio++;
      continue;
    }

    try {
      await sendFollowup(phone, nextType);

      const newFollowUpsSent = [
        ...followUpsSent,
        { at: Timestamp.now(), type: nextType },
      ];

      // Calcular cuándo es el PRÓXIMO follow-up después de éste
      const nextSequenceType = FOLLOWUP_SEQUENCE[newFollowUpsSent.length];
      const FOLLOWUP_MS: Record<string, number> = {
        '2h':  2  * 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '72h': 72 * 60 * 60 * 1000,
        '7d':  7  * 24 * 60 * 60 * 1000,
      };
      const nextFollowupAt = nextSequenceType
        ? Timestamp.fromMillis(Date.now() + FOLLOWUP_MS[nextSequenceType])
        : null;

      await db.collection('conversations').doc(phone).set(
        { followUpsSent: newFollowUpsSent, nextFollowupAt },
        { merge: true }
      );

      await logStateChange(phone, 'esperando_cliente', 'esperando_cliente',
        `Follow-up ${nextType} enviado`, 'cron');

      console.log(`[CRON] Follow-up ${nextType} enviado a ${phone}`);
      results.followups++;
    } catch (e) {
      console.error('[CRON] Error enviando follow-up a', phone, e);
      results.errors++;
    }
  }

  // ── 2. Silencio >7d → frío ─────────────────────────────────────────────────
  const frioCorte = Timestamp.fromMillis(now - FRIO_AFTER_MS);
  const silentSnap = await db
    .collection('conversations')
    .where('lastActivity', '<=', frioCorte)
    .get();

  for (const doc of silentSnap.docs) {
    const data = doc.data();
    const state = data.chatState ?? 'luz_atendiendo';
    if (state === 'cerrado' || state === 'frio' || state === 'tu_turno') continue;

    const phone: string = data.phone ?? doc.id;
    const diasSilencio = Math.floor((now - (data.lastActivity?.toMillis?.() ?? now)) / 86400000);

    await updateChatState(
      phone,
      {
        chatState: 'frio',
        chatReason: `Sin actividad por ${diasSilencio} días`,
        chatUrgency: 'ninguna',
        nextFollowupAt: null,
      },
      'cron'
    ).catch(e => console.error('[CRON] Error marcando frio silencio:', phone, e));

    console.log(`[CRON] ${phone} → frio (${diasSilencio}d sin actividad)`);
    results.frio++;
  }

  return NextResponse.json({ ok: true, ...results, ran_at: new Date().toISOString() });
}
