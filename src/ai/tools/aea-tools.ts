import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getCourses } from '@/services/courseService';
import { programData } from '@/lib/course-data';
import { getAvailableSlots } from '@/services/calendarService';

export const consultarDisponibilidadTool = ai.defineTool(
  {
    name: 'consultarDisponibilidad',
    description:
      'Consulta en tiempo real los horarios disponibles en el calendario de clases de AEA. ' +
      'Llama esta herramienta cuando el cliente pregunte: ¿hay lugar?, ¿cuándo puedo empezar?, ' +
      '¿tienen disponibilidad esta semana?, ¿hay clase mañana?, ¿qué días tienen libres?, etc. ' +
      'Siempre úsala antes de responder preguntas de disponibilidad — no inventes horarios.',
    inputSchema: z.object({
      dias: z.number().optional().describe('Días hacia adelante a consultar (default 7)'),
    }),
    outputSchema: z.array(
      z.object({
        fecha: z.string().describe('Fecha en formato YYYY-MM-DD'),
        diaSemana: z.string().describe('Nombre del día en español'),
        horariosLibres: z.array(z.string()).describe('Horarios disponibles en formato HH:mm'),
      })
    ),
  },
  async ({ dias = 7 }) => {
    try {
      return await getAvailableSlots(dias);
    } catch (e) {
      console.error('[Tool] consultarDisponibilidad error:', e);
      return [];
    }
  }
);

export const consultarCatalogoCursosTool = ai.defineTool(
  {
    name: 'consultarCatalogoCursos',
    description:
      'Obtiene el catálogo actualizado de cursos con precios y descripciones de AEA. ' +
      'Úsala para confirmar precios exactos, comparar opciones o responder preguntas específicas sobre un curso.',
    inputSchema: z.object({}),
    outputSchema: z.array(
      z.object({
        nombre: z.string(),
        precio: z.number(),
        descripcion: z.string(),
      })
    ),
  },
  async () => {
    const courses = await getCourses();
    return courses.map(c => ({
      nombre: c.title,
      precio: parseFloat(c.price),
      descripcion: c.description,
    }));
  }
);

export const consultarProgramaCursoTool = ai.defineTool(
  {
    name: 'consultarProgramaCurso',
    description:
      'Obtiene el temario detallado del curso de manejo. ' +
      'Úsala cuando el cliente pregunte qué aprende, cuál es el contenido, el plan de estudios o las materias.',
    inputSchema: z.object({}),
    outputSchema: z.array(
      z.object({
        titulo: z.string(),
        temas: z.array(z.string()),
      })
    ),
  },
  async () => {
    return programData.map(section => ({
      titulo: section.title,
      temas: section.content.flatMap(c => c.points),
    }));
  }
);

export const AEA_TOOLS = [
  consultarDisponibilidadTool,
  consultarCatalogoCursosTool,
  consultarProgramaCursoTool,
];
