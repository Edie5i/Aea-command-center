'use server';
/**
 * @fileOverview A flow for creating Google Calendar events for driving classes.
 *
 * - scheduleAndCreateEvents - Takes student and class details and creates events in Google Calendar.
 * - CreateEventInput - The input type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { createCalendarEvent } from '@/services/calendarService';
import { format } from 'date-fns';

export const CreateEventInputSchema = z.object({
  name: z.string(),
  phone: z.string(),
  address: z.string(),
  transmission: z.string(),
  isMinor: z.boolean().optional(),
  notes: z.string().optional(),
  // Dates will be serialized as strings from the client
  dates: z.array(z.object({
    date: z.string(), 
    time: z.string().optional(),
  })),
});

export type CreateEventInput = z.infer<typeof CreateEventInputSchema>;

// This is the main logic function.
async function createEvents(input: CreateEventInput & { dates: { date: Date; time?: string }[] }) {
    const promises = input.dates.map(classItem => {
        if (!classItem.time) {
            console.warn(`Skipping event creation for date ${format(classItem.date, 'yyyy-MM-dd')} due to missing time.`);
            return Promise.resolve(null);
        }
        return createCalendarEvent({
            studentName: input.name,
            studentPhone: input.phone,
            studentAddress: input.address,
            transmission: input.transmission,
            isMinor: !!input.isMinor,
            notes: input.notes,
            classDate: classItem.date,
            classTime: classItem.time,
        });
    });

    try {
        const results = await Promise.all(promises);
        const createdCount = results.filter(r => r !== null).length;
        console.log(`${createdCount} of ${input.dates.length} calendar events created successfully.`);
        return { success: true, created: createdCount, total: input.dates.length };
    } catch (error) {
        console.error("An error occurred while creating one or more calendar events:", error);
        throw new Error("Failed to create one or more calendar events.");
    }
}

// Genkit flow definition
const scheduleAndCreateEventsFlow = ai.defineFlow(
  {
    name: 'scheduleAndCreateEventsFlow',
    inputSchema: CreateEventInputSchema,
    outputSchema: z.object({ success: z.boolean(), created: z.number(), total: z.number() }),
  },
  async (input) => {
    const parsedDatesInput = {
      ...input,
      dates: input.dates.map(d => ({ ...d, date: new Date(d.date) }))
    };
    return createEvents(parsedDatesInput);
  }
);

// Export a simple async function to be called from the server action.
export async function scheduleAndCreateEvents(input: CreateEventInput) {
    return await scheduleAndCreateEventsFlow(input);
}
