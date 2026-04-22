import { NextRequest, NextResponse } from 'next/server';
import { botContextData } from '@/lib/bot-data';

const TOKEN = process.env.META_VERIFY_TOKEN ?? 'aea_webhook_2026';
const WA_TOKEN = process.env.META_WHATSAPP_TOKEN ?? '';
const PHONE_ID = process.env.META_PHONE_NUMBER_ID ?? '';

const TPL = {
  bienvenida: `¡Hola! 👋 Bienvenido a *Auto Escuela Americana*.

Nuestros cursos más populares:
🚗 Principiante Automático — $3,900
🚗 Principiante Estándar — $3,400
🇺🇸 English Driving Course — $4,800

Escríbenos: *PRECIOS*, *HORARIOS*, *AGENDAR* o *UBICACION* para más info.`,

  asesor: `Gracias por escribirnos. Un asesor se pondrá en contacto contigo pronto.\n\nTambién puedes llamarnos directamente:\n📞 *56 3443 3212*`,

  ingles: `🇺🇸 *English Driving Course* — $4,800\n\nClases 100% en inglés para manejar en CDMX con confianza. Ideal para extranjeros o personas que prefieren aprender en inglés.\n\nEscribe *AGENDAR* para reservar tu clase o *PRECIOS* para ver todos los cursos.`,

  moto: `🏍️ *Curso de Motocicleta* — $4,300\n\nAprende a manejar moto desde cero: balance, arranque, frenado y maniobras en ciudad.\n\nEscribe *AGENDAR* para reservar o *ASESOR* para hablar con alguien.`,

  nervios: `💚 *Curso para Personas Nerviosas* — $5,100\n\nDiseñado especialmente para quienes sienten ansiedad o miedo al volante. Instructores con paciencia y metodología suave.\n\nEscribe *AGENDAR* para reservar o *ASESOR* para más información.`,

  automatico: `🚗 *Curso Principiante Automático* — $3,900\n\nPerfecto si nunca has manejado. Aprende en auto automático enfocándote en reglas de tránsito y maniobras esenciales.\n\nEscribe *AGENDAR* para reservar tu lugar.`,

  estandar: `🚗 *Curso Principiante Estándar* — $3,400\n\nDomina la transmisión manual desde cero: control del clutch, cambios de marcha y conducción segura.\n\nEscribe *AGENDAR* para reservar tu lugar.`,

  horarios: `🕐 *Horarios disponibles* (todos los días)\n\n• 7:00 am\n• 10:00 am\n• 1:00 pm (13h)\n• 4:00 pm (16h)\n• 7:00 pm (19h)\n\nConfirma disponibilidad al agendar en: app.autoescuelaamericana.com/agenda`,

  ubicacion: `📍 *Ubicación*\nTorreón #49, Col. Roma Sur, CDMX.\n\n🏠 También ofrecemos *servicio a domicilio* — el instructor llega a donde estés.\n\nEscribe *AGENDAR* para reservar.`,

  agendar: `📅 *Agenda tu clase aquí:*\n👉 https://app.autoescuelaamericana.com/agenda\n\nElige fecha, horario y curso. Si tienes dudas escribe *ASESOR* y te ayudamos.`,

  pago: `💳 *Métodos de pago*\n\n• Transferencia BBVA\n• Pago en OXXO\n• Tarjeta de crédito a *3 MSI* (meses sin intereses)\n\nEscribe *ASESOR* si necesitas más detalles.`,

  requisitos: `📋 *Requisitos*\n\n• Edad mínima: *16 años*\n• Menores de edad: constancia firmada por tutor (costo adicional $500)\n• Identificación oficial\n\nEscribe *AGENDAR* para reservar o *ASESOR* para dudas.`,

  cancelar: `🔄 *Política de cancelación / reprogramación*\n\nPuedes cancelar o reprogramar tu clase con *mínimo 24 horas de anticipación* sin penalización.\n\nEscribe *ASESOR* o llama al 56 3443 3212.`,

  precios: `💰 *Todos nuestros cursos:*\n\n🚗 Principiante Automático — $3,900\n🚗 Principiante Estándar — $3,400\n🇺🇸 English Driving Course — $4,800\n🏍️ Motocicleta — $4,300\n💚 Personas Nerviosas — $5,100\n🔄 Refresco — $1,800\n🅿️ Estacionamiento — $1,500\n🛣️ Carretera — $2,500\n🏙️ Ciudad Avanzado — $2,200\n\n¿Cuál te interesa? Escríbenos el nombre del curso.`,

  default: `Gracias por escribirnos. Un asesor te contactará pronto.\n\nMientras tanto puedes escribir:\n• *PRECIOS* — ver todos los cursos\n• *HORARIOS* — ver horarios disponibles\n• *AGENDAR* — reservar tu clase\n• *UBICACION* — dónde estamos`,
};

