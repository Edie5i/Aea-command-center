
'use server';
/**
 * @fileOverview This file defines the Genkit indexer for the chatbot's knowledge base.
 * It reads data from local files, chunks it, and creates an in-memory vector index.
 */

import { ai } from '@/ai/genkit';
import { botContextData } from '@/lib/bot-data';
import { reglamentoTransitoCompleto } from '@/lib/reglamento-transito-data';
import { z } from 'zod';

const SCHOOL_KNOWLEDGE_INDEX = 'schoolKnowledge';

// Define an indexer for the school's knowledge base.
const schoolKnowledgeIndexer = ai.defineIndexer(
  {
    name: SCHOOL_KNOWLEDGE_INDEX,
    embedder: 'googleai/text-embedding-004',
  },
  async () => {
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
  }
);

export const schoolKnowledgeRetriever = ai.defineRetriever(
  {
    name: 'schoolKnowledgeRetriever',
    inputSchema: z.string(),
    description: 'Searches for information about the driving school, including courses, prices, policies, and traffic regulations.',
  },
  async (input: string) => {
    const results = await ai.retrieve({
      indexer: schoolKnowledgeIndexer,
      query: input,
      options: { k: 5 }, // Retrieve the top 5 most relevant chunks
    });
    return { documents: results.documents };
  }
);
