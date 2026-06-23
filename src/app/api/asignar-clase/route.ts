import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  getInscripcionData,
  getCandidato,
  createClaseAsignada,
} from '@/lib/firestore';

const ADMIN_PIN    = (process.env.ADMIN_PIN ?? '1234').trim();
const WA_TOKEN     = process.env.META_WHATSAPP_TOKEN ?? '';
const PHONE_ID     = process.env.META_PHONE_NUMBER_ID ?? '';

async function sendWA(to: string, text: string): Promise<void> {
  await fetch(`https://graph.facebook.com/v21.0/${PHONE_ID}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${WA_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body: text } }),
  });
}

function formatFechaWA(iso: string): string {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('es-MX', {
    weekday: 'short', day: 'numeric', month: 'short',
    timeZone: 'America/Mexico_City',
  });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const cookieStore = await cookies();
  if (cookieStore.get('admin_pin')?.value !== ADMIN_PIN) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { instructorPhone, alumnoPhone } = await req.json();
  if (!instructorPhone || !alumnoPhone) {
    return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
  }

  const [inscripcion, instructor] = await Promise.all([
    getInscripcionData(alumnoPhone),
    getCandidato(instructorPhone),
  ]);

  if (!inscripcion) return NextResponse.json({ error: 'Alumno no encontrado' }, { status: 404 });
  if (!instructor) return NextResponse.json({ error: 'Instructor no encontrado' }, { status: 404 });

  const primeraFecha = inscripcion.fechas?.[0];
  const fecha = primeraFecha?.date ?? '';
  const hora  = primeraFecha?.time ?? '';

  const claseId = await createClaseAsignada({
    alumnoPhone,
    alumnoNombre:     inscripcion.nombre,
    instructorPhone,
    instructorNombre: instructor.nombre ?? `+${instructorPhone}`,
    fecha,
    hora,
    zona:       inscripcion.zona,
    transmision: inscripcion.transmision,
    curso:      inscripcion.curso,
    estado:     'pendiente',
    notificadoEn: Date.now(),
  });

  const fechaLabel = fecha ? formatFechaWA(fecha) : 'por confirmar';
  const horaLabel  = hora ? `· ${hora}` : '';

  await sendWA(
    instructorPhone,
    `🎓 *Nueva clase asignada — UrbDriver*\n\n` +
    `👤 Alumno: ${inscripcion.nombre}\n` +
    `📚 Curso: ${inscripcion.curso}\n` +
    `📍 Zona: ${inscripcion.zona || 'CDMX'}\n` +
    `📅 Primera clase: ${fechaLabel} ${horaLabel}\n\n` +
    `Responde:\n` +
    `✅ *confirmada* — para aceptar\n` +
    `❌ *no puedo* — si no puedes\n\n` +
    `— Marco, UrbDriver 🚗`
  );

  return NextResponse.json({ ok: true, claseId });
}
