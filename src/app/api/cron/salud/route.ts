/**
 * Chequeo diario de salud. Manda un resumen al admin por WhatsApp.
 *
 * Existe porque todo lo que se rompió el 30 de julio se encontró por accidente:
 * 38 eventos duplicados, fechas de Firestore que no coincidían con Calendar,
 * pre-reservas fantasma ocupando horarios y avisos que Meta descartaba en
 * silencio. Ninguna de esas fallas gritó; todas se vieron por casualidad.
 *
 * El resumen se manda SIEMPRE, aunque esté todo en orden: un monitor que sólo
 * habla cuando hay problemas es indistinguible de un monitor muerto.
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firestore';
import { notificarAdmin } from '@/lib/adminNotify';
import { getEventosProximos } from '@/services/calendarService';
import { claveDesdeEntrada, claveDesdeEvento, normalizarAlumno } from '@/lib/calendar-keys';

const TOKEN = process.env.META_VERIFY_TOKEN ?? 'aea_webhook_2026';
const WA_TOKEN = process.env.META_WHATSAPP_TOKEN ?? '';

const DIAS_VISTA = 30;
const AVISAR_TOKEN_DIAS = 21;
const FICHA_ESTANCADA_DIAS = 3;
const WABA_ID = '1871805990307489';
const PLANTILLA_CRITICA = 'alerta_aea';
const DIAS_PREAVISO = 14;

interface Hallazgo {
  grave: boolean;
  texto: string;
}

/** El token de usuario de Meta caduca. Cuando lo hace, se detiene TODO el WhatsApp. */
async function revisarToken(): Promise<Hallazgo | null> {
  if (!WA_TOKEN) return { grave: true, texto: '❌ No hay token de WhatsApp configurado' };
  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/debug_token?input_token=${WA_TOKEN}&access_token=${WA_TOKEN}`,
    );
    if (!res.ok) return { grave: true, texto: `❌ No se pudo verificar el token (${res.status})` };
    const { data } = (await res.json()) as { data?: { is_valid?: boolean; expires_at?: number } };
    if (!data?.is_valid) return { grave: true, texto: '❌ El token de WhatsApp ya NO es válido' };
    if (!data.expires_at) return null; // token permanente: nada que avisar
    const dias = Math.round((data.expires_at * 1000 - Date.now()) / 86_400_000);
    if (dias <= AVISAR_TOKEN_DIAS) {
      return { grave: dias <= 7, texto: `🔑 El token de WhatsApp vence en ${dias} días — renuévalo` };
    }
    return null;
  } catch {
    return { grave: false, texto: '⚠️ No se pudo consultar el estado del token' };
  }
}

/**
 * Eventos idénticos (mismo alumno, misma hora). Es el bug que llenó el calendario
 * de 38 copias; el candado de scheduleAndCreateEvents lo previene, pero esto
 * detecta cualquier vía que se lo salte.
 */
function revisarDuplicados(eventos: { alumno: string; inicio: string }[]): Hallazgo | null {
  const vistos = new Set<string>();
  const dup = new Set<string>();
  for (const e of eventos) {
    if (!e.inicio) continue;
    const k = `${normalizarAlumno(e.alumno)}|${claveDesdeEvento(e.inicio)}`;
    if (vistos.has(k)) dup.add(k);
    vistos.add(k);
  }
  if (dup.size === 0) return null;
  const muestra = [...dup].slice(0, 3).map(k => k.split('|')[0]).join(', ');
  return { grave: true, texto: `👥 ${dup.size} clase(s) duplicada(s) en Calendar — ${muestra}` };
}

/**
 * Clases confirmadas en Firestore que no tienen evento en Calendar. Es lo que
 * pasó con Rosa y Renata: el sistema decía una cosa y el calendario otra, y el
 * alumno se habría quedado esperando.
 */
async function revisarDesfase(
  eventos: { alumno: string; inicio: string }[],
  perdidas: Set<string>,
): Promise<Hallazgo | null> {
  const enCalendar = new Set(
    eventos.filter(e => e.inicio).map(e => `${normalizarAlumno(e.alumno)}|${claveDesdeEvento(e.inicio)}`),
  );
  const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });
  const snap = await db.collection('conversations').limit(300).get();

  const faltantes: string[] = [];
  for (const doc of snap.docs) {
    const ins = doc.data().inscripcion;
    if (!ins || ins.status === 'pre_reserva' || !Array.isArray(ins.fechas)) continue;
    if (perdidas.has(normalizarAlumno(ins.nombre ?? ''))) continue;
    for (const f of ins.fechas) {
      if (!f?.date || !f?.time || f.date <= hoy) continue; // sólo clases futuras
      const clave = `${normalizarAlumno(ins.nombre ?? '')}|${claveDesdeEntrada(`${f.date}T12:00:00`, f.time)}`;
      if (!enCalendar.has(clave)) faltantes.push(`${ins.nombre} ${f.date} ${f.time}`);
    }
  }
  if (faltantes.length === 0) return null;
  return {
    grave: true,
    texto: `📅 ${faltantes.length} clase(s) confirmada(s) SIN evento en Calendar — ${faltantes.slice(0, 3).join(' · ')}`,
  };
}

/**
 * Estado de las plantillas de WhatsApp.
 *
 * alerta_aea es el canal garantizado: si Meta la pausa o la deshabilita, los
 * avisos dejan de llegar fuera de la ventana de 24h y hoy no habría forma de
 * saberlo hasta echar de menos un mensaje que nunca llegó.
 */
async function revisarPlantillas(): Promise<Hallazgo | null> {
  if (!WA_TOKEN) return null;
  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${WABA_ID}/message_templates?limit=50&access_token=${WA_TOKEN}`,
    );
    if (!res.ok) return { grave: false, texto: '⚠️ No se pudo consultar el estado de las plantillas' };
    const { data } = (await res.json()) as {
      data?: { name: string; status: string }[];
    };
    const plantillas = data ?? [];

    const critica = plantillas.find(t => t.name === PLANTILLA_CRITICA);
    if (!critica || critica.status !== 'APPROVED') {
      return {
        grave: true,
        texto: `📋 La plantilla ${PLANTILLA_CRITICA} está ${critica?.status ?? 'AUSENTE'} — es el canal que garantiza tus avisos`,
      };
    }

    const rotas = plantillas.filter(t => ['REJECTED', 'PAUSED', 'DISABLED'].includes(t.status));
    if (rotas.length > 0) {
      return { grave: true, texto: `📋 ${rotas.map(t => `${t.name}: ${t.status}`).join(' · ')}` };
    }

    const pendientes = plantillas.filter(t => t.status === 'PENDING');
    if (pendientes.length > 0) {
      return { grave: false, texto: `📋 En revisión por Meta: ${pendientes.map(t => t.name).join(', ')}` };
    }
    return null;
  } catch {
    return { grave: false, texto: '⚠️ No se pudo consultar el estado de las plantillas' };
  }
}

