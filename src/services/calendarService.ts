import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import type { calendar_v3 } from 'googleapis';

const SLOTS_STANDARD = ['07:00', '10:00', '13:00', '16:00', '19:00'];
const DIAS_ES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

export interface SlotDisponible {
  fecha: string;
  diaSemana: string;
  horariosLibres: string[];
}

export async function getAvailableSlots(days: number = 7): Promise<SlotDisponible[]> {
  const auth = getCalendarAuth();
  const calendar = google.calendar({ version: 'v3', auth });
  const calendarId = process.env.GOOGLE_CALENDAR_ID!;

  const now = new Date();
  const timeMax = new Date(now.getTime() + (days + 1) * 24 * 60 * 60 * 1000);

  const response = await calendar.events.list({
    calendarId,
    timeMin: now.toISOString(),
    timeMax: timeMax.toISOString(),
    timeZone: 'America/Mexico_City',
    singleEvents: true,
    orderBy: 'startTime',
  });

  const events = response.data.items ?? [];

  const result: SlotDisponible[] = [];
  for (let d = 1; d <= days; d++) {
    const day = new Date();
    day.setDate(day.getDate() + d);
    const dateStr = day.toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });

    const dayEvents = events.filter(e => {
      const start = e.start?.dateTime ?? e.start?.date ?? '';
      return start.startsWith(dateStr);
    });

    const busyStartTimes = dayEvents
      .map(e => {
        const startDT = e.start?.dateTime;
        if (!startDT) return null;
        return new Date(startDT).toLocaleTimeString('en-GB', {
          timeZone: 'America/Mexico_City',
          hour: '2-digit',
          minute: '2-digit',
        });
      })
      .filter((t): t is string => t !== null);

    const horariosLibres = SLOTS_STANDARD.filter(s => !busyStartTimes.includes(s));
    const dayOfWeek = new Date(dateStr + 'T12:00:00').getDay();

    result.push({
      fecha: dateStr,
      diaSemana: DIAS_ES[dayOfWeek],
      horariosLibres,
    });
  }

  return result;
}

function getCalendarAuth(): JWT {
    const calendarId = process.env.GOOGLE_CALENDAR_ID;
    const calendarKeyBase64 = process.env.CALENDAR_KEY;

    if (!calendarId || calendarId.trim() === '') {
        throw new Error('CONFIGURACIÓN REQUERIDA: La variable de entorno GOOGLE_CALENDAR_ID no está configurada.');
    }

    if (!calendarKeyBase64 || calendarKeyBase64.trim() === '') {
        throw new Error('CONFIGURACIÓN REQUERIDA: La credencial CALENDAR_KEY no está configurada.');
    }
    
    let credentials;
    try {
        const calendarKey = Buffer.from(calendarKeyBase64, 'base64').toString('utf-8');
        credentials = JSON.parse(calendarKey);
        credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
    } catch (error) {
        throw new Error('CONFIGURACIÓN REQUERIDA: La credencial CALENDAR_KEY es inválida. Asegúrate de haber copiado el contenido completo del archivo JSON y que esté codificado en Base64 correctamente.');
    }

    if (!credentials.client_email || !credentials.private_key) {
        throw new Error('CONFIGURACIÓN REQUERIDA: El JSON de la credencial CALENDAR_KEY es inválido. Faltan las propiedades `client_email` o `private_key`.');
    }

    return new JWT({
        email: credentials.client_email,
        key: credentials.private_key,
        scopes: ['https://www.googleapis.com/auth/calendar'],
    });
}

export interface EventoCalendario {
  id: string;
  alumno: string;
  telefono?: string;
  inicio: string;
  fin: string;
  ubicacion?: string;
  colorId?: string;
}

