// lib/fichaLuz.ts — Fuente ÚNICA. Ficha web (/agenda) + Luz caen aquí. Dashboard las ve TODAS.
import { randomBytes } from 'crypto';
import { db } from '@/lib/firestore';
import { notificarAdmin } from '@/lib/adminNotify';
import { type Ficha, APARTADO, revisarFicha } from '@/lib/ficha-reglas';

// Reexportadas: media app importa la ficha desde aquí.
export { APARTADO, revisarFicha };
export type { Ficha };

const generarToken = () => randomBytes(9).toString('base64url');

// El enlace de la ficha se manda con ficha-enlace.ts, el mismo módulo que usa
// la web, el panel y confirmarInscripcion. Antes esta función armaba su propio
// mensaje —sin las fechas, sin revisar la respuesta de Meta— y lo mandaba al
// `telefono` de la ficha, que se guarda a 10 dígitos para armar el wa.me. Meta
// necesita lada: ese envío se rechazaba siempre y nadie lo veía en los logs.
async function mandarEnlaceAlAlumno(id: string, ficha: Ficha): Promise<void> {
  const { enviarFicha } = await import('@/lib/ficha-enlace');
  await enviarFicha(
    {
      nombre: ficha.studentName,
      // El id de la ficha es el teléfono normalizado a 52XXXXXXXXXX: sirve para
      // resolver el token y es lo que Meta acepta como destinatario.
      telefono: id,
      zona: ficha.zona ?? '',
      curso: ficha.curso,
      fechas: ficha.opcionesFechaHora.map((f) => {
        const [date, time] = f.split(' ');
        return { date, time: time ?? '' };
      }),
    },
    id
  );
}

// Aviso puntual al admin: cuando cambia el estado, o cuando llega la dirección
// por primera vez. Sin spam por re-guardados: si nada de eso cambió, no manda.
async function notificarCambios(prev: Ficha | null, ficha: Ficha): Promise<void> {
  const cambioEstado = prev?.estado !== ficha.estado;
  const llegoZona = !prev?.zona && !!ficha.zona;
  if (!cambioEstado && !llegoZona) return;

  const chip = ficha.origen === 'web' ? '🌐 Web' : ficha.origen === 'mostrador' ? '🏫 Mostrador' : '💬 Luz';
  const nombre = ficha.studentName || 'Sin nombre';
  const dir = ficha.zona ? `\n📍 ${ficha.zona}` : '';
  const linkFicha = ficha.fichaToken ? `\n📋 Ficha: https://app.autoescuelaamericana.com/ficha/${ficha.fichaToken}` : '';

  let texto: string;
  if (cambioEstado) {
    texto =
      ficha.estado === 'reservada'
        ? `✅ *FICHA RESERVADA* — ${nombre}\n🚗 ${ficha.curso} $${ficha.precio.toLocaleString('es-MX')} · Depósito $${ficha.depositoMonto.toLocaleString('es-MX')} PAGADO${dir}\n${chip} · 📱 ${ficha.telefono}${linkFicha}`
        : `🟡 *Ficha ${ficha.estado.toUpperCase()}* — ${nombre}\n🚗 ${ficha.curso || '¿curso?'} · Falta: ${ficha.faltantes.join(', ')}${dir}\n${chip} · 📱 ${ficha.telefono || '¿tel?'}` +
          (ficha.telefono ? `\n👉 Cerrar: ${linkCierre(ficha)}` : '') + linkFicha;
  } else {
    // Sólo llegó la dirección: aviso corto y accionable
    texto =
      `📍 *DIRECCIÓN RECIBIDA* — ${nombre}\n${ficha.zona}\n` +
      `🚗 ${ficha.curso || '¿curso?'} · ${ficha.faltantes.length ? 'Falta: ' + ficha.faltantes.join(', ') : 'sin pendientes'}\n` +
      `${chip} · 📱 ${ficha.telefono || '¿tel?'}` +
      (ficha.telefono ? `\n👉 Cerrar: ${linkCierre(ficha)}` : '') + linkFicha;
  }

  await notificarAdmin(texto).catch((e) => console.error('[FICHA] Error notificando cambio:', e));
}

