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
    // sendFicha: true sólo cuando el caller crea una ficha nueva (/admin/importar).
    // El botón "Calendar" de FichaButton reusa esta misma ruta para re-sincronizar
    // fichas YA existentes — ahí no debe reenviar el PDF cada vez que se clickea.
    const sendFicha = body.sendFicha === true;
    let fichaPayload: { nombre: string; telefono: string; zona: string; curso: string; transmision: string; fechas: { date: string; time: string }[] } | null = null;

    const [result] = await Promise.all([
      scheduleAndCreateEvents(body),
      // Guardar inscripción en Firestore en paralelo con GC
      (body.phone && body.name)
        ? (() => {
            const phone = normalizePhone(body.phone);
            const fechas = (body.dates ?? [])
              .filter((d: { date: string; time?: string }) => d.date && d.time)
              .map((d: { date: string; time: string }) => ({
                date: new Date(d.date).toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' }),
                time: d.time,
              }));
            fichaPayload = {
              nombre: body.name,
              telefono: phone,
              zona: body.address ?? '',
              curso: body.transmission ?? 'Automático',
              transmision: body.transmission ?? 'Automático',
              fechas,
            };
            return saveInscripcionData(phone, fichaPayload)
              .catch(e => console.error('[FICHA] Error guardando en Firestore:', e));
          })()
        : Promise.resolve(),
    ]);

    if (sendFicha && fichaPayload) {
      const payload = fichaPayload;
      import('@/lib/ficha-pdf-server').then(({ enviarFichaAdminWhatsApp }) => {
        enviarFichaAdminWhatsApp(payload)
          .catch(e => console.error('[FICHA] Error enviando ficha PDF al admin:', e));
        enviarFichaAdminWhatsApp(payload, payload.telefono)
          .catch(e => console.error('[FICHA] Error enviando ficha PDF al alumno:', e));
      }).catch(e => console.error('[FICHA] Error importando ficha-pdf-server:', e));
    }

    return NextResponse.json({
      ok: true,
      created: result.created,
      omitidos: result.omitidos,
      total: result.total,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error al crear eventos';
    console.error('[FICHA] Error en calendario:', msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