export async function getEventosProximos(dias = 7): Promise<EventoCalendario[]> {
  const auth = getCalendarAuth();
  const calendar = google.calendar({ version: 'v3', auth });
  const calendarId = process.env.GOOGLE_CALENDAR_ID!;

  const now = new Date();
  const timeMax = new Date(now.getTime() + dias * 24 * 60 * 60 * 1000);

  const response = await calendar.events.list({
    calendarId,
    timeMin: now.toISOString(),
    timeMax: timeMax.toISOString(),
    timeZone: 'America/Mexico_City',
    singleEvents: true,
    orderBy: 'startTime',
  });

  return (response.data.items ?? []).map(e => {
    const summary = e.summary ?? '';
    const alumno = summary.startsWith('Clase: ') ? summary.slice(7) : summary;
    const desc = e.description ?? '';
    const phoneMatch = desc.match(/Teléfono:<\/b>\s*(\d+)/);
    return {
      id: e.id ?? '',
      alumno,
      telefono: phoneMatch?.[1],
      inicio: e.start?.dateTime ?? e.start?.date ?? '',
      fin: e.end?.dateTime ?? e.end?.date ?? '',
      ubicacion: e.location ?? undefined,
      colorId: e.colorId ?? undefined,
    };
  });
}

export async function createFichaEvent(details: {
  studentName: string;
  studentPhone: string;
  completedTopics: string[];
  pendingTopics: string[];
  completedCount: number;
  totalTopics: number;
}): Promise<void> {
  const auth = getCalendarAuth();
  const calendar = google.calendar({ version: 'v3', auth });
  const calendarId = process.env.GOOGLE_CALENDAR_ID!;

  const now = new Date();
  const nowMX = now.toLocaleString('en-CA', { timeZone: 'America/Mexico_City', hour12: false });
  const [datePart, timePart] = nowMX.split(', ');
  const startLocal = `${datePart}T${timePart}`;
  const endLocal = new Date(now.getTime() + 9000000) // +2.5h
    .toLocaleString('en-CA', { timeZone: 'America/Mexico_City', hour12: false })
    .replace(', ', 'T');

  const pct = details.totalTopics > 0
    ? Math.round((details.completedCount / details.totalTopics) * 100)
    : 0;

  const coveredList = details.completedTopics.slice(0, 5)
    .map(t => `• ${t}`)
    .join('<br>');
  const pendingList = details.pendingTopics.slice(0, 5)
    .map(t => `• ${t}`)
    .join('<br>');
  const moreCovered = details.completedTopics.length > 5
    ? `<br>+${details.completedTopics.length - 5} más` : '';
  const morePending = details.pendingTopics.length > 5
    ? `<br>+${details.pendingTopics.length - 5} más` : '';

  const description =
    `<b>Alumno:</b> ${details.studentName}<br>` +
    `<b>Teléfono:</b> ${details.studentPhone}<br>` +
    `<b>Avance:</b> ${details.completedCount}/${details.totalTopics} temas (${pct}%)<br><br>` +
    `<b>✅ Cubiertos:</b><br>${coveredList}${moreCovered}<br><br>` +
    `<b>📝 Pendientes:</b><br>${pendingList}${morePending}<br><br>` +
    `<i>Ficha generada automáticamente por la App de AEA.</i>`;

  await calendar.events.insert({
    calendarId,
    requestBody: {
      summary: `Ficha: ${details.studentName}`,
      description,
      start: { dateTime: startLocal, timeZone: 'America/Mexico_City' },
      end: { dateTime: endLocal, timeZone: 'America/Mexico_City' },
    },
  });
}

export async function buscarEventosPorAlumno(nombre: string): Promise<EventoCalendario[]> {
  const todos = await getEventosProximos(30);
  const q = nombre.toLowerCase();
  return todos.filter(e => e.alumno.toLowerCase().includes(q));
}

/**
 * Devuelve las claves "YYYY-MM-DDTHH:mm" que YA tienen evento para ese alumno.
 * Sirve para no volver a crear una clase idéntica: seis rutas distintas crean
 * eventos (webhook, herramienta de Luz, botón Calendar del panel, importador y
 * las dos de agenda) y ninguna sabía de las otras.
 */
