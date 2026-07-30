import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getCourses } from '@/services/courseService';
import { programData } from '@/lib/course-data';
import { getAvailableSlots } from '@/services/calendarService';
import { scheduleAndCreateEvents } from '@/ai/flows/create-calendar-event';
import { normalizePhone } from '@/lib/phone';

const DIAS_ES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function calcularFechas(patron: string, fechaInicio: string, hora: string) {
  const offsets = patron === 'fin-de-semana' ? [0, 1, 7, 8] : [0, 1, 2, 3];
  const [y, m, d] = fechaInicio.split('-').map(Number);
  return offsets.map(offset => {
    const fecha = new Date(y, m - 1, d + offset);
    const dateStr = fecha.toLocaleDateString('en-CA');
    const label = `${DIAS_ES[fecha.getDay()]} ${fecha.getDate()} de ${MESES_ES[fecha.getMonth()]}`;
    return { date: dateStr + 'T12:00:00', time: hora, label };
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
  async ({ nombre, telefono: rawTelefono, zona, transmision, patron, hora, fechaInicio }) => {
    // Normalize so Firestore key always matches the webhook's conversations/{from} doc
    const telefono = normalizePhone(rawTelefono);
    console.log('[TOOL] confirmarInscripcion llamado:', { nombre, telefono, rawTelefono, zona, patron, hora, fechaInicio });

    // Se delega en @/lib/adminNotify, que revisa la respuesta de Meta y cae a
    // plantilla si la ventana de 24h está cerrada. Aquí había una copia local
    // que sólo capturaba errores de red: los rechazos de Meta se descartaban en
    // silencio y avisos críticos —como que Calendar falló— nunca llegaban.
    async function notificarAdmin(texto: string) {
      const { notificarAdmin: enviar } = await import('@/lib/adminNotify');
      await enviar(texto);
    }

    let calendarError: string | null = null;
    try {
      const fechas = calcularFechas(patron, fechaInicio, hora);
      console.log('[TOOL] Fechas calculadas:', JSON.stringify(fechas));
      await scheduleAndCreateEvents({
        name: nombre,
        phone: telefono,
        address: zona,
        transmission: transmision ?? 'Estándar',
        dates: fechas,
      });
      console.log('[TOOL] Calendar events creados exitosamente');
    } catch (e) {
      calendarError = e instanceof Error ? e.message : String(e);
      console.error('[TOOL] Error creando eventos en Calendar:', calendarError);
    }

    const patronLabel =
      patron === 'lunes-jueves' ? 'Lunes a jueves' :
      patron === 'martes-viernes' ? 'Martes a viernes' : 'Sábado y domingo';

    if (calendarError) {
      await notificarAdmin(
        `⚠️ *Error al agendar clases*\n\n` +
        `👤 ${nombre} | 📱 +${telefono}\n` +
        `📍 ${zona} | 🚗 ${transmision ?? 'Estándar'}\n` +
        `📅 ${patronLabel} ${hora} desde ${fechaInicio}\n\n` +
        `❌ Error: ${calendarError}`
      );
      return { exitoso: false, mensaje: `Error al crear eventos: ${calendarError}` };
    }

    // Persiste datos de inscripción en Firestore para generar la ficha desde el admin panel
    const fechasCalculadas = calcularFechas(patron, fechaInicio, hora).map(f => ({
      date: f.date.split('T')[0],
      time: hora,
      label: f.label,
    }));
    try {
      const { saveInscripcionData, updateChatState } = await import('@/lib/firestore');
      const { Timestamp } = await import('firebase-admin/firestore');
      await saveInscripcionData(telefono, {
        nombre,
        telefono,
        zona,
        curso: transmision ?? 'Estándar',
        transmision: transmision ?? 'Estándar',
        fechas: fechasCalculadas.map(({ date, time }) => ({ date, time })),
      });
      console.log('[TOOL] Inscripción guardada en Firestore para', telefono);
      // Enviar ficha PDF al admin y al alumno
      const { enviarFichaAdminWhatsApp } = await import('@/lib/ficha-pdf-server');
      const fichaPayload = {
        nombre,
        telefono,
        zona,
        transmision: transmision ?? 'Estándar',
        fechas: fechasCalculadas.map(({ date, time }) => ({ date, time })),
      };
      enviarFichaAdminWhatsApp(fichaPayload)
        .catch(e => console.error('[TOOL] Error enviando ficha al admin:', e));
      enviarFichaAdminWhatsApp(fichaPayload, telefono)
        .catch(e => console.error('[TOOL] Error enviando ficha al alumno:', e));
      await updateChatState(telefono, {
        chatState: 'cerrado',
        chatReason: 'Inscripción confirmada por Luz',
        chatUrgency: 'ninguna',
        closedAt: Timestamp.now(),
        closedOutcome: 'ganado',
      }, 'manual');
      console.log('[TOOL] Lead marcado como cerrado/ganado:', telefono);
    } catch (e) {
      console.error('[TOOL] Error guardando inscripcion en Firestore:', e);
    }

    await notificarAdmin(
      `✅ *Inscripción confirmada*\n\n` +
      `👤 *Nombre:* ${nombre}\n` +
      `📱 *Teléfono:* +${telefono}\n` +
      `📍 *Zona:* ${zona}\n` +
      `🚗 *Transmisión:* ${transmision ?? 'Estándar'}\n` +
      `📅 *Patrón:* ${patronLabel} a las ${hora}\n` +
      `🗓️ *Inicio:* ${fechaInicio}\n\n` +
      `4 clases agendadas en Calendar ✅`
    );
    const fechasTexto = fechasCalculadas
      .map((f, i) => {
        const fecha = new Date(f.date + 'T12:00:00');
        const label = `${DIAS_ES[fecha.getDay()]} ${fecha.getDate()} de ${MESES_ES[fecha.getMonth()]}`;
        const [hh, mm] = f.time.split(':');
        const h = parseInt(hh);
        const ampm = h >= 12 ? 'pm' : 'am';
        const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
        return `  ${i + 1}. ${label} a las ${h12}:${mm} ${ampm}`;
      })
      .join('\n');
    return { exitoso: true, mensaje: `4 clases agendadas en Calendar:\n${fechasTexto}` };
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
      telefono: z.string().describe('Número de WhatsApp con código de país, ej: 5215512345678'),
      zona: z.string().describe('Dirección completa: calle, número y colonia'),
      curso: z.string().optional().describe('Curso acordado, ej: Automático'),
      transmision: z.string().optional().describe('Estándar o Automático'),
      patron: z.enum(['lunes-jueves', 'martes-viernes', 'fin-de-semana']).optional()
        .describe('Patrón de clases acordado. Si se da junto con fechaInicio + hora, se calculan las 4 fechas completas.'),
      fechaInicio: z.string().optional().describe('Fecha de inicio propuesta en formato YYYY-MM-DD'),
      hora: z.string().optional().describe('Hora propuesta en formato HH:mm, ej: 10:00'),
    }),
    outputSchema: z.object({ ok: z.boolean() }),
  },
  async ({ nombre, telefono: rawTelefono, zona, curso, transmision, patron, fechaInicio, hora }) => {
    try {
      const telefono = normalizePhone(rawTelefono);
      const { savePreReserva } = await import('@/lib/firestore');
      const fechas = patron && fechaInicio && hora
        ? calcularFechas(patron, fechaInicio, hora).map(f => ({ date: f.date.split('T')[0], time: f.time }))
        : fechaInicio && hora ? [{ date: fechaInicio, time: hora }] : [];
      await savePreReserva(telefono, {
        nombre,
        telefono,
        zona,
        curso: curso ?? 'Estándar',
        transmision: transmision ?? 'Estándar',
        fechas,
      });

      // Ficha única (web + Luz): el panel /admin/reservas las ve todas
      const { guardarFicha } = await import('@/lib/fichaLuz');
      const PRECIO_CURSO: Record<string, number> = {
        // Fuente: catálogo oficial AEA 2026
        'Estándar': 3400, 'Automático': 3900, 'Intermedio': 2900, 'Avanzado': 1900,
        'Moto': 4300, 'English Drive': 4800, 'Personas Nerviosas': 5600,
        'Intensivo': 5600, 'Mixto': 5600, 'Coche Propio': 3900,
      };
      const cursoFicha = curso ?? 'Estándar';
      await guardarFicha(
        telefono,
        {
          studentName: nombre,
          curso: cursoFicha,
          precio: PRECIO_CURSO[cursoFicha] ?? 0, // TODO: dato pendiente si el curso no está en el catálogo
          opcionesFechaHora: fechas.map((f) => `${f.date} ${f.time}`),
          zona,
          // linkCierre arma wa.me/52{telefono} → se guarda a 10 dígitos
          telefono: telefono.startsWith('52') && telefono.length === 12 ? telefono.slice(2) : telefono,
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

export const AEA_TOOLS = [
  consultarDisponibilidadTool,
  consultarCatalogoCursosTool,
  consultarProgramaCursoTool,
  confirmarInscripcionTool,
  guardarPreReservaTool,
];
