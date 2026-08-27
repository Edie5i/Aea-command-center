import { NextRequest, NextResponse } from 'next/server';
import {
  getClasesPorFecha,
  marcarRecordatorioClaseEnviado,
  type ClaseAsignada,
} from '@/lib/firestore';
import { notificarAdmin } from '@/lib/adminNotify';

const TOKEN = process.env.META_VERIFY_TOKEN ?? 'aea_webhook_2026';
const WA_TOKEN = process.env.META_WHATSAPP_TOKEN ?? '';
const PHONE_ID = process.env.META_PHONE_NUMBER_ID ?? '';

async function sendWA(to: string, text: string): Promise<void> {
  const res = await fetch(`https://graph.facebook.com/v21.0/${PHONE_ID}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${WA_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body: text } }),
  });
  if (!res.ok) {
    console.error('[REMINDER-CLASE] WhatsApp error:', res.status, await res.text());
  }
}

function mananaMX(): string {
  const now = new Date();
  const manana = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  return manana.toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });
}

function mensajeConfirmada(clase: ClaseAsignada): string {
  const nombreCorto = clase.alumnoNombre.split(' ')[0];
  return (
    `¡Hola ${nombreCorto}! 👋 Soy Luz, de Auto Escuela Americana.\n\n` +
    `Mañana empieza tu primera clase 🚗\n\n` +
    `🧑‍🏫 Instructor: ${clase.instructorNombre}\n` +
    `🕒 Hora: ${clase.hora}\n` +
    `📍 Zona: ${clase.zona}\n\n` +
    `Antes de empezar te dejo dos cosas útiles:\n` +
    `📘 Programa del curso: https://autoescuelaamericana.com/programa\n\n` +
    `💳 Recuerda: tu depósito apartó el lugar — el resto del pago se liquida al terminar esta primera clase (efectivo, transferencia o tarjeta). Términos y condiciones: https://autoescuelaamericana.com/terminos\n\n` +
    `¡Nos vemos mañana! 🙌`
  );
}

function mensajeSinConfirmar(clase: ClaseAsignada): string {
  const nombreCorto = clase.alumnoNombre.split(' ')[0];
  return (
    `¡Hola ${nombreCorto}! 👋 Soy Luz, de Auto Escuela Americana.\n\n` +
    `Mañana empieza tu primera clase 🚗 a las ${clase.hora} en ${clase.zona}. ` +
    `Tu instructor te confirma en breve.\n\n` +
    `Antes de empezar te dejo dos cosas útiles:\n` +
    `📘 Programa del curso: https://autoescuelaamericana.com/programa\n\n` +
    `💳 Recuerda: tu depósito apartó el lugar — el resto del pago se liquida al terminar esta primera clase (efectivo, transferencia o tarjeta). Términos y condiciones: https://autoescuelaamericana.com/terminos\n\n` +
    `¡Nos vemos mañana! 🙌`
  );
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  if (token !== TOKEN) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const fecha = mananaMX();
  const clases = await getClasesPorFecha(fecha);
  const pendientes = clases.filter(
    c => (c.estado === 'pendiente' || c.estado === 'confirmada') && !c.recordatorioEnviado
  );

  let enviados = 0;
  for (const clase of pendientes) {
    const mensaje = clase.estado === 'confirmada'
      ? mensajeConfirmada(clase)
      : mensajeSinConfirmar(clase);

    await sendWA(clase.alumnoPhone, mensaje).catch(e =>
      console.error('[REMINDER-CLASE] Error enviando a', clase.alumnoPhone, e)
    );

    if (clase.estado === 'pendiente') {
      notificarAdmin(
        `⚠️ *Clase de mañana sin confirmar*\n\n👤 ${clase.alumnoNombre} · 🕒 ${clase.hora}\n🧑‍🏫 Instructor asignado: ${clase.instructorNombre} (no ha confirmado)\n\nPersígnale para que confirme.`
      ).catch(e => console.error('[REMINDER-CLASE] Error notificando admin:', e));
    }

    await marcarRecordatorioClaseEnviado(clase.id);
    enviados++;
    console.log('[REMINDER-CLASE] Recordatorio enviado a', clase.alumnoPhone, '| estado:', clase.estado);
  }

  return NextResponse.json({ ok: true, fecha, enviados });
}
