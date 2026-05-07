import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getCourses } from '@/services/courseService';
import { programData } from '@/lib/course-data';
import { getAvailableSlots } from '@/services/calendarService';
import { scheduleAndCreateEvents } from '@/ai/flows/create-calendar-event';

function calcularFechas(patron: string, fechaInicio: string, hora: string) {
  const offsets = patron === 'fin-de-semana' ? [0, 1, 7, 8] : [0, 1, 2, 3];
  const [y, m, d] = fechaInicio.split('-').map(Number);
  return offsets.map(offset => {
    const fecha = new Date(y, m - 1, d + offset);
    const dateStr = fecha.toLocaleDateString('en-CA');
    return { date: dateStr + 'T12:00:00', time: hora };
  });
}

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

export const confirmarInscripcionTool = ai.defineTool(
  {
    name: 'confirmarInscripcion',
    description:
      'Registra la inscripción del alumno y crea automáticamente las 4 clases en Google Calendar. ' +
      'Úsala cuando el alumno haya confirmado su patrón de horario y fecha de inicio después de enviar el comprobante de pago.',
    inputSchema: z.object({
      nombre: z.string().describe('Nombre completo del alumno'),
      telefono: z.string().describe('Número de WhatsApp con código de país, ej: 5215512345678'),
      zona: z.string().describe('Colonia, zona o dirección de punto de encuentro'),
      transmision: z.string().optional().describe('Estándar o Automático'),
      patron: z.enum(['lunes-jueves', 'martes-viernes', 'fin-de-semana']).describe('Patrón de clases acordado'),
      hora: z.string().describe('Horario en formato HH:mm, ej: 10:00'),
      fechaInicio: z.string().describe('Fecha del primer día de clase en formato YYYY-MM-DD'),
    }),
    outputSchema: z.object({
      exitoso: z.boolean(),
      mensaje: z.string(),
    }),
  },
  async ({ nombre, telefono, zona, transmision, patron, hora, fechaInicio }) => {
    try {
      const fechas = calcularFechas(patron, fechaInicio, hora);
      await scheduleAndCreateEvents({
        name: nombre,
        phone: telefono,
        address: zona,
        transmission: transmision ?? 'Estándar',
        dates: fechas,
      });

      const adminPhone = (process.env.ADMIN_NOTIFICATION_PHONE ?? '525634433212').trim();
      const waToken = process.env.META_WHATSAPP_TOKEN ?? '';
      const phoneId = process.env.META_PHONE_NUMBER_ID ?? '';

      if (waToken && phoneId) {
        const patronLabel =
          patron === 'lunes-jueves' ? 'Lunes a jueves' :
          patron === 'martes-viernes' ? 'Martes a viernes' : 'Sábado y domingo';
        const texto =
          `✅ *Inscripción confirmada*\n\n` +
          `👤 *Nombre:* ${nombre}\n` +
          `📱 *Teléfono:* +${telefono}\n` +
          `📍 *Zona:* ${zona}\n` +
          `🚗 *Transmisión:* ${transmision ?? 'Estándar'}\n` +
          `📅 *Patrón:* ${patronLabel} a las ${hora}\n` +
          `🗓️ *Inicio:* ${fechaInicio}\n\n` +
          `4 clases agendadas en Calendar ✅`;
        await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${waToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: adminPhone,
            type: 'text',
            text: { body: texto },
          }),
        }).catch(e => console.error('[Tool] confirmarInscripcion WhatsApp error:', e));
      }

      return { exitoso: true, mensaje: '4 clases agendadas en Calendar.' };
    } catch (e) {
      console.error('[Tool] confirmarInscripcion error:', e);
      const msg = e instanceof Error ? e.message : 'Error desconocido';
      return { exitoso: false, mensaje: `No se pudieron crear los eventos: ${msg}` };
    }
  }
);

export const AEA_TOOLS = [
  consultarDisponibilidadTool,
  consultarCatalogoCursosTool,
  consultarProgramaCursoTool,
  confirmarInscripcionTool,
];
