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
    };
  });
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

    const event: calendar_v3.Params$Resource$Events$Insert['requestBody'] = {
        summary: `Clase: ${details.studentName}`,
        location: details.studentAddress,
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
                { method: 'popup', minutes: 120 }, // 2 hours before
                { method: 'popup', minutes: 60 },  // 1 hour before
            ],
        },
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
