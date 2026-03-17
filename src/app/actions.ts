'use server';

import { simpleChat } from '@/ai/flows/chatbot-flow';

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
