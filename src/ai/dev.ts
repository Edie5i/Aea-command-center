
'use server';
import { config } from 'dotenv';
config();

// This file is used to start Genkit in development mode.
// It is not intended for production use.

// Import the indexer to ensure it's registered and runs on startup.
import './flows/chatbot-indexer';
    
