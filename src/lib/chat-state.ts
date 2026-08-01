import {
  db,
  updateChatState,
  getRecentMessages,
  type ChatState,
  type ChatLastBy,
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
  const dp      = phone.startsWith('52') && phone.length === 12 ? phone.slice(2) : phone;
  const nombre  = contactName ? `👤 ${contactName} (+${dp})` : `📱 +${dp}`;
  const preview = lastMessage.length > 120 ? lastMessage.slice(0, 120) + '…' : lastMessage;

  // Se delega en @/lib/adminNotify: revisa la respuesta de Meta y cae a
  // plantilla fuera de la ventana de 24h. El envío directo que había aquí
  // descartaba los rechazos en silencio y encima podía lanzar sin capturar.
  const { notificarAdmin } = await import('@/lib/adminNotify');
  await notificarAdmin(`⚡ *Tu turno*\n\n${nombre}\n💬 "${preview}"\n🎯 ${reason}`);
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
 * Quién habló al final. Se deriva SIEMPRE del mensaje real: antes era
 * `conv.chatLastBy ?? (...)` y el campo se volvía pegajoso — una vez en
 * 'cliente' ya nunca se recalculaba, la Regla 6 no podía aplicar y esa
 * conversación quedaba fuera de la secuencia de follow-ups para siempre.
 *
 * 'humano' es la excepción: marca que el equipo entró a mano y se conserva
 * mientras el cliente no vuelva a escribir, porque el cron lo usa para no
 * encimar follow-ups automáticos sobre una atención humana.
 */
export function quienEscribioAlFinal(
  guardado: ChatLastBy | undefined | null,
  ultimoRol: 'user' | 'bot' | undefined
): ChatLastBy {
  const real: ChatLastBy = ultimoRol === 'user' ? 'cliente' : 'luz';
  return guardado === 'humano' && real === 'luz' ? 'humano' : real;
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
    const lastBy = quienEscribioAlFinal(conv.chatLastBy, lastMsg?.role);

    // Si ya está cerrado, no recalcular
    const currentState: ChatState = conv.chatState ?? 'luz_atendiendo';
    if (currentState === 'cerrado') return;

    // Un cliente con inscripción CONFIRMADA (pagó, tiene clases agendadas) ES inscrito:
    // fuerza 'cerrado' y NUNCA lo degrades a frío por inactividad. La verdad es el pago,
    // no la conversación. Esto evita que alumnos pagados aparezcan como "frío"/"con Luz".
    if (conv.inscripcion?.status === 'confirmado') {
      await updateChatState(
        phone,
        {
          chatState: 'cerrado',
          chatReason: 'Inscripción confirmada (depósito pagado)',
          chatUrgency: 'ninguna',
          closedOutcome: 'ganado',
          // Fecha real del cierre = cuando pagó, no cuando el cron se enteró.
          closedAt: conv.inscripcion?.fechaConfirmacion ?? Timestamp.now(),
          nextFollowupAt: null,
        },
        trigger
      );
      return;
    }

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

    // Notificar al admin cuando transiciona A tu_turno o atascado
    if (
      (newState === 'tu_turno' && currentState !== 'tu_turno') ||
      (newState === 'atascado' && currentState !== 'atascado')
    ) {
      notifyAdminTuTurno(phone, reason, contactName, lastMsg?.text ?? '').catch(
        e => console.error('[CHAT-STATE] Error notificando admin:', e)
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
