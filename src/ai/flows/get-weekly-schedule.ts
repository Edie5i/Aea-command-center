'use server';
/**
 * @fileOverview A flow to get weekly events from Google Calendar.
 *
 * - getWeeklySchedule - Fetches events from the primary calendar for the current week.
 * - WeeklySchedule - The return type for the getWeeklySchedule function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';

// Define schemas for calendar event data
const CourseSchema = z.object({
  studentName: z.string().describe('The name of the student or event title.'),
  time: z.string().describe('The scheduled time for the event.'),
  transmission: z.string().describe('Details from the event description.'),
  classDate: z.string().describe('The date of the event in YYYY-MM-DD format.'),
});

export type Course = z.infer<typeof CourseSchema>;

const WeeklyScheduleSchema = z.object({
  lunes: z.array(CourseSchema),
  martes: z.array(CourseSchema),
  miércoles: z.array(CourseSchema),
  jueves: z.array(CourseSchema),
  viernes: z.array(CourseSchema),
  sábado: z.array(CourseSchema),
  domingo: z.array(CourseSchema),
});

export type WeeklySchedule = z.infer<typeof WeeklyScheduleSchema>;

// Function to authenticate and get calendar instance
async function getCalendarClient() {
  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
  });
  const authClient = await auth.getClient();
  return google.calendar({ version: 'v3', auth: authClient as any });
}

// Helper to get start and end of the current week (Monday to Sunday)
function getWeekRange() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayOfWeek = today.getDay(); // Sunday - 0, Monday - 1, ...
  
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { startOfWeek: monday.toISOString(), endOfWeek: sunday.toISOString() };
}

// The main flow to get and organize the weekly schedule
export const getWeeklySchedule = ai.defineFlow(
  {
    name: 'getWeeklySchedule',
    inputSchema: z.void(),
    outputSchema: WeeklyScheduleSchema,
  },
  async () => {
    const calendarId = process.env.GOOGLE_CALENDAR_ID;
    if (!calendarId) {
        throw new Error('GOOGLE_CALENDAR_ID environment variable is not set.');
    }

    const calendar = await getCalendarClient();
    const { startOfWeek, endOfWeek } = getWeekRange();

    const response = await calendar.events.list({
      calendarId: calendarId,
      timeMin: startOfWeek,
      timeMax: endOfWeek,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];
    const schedule: WeeklySchedule = {
      lunes: [],
      martes: [],
      miércoles: [],
      jueves: [],
      viernes: [],
      sábado: [],
      domingo: [],
    };
    
    const dayMapping = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

    events.forEach((event) => {
        if (event.start?.dateTime && event.summary) {
            const eventDate = new Date(event.start.dateTime);
            const dayName = dayMapping[eventDate.getDay()] as keyof WeeklySchedule;
            
            // Extract transmission from description if available
            const description = event.description || '';
            const transmissionMatch = description.match(/Transmisión: (Automático|Estándar)/);
            const transmission = transmissionMatch ? transmissionMatch[1] : 'No especificada';

            schedule[dayName].push({
                studentName: event.summary,
                time: eventDate.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true }),
                transmission: transmission,
                classDate: eventDate.toISOString().split('T')[0],
            });
        }
    });

    return schedule;
  }
);
