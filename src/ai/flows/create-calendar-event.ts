'use server';
/**
 * @fileOverview A Genkit flow for creating Google Calendar events.
 *
 * This flow authenticates with Google Calendar and creates a new event
 * for each class session requested by the student.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';

const ClassDateSchema = z.object({
  date: z.string().describe('The date of the class in YYYY-MM-DD format.'),
  time: z.string().describe('The time of the class in 24-hour HH:mm format.'),
});

export const CreateEventInputSchema = z.object({
  studentName: z.string().describe("The student's full name."),
  phone: z.string().describe("The student's contact phone number."),
  address: z.string().describe('The meeting point or address for the class.'),
  transmission: z.string().describe('The vehicle transmission type.'),
  isMinor: z.boolean().optional().describe('Whether the student is a minor.'),
  notes: z.string().optional().describe('Additional notes or comments.'),
  classDates: z.array(ClassDateSchema).describe('The list of dates and times for the classes.'),
});

export type CreateEventInput = z.infer<typeof CreateEventInputSchema>;

const CreateEventOutputSchema = z.object({
  success: z.boolean().describe('Whether the event creation was successful.'),
  link: z.string().nullable().describe('The link to the first created calendar event.'),
});

/**
 * Authenticates with Google and returns a Calendar API client.
 */
async function getCalendarClient() {
  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });
  const authClient = await auth.getClient ();
  return google.calendar({ version: 'v3', auth: authClient as any });
}

export const createCalendarEvent = ai.defineFlow(
  {
    name: 'createCalendarEvent',
    inputSchema: CreateEventInputSchema,
    outputSchema: CreateEventOutputSchema,
  },
  async (input) => {
    const calendarId = process.env.GOOGLE_CALENDAR_ID;
    if (!calendarId) {
      console.error('GOOGLE_CALENDAR_ID environment variable is not set.');
      return { success: false, link: null };
    }

    try {
      const calendar = await getCalendarClient();
      let firstEventLink: string | null = null;

      // Class duration is 2.5 hours
      const CLASS_DURATION_MINUTES = 150; 

      for (const classDetail of input.classDates) {
        const [year, month, day] = classDetail.date.split('-').map(Number);
        const [hours, minutes] = classDetail.time.split(':').map(Number);
        
        const startTime = new Date(year, month - 1, day, hours, minutes);
        const endTime = new Date(startTime.getTime() + CLASS_DURATION_MINUTES * 60000);

        const eventDescription = [
          `<b>Teléfono:</b> ${input.phone}`,
          `<b>Punto de Encuentro:</b> ${input.address}`,
          `<b>Transmisión:</b> ${input.transmission}`,
          input.isMinor ? '<b>Nota:</b> El alumno es MENOR DE EDAD.' : '',
          input.notes ? `<b>Notas Adicionales:</b>\n${input.notes}` : ''
        ].filter(Boolean).join('<br>');
        
        const event = {
          summary: `Clase: ${input.studentName}`,
          description: eventDescription,
          start: {
            dateTime: startTime.toISOString(),
            timeZone: 'America/Mexico_City',
          },
          end: {
            dateTime: endTime.toISOString(),
            timeZone: 'America/Mexico_City',
          },
        };

        const createdEvent = await calendar.events.insert({
          calendarId,
          requestBody: event,
        });

        if (createdEvent.data.htmlLink && !firstEventLink) {
            firstEventLink = createdEvent.data.htmlLink;
        }

        console.log(`Event created: ${createdEvent.data.htmlLink}`);
      }

      return { success: true, link: firstEventLink };
    } catch (error) {
      console.error('Error creating calendar event:', error);
      return { success: false, link: null };
    }
  }
);
