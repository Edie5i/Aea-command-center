'use server';

import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import type { calendar_v3 } from 'googleapis';

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

interface EventDetails {
  studentName: string;
  studentPhone: string;
  studentAddress: string;
  transmission: string;
  isMinor: boolean;
  notes?: string;
  classDate: Date;
  classTime: string; // "HH:mm"
}

export async function createCalendarEvent(details: EventDetails): Promise<string | null> {
    const auth = getCalendarAuth();
    const calendar = google.calendar({ version: 'v3', auth });
    const calendarId = process.env.GOOGLE_CALENDAR_ID!;

    const [hours, minutes] = details.classTime.split(':').map(Number);
    const startDate = new Date(details.classDate);
    startDate.setHours(hours, minutes, 0, 0);

    // Classes are 2.5 hours long
    const endDate = new Date(startDate.getTime() + 2.5 * 60 * 60 * 1000); 

    const event: calendar_v3.Params$Resource$Events$Insert['requestBody'] = {
        summary: `Clase: ${details.studentName}`,
        location: details.studentAddress,
        description: `<b>Alumno:</b> ${details.studentName}<br><b>Teléfono:</b> ${details.studentPhone}<br><b>Transmisión:</b> ${details.transmission}${details.isMinor ? '<br><b>Modalidad:</b> MENOR DE EDAD' : ''}${details.notes ? `<br><b>Notas:</b> ${details.notes}` : ''}<br><br><i>Evento creado automáticamente por la App de AEA.</i>`,
        start: {
            dateTime: startDate.toISOString(),
            timeZone: 'America/Mexico_City',
        },
        end: {
            dateTime: endDate.toISOString(),
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
    } catch (error) {
        console.error('Error creating calendar event:', error);
        if (error instanceof Error) {
            const message = error.message;
            // The googleapis library returns errors with status codes in the message
            if (message.includes('404')) { 
                throw new Error('Error de Calendario: El ID del calendario no fue encontrado. Verifica que el valor de GOOGLE_CALENDAR_ID sea correcto.');
            }
            if (message.includes('403')) {
                throw new Error('Error de Permisos: La cuenta de servicio no tiene permiso para editar el calendario. Asegúrate de haber compartido tu calendario con el `client_email` de tus credenciales y de haberle dado el permiso "Hacer cambios en los eventos".');
            }
            if (message.includes('invalid_grant')) {
                throw new Error('Error de Autenticación: La autenticación con Google falló. Esto puede deberse a un problema con las credenciales en CALENDAR_KEY o un problema de sincronización de hora en el servidor.');
            }
            throw new Error(`Error al crear evento: ${message}`);
        }
        throw new Error('Ocurrió un error desconocido al crear el evento en el calendario.');
    }
}
