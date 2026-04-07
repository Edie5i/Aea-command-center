'use server';

import { scheduleAndCreateEvents, type CreateEventInput } from '@/ai/flows/create-calendar-event';

/**
 * A server action that attempts to create Google Calendar events.
 * It now awaits the result and returns success or a specific error message.
 * @param input The data from the schedule form.
 */
export async function createCalendarEventsAction(input: CreateEventInput): Promise<{ success: boolean; message: string | null; error: string | null; }> {
  try {
    // Await the result to provide feedback to the user.
    const result = await scheduleAndCreateEvents(input);
    
    // Return a detailed success message.
    return { success: true, message: result.message, error: null };
  } catch (error) {
    // The calendarService and create-calendar-event flow now throw user-friendly errors.
    console.error('Error in createCalendarEventsAction:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred while creating calendar events.';
    return { success: false, message: null, error: errorMessage };
  }
}
