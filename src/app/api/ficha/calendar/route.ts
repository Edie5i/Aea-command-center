import { NextRequest, NextResponse } from 'next/server';
import { scheduleAndCreateEvents } from '@/ai/flows/create-calendar-event';
import { saveInscripcionData } from '@/lib/firestore';

function normalizePhone(raw: string): string {
  let p = raw.replace(/\D/g, '');
  if (p.startsWith('521') && p.length === 13) p = '52' + p.slice(3);
  if (p.startsWith('52') && p.length === 12) return p;
  if (p.length === 10) return '52' + p;
  return p;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await scheduleAndCreateEvents(body);

    // Guardar en Firestore para que aparezca el botón de Ficha PDF en el admin
    if (body.phone && body.name) {
      const phone = normalizePhone(body.phone);
      const fechas = (body.dates ?? [])
        .filter((d: { date: string; time?: string }) => d.date && d.time)
        .map((d: { date: string; time: string }) => ({
          date: new Date(d.date).toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' }),
          time: d.time,
        }));
      saveInscripcionData(phone, {
        nombre: body.name,
        telefono: phone,
        zona: body.address ?? '',
        transmision: body.transmission ?? 'Automático',
        fechas,
      }).catch(e => console.error('[FICHA] Error guardando en Firestore:', e));
    }

    return NextResponse.json({ ok: true, created: result.created, total: result.total });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error al crear eventos';
    console.error('[FICHA] Error en calendario:', msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
