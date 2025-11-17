'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/generate-driving-tips.ts';
import '@/ai/flows/chatbot-flow.ts';
import '@/ai/flows/chatbot-indexer.ts';
