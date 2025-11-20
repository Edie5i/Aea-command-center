
'use server';

import { z } from 'zod';
import { createCalendarEvent } from '@/ai/flows/create-calendar-event';
import type { CreateEventInput } from '@/ai/flows/create-calendar-event';

export async function createCalendarEventAction(eventData: CreateEventInput) {
    try {
        const result = await createCalendarEvent(eventData);
        if (result.success) {
            return { success: true, link: result.link, error: null };
        } else {
            return { success: false, link: null, error: 'Failed to create calendar event.' };
        }
    } catch (error) {
        console.error('Error creating calendar event:', error);
        return { success: false, link: null, error: 'An unexpected error occurred while creating the calendar event.' };
    }
}
    