// Web y Luz llaman ESTA función. Misma colección 'fichas'. Cero leads perdidos.
export async function guardarFicha(id: string, datos: Partial<Ficha>, origen: Ficha['origen']) {
  const ref = db.collection('fichas').doc(id);
  const snap = await ref.get();
  const existente = snap.exists ? (snap.data() as Ficha) : null;

  const precio = datos.precio ?? 0;
  // El token se genera UNA vez y se preserva — el mismo link sirve toda la
  // vida de la ficha, la página siempre lee el estado actual en vivo.
  const fichaToken = existente?.fichaToken ?? generarToken();
  // Firestore rechaza `undefined` y al rechazarlo tira el `set` COMPLETO, no el
  // campo. `zona` es el único campo opcional de la ficha, así que una ficha sin
  // dirección —las de Luz no siempre la traen— no se guardaba, y el error se lo
  // comían los `.catch` de los llamadores. Se preserva igual que 'creada' (un
  // re-guardado sin dirección no debe borrar la que ya se capturó) y abajo va
  // como llave condicional: con merge:true, no mandarla es exactamente "déjala
  // como está".
  const zona = datos.zona ?? existente?.zona;
  // Primero los campos, y lo que falta se revisa sobre ELLOS. Antes se revisaba
  // `datos` —sólo lo que trae la llamada—, así que un re-guardado que no manda el
  // depósito lo reportaba faltante aunque estuviera pagado desde antes.
  const campos: Omit<Ficha, 'estado' | 'faltantes'> = {
    studentName: datos.studentName ?? '',
    curso: datos.curso ?? '',
    precio,
    opcionesFechaHora: datos.opcionesFechaHora ?? [],
    // Lo del apartado se preserva igual que 'zona' o 'creada'. Antes estas tres
    // líneas pisaban lo guardado con APARTADO/false/null, y como guardarPreReserva
    // vuelve a llamar aquí cada vez que Luz toca la pre-reserva —sin mandar estos
    // campos—, un alumno que ya había apartado y luego cambiaba fechas volvía a
    // 'pendiente': su ficha le pedía otra vez los $690 y al admin le llegaba
    // "Falta: depósito". El monto además es una promesa: el que se le dijo cuando
    // reservó, no el APARTADO de hoy.
    depositoMonto: existente?.depositoMonto ?? APARTADO,
    depositoPagado: datos.depositoPagado ?? existente?.depositoPagado ?? false,
    comprobanteURL: datos.comprobanteURL ?? existente?.comprobanteURL ?? null,
    origen,
    telefono: datos.telefono ?? '',
    ...(zona ? { zona } : {}),
    // Preservar la fecha original — si no, cada re-guardado (ej. Luz llamando
    // guardarPreReserva varias veces) corre la ficha al tope de /admin/reservas.
    creada: existente?.creada ?? Date.now(),
    fichaToken,
    ...(datos.depositoRegistrado ?? existente?.depositoRegistrado
      ? { depositoRegistrado: datos.depositoRegistrado ?? existente?.depositoRegistrado }
      : {}),
    ...(datos.nota ?? existente?.nota ? { nota: datos.nota ?? existente?.nota } : {}),
  };
  const faltantes = revisarFicha(campos);
  const ficha: Ficha = {
    ...campos,
    // Una ficha marcada 'perdida' a mano no debe revivir sola porque Luz vuelva
    // a llamar guardarPreReserva u otro re-guardado toque el mismo teléfono.
    estado: existente?.estado === 'perdida'
      ? 'perdida'
      : faltantes.length === 0 ? 'reservada' : faltantes.length >= 3 ? 'nueva' : 'pendiente',
    faltantes,
  };
  await ref.set(ficha, { merge: true });
  await notificarCambios(existente, ficha);
  // Ficha nueva (no un re-guardado): mandarle el enlace al alumno de una vez,
  // aunque todavía no haya pagado — es lo que pidió Eduardo explícitamente.
  if (!existente && ficha.telefono) {
    await mandarEnlaceAlAlumno(id, ficha).catch(
      (e) => console.error('[FICHA] Error mandando el enlace al alumno:', e)
    );
  }
  return ficha;
}