export async function eventosYaCreados(
  studentName: string,
  fechas: { date: string; time: string }[],
): Promise<Set<string>> {
  const claves = new Set<string>();
  if (fechas.length === 0) return claves;

  const auth = getCalendarAuth();
  const calendar = google.calendar({ version: 'v3', auth });
  const calendarId = process.env.GOOGLE_CALENDAR_ID!;

  const ordenadas = fechas.map(f => f.date).sort();
  const res = await calendar.events.list({
    calendarId,
    timeMin: `${ordenadas[0]}T00:00:00-06:00`,
    timeMax: `${ordenadas[ordenadas.length - 1]}T23:59:59-06:00`,
    singleEvents: true,
    maxResults: 500,
  });

  const summary = `Clase: ${studentName}`;
  for (const e of res.data.items ?? []) {
    if ((e.summary ?? '') !== summary) continue;
    const dt = e.start?.dateTime;
    if (dt) claves.add(dt.slice(0, 16)); // "2026-08-01T07:00:00-06:00" → "2026-08-01T07:00"
  }
  return claves;
}

export async function moverEvento(eventId: string, nuevaFecha: string, nuevaHora: string): Promise<void> {
  const auth = getCalendarAuth();
  const calendar = google.calendar({ version: 'v3', auth });
  const calendarId = process.env.GOOGLE_CALENDAR_ID!;

  const startTimeLocal = `${nuevaFecha}T${nuevaHora}:00`;
  const tempEnd = new Date(new Date(startTimeLocal + 'Z').getTime() + 9000000);
  const endTimeLocal = tempEnd.toISOString().substring(0, 19);

  await calendar.events.patch({
    calendarId,
    eventId,
    requestBody: {
      start: { dateTime: startTimeLocal, timeZone: 'America/Mexico_City' },
      end:   { dateTime: endTimeLocal,   timeZone: 'America/Mexico_City' },
    },
  });
}

export async function cancelarEvento(eventId: string): Promise<void> {
  const auth = getCalendarAuth();
  const calendar = google.calendar({ version: 'v3', auth });
  const calendarId = process.env.GOOGLE_CALENDAR_ID!;
  await calendar.events.delete({ calendarId, eventId });
}

interface EventDetails {
  studentName: string;
  studentPhone: string;
  studentAddress: string;
  transmission: string;
  isMinor: boolean;
  notes?: string;
  classDate: Date; // This is a Date object from the flow
  classTime: string; // "HH:mm"
  sessionIndex?: number; // para alternar colores entre sesiones
}