// Dedup: messageId → timestamp
const seen = new Map<string, number>();
const DEDUP_TTL = 5 * 60 * 1000;

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function classify(body: string): string {
  const t = normalize(body);

  if (t.length < 30 && /\b(hola|buenas|hey)\b/.test(t)) return TPL.bienvenida;
  if (/\b(asesor|humano|persona)\b/.test(t)) return TPL.asesor;
  if (/\b(ingles|english)\b/.test(t)) return TPL.ingles;
  if (/\b(moto|motocicleta)\b/.test(t)) return TPL.moto;
  if (/\b(nervios|ansiedad|miedo)\b/.test(t)) return TPL.nervios;
  if (/\b(automatico|automatica)\b/.test(t)) return TPL.automatico;
  if (/\b(estandar|manual|clutch)\b/.test(t)) return TPL.estandar;
  if (/\b(horario|hora|abren)\b/.test(t)) return TPL.horarios;
  if (/\b(direccion|donde|ubicacion)\b/.test(t)) return TPL.ubicacion;
  if (/\b(agendar|inscribir|apartar|reservar)\b/.test(t)) return TPL.agendar;
  if (/\b(pago|transferencia|tarjeta|msi)\b/.test(t)) return TPL.pago;
  if (/\b(requisito|menor|edad|constancia)\b/.test(t)) return TPL.requisitos;
  if (/\b(cancelar|reprogramar)\b/.test(t)) return TPL.cancelar;
  if (/\b(precio|costo|cuanto)\b/.test(t)) return TPL.precios;

  return TPL.default;
}

async function sendMessage(to: string, text: string): Promise<void> {
  const url = `https://graph.facebook.com/v21.0/${PHONE_ID}/messages`;
  await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${WA_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text },
    }),
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === TOKEN && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse('Forbidden', { status: 403 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const entry = body?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const messages = value?.messages;

    if (!messages?.length) {
      return new NextResponse('EVENT_RECEIVED', { status: 200 });
    }

    const message = messages[0];
    const msgId: string = message.id ?? '';
    const from: string = message.from ?? '';
    const textBody: string = message?.text?.body ?? '';

    if (!from || !textBody) {
      return new NextResponse('EVENT_RECEIVED', { status: 200 });
    }

    // Dedup
    const now = Date.now();
    for (const [id, ts] of seen) {
      if (now - ts > DEDUP_TTL) seen.delete(id);
    }
    if (seen.has(msgId)) {
      return new NextResponse('EVENT_RECEIVED', { status: 200 });
    }
    seen.set(msgId, now);

    const classification = classify(textBody);

if (classification === "TPL.agenda") {
  try {
    const result = await chatbotFlow({
      input: { message: textBody, fullContext: "Agenda de clase" }
    });
    const botResponse = result.response || "Clase agendada correctamente ✓";
    await sendMessage(from, botResponse);
  } catch (error) {
    console.error("Chatbot error:", error);
    await sendMessage(from, "Ocurrió un error al procesar tu solicitud. Por favor intenta nuevamente.");
  }
} else {
  await sendMessage(from, classification);
}
    await sendMessage(from, reply);

    // botContextData available for future enrichment
    void botContextData;
  } catch {
    // swallow errors — always ack Meta
  }

  return new NextResponse('EVENT_RECEIVED', { status: 200 });
}
