import { config } from 'dotenv';
config();

import '@/ai/flows/generate-integration-instructions.ts';
import '@/ai/flows/chatbot-flow.ts';
import '@/ai/tools/google-calendar.ts';