/**
 * Pre-reservas con fecha próxima.
 *
 * Los eventos de Calendar sólo se crean al confirmar el pago, así que un lead
 * que apartó y no pagó tiene fechas guardadas en su ficha y en ningún otro
 * lado: no salen en la agenda ni en el calendario. El 31 de julio pasaron dos
 * horarios apartados sin que nadie lo supiera, y uno de esos apartados ya
 * chocaba con otro alumno.
 */
function revisarPreReservasProximas(
  fichas: FirebaseFirestore.QueryDocumentSnapshot[],
  eventos: { inicio: string }[],
): Hallazgo | null {
  const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });
  const limite = new Date(Date.now() + DIAS_PREAVISO * 86_400_000)
    .toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });

  // Horarios que ya tienen clase, para detectar apartados que chocan
  const ocupados = new Set(
    eventos.filter(e => e.inicio).map(e => claveDesdeEvento(e.inicio)),
  );

  const avisos: string[] = [];
  for (const doc of fichas) {
    const f = doc.data() as { estado?: string; studentName?: string; opcionesFechaHora?: string[] };
    if (f.estado === 'reservada' || f.estado === 'perdida') continue;
    for (const slot of f.opcionesFechaHora ?? []) {
      const [dia, hora] = slot.split(' ');
      if (!dia || !hora || dia < hoy || dia > limite) continue;
      const choca = ocupados.has(`${dia}T${hora}`);
      avisos.push(`${f.studentName || 'sin nombre'} ${dia} ${hora}${choca ? ' ⚠️OCUPADO' : ''}`);
    }
  }
  if (avisos.length === 0) return null;
  return {
    grave: avisos.some(a => a.includes('OCUPADO')),
    texto: `⏳ ${avisos.length} horario(s) apartado(s) SIN pagar en los próximos ${DIAS_PREAVISO}d — ${avisos.slice(0, 4).join(' · ')}`,
  };
}

