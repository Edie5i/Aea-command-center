// POST /api/calendar/sync-class
//
// Sincroniza una clase (ficha YA existente en Firestore) con Google Calendar.
// Idempotente: guarda calendarEventId en la ficha. Re-ejecutar actualiza el
// evento en vez de duplicarlo.
//
// Body (JSON):
// {
//   "alumno":      "Anastacia",            // requerido — coincide con fichas.studentName
//   "inicio":      "2026-06-06T10:00:00",  // requerido, hora local CDMX (sin Z, sin offset)
//   "tipoCurso":   "automatico",           // opcional; si se omite usa el de la ficha o "estándar"
//   "duracionMin": 120                     // opcional; default 120 min
// }

import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { db } from '@/lib/firestore';

const CALENDAR_ID          = process.env.GOOGLE_CALENDAR_ID ?? '';
const FICHAS_COLLECTION    = 'fichas';
const NAME_FIELD           = 'studentName';
const COURSE_FIELD         = 'tipoCurso';
const EVENT_ID_FIELD       = 'calendarEventId';
const TIME_ZONE            = 'America/Mexico_City';
const DEFAULT_DURATION_MIN = 120;

// Reusa el mismo patrón de auth que calendarService.ts:
// CALENDAR_KEY es un JSON de service account codificado en base64.
function getCalendarClient() {
  const raw = process.env.CALENDAR_KEY;
  if (!raw) throw new Error('Falta CALENDAR_KEY en el entorno');
  const json = Buffer.from(raw, 'base64').toString('utf-8');
  const creds = JSON.parse(json);
  creds.private_key = creds.private_key.replace(/\\n/g, '\n');
  const auth = new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ['https://www.googleapis.com/auth/calendar.events'],
  });
  return google.calendar({ version: 'v3', auth });
}

// Suma minutos sobre un ISO local puro (sin tz offset) usando UTC como
// contenedor neutro. CDMX ya no usa horario de verano — aritmética de pared segura.
function addMinutesLocal(localIso: string, minutes: number): string {
  const [datePart, timePart] = localIso.split('T');
  const [y, m, d] = datePart.split('-').map(Number);
  const [hh, mm, ss = 0] = timePart.split(':').map(Number);
  const base = new Date(Date.UTC(y, m - 1, d, hh, mm, ss));
  const out  = new Date(base.getTime() + minutes * 60_000);
  const p    = (n: number) => String(n).padStart(2, '0');
  return (
    `${out.getUTCFullYear()}-${p(out.getUTCMonth() + 1)}-${p(out.getUTCDate())}` +
    `T${p(out.getUTCHours())}:${p(out.getUTCMinutes())}:${p(out.getUTCSeconds())}`
  );
}

const ISO_LOCAL = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/;

export async function POST(req: NextRequest) {
  try {
    const { alumno, inicio, tipoCurso, duracionMin } = await req.json();

    if (!alumno || !inicio) {
      return NextResponse.json(
        { ok: false, error: 'Faltan campos requeridos: alumno e inicio' },
        { status: 400 },
      );
    }
    if (!ISO_LOCAL.test(inicio)) {
      return NextResponse.json(
        { ok: false, error: `inicio inválido — usa "AAAA-MM-DDThh:mm" hora local CDMX. Recibí: ${inicio}` },
        { status: 400 },
      );
    }
    if (!CALENDAR_ID) {
      return NextResponse.json(
        { ok: false, error: 'GOOGLE_CALENDAR_ID no está configurado en el entorno' },
        { status: 500 },
      );
    }

    // 1) Buscar ficha por nombre del alumno
    const snap = await db
      .collection(FICHAS_COLLECTION)
      .where(NAME_FIELD, '==', alumno)
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json(
        { ok: false, error: `No encontré ficha para "${alumno}"` },
        { status: 404 },
      );
    }

    const fichaRef = snap.docs[0].ref;
    const ficha    = snap.docs[0].data();
    const curso    = tipoCurso ?? ficha[COURSE_FIELD] ?? 'estándar';
    const dur      = Number(duracionMin) || DEFAULT_DURATION_MIN;
    const fin      = addMinutesLocal(inicio, dur);

    const eventBody = {
      summary:     `Clase ${curso} — ${alumno}`,
      description: `Curso: ${curso}\nAlumno: ${alumno}\nFicha: ${fichaRef.id}`,
      start: { dateTime: inicio, timeZone: TIME_ZONE },
      end:   { dateTime: fin,    timeZone: TIME_ZONE },
    };

    // 2) Crear o actualizar (idempotente)
    const calendar = getCalendarClient();
    const existingEventId: string | undefined = ficha[EVENT_ID_FIELD];
    let eventId: string;

    if (existingEventId) {
      const updated = await calendar.events.update({
        calendarId: CALENDAR_ID,
        eventId:    existingEventId,
        requestBody: eventBody,
      });
      eventId = updated.data.id!;
    } else {
      const created = await calendar.events.insert({
        calendarId: CALENDAR_ID,
        requestBody: eventBody,
      });
      eventId = created.data.id!;
    }

    // 3) Persistir referencias en la ficha
    await fichaRef.update({
      [EVENT_ID_FIELD]: eventId,
      [COURSE_FIELD]:   curso,
      horarioInicio:    inicio,
      ultimaSync:       new Date().toISOString(),
    });

    return NextResponse.json({
      ok: true,
      alumno,
      curso,
      eventId,
      inicio,
      fin,
      accion: existingEventId ? 'actualizado' : 'creado',
    });
  } catch (err: any) {
    console.error('[sync-class] error:', err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? 'Error desconocido' },
      { status: 500 },
    );
  }
}
