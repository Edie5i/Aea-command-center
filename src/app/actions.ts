
'use server';

import { z } from 'zod';
import { createCalendarEvent } from '@/ai/flows/create-calendar-event';
import type { CreateEventInput } from '@/ai/flows/create-calendar-event';
import { generateDrivingTips } from '@/ai/flows/generate-driving-tips';

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

export async function getDrivingTipsAction(topic: string) {
    try {
        const result = await generateDrivingTips({ topic });
        return { tips: result.tips, error: null };
    } catch (error) {
        console.error('Error generating driving tips:', error);
        return { tips: null, error: 'Failed to generate driving tips.' };
    }
}
