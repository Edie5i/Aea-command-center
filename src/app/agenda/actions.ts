'use server';

import { scheduleAndCreateEvents, type CreateEventInput } from '@/ai/flows/create-calendar-event';

/**
 * A server action that triggers the creation of Google Calendar events in the background.
 * It does not wait for the calendar events to be created to provide a fast user experience.
 * @param input The data from the schedule form.
 */
export async function createCalendarEventsAction(input: CreateEventInput) {
  try {
    // Don't await this. Let it run in the background.
    // The user's UI is not blocked.
    scheduleAndCreateEvents(input)
      .then(result => console.log('Background calendar event creation process finished.', result))
      .catch(error => console.error('Background calendar event creation failed:', error));
    
    // Return success to the UI immediately.
    return { success: true, error: null };
  } catch (error) {
    // This part should ideally not be reached if the call is not awaited, but it's good practice.
    console.error('Error initiating calendar event creation:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return { success: false, error: errorMessage };
  }
}
