/**
 * @fileOverview A utility for creating Google Calendar events for driving classes.
 * This is NOT an AI flow, but a server-side utility function.
 *
 * - scheduleAndCreateEvents - Takes student and class details and creates events in Google Calendar.
 * - CreateEventInputSchema - The Zod schema for the input.
 * - CreateEventInput - The TypeScript type for the input.
 */

import { z } from 'zod';
import { createCalendarEvent, eventosYaCreados } from '@/services/calendarService';
import { claveDesdeEntrada, ZONA_HORARIA } from '@/lib/calendar-keys';

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
    // Clave local por clase, igual que la que arma createCalendarEvent
    const conHora = input.dates
        .map((classItem, i) => ({ ...classItem, i }))
        .filter(c => {
            if (!c.time) {
                console.warn(`Skipping event creation for date ${c.date} due to missing time.`);
                return false;
            }
            return true;
        })
        .map(c => ({
            ...c,
            dia: new Date(c.date).toLocaleDateString('en-CA', { timeZone: ZONA_HORARIA }),
            clave: claveDesdeEntrada(c.date, c.time!),
        }));

    // Candado de idempotencia: seis rutas distintas llaman aquí y ninguna sabía
    // de las otras, así que pedir las mismas clases dos veces duplicaba los
    // eventos. Si la verificación falla se continúa: es preferible arriesgar un
    // duplicado a dejar a un alumno sin clases agendadas.
    let existentes = new Set<string>();
    try {
        existentes = await eventosYaCreados(
            input.name,
            conHora.map(c => ({ date: c.dia, time: c.time! })),
        );
    } catch (e) {
        console.error('[Calendar] No se pudo verificar duplicados, se continúa:', e);
    }

    const pendientes = conHora.filter(c => !existentes.has(c.clave));
    const omitidos = conHora.length - pendientes.length;
    if (omitidos > 0) {
        console.log(`[Calendar] ${omitidos} evento(s) ya existían para ${input.name} — no se recrean`);
    }

    const promises = pendientes.map((classItem) =>
        createCalendarEvent({
            studentName: input.name,
            studentPhone: input.phone,
            studentAddress: input.address,
            transmission: input.transmission,
            isMinor: !!input.isMinor,
            notes: input.notes,
            classDate: new Date(classItem.date),
            classTime: classItem.time!,
            sessionIndex: classItem.i,
        }),
    );

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

    const message = omitidos > 0
        ? `Se crearon ${created} eventos; ${omitidos} ya existían (de ${input.dates.length}).`
        : `Se crearon ${created} de ${input.dates.length} eventos en el calendario.`;
    console.log(message);
    return { success: true, message, created, omitidos, total: input.dates.length };
}
