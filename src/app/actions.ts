'use server';

import { simpleChat } from '@/ai/flows/chatbot-flow';

export async function getChatbotResponseAction(
  message: string,
  history: Array<{ role: 'user' | 'bot'; text: string }> = []
) {
  try {
    const response = await simpleChat({ message, history });
    return { response: response.response, error: null };
  } catch (error) {
    console.error('Error getting chatbot response:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return { response: null, error: errorMessage };
  }
}
