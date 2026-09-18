/**
 * La ficha se manda como enlace, no como PDF.
 *
 * Antes se generaba un PDF y se subía a WhatsApp como documento. Se veía mal
 * al reenviarlo: llega como archivo, abre en un visor, en iPhone a veces ni
 * previsualiza, y obliga a tener con qué abrirlo. Poco profesional para algo
 * que el alumno va a enseñar o reenviar.
 *
 * Un enlace abre en el navegador, en cualquier teléfono, sin depender de nada
 * instalado. Y hay una razón de fondo, más importante que la estética:
 *
 *   **un PDF es una foto congelada.** Si el alumno paga, si cambian las
 *   fechas, si se marca el depósito, el PDF sigue diciendo lo de antes. La
 *   página se actualiza sola.
 *
 * El token sale de la ficha guardada. Si no lo tiene —fichas de antes de que
 * existiera el token— se le genera uno y se guarda, en vez de mandar un
 * enlace roto.
 */

import { randomBytes } from 'crypto';
import { db } from '@/lib/firestore';
/** Lo que se necesita saber de una inscripción para poder mandarla. */
export interface FichaData {
  nombre: string;
  telefono: string;
  zona: string;
  curso?: string;
  transmision?: string;
  fechas: { date: string; time: string; nota?: string }[];
  nota?: string;
  folio?: string;
}

const BASE = 'https://app.autoescuelaamericana.com';

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

/** "lunes 22 de septiembre · 10:00 a.m." */
export function fechaLarga(date: string, time: string): string {
  const [y, m, d] = date.split('-').map(Number);
  if (!y || !m || !d) return `${date} ${time}`;
  const dt = new Date(y, m - 1, d);
  const [hh, mm] = time.split(':').map(Number);
  const ampm = hh >= 12 ? 'p.m.' : 'a.m.';
  const h12 = hh % 12 || 12;
  return `${DIAS[dt.getDay()]} ${d} de ${MESES[m - 1]} · ${h12}:${String(mm ?? 0).padStart(2, '0')} ${ampm}`;
}

export function enlaceFicha(token: string): string {
  return `${BASE}/ficha/${token}`;
}

/**
 * El mensaje para el ALUMNO. Trae lo indispensable para que reconozca que es
 * suyo sin abrir nada, y el enlace para el detalle.
 *
 * No se repite el curso ni el precio: eso ya lo acaba de platicar con Luz, y
 * un mensaje largo en WhatsApp se lee menos, no más.
 */
export function mensajeAlumno(data: FichaData, token: string): string {
  const pila = data.nombre.trim().split(/\s+/)[0] || '';
  const fechas = data.fechas.slice(0, 4).map(f => `• ${fechaLarga(f.date, f.time)}`);

  return [
    `📋 ${pila ? `Hola ${pila}, a` : 'A'}quí está tu ficha de Auto Escuela Americana:`,
    '',
    enlaceFicha(token),
    '',
    ...(fechas.length ? ['Tus clases:', ...fechas, ''] : []),
    'Ahí puedes ver tus datos, tus fechas y el estatus de tu apartado. Se actualiza solo.',
  ].join('\n');
}

/** El mensaje para el admin: quién es, cómo localizarlo y a dónde ir. */
export function mensajeAdmin(data: FichaData, token: string): string {
  return [
    `📋 *Ficha nueva* — ${data.nombre}`,
    `📱 +${data.telefono}`,
    `📍 ${data.zona || 'Sin zona'}`,
    ...(data.curso ? [`🚗 ${data.curso}`] : []),
    '',
    enlaceFicha(token),
  ].join('\n');
}

/**
 * El token de esta ficha. Si no tiene, se le pone uno y se guarda.
 *
 * Al 2026-09-18 había 7 de 17 fichas reservadas sin token, de antes de que
 * existiera. Sin esto, a esas se les mandaría un enlace roto.
 */
export async function tokenDeFicha(telefono: string): Promise<string | null> {
  try {
    const ref = db.collection('fichas').doc(telefono);
    const snap = await ref.get();
    if (!snap.exists) return null;

    const actual = snap.data()?.fichaToken;
    if (typeof actual === 'string' && actual) return actual;

    const nuevo = randomBytes(9).toString('base64url');
    await ref.update({ fichaToken: nuevo });
    console.log('[FICHA] token generado para una ficha vieja:', telefono);
    return nuevo;
  } catch (e) {
    console.error('[FICHA] no se pudo leer el token de', telefono, e);
    return null;
  }
}

async function mandarTexto(to: string, texto: string, quien: string): Promise<void> {
  const waToken = process.env.META_WHATSAPP_TOKEN ?? '';
  const phoneId = process.env.META_PHONE_NUMBER_ID ?? '';
  if (!waToken || !phoneId) {
    console.error('[FICHA] faltan credenciales de WhatsApp');
    return;
  }

  const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${waToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      // Sin preview: la tarjeta que arma WhatsApp tapa el mensaje y el alumno
      // ya sabe qué es porque se lo dice el texto.
      text: { body: texto, preview_url: false },
    }),
  }).catch((e: unknown) => {
    console.error(`[FICHA] error de red mandando a ${quien}:`, e);
    return null;
  });

  if (!res) return;
  if (!res.ok) {
    console.error(`[FICHA] Meta rechazó el envío a ${quien}:`, res.status, await res.text());
    return;
  }
  console.log(`[FICHA] enlace enviado a ${quien} (${to}) — 200 no garantiza entrega`);
}

/**
 * Manda la ficha. Sin `to`, va al admin; con `to`, a esa persona.
 *
 * Reemplaza a `enviarFichaAdminWhatsApp`. Nunca lanza: un aviso que falla no
 * debe tumbar una inscripción que ya quedó guardada.
 */
export async function enviarFicha(data: FichaData, to?: string): Promise<void> {
  const token = await tokenDeFicha(data.telefono);

  if (!token) {
    // Sin ficha guardada no hay página que enseñar. Se avisa igual, para que
    // nadie se entere de la inscripción hasta que alguien mire el panel.
    const { notificarAdmin } = await import('@/lib/adminNotify');
    await notificarAdmin(
      `📋 *Ficha nueva* — ${data.nombre}\n📱 +${data.telefono}\n\n⚠️ Sin ficha guardada; ábrela en ${BASE}/admin/fichas`
    ).catch(() => {});
    return;
  }

  if (to) {
    await mandarTexto(to, mensajeAlumno(data, token), 'el alumno');
    return;
  }

  const { notificarAdmin } = await import('@/lib/adminNotify');
  await notificarAdmin(mensajeAdmin(data, token)).catch(e =>
    console.error('[FICHA] no se pudo avisar al admin:', e)
  );
}
