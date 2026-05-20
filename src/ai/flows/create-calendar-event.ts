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
            classDate: new Date(classItem.date), // The service handles the ISO string
            classTime: classItem.time,
        });
    });

    const results = await Promise.allSettled(promises);

    const created = results.filter(
        (r): r is PromiseFulfilledResult<string | null> => r.status === 'fulfilled' && r.value !== null
    ).length;
    const failures = results.filter(r => r.status === 'rejected');

    if (failures.length > 0) {
        const reasons = failures.map(f => (f as PromiseRejectedResult).reason?.message ?? String((f as PromiseRejectedResult).reason)).join(' | ');
        console.error(`[Calendar] ${failures.length} evento(s) fallaron: ${reasons}`);
        if (created === 0) {
            throw new Error(reasons);
        }
    }

    const message = `Se crearon ${created} de ${input.dates.length} eventos en el calendario.`;
    console.log(message);
    return { success: true, message, created, total: input.dates.length };
}
