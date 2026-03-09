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

// This function converts the structured knowledge base into smaller, chunked documents.
function formatKnowledgeBase(): DocumentSource[] {
  const sources: DocumentSource[] = [];
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

  sources.push({ content: `Información General: ${JSON.stringify(informacionGeneral)}`, metadata: { source: 'general' } });
  sources.push({ content: `Catálogo de Cursos: ${JSON.stringify(catalogoCursos)}`, metadata: { source: 'courses' } });
  sources.push({ content: `Proceso para Agendar: ${procesoAgendar.join('; ')}`, metadata: { source: 'scheduling' } });
  sources.push({ content: `Métodos de Pago: ${JSON.stringify(metodosPago)}`, metadata: { source: 'payment' } });
  sources.push({ content: `Políticas Importantes: ${JSON.stringify(politicas)}`, metadata: { source: 'policies' } });
  
  preguntasFrecuentes.forEach(faq => {
      sources.push({ content: `Pregunta Frecuente: ${faq.pregunta}\nRespuesta: ${faq.respuesta}`, metadata: { source: 'faq' } });
  });

  programaDelCurso.forEach(section => {
      const sectionContent = section.content.map(c => `${c.heading ? c.heading + ': ' : ''}${c.points.join(', ')}`).join('\n');
      sources.push({ content: `Programa del Curso - ${section.title}: ${sectionContent}`, metadata: { source: 'program' } });
  });

  // Split the large traffic regulation string into smaller chunks by article.
  const chunks = reglamentoTransito.split('Artículo').filter(c => c.trim());
  chunks.forEach(chunk => {
      if (chunk.trim()) {
          sources.push({ content: `Reglamento de Tránsito: Artículo ${chunk.trim()}`, metadata: { source: 'traffic_rules' } });
      }
  });

  return sources;
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
        const sources = formatKnowledgeBase();
        return {
          documents: sources.map(source => Document.fromSource(source)),
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
