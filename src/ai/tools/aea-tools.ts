import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getCourses } from '@/services/courseService';
import { programData } from '@/lib/course-data';
import { getAvailableSlots } from '@/services/calendarService';
import { celularLocal, normalizePhone } from '@/lib/phone';
import { calcularFechas } from '@/lib/patron-fechas';
import { PRECIO_CURSO } from '@/lib/precios';

/**
 * El teléfono de quien está escribiendo, puesto por el servidor.
 *
 * Antes cada herramienta recibía `telefono` como argumento, o sea que lo
 * dictaba el modelo: un «cancela la clase del 55…» cancelaba la de otro alumno,
 * y una pre-reserva podía pisar la ficha de cualquier número y mandarle
 * mensajes. Ahora lo pone el webhook en el contexto de la llamada, a partir del
 * mensaje que de verdad llegó, y el modelo no lo puede cambiar. Sin teléfono
 * —el chatbot de la web, que es anónimo— las herramientas que escriben se niegan.
 */
function telefonoDelTurno(ctx: { context?: Record<string, unknown> }): string | null {
  const t = ctx.context?.telefono;
  return typeof t === 'string' && t ? normalizePhone(t) : null;
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
  async ({ dias = 7 }, ctx) => {
    try {
      const telefono = telefonoDelTurno(ctx);
      // Un horario está ocupado si tiene evento en Calendar O si una ficha lo
      // tiene apartado — el propio apartado del cliente no, que si no Luz le
      // diría que su fecha ya no está libre.
      return await getAvailableSlots(dias, {
        ...(telefono ? { excluirTelefono: telefono } : {}),
      });
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


export const guardarPreReservaTool = ai.defineTool(
  {
    name: 'guardarPreReserva',
    description:
      'Guarda los datos del prospecto como pre-reserva en el sistema, justo después de enviarle los datos de pago (Paso 6 CIERRE). ' +
      'Úsala siempre que tengas nombre + dirección completa + patrón + horario acordado, aunque el cliente aún no haya mandado el comprobante. ' +
      'Calcula y guarda las 4 fechas reales del patrón (no solo la primera) para que, cuando llegue el comprobante, el sistema respete ' +
      'exactamente esas 4 fechas en vez de recalcular un bloque distinto.',
    inputSchema: z.object({
      nombre: z.string().describe('Nombre completo del prospecto'),
      zona: z.string().describe('Dirección completa: calle, número y colonia'),
      curso: z.string().optional().describe('Curso acordado, ej: Automático'),
      transmision: z.string().optional().describe('Estándar o Automático'),
      patron: z.enum(['lunes-jueves', 'martes-viernes', 'fin-de-semana']).optional()
        .describe('Patrón de clases acordado. Si se da junto con fechaInicio + hora, se calculan las 4 fechas completas.'),
      fechaInicio: z.string().optional().describe('Fecha de inicio propuesta en formato YYYY-MM-DD'),
      hora: z.string().optional().describe('Hora propuesta en formato HH:mm, ej: 10:00'),
      edadAlumno: z.number().optional()
        .describe('Edad del ALUMNO (no de quien contrata) si salió en la conversación, ej: 16. Los menores de 18 necesitan constancia para SEMOVI.'),
    }),
    outputSchema: z.object({ ok: z.boolean() }),
  },
  async ({ nombre, zona, curso, transmision, patron, fechaInicio, hora, edadAlumno }, ctx) => {
    try {
      const telefono = telefonoDelTurno(ctx);
      if (!telefono) {
        console.warn('[TOOL] guardarPreReserva sin teléfono en el contexto — no se guarda');
        return { ok: false };
      }
      const { savePreReserva } = await import('@/lib/firestore');
      const fechas = patron && fechaInicio && hora
        ? calcularFechas(patron, fechaInicio, hora).map(f => ({ date: f.date.split('T')[0], time: f.time }))
        : fechaInicio && hora ? [{ date: fechaInicio, time: hora }] : [];
      // La edad casi siempre sale sola ("mi hijo tiene 16"). Es la única señal
      // temprana de que va a hacer falta la constancia de SEMOVI, y sin
      // registrarla el pendiente se perdía: nadie lleva la cuenta de cuáles se
      // deben. requiereConstancia queda undefined si nunca se mencionó la edad,
      // que no es lo mismo que saber que no la necesita.
      await savePreReserva(telefono, {
        nombre,
        telefono,
        zona,
        curso: curso ?? 'Estándar',
        transmision: transmision ?? 'Estándar',
        fechas,
        ...(edadAlumno !== undefined
          ? { edadAlumno, requiereConstancia: edadAlumno < 18 }
          : {}),
      });

      // Ficha única (web + Luz): el panel /admin/reservas las ve todas
      const { guardarFicha } = await import('@/lib/fichaLuz');
      const cursoFicha = curso ?? 'Estándar';
      // Si mandó el comprobante antes de tener ficha, el webhook lo dejó
      // apuntado en la conversación: se cuelga aquí, al nacer la ficha.
      const { db } = await import('@/lib/firestore');
      const comprobantePendienteURL: string | undefined = await db
        .collection('conversations').doc(telefono).get()
        .then((d) => d.data()?.comprobantePendienteURL)
        .catch(() => undefined);
      await guardarFicha(
        telefono,
        {
          studentName: nombre,
          curso: cursoFicha,
          precio: PRECIO_CURSO[cursoFicha] ?? 0, // TODO: dato pendiente si el curso no está en el catálogo
          opcionesFechaHora: fechas.map((f) => `${f.date} ${f.time}`),
          zona,
          // linkCierre arma wa.me/52{telefono} → se guarda a 10 dígitos
          telefono: celularLocal(telefono),
          ...(comprobantePendienteURL ? { comprobanteURL: comprobantePendienteURL } : {}),
        },
        'luz'
      ).catch((e) => console.error('[TOOL] guardarFicha error:', e));

      console.log('[TOOL] guardarPreReserva guardado para', telefono);
      return { ok: true };
    } catch (e) {
      console.error('[TOOL] guardarPreReserva error:', e);
      return { ok: false };
    }
  }
);

export const cancelarClaseAlumnoTool = ai.defineTool(
  {
    name: 'cancelarClaseAlumno',
    description:
      'Cancela la clase agendada de un alumno cuando ÉL pide cancelar (no cuando el instructor no puede — para eso es otro flujo). ' +
      'Úsala en cuanto el cliente diga que ya no puede o ya no quiere su clase agendada, por WhatsApp o si te dicen que llamó por teléfono a cancelar. ' +
      'Avisa automáticamente al instructor asignado y al equipo — no hace falta que tú lo hagas aparte.',
    // Sin argumentos: cancela la clase de quien está escribiendo, y de nadie más.
    inputSchema: z.object({}),
    outputSchema: z.object({
      ok: z.boolean(),
      mensaje: z.string().describe('Si ok=false, explica por qué (ej: no se encontró clase activa) para que se lo digas al cliente.'),
    }),
  },
  async (_input, ctx) => {
    try {
      const telefono = telefonoDelTurno(ctx);
      if (!telefono) {
        return { ok: false, mensaje: 'Por aquí no se puede cancelar: tiene que escribir desde el WhatsApp con el que se inscribió.' };
      }
      const { getClasesDeAlumno, updateClaseEstado } = await import('@/lib/firestore');
      const clases = await getClasesDeAlumno(telefono);
      const activa = clases.find(c => c.estado === 'pendiente' || c.estado === 'confirmada');

      if (!activa) {
        return { ok: false, mensaje: 'No se encontró ninguna clase activa a nombre de este número de WhatsApp.' };
      }

      await updateClaseEstado(activa.id, 'cancelada');

      const { notificarAdmin } = await import('@/lib/adminNotify');
      await notificarAdmin(
        `❌ *Clase cancelada por el alumno*\n👤 ${activa.alumnoNombre}\n📅 ${activa.fecha} ${activa.hora}\n🧑‍🏫 Instructor: ${activa.instructorNombre}\n\nAvisa al instructor si no le llega el mensaje.`
      );

      const WA_TOKEN = process.env.META_WHATSAPP_TOKEN ?? '';
      const PHONE_ID = process.env.META_PHONE_NUMBER_ID ?? '';
      if (activa.instructorPhone && WA_TOKEN && PHONE_ID) {
        await fetch(`https://graph.facebook.com/v21.0/${PHONE_ID}/messages`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${WA_TOKEN}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: activa.instructorPhone,
            type: 'text',
            text: { body: `📢 ${activa.alumnoNombre} canceló la clase del ${activa.fecha} a las ${activa.hora}. No hace falta que vayas.` },
          }),
        }).catch(e => console.error('[TOOL] Error avisando al instructor:', e));
      }

      console.log('[TOOL] cancelarClaseAlumno: clase', activa.id, 'cancelada para', telefono);
      return { ok: true, mensaje: 'Clase cancelada, instructor y equipo avisados.' };
    } catch (e) {
      console.error('[TOOL] cancelarClaseAlumno error:', e);
      return { ok: false, mensaje: 'Error interno al cancelar.' };
    }
  }
);

/** Las que sólo leen: lo único que se le da a quien no sabemos quién es. */
export const AEA_TOOLS_LECTURA = [
  consultarDisponibilidadTool,
  consultarCatalogoCursosTool,
  consultarProgramaCursoTool,
];

// confirmarInscripcion ya no existe: creaba las cuatro clases en Calendar y
// cerraba la venta como ganada con la sola palabra del modelo, sin que nadie
// hubiera visto el depósito. Las clases se crean cuando una persona confirma el
// apartado y la ficha pasa a 'reservada' (lib/fichaLuz.ts).
export const AEA_TOOLS = [
  ...AEA_TOOLS_LECTURA,
  guardarPreReservaTool,
  cancelarClaseAlumnoTool,
];
