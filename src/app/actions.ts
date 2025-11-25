
'use server';

import { z } from 'zod';
import { createCalendarEvent } from '@/ai/flows/create-calendar-event';
import type { CreateEventInput } from '@/ai/flows/create-calendar-event';
import { simpleChat } from '@/ai/flows/chatbot-flow';
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

export async function getChatbotResponseAction(message: string) {
  try {
    const response = await simpleChat({ message });
    return { response: response.response, error: null };
  } catch (error) {
    console.error('Error getting chatbot response:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return { response: null, error: errorMessage };
  }
}

export async function generateDrivingTipsAction(topic: string) {
  try {
    const result = await generateDrivingTips({ topic });
    return { tips: result.tips, error: null };
  } catch (error) {
    console.error('Error generating driving tips:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return { tips: null, error: errorMessage };
  }
}
