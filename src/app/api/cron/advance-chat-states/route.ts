import { NextRequest, NextResponse } from 'next/server';
import { db, updateChatState, logStateChange } from '@/lib/firestore';
import { Timestamp } from 'firebase-admin/firestore';

const TOKEN = process.env.META_VERIFY_TOKEN ?? 'aea_webhook_2026';
const WA_TOKEN = process.env.META_WHATSAPP_TOKEN ?? '';
const PHONE_ID = process.env.META_PHONE_NUMBER_ID ?? '';

const FRIO_AFTER_MS = 7 * 24 * 60 * 60 * 1000;
const ADMIN_PHONE = (process.env.ADMIN_NOTIFICATION_PHONE ?? '525634433212').trim();

const FOLLOWUP_SEQUENCE = ['2h', '24h', '72h', '7d'] as const;

const FOLLOWUP_MS: Record<string, number> = {
  '2h':  2  * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '72h': 72 * 60 * 60 * 1000,
  '7d':  7  * 24 * 60 * 60 * 1000,
};

function buildMsg2h(nombre: string | null, curso: string | null): string {
  const saludo = nombre ? `Hola ${nombre.split(' ')[0]} 👋` : '¡Hola!';
  const ref = curso ? ` sobre el ${curso}` : '';
  return `${saludo} Por aquí Luz de Auto Escuela Americana. ¿Te quedó alguna duda${ref}? Tengo lugar disponible esta semana si quieres arrancar pronto 🚗`;
}

function buildMsg24h(nombre: string | null): string {
  const saludo = nombre ? `${nombre.split(' ')[0]}, e` : 'E';
  return `${saludo}n AEA tenemos más de 220 reseñas de alumnos que empezaron igual que tú. 4 clases de 2.5h y ya manejan solos 🌟\n\n¿Te resuelvo alguna duda antes de decidirte?`;
}

function buildMsg72h(nombre: string | null): string {
  const saludo = nombre ? `Hola ${nombre.split(' ')[0]}` : 'Hola';
  return `${saludo}, no quiero molestarte más 😊 Solo decirte que si en algún momento decides aprender a manejar, aquí estamos.\n\n¿Hay algo que te frene para arrancar?`;
}

async function sendWA(to: string, text: string): Promise<void> {
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

async function sendFollowup(
  phone: string,
  type: string,
  nombre: string | null,
  curso: string | null,
): Promise<void> {
  const dp = phone.startsWith('52') && phone.length === 12 ? phone.slice(2) : phone;
  const quien = nombre ? `*${nombre}* (+${dp})` : `+${dp}`;

  if (type === '2h') {
    return sendWA(phone, buildMsg2h(nombre, curso));
  }

  if (type === '24h') {
    // Mensaje automático al cliente + aviso silencioso al admin
    await sendWA(phone, buildMsg24h(nombre));
    await sendWA(ADMIN_PHONE,
      `⏰ *Follow-up 24h enviado*\n\n${quien}\nLuz mandó mensaje automático. Monitorea si responde.`
    );
    return;
  }

  if (type === '72h') {
    // Último intento automático al cliente + aviso al admin para que esté listo
    await sendWA(phone, buildMsg72h(nombre));
    await sendWA(ADMIN_PHONE,
      `🔔 *Follow-up 72h — último intento automático*\n\n${quien}\nSi no responde hoy, pasa a frío mañana. ¿Lo llamas tú?`
    );
    return;
  }

  if (type === '7d') {
    // Solo notificar al admin — el lead ya va a frío
    await sendWA(ADMIN_PHONE,
      `❄️ *Lead frío — 7 días sin respuesta*\n\n${quien}\nLo marqué como frío. Avísame si quieres retomarlo manualmente.`
    );
    return;
  }
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
  const followupSnap = await db
    .collection('conversations')
    .where('chatState', '==', 'esperando_cliente')
    .where('nextFollowupAt', '<=', nowTs)
    .get();

  for (const doc of followupSnap.docs) {
    const data = doc.data();
    const phone: string = data.phone ?? doc.id;

    // Conversación pausada, o donde ya intervino un humano (ej. respuesta manual
    // desde el panel sin pausar) — nunca mandar follow-ups automáticos encima de
    // esa atención, aunque el estado siga marcado como esperando_cliente.
    if (data.botPaused || data.chatLastBy === 'humano') continue;

    const followUpsSent: Array<{ at: Timestamp; type: string }> = data.followUpsSent ?? [];
    const nombre: string | null = data.contactName ?? data.nombre ?? null;
    const curso: string | null = data.courseInterest ?? null;

    const nextType = FOLLOWUP_SEQUENCE[followUpsSent.length];
    if (!nextType) {
      await updateChatState(
        phone,
        { chatState: 'frio', chatReason: 'Follow-ups agotados sin respuesta', chatUrgency: 'ninguna', nextFollowupAt: null },
        'cron'
      ).catch(e => console.error('[CRON] Error marcando frio:', phone, e));
      results.frio++;
      continue;
    }

    try {
      await sendFollowup(phone, nextType, nombre, curso);

      const newFollowUpsSent = [...followUpsSent, { at: Timestamp.now(), type: nextType }];
      const nextSequenceType = FOLLOWUP_SEQUENCE[newFollowUpsSent.length];
      const nextFollowupAt = nextSequenceType
        ? Timestamp.fromMillis(Date.now() + FOLLOWUP_MS[nextSequenceType])
        : null;

      await db.collection('conversations').doc(phone).set(
        { followUpsSent: newFollowUpsSent, nextFollowupAt },
        { merge: true }
      );

      await logStateChange(phone, 'esperando_cliente', 'esperando_cliente',
        `Follow-up ${nextType} enviado`, 'cron');

      console.log(`[CRON] Follow-up ${nextType} enviado a ${phone} (${nombre ?? 'sin nombre'}, ${curso ?? 'sin curso'})`);
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
      { chatState: 'frio', chatReason: `Sin actividad por ${diasSilencio} días`, chatUrgency: 'ninguna', nextFollowupAt: null },
      'cron'
    ).catch(e => console.error('[CRON] Error marcando frio silencio:', phone, e));

    console.log(`[CRON] ${phone} → frio (${diasSilencio}d sin actividad)`);
    results.frio++;
  }

  return NextResponse.json({ ok: true, ...results, ran_at: new Date().toISOString() });
}