/**
 * Reembolsos anotados y todavía sin pagar.
 *
 * Se registran a mano cuando se acuerda devolver dinero a un alumno. Sin esto
 * el dato queda escrito en Firestore y nadie lo vuelve a ver — que es como se
 * pierden los compromisos con clientes.
 */
async function revisarReembolsos(): Promise<Hallazgo | null> {
  const snap = await db.collection('conversations').limit(300).get();
  const pendientes: string[] = [];
  for (const doc of snap.docs) {
    const r = doc.data().reembolsoPendiente;
    if (!r || r.pagado) continue;
    const nombre = doc.data().inscripcion?.nombre ?? doc.data().contactName ?? doc.id;
    const dias = r.registradoEn?.toMillis
      ? Math.round((Date.now() - r.registradoEn.toMillis()) / 86_400_000)
      : 0;
    pendientes.push(`${nombre} $${r.monto}${dias > 0 ? ` (${dias}d)` : ''}`);
  }
  if (pendientes.length === 0) return null;
  return {
    grave: false,
    texto: `💸 ${pendientes.length} reembolso(s) sin pagar — ${pendientes.slice(0, 4).join(' · ')}`,
  };
}

/** Pre-reservas que llevan días sin depósito: son ventas que se están enfriando. */
function revisarFichasEstancadas(
  fichas: FirebaseFirestore.QueryDocumentSnapshot[],
): Hallazgo | null {
  const corte = Date.now() - FICHA_ESTANCADA_DIAS * 86_400_000;
  const estancadas = fichas
    .map(d => d.data())
    .filter(f => f.estado !== 'reservada' && f.estado !== 'perdida' && (f.creada ?? Date.now()) < corte);
  if (estancadas.length === 0) return null;
  const nombres = estancadas.slice(0, 3).map(f => f.studentName || 'sin nombre').join(', ');
  return {
    grave: false,
    texto: `🟡 ${estancadas.length} ficha(s) sin depósito hace +${FICHA_ESTANCADA_DIAS}d — ${nombres}`,
  };
}

export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.get('token') !== TOKEN) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const eventos = await getEventosProximos(DIAS_VISTA).catch(e => {
    console.error('[SALUD] No se pudo leer Calendar:', e);
    return null;
  });
  // Una sola lectura de fichas para las tres revisiones que las necesitan
  const fichas = await db.collection('fichas').limit(300).get()
    .then(s => s.docs)
    .catch(e => { console.error('[SALUD] No se pudieron leer las fichas:', e); return []; });
  // Alumnos con ficha marcada perdida: su inscripcion.status puede seguir
  // diciendo "confirmado" (dato viejo, nunca se reconcilia al perder el
  // lead) — sin esto, cancelar sus eventos de Calendar dispara una falsa
  // alarma de "clase confirmada sin evento".
  const perdidas = new Set(
    fichas
      .map(d => d.data())
      .filter(f => f.estado === 'perdida')
      .map(f => normalizarAlumno(f.studentName ?? '')),
  );

  const chequeos = await Promise.all([
    revisarToken(),
    Promise.resolve(eventos ? revisarDuplicados(eventos) : { grave: true, texto: '❌ No se pudo leer Google Calendar' }),
    eventos ? revisarDesfase(eventos, perdidas).catch(() => null) : Promise.resolve(null),
    Promise.resolve(revisarFichasEstancadas(fichas)),
    Promise.resolve(eventos ? revisarPreReservasProximas(fichas, eventos) : null),
    revisarPlantillas().catch(() => null),
    revisarReembolsos().catch(() => null),
  ]);

  const hallazgos = chequeos.filter((h): h is Hallazgo => h !== null);
  const graves = hallazgos.filter(h => h.grave).length;

  const encabezado = hallazgos.length === 0
    ? '✅ *Chequeo diario AEA* — todo en orden'
    : `${graves > 0 ? '🚨' : '⚠️'} *Chequeo diario AEA* — ${hallazgos.length} hallazgo(s)`;

  const cuerpo = hallazgos.map(h => h.texto).join('\n');
  const texto = [encabezado, cuerpo].filter(Boolean).join('\n\n');

  console.log('[SALUD]', texto.replace(/\n/g, ' | '));
  await notificarAdmin(texto).catch(e => console.error('[SALUD] Error notificando:', e));

  return NextResponse.json({ ok: true, hallazgos: hallazgos.length, graves });
}