export async function createCalendarEvent(details: EventDetails): Promise<string | null> {
    const auth = getCalendarAuth();
    const calendar = google.calendar({ version: 'v3', auth });
    const calendarId = process.env.GOOGLE_CALENDAR_ID!;

    // Construct date/time strings for the 'America/Mexico_City' timezone explicitly.
    // This avoids issues with the server's default UTC timezone.
    const datePart = details.classDate.toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" }); // "YYYY-MM-DD"
    const startTimeLocal = `${datePart}T${details.classTime}:00`;

    // To calculate the end time, create a Date object assuming the local time is UTC,
    // perform the addition, and then format it back to a local time string.
    const tempStartDate = new Date(startTimeLocal + 'Z'); // Treat as UTC for calculation purposes
    const tempEndDate = new Date(tempStartDate.getTime() + 9000000); // Add 2.5 hours (9,000,000 ms)
    const endTimeLocal = tempEndDate.toISOString().substring(0, 19); // Extracts "YYYY-MM-DDTHH:mm:ss"

    // Pares de colores alternados por transmisión [par, impar]
    const colorPairs: Record<string, [string, string]> = {
        'automático': ['7', '8'],   // Peacock ↔ Blueberry (azules)
        'estándar':   ['6', '5'],   // Tangerine ↔ Banana (cálidos)
        'moto':       ['6', '4'],   // Tangerine ↔ Flamingo
        'english':    ['2', '9'],   // Sage ↔ Basil (verdes)
        'intensivo':  ['10', '4'],  // Tomato ↔ Flamingo (rojos)
        'nerviosas':  ['1', '3'],   // Lavender ↔ Grape (lilas)
        'mixto':      ['3', '1'],   // Grape ↔ Lavender
        'avanzado':   ['5', '6'],   // Banana ↔ Tangerine
        'intermedio': ['9', '2'],   // Basil ↔ Sage
    };
    const txKey = details.transmission.toLowerCase();
    const pair = Object.entries(colorPairs).find(([k]) => txKey.includes(k))?.[1] ?? ['7', '8'];
    const colorId = pair[(details.sessionIndex ?? 0) % 2];

    const calendarAttendee = process.env.CALENDAR_ATTENDEE_EMAIL;
    const event: calendar_v3.Params$Resource$Events$Insert['requestBody'] = {
        summary: `Clase: ${details.studentName}`,
        location: details.studentAddress,
        colorId,
        description: `<b>Alumno:</b> ${details.studentName}<br><b>Teléfono:</b> ${details.studentPhone}<br><b>Transmisión:</b> ${details.transmission}${details.isMinor ? '<br><b>Modalidad:</b> MENOR DE EDAD' : ''}${details.notes ? `<br><b>Notas:</b> ${details.notes}` : ''}<br><br><i>Evento creado automáticamente por la App de AEA.</i>`,
        start: {
            dateTime: startTimeLocal,
            timeZone: 'America/Mexico_City',
        },
        end: {
            dateTime: endTimeLocal,
            timeZone: 'America/Mexico_City',
        },
        reminders: {
            useDefault: false,
            overrides: [
                { method: 'popup', minutes: 120 },
                { method: 'popup', minutes: 60 },
            ],
        },
        ...(calendarAttendee ? { attendees: [{ email: calendarAttendee }] } : {}),
        guestsCanModify: true,
    };

    try {
        const response = await calendar.events.insert({
            calendarId: calendarId,
            requestBody: event,
        });
        console.log('Event created successfully: %s', response.data.htmlLink);
        return response.data.id || 'success';
    } catch (error: any) {
        console.error('Error creating calendar event:', error);
        // GaxiosError exposes status on error.response?.status or error.status
        const status = error?.response?.status ?? error?.status ?? 0;
        const message = error instanceof Error ? error.message : String(error);

        if (status === 404 || message.includes('404') || message.toLowerCase().includes('not found')) {
            throw new Error('Error de Calendario (404): El calendario no fue encontrado. Verifica que GOOGLE_CALENDAR_ID sea correcto (debe ser el ID del calendario, p.ej. xxx@group.calendar.google.com) y que la cuenta de servicio tenga acceso a él.');
        }
        if (status === 403 || message.includes('403') || message.toLowerCase().includes('forbidden')) {
            throw new Error('Error de Permisos (403): La cuenta de servicio no tiene permiso para editar el calendario. Comparte el calendario con el `client_email` de tus credenciales y dale el permiso "Hacer cambios en los eventos".');
        }
        if (message.includes('invalid_grant')) {
            throw new Error('Error de Autenticación: La autenticación con Google falló. Revisa que las credenciales en CALENDAR_KEY sean correctas y que el servidor tenga la hora sincronizada.');
        }
        throw new Error(`Error al crear evento: ${message}`);
    }
}

export async function createEvaluacionEvent(
  nombre: string,
  phone: string,
  fecha: string,
  hora: string
): Promise<boolean> {
  try {
    const auth = getCalendarAuth();
    const calendar = google.calendar({ version: 'v3', auth });
    const startISO = `${fecha}T${hora}:00`;
    const endDate = new Date(startISO + 'Z');
    endDate.setTime(endDate.getTime() + 30 * 60 * 1000);
    const endISO = endDate.toISOString().substring(0, 19);
    await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID!,
      requestBody: {
        summary: `🚗 Evaluación instructor — ${nombre}`,
        description: `Candidato UrbDriver\nTel: +${phone}`,
        location: 'Av. Universidad 1404, Col. Axotla, CDMX',
        colorId: '9',
        start: { dateTime: startISO, timeZone: 'America/Mexico_City' },
        end:   { dateTime: endISO,   timeZone: 'America/Mexico_City' },
        reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 30 }] },
      },
    });
    return true;
  } catch (e) {
    console.error('[MARCO] Error creando evento evaluación:', e);
    return false;
  }
}
