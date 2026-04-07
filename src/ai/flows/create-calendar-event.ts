'use server';
/**
 * @fileOverview A utility for creating Google Calendar events for driving classes.
 * This is NOT an AI flow, but a server-side utility function.
 *
 * - scheduleAndCreateEvents - Takes student and class details and creates events in Google Calendar.
 * - CreateEventInputSchema - The Zod schema for the input.
 * - CreateEventInput - The TypeScript type for the input.
 */

import { z } from 'zod';
import { createCalendarEvent } from '@/services/calendarService';

export const CreateEventInputSchema = z.object({
  name: z.string(),
  phone: z.string(),
  address: z.string(),
  transmission: z.string(),
  isMinor: z.boolean().optional(),
  notes: z.string().optional(),
  // Dates are serialized as ISO strings from the client
  dates: z.array(z.object({
    date: z.string(),
    time: z.string().optional(),
  })),
});

export type CreateEventInput = z.infer<typeof CreateEventInputSchema>;

export async function scheduleAndCreateEvents(input: CreateEventInput) {
    const promises = input.dates.map(classItem => {
        if (!classItem.time) {
            console.warn(`Skipping event creation for date ${classItem.date} due to missing time.`);
            return Promise.resolve(null);
        }
        return createCalendarEvent({
            studentName: input.name,
            studentPhone: input.phone,
            studentAddress: input.address,
            transmission: input.transmission,
            isMinor: !!input.isMinor,
            notes: input.notes,
            classDate: new Date(classItem.date), // Parse date string here
            classTime: classItem.time,
        });
    });

    try {
        const results = await Promise.all(promises);
        const createdCount = results.filter(r => r !== null).length;
        const message = `Se crearon ${createdCount} de ${input.dates.length} eventos en el calendario exitosamente.`;
        console.log(message);
        return { success: true, message, created: createdCount, total: input.dates.length };
    } catch (error) {
        console.error("An error occurred while creating one or more calendar events:", error);
        // Propagate the specific error message if available
        const errorMessage = error instanceof Error ? error.message : "Failed to create one or more calendar events.";
        throw new Error(errorMessage);
    }
}
