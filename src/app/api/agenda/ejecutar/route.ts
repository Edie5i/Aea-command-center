import { NextRequest, NextResponse } from 'next/server';
import { buscarEventosPorAlumno, moverEvento, cancelarEvento, getEventosProximos } from '@/services/calendarService';
import { scheduleAndCreateEvents } from '@/ai/flows/create-calendar-event';
import { saveInscripcionData, buscarInscripcionPorNombre } from '@/lib/firestore';

function normalizePhone(raw: string): string {
  let p = raw.replace(/\D/g, '');
  if (p.startsWith('521') && p.length === 13) p = '52' + p.slice(3);
  if (p.startsWith('52') && p.length === 12) return p;
  if (p.length === 10) return '52' + p;
  return p;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { accion, alumno, curso, fecha, hora, telefono, eventId } = body;

  try {
    // ── nueva_ficha ──────────────────────────────────────────────
    if (accion === 'nueva_ficha') {
      if (!alumno || !fecha || !hora) {
        return NextResponse.json({ ok: false, error: 'Faltan datos: alumno, fecha y hora son obligatorios.' });
      }
      const result = await scheduleAndCreateEvents({
        name: alumno,
        phone: normalizePhone(telefono ?? '0000000000'),
        address: 'Por confirmar',
        transmission: curso ?? 'Automático',
        dates: [{ date: new Date(fecha + 'T12:00:00').toISOString(), time: hora }],
      });
      if (telefono) {
        saveInscripcionData(normalizePhone(telefono), {
          nombre: alumno, telefono: normalizePhone(telefono),
          zona: 'Por confirmar', transmision: curso ?? 'Automático',
          fechas: [{ date: fecha, time: hora }],
        }).catch(() => {});
      }
      return NextResponse.json({ ok: true, mensaje: `Ficha creada: ${result.message}` });
    }

    // ── mover_clase ──────────────────────────────────────────────
    if (accion === 'mover_clase') {
      if (!alumno) return NextResponse.json({ ok: false, error: 'Falta el nombre del alumno.' });
      if (!fecha || !hora) return NextResponse.json({ ok: false, error: 'Faltan fecha y hora nuevas.' });

      // Si el cliente ya seleccionó el evento concreto
      if (eventId) {
        await moverEvento(eventId, fecha, hora);
        return NextResponse.json({ ok: true, mensaje: `Clase movida al ${fecha} a las ${hora}.` });
      }

      // Buscar eventos del alumno
      const eventos = await buscarEventosPorAlumno(alumno);
      if (eventos.length === 0) {
        return NextResponse.json({ ok: false, error: `No se encontraron clases próximas de "${alumno}".` });
      }
      if (eventos.length > 1) {
        return NextResponse.json({ ok: false, error: 'multiple', eventos });
      }
      await moverEvento(eventos[0].id, fecha, hora);
      return NextResponse.json({ ok: true, mensaje: `Clase de ${alumno} movida al ${fecha} a las ${hora}.` });
    }

    // ── cancelar_clase ───────────────────────────────────────────
    if (accion === 'cancelar_clase') {
      if (!alumno) return NextResponse.json({ ok: false, error: 'Falta el nombre del alumno.' });

      if (eventId) {
        await cancelarEvento(eventId);
        return NextResponse.json({ ok: true, mensaje: `Clase cancelada.` });
      }

      const eventos = await buscarEventosPorAlumno(alumno);
      if (eventos.length === 0) {
        return NextResponse.json({ ok: false, error: `No se encontraron clases próximas de "${alumno}".` });
      }
      if (eventos.length > 1) {
        return NextResponse.json({ ok: false, error: 'multiple', eventos });
      }
      await cancelarEvento(eventos[0].id);
      return NextResponse.json({ ok: true, mensaje: `Clase de ${alumno} cancelada.` });
    }

    // ── agendar_ficha ────────────────────────────────────────────
    if (accion === 'agendar_ficha') {
      if (!alumno) return NextResponse.json({ ok: false, error: 'Falta el nombre del alumno.' });

      const inscripciones = await buscarInscripcionPorNombre(alumno);
      if (inscripciones.length === 0) {
        return NextResponse.json({ ok: false, error: `No se encontró ficha de inscripción para "${alumno}". Verifica el nombre.` });
      }

      const ins = inscripciones[0];
      const result = await scheduleAndCreateEvents({
        name: ins.nombre,
        phone: ins.telefono,
        address: ins.zona || 'Por confirmar',
        transmission: ins.transmision,
        dates: ins.fechas.map(f => ({
          date: new Date(f.date + 'T12:00:00').toISOString(),
          time: f.time,
        })),
      });

      return NextResponse.json({
        ok: true,
        mensaje: `${ins.fechas.length} clase(s) de ${ins.nombre} agendadas en Calendar.`,
      });
    }

    // ── consultar_agenda ─────────────────────────────────────────
    if (accion === 'consultar_agenda') {
      const todos = await getEventosProximos(14);

      let eventosFiltrados = todos;
      if (fecha) {
        eventosFiltrados = todos.filter(e => e.inicio.startsWith(fecha));
      }

      if (eventosFiltrados.length === 0) {
        const label = fecha ?? 'próximos días';
        return NextResponse.json({ ok: true, consulta: true, eventos: [], mensaje: `No hay clases agendadas para ${label}.` });
      }

      return NextResponse.json({ ok: true, consulta: true, eventos: eventosFiltrados });
    }

    return NextResponse.json({ ok: false, error: `Acción desconocida: ${accion}` });

  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error al ejecutar';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
