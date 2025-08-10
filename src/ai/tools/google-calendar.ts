
'use server';

import { ai } from '@/ai/genkit';
import { getAuthenticatedCalendarClient } from '@/lib/google-auth';
import { z } from 'zod';
import { google } from 'googleapis';

export const checkAvailability = ai.defineTool(
  {
    name: 'checkAvailability',
    description: 'Checks for event conflicts in the primary Google Calendar for a given time range. Use this to determine if a time slot is available for booking.',
    inputSchema: z.object({
        startTime: z.string().datetime({ message: "Start time must be a valid ISO 8601 date-time string." }).describe("The start of the time range to check, in ISO 8601 format."),
        endTime: z.string().datetime({ message: "End time must be a valid ISO 8601 date-time string." }).describe("The end of the time range to check, in ISO 8601 format."),
    }),
    outputSchema: z.enum(['FREE', 'BUSY', 'ERROR']).describe("Returns 'FREE' if the slot is available, 'BUSY' if there's a conflict, or 'ERROR' if the calendar cannot be accessed."),
  },
  async (input) => {
    try {
        const oauth2Client = await getAuthenticatedCalendarClient();
        if (!oauth2Client) {
            console.error('Google Calendar client is not authenticated. User needs to log in via /admin.');
            return 'ERROR';
        }
        
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        console.log(`Checking calendar availability from ${input.startTime} to ${input.endTime}`);

        const response = await calendar.freebusy.query({
            requestBody: {
                timeMin: input.startTime,
                timeMax: input.endTime,
                items: [{ id: 'primary' }], // Check the primary calendar
            },
        });

        const calendars = response.data.calendars;
        if (!calendars || !calendars.primary) {
            console.error('Primary calendar information not found in Free-Busy response.');
            return 'ERROR';
        }

        const busySlots = calendars.primary.busy;
        if (busySlots && busySlots.length > 0) {
            console.log(`Time slot is BUSY. Conflicts found:`, busySlots);
            return 'BUSY';
        } else {
            console.log('Time slot is FREE.');
            return 'FREE';
        }

    } catch (error) {
        console.error('Error checking Google Calendar availability:', error);
        // This could be due to invalid tokens, API errors, etc.
        return 'ERROR';
    }
  }
);