// Actualización parcial: lee la ficha existente, fusiona el patch y recalcula
// depósito/estado/faltantes. (guardarFicha con datos parciales pisaría campos con vacíos.)
export async function actualizarFicha(id: string, patch: Partial<Ficha>): Promise<Ficha> {
  const ref = db.collection('fichas').doc(id);
  const snap = await ref.get();
  const actual = (snap.exists ? snap.data() : {}) as Partial<Ficha>;
  const datos = { ...actual, ...patch };
  const precio = datos.precio ?? 0;
  const faltantes = revisarFicha(datos);
  const ficha: Ficha = {
    studentName: datos.studentName ?? '',
    curso: datos.curso ?? '',
    precio,
    opcionesFechaHora: datos.opcionesFechaHora ?? [],
    // `datos` ya trae la ficha guardada: el apartado prometido se queda como
    // estaba, no se recalcula al APARTADO de hoy.
    depositoMonto: datos.depositoMonto ?? APARTADO,
    depositoPagado: datos.depositoPagado ?? false,
    comprobanteURL: datos.comprobanteURL ?? null,
    origen: datos.origen ?? 'luz',
    estado: (actual as Ficha | undefined)?.estado === 'perdida' && patch.estado === undefined
      ? 'perdida'
      : faltantes.length === 0 ? 'reservada' : faltantes.length >= 3 ? 'nueva' : 'pendiente',
    faltantes,
    telefono: datos.telefono ?? '',
    // Condicional por lo mismo que en guardarFicha: `zona: undefined` tiraba el
    // guardado entero. Pegaba al confirmar el apartado de una ficha vieja, de
    // antes de que el campo existiera.
    ...(datos.zona ? { zona: datos.zona } : {}),
    creada: datos.creada ?? Date.now(),
    fichaToken: (actual as Ficha | undefined)?.fichaToken ?? generarToken(),
    ...(datos.depositoRegistrado ? { depositoRegistrado: datos.depositoRegistrado } : {}),
    ...(datos.nota ? { nota: datos.nota } : {}),
  };
  await ref.set(ficha, { merge: true });
  await notificarCambios(actual as Ficha | null, ficha);
  return ficha;
}

// Marca manualmente una ficha como perdida (lead que nunca pagó y ya no va a
// responder). No pasa por guardarFicha/actualizarFicha porque esas recalculan
// estado a partir de faltantes — aquí el estado lo decide una persona.
export async function marcarPerdida(id: string, razon?: string): Promise<void> {
  const ref = db.collection('fichas').doc(id);
  await ref.set(
    { estado: 'perdida', ...(razon ? { perdidaRazon: razon } : {}) },
    { merge: true }
  );
}

// El dashboard llama esto: TODO (web + Luz), lo más caliente arriba.
export async function traerFichas() {
  const snap = await db.collection('fichas').orderBy('creada', 'desc').get();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Ficha) }));
}

// Link de WhatsApp pre-armado para que TÚ cierres manual, con tu escasez.
export const linkCierre = (f: Ficha) =>
  `https://wa.me/52${f.telefono}?text=${encodeURIComponent(
    `Hola ${f.studentName}, vi tu solicitud de clases. Te aparto tu lugar con $${f.depositoMonto.toLocaleString('es-MX')}. ¿Te va?`
  )}`;
