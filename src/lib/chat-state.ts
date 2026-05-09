import {
  db,
  updateChatState,
  getRecentMessages,
  type ChatState,
  type ChatUrgency,
  type StateChangeTrigger,
} from '@/lib/firestore';
import { Timestamp } from 'firebase-admin/firestore';

async function notifyAdminTuTurno(
  phone: string,
  reason: string,
  contactName: string | null,
  lastMessage: string
): Promise<void> {
  const WA_TOKEN  = process.env.META_WHATSAPP_TOKEN ?? '';
  const PHONE_ID  = process.env.META_PHONE_NUMBER_ID ?? '';
  const ADMIN     = (process.env.ADMIN_NOTIFICATION_PHONE ?? '525634433212').trim();
  if (!WA_TOKEN || !PHONE_ID) return;

  const dp      = phone.startsWith('52') && phone.length === 12 ? phone.slice(2) : phone;
  const nombre  = contactName ? `👤 ${contactName} (+${dp})` : `📱 +${dp}`;
  const preview = lastMessage.length > 120 ? lastMessage.slice(0, 120) + '…' : lastMessage;

  await fetch(`https://graph.facebook.com/v21.0/${PHONE_ID}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${WA_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: ADMIN,
      type: 'text',
      text: { body: `⚡ *Tu turno*\n\n${nombre}\n💬 "${preview}"\n🎯 ${reason}` },
    }),
  });
}

// ms por tipo de follow-up
const FOLLOWUP_MS: Record<string, number> = {
  '2h':  2  * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '72h': 72 * 60 * 60 * 1000,
  '7d':  7  * 24 * 60 * 60 * 1000,
};
const FOLLOWUP_SEQUENCE = ['2h', '24h', '72h', '7d'] as const;
const FRIO_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

function nextFollowupAt(followUpsSent: Array<{ type: string }>): Timestamp | null {
  const nextType = FOLLOWUP_SEQUENCE[followUpsSent.length];
  if (!nextType) return null;
  return Timestamp.fromMillis(Date.now() + FOLLOWUP_MS[nextType]);
}

/**
 * Recalculates and persists the pipeline state for a conversation.
 * Safe to call fire-and-forget — all errors are caught internally.
 */
export async function recalculateChatState(
  phone: string,
  trigger: StateChangeTrigger
): Promise<void> {
  try {
    const convRef = db.collection('conversations').doc(phone);
    const [convSnap, messages] = await Promise.all([
      convRef.get(),
      getRecentMessages(phone, 10),
    ]);

    const conv = convSnap.data() ?? {};
    const followUpsSent: Array<{ type: string }> = conv.followUpsSent ?? [];
    const lastMessageAt: number = conv.lastActivity?.toMillis?.() ?? Date.now();
    const silenceMs = Date.now() - lastMessageAt;

    // Determinar quién mandó el último mensaje
    const lastMsg = messages[messages.length - 1];
    const lastBy = conv.chatLastBy ?? (lastMsg?.role === 'user' ? 'cliente' : 'luz');

    // Si ya está cerrado, no recalcular
    const currentState: ChatState = conv.chatState ?? 'luz_atendiendo';
    if (currentState === 'cerrado') return;

    let newState: ChatState = 'luz_atendiendo';
    let reason = 'Luz atendiendo';
    let urgency: ChatUrgency = 'ninguna';
    let courseInterest: string | null = conv.courseInterest ?? null;
    let coursePrice: string | null = conv.coursePrice ?? null;
    let qualifiedAt: Timestamp | null = conv.qualifiedAt ?? null;
    let contactName: string | null = conv.contactName ?? null;
    let newNextFollowupAt: Timestamp | null = conv.nextFollowupAt ?? null;

    // ── Reglas en orden de prioridad ─────────────────────────────────────────

    if (lastBy === 'cliente' && lastMsg) {
      // Importación dinámica para no arrastrar Genkit al bundle del webhook
      const { classifyClientMessage } = await import('@/ai/flows/classify-client-message');

      // Construir contexto: los 5 mensajes anteriores al último
      const contextMsgs = messages.slice(-6, -1).map(
        m => `${m.role === 'user' ? 'Cliente' : 'Luz'}: ${m.text}`
      );

      const classification = await classifyClientMessage(lastMsg.text, contextMsgs);
      console.log(`[CHAT-STATE] ${phone} → intent=${classification.intent} (${classification.confidence.toFixed(2)})`);

      // Actualizar datos de calificación si se detectó curso
      if (classification.detected_course) {
        courseInterest = classification.detected_course;
        coursePrice = classification.detected_price;
        qualifiedAt = qualifiedAt ?? Timestamp.now();
      }
      if (classification.intent === 'info_personal' && !contactName) {
        if (classification.detected_name) contactName = classification.detected_name;
      }

      // Regla 1: compra
      if (classification.intent === 'compra') {
        newState = 'tu_turno';
        reason = 'Listo para cerrar';
        urgency = 'alta';
      }
      // Regla 2: objeción
      else if (classification.intent === 'objecion') {
        newState = 'tu_turno';
        reason = `Objeción: ${classification.reasoning}`;
        urgency = 'alta';
      }
      // Regla 3: pide humano
      else if (classification.intent === 'pide_humano') {
        newState = 'tu_turno';
        reason = 'Pidió asesor humano';
        urgency = 'alta';
      }
      // Regla 4: frustración
      else if (classification.intent === 'frustracion') {
        newState = 'atascado';
        reason = 'Cliente frustrado';
        urgency = 'alta';
      }
      // Regla 5: si Luz respondió y el cliente volvió a escribir, Luz está atendiendo
      else {
        newState = 'luz_atendiendo';
        reason = 'Cliente activo';
        urgency = 'baja';
        newNextFollowupAt = null; // reset follow-up si el cliente respondió
      }
    } else if (lastBy === 'luz') {
      // Regla 6: Luz mandó el último mensaje → esperando respuesta del cliente
      newState = 'esperando_cliente';
      reason = 'Esperando respuesta del cliente';
      urgency = 'ninguna';
      // Calcular cuándo disparar el primer (o siguiente) follow-up
      newNextFollowupAt = nextFollowupAt(followUpsSent);
    }

    // Regla 7 (override): silencio >7d → frío (solo si no es tu_turno/atascado)
    if (
      silenceMs > FRIO_AFTER_MS &&
      newState !== 'tu_turno' &&
      newState !== 'atascado'
    ) {
      newState = 'frio';
      reason = `Sin actividad por ${Math.floor(silenceMs / 86400000)} días`;
      urgency = 'ninguna';
    }

    // Regla 8: detectar Luz atascada (2+ "no entendí" en los últimos 10 mensajes)
    if (newState === 'luz_atendiendo') {
      const botMsgs = messages.filter(m => m.role === 'bot');
      const confusionCount = botMsgs.filter(m =>
        /no entend[íi]|no comprend|podr[íi]as repetir|disculpa, no|lo siento, no/i.test(m.text)
      ).length;
      if (confusionCount >= 2) {
        newState = 'atascado';
        reason = `Luz no entendió ${confusionCount} veces seguidas`;
        urgency = 'alta';
      }
    }

    // Notificar al admin solo cuando el estado transiciona A tu_turno
    if (newState === 'tu_turno' && currentState !== 'tu_turno') {
      notifyAdminTuTurno(phone, reason, contactName, lastMsg?.text ?? '').catch(
        e => console.error('[CHAT-STATE] Error notificando admin tu_turno:', e)
      );
    }

    await updateChatState(
      phone,
      {
        chatState: newState,
        chatReason: reason,
        chatUrgency: urgency,
        chatLastBy: lastBy,
        chatLastPreview: lastMsg?.text?.slice(0, 200) ?? '',
        courseInterest,
        coursePrice,
        qualifiedAt,
        contactName,
        nextFollowupAt: newNextFollowupAt,
      },
      trigger
    );
  } catch (err) {
    console.error('[CHAT-STATE] Error recalculando estado para', phone, err);
  }
}
