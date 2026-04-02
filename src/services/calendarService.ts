'use server';

import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import type { calendar_v3 } from 'googleapis';

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID;
const CALENDAR_KEY_BASE64 = process.env.CALENDAR_KEY;

if (!CALENDAR_ID || !CALENDAR_KEY_BASE64) {
  console.warn('Google Calendar environment variables not set. Calendar integration will be disabled.');
}

async function getAuth(): Promise<JWT | null> {
  if (!CALENDAR_KEY_BASE64) {
    return null;
  }
  
  try {
    const calendarKey = Buffer.from(CALENDAR_KEY_BASE64, 'base64').toString('utf-8');
    const credentials = JSON.parse(calendarKey);

    return new JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });
  } catch (error) {
    console.error("Failed to parse calendar credentials:", error);
    return null;
  }
}

async function getCalendar(): Promise<calendar_v3.Calendar | null> {
  const auth = await getAuth();
  if (!auth) {
    return null;
  }
  return google.calendar({ version: 'v3', auth });
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
  const calendar = await getCalendar();
  if (!calendar || !CALENDAR_ID) {
    console.log('Calendar client not available. Cannot create event.');
    return null;
  }

  const [hours, minutes] = details.classTime.split(':').map(Number);
  const startDate = new Date(details.classDate);
  startDate.setHours(hours, minutes, 0, 0);

  // Classes are 2.5 hours long
  const endDate = new Date(startDate.getTime() + 2.5 * 60 * 60 * 1000); 

  const event: calendar_v3.Params$Resource$Events$Insert['requestBody'] = {
    summary: `Clase: ${details.studentName}`,
    location: details.studentAddress,
    description: `
      <b>Alumno:</b> ${details.studentName}
      <b>Teléfono:</b> ${details.studentPhone}
      <b>Transmisión:</b> ${details.transmission}
      ${details.isMinor ? '<b>Modalidad:</b> MENOR DE EDAD\n' : ''}
      ${details.notes ? `<b>Notas:</b> ${details.notes}\n` : ''}
      <br>
      <i>Evento creado automáticamente por la App de AEA.</i>
    `,
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
      calendarId: CALENDAR_ID,
      requestBody: event,
    });
    console.log('Event created successfully: %s', response.data.htmlLink);
    return response.data.id || 'success';
  } catch (error) {
    console.error('Error creating calendar event:', error);
    // Let the flow handle the error
    throw new Error('Failed to create calendar event.');
  }
}
