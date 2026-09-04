import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getClasesActivas, updateClaseEstado } from '@/lib/firestore';
import { notificarAdmin } from '@/lib/adminNotify';

const ADMIN_PIN = (process.env.ADMIN_PIN ?? '1234').trim();
const WA_TOKEN = process.env.META_WHATSAPP_TOKEN ?? '';
const PHONE_ID = process.env.META_PHONE_NUMBER_ID ?? '';

async function sendWA(to: string, text: string): Promise<void> {
  await fetch(`https://graph.facebook.com/v21.0/${PHONE_ID}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${WA_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body: text } }),
  });
}

// Registro manual de una cancelación que el admin ya resolvió por teléfono
// (con el instructor o con el alumno) — para que quede reflejada en el
// sistema en vez de quedarse solo en la llamada.
export async function POST(req: NextRequest): Promise<NextResponse> {
  const cookieStore = await cookies();
  if (cookieStore.get('admin_pin')?.value !== ADMIN_PIN) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { claseId, motivo } = (await req.json()) as { claseId: string; motivo: 'instructor' | 'alumno' };
  if (!claseId || (motivo !== 'instructor' && motivo !== 'alumno')) {
    return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
  }

  const clases = await getClasesActivas();
  const clase = clases.find(c => c.id === claseId);
  if (!clase) return NextResponse.json({ error: 'Clase no encontrada o ya no activa' }, { status: 404 });

  await updateClaseEstado(claseId, 'cancelada');

  if (motivo === 'instructor') {
    // El admin ya habló con el instructor — solo falta avisar al alumno y dejar rastro.
    await notificarAdmin(
      `⚠️ *Clase cancelada (registrado por admin — instructor no puede)*\n👤 ${clase.instructorNombre}\n📅 ${clase.fecha} ${clase.hora} · ${clase.alumnoNombre}\n\nHay que reasignar.`
    ).catch(() => {});
    sendWA(clase.alumnoPhone,
      `Hola ${clase.alumnoNombre} 👋, tu instructor para la clase del ${clase.fecha} a las ${clase.hora} tuvo un imprevisto. Ya estamos buscando quién te cubra y te confirmamos en breve. Disculpa la molestia 🙏`
    ).catch(() => {});
  } else {
    // El admin ya habló con el alumno — solo falta avisar al instructor y dejar rastro.
    await notificarAdmin(
      `❌ *Clase cancelada (registrado por admin — alumno canceló)*\n👤 ${clase.alumnoNombre}\n📅 ${clase.fecha} ${clase.hora}\n🧑‍🏫 Instructor: ${clase.instructorNombre}`
    ).catch(() => {});
    if (clase.instructorPhone) {
      sendWA(clase.instructorPhone,
        `📢 ${clase.alumnoNombre} canceló la clase del ${clase.fecha} a las ${clase.hora}. No hace falta que vayas.`
      ).catch(() => {});
    }
  }

  return NextResponse.json({ ok: true });
}
