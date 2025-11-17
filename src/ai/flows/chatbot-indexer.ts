
'use server';
/**
 * @fileOverview This file defines the Genkit indexer for the chatbot's knowledge base.
 * It reads data from local files, chunks it, and creates an in-memory vector index.
 */

import { ai } from '@/ai/genkit';
import { botContextData } from '@/lib/bot-data';
import { reglamentoTransitoCompleto } from '@/lib/reglamento-transito-data';

const SCHOOL_KNOWLEDGE_INDEX = 'schoolKnowledge';

// Define an index for the school's knowledge base.
ai.defineIndex({
  name: SCHOOL_KNOWLEDGE_INDEX,
  indexer: async () => {
    // Convert structured data to a long string for chunking.
    const schoolContextString = JSON.stringify(botContextData, null, 2);

    // Combine all knowledge sources.
    const fullKnowledgeText =
      'Información de la Auto Escuela Americana:\n' +
      schoolContextString +
      '\n\nReglamento de Tránsito de la CDMX (Extracto):\n' +
      reglamentoTransitoCompleto;

    // Use the text chunker to split the document.
    const chunks = await ai.chunk({
      text: fullKnowledgeText,
    });

    return {
      documents: chunks.map((chunk) => ({
        content: { parts: [{ text: chunk.text }] },
      })),
    };
  },
  embedder: 'googleai/text-embedding-004',
});
