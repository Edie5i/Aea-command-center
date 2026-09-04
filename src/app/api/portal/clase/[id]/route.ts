import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { updateClaseEstado, getClasesDeInstructor } from '@/lib/firestore';
import type { EstadoClase } from '@/lib/firestore';
import { notificarAdmin } from '@/lib/adminNotify';

const WA_TOKEN = process.env.META_WHATSAPP_TOKEN ?? '';
const PHONE_ID = process.env.META_PHONE_NUMBER_ID ?? '';

async function sendWA(to: string, text: string): Promise<void> {
  await fetch(`https://graph.facebook.com/v21.0/${PHONE_ID}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${WA_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body: text } }),
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const phone = cookies().get('instructor_phone')?.value;
  if (!phone) return new NextResponse('Unauthorized', { status: 401 });

  const { estado } = (await request.json()) as { estado: EstadoClase };

  const clases = await getClasesDeInstructor(phone);
  const clase = clases.find(c => c.id === params.id);
  if (!clase) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  await updateClaseEstado(params.id, estado);

  // El instructor canceló desde el portal — antes esto quedaba en silencio: nadie
  // se enteraba y la clase nunca se reasignaba. Mismo aviso que el rechazo por
  // WhatsApp en marco.ts, para que admin y alumno se enteren de inmediato.
  if (estado === 'cancelada') {
    notificarAdmin(
      `⚠️ *Clase rechazada (portal)*\n👤 ${clase.instructorNombre} no puede\n📅 ${clase.fecha} ${clase.hora} · ${clase.alumnoNombre}\n\nHay que reasignar.`
    ).catch(() => {});
    sendWA(clase.alumnoPhone,
      `Hola ${clase.alumnoNombre} 👋, tu instructor para la clase del ${clase.fecha} a las ${clase.hora} tuvo un imprevisto. Ya estamos buscando quién te cubra y te confirmamos en breve. Disculpa la molestia 🙏`
    ).catch(() => {});
  }

  return new NextResponse('OK', { status: 200 });
}
