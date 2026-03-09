'use server';
/**
 * @fileOverview This file defines the knowledge base indexer and a function to retrieve
 * information from it. It reads structured data about the driving school, processes it, 
 * and makes it available for the chatbot to query.
 */

import { ai } from '@/ai/genkit';
import { botContextData } from '@/lib/bot-data';
import { Document, DocumentSource } from 'genkit';

const SCHOOL_KNOWLEDGE_INDEX = 'schoolKnowledge';

// This function converts the structured knowledge base into a single string.
function formatKnowledgeBase(): DocumentSource {
  const {
    informacionGeneral,
    catalogoCursos,
    procesoAgendar,
    metodosPago,
    politicas,
    preguntasFrecuentes,
    programaDelCurso,
    reglamentoTransito,
  } = botContextData;

  // Combine all data into a single text block for indexing.
  const content = `
    Información General: ${JSON.stringify(informacionGeneral)}
    Catálogo de Cursos: ${JSON.stringify(catalogoCursos)}
    Proceso para Agendar: ${procesoAgendar.join('; ')}
    Métodos de Pago: ${JSON.stringify(metodosPago)}
    Políticas Importantes: ${JSON.stringify(politicas)}
    Preguntas Frecuentes: ${JSON.stringify(preguntasFrecuentes)}
    Programa del Curso: ${JSON.stringify(programaDelCurso)}
    Reglamento de Tránsito: ${reglamentoTransito}
  `;

  return {
    content,
    metadata: {
      source: 'internal knowledge base',
    },
  };
}

// Define an indexer for the school's knowledge base.
// An indexer is responsible for loading and chunking documents.
export const schoolKnowledgeIndexer = ai.defineIndexer(
  {
    name: SCHOOL_KNOWLEDGE_INDEX,
  },
  async () => {
    // The loader function is called to get the documents to index.
    return {
      loader: () => {
        return {
          documents: [Document.fromSource(formatKnowledgeBase())],
        };
      },
    };
  }
);

/**
 * Retrieves relevant documents from the school's knowledge base.
 * @param query The user's question as a string.
 * @returns A promise that resolves to an array of relevant documents.
 */
export async function retrieveSchoolKnowledge(query: string): Promise<Document[]> {
    const index = await schoolKnowledgeIndexer();
    const results = await index.search(query, { k: 5 });
    return results;
}
