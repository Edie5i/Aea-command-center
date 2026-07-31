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

/** Pre-reservas que llevan días sin depósito: son ventas que se están enfriando. */
async function revisarFichasEstancadas(): Promise<Hallazgo | null> {
  const corte = Date.now() - FICHA_ESTANCADA_DIAS * 86_400_000;
  const snap = await db.collection('fichas').limit(300).get();
  const estancadas = snap.docs
    .map(d => d.data())
    .filter(f => f.estado !== 'reservada' && (f.creada ?? Date.now()) < corte);
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

  const chequeos = await Promise.all([
    revisarToken(),
    Promise.resolve(eventos ? revisarDuplicados(eventos) : { grave: true, texto: '❌ No se pudo leer Google Calendar' }),
    eventos ? revisarDesfase(eventos).catch(() => null) : Promise.resolve(null),
    revisarFichasEstancadas().catch(() => null),
    revisarPlantillas().catch(() => null),
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
