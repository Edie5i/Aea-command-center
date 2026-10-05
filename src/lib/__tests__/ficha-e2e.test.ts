/**
 * Las fichas de punta a punta: se guardan, se manda el enlace al número correcto,
 * y el enlace abre la ficha que es.
 *
 * Corre el código real (fichaLuz, ficha-enlace, saveInscripcionData, la acción de
 * /agenda) contra una Firestore en memoria con latencia aleatoria, y captura lo
 * que saldría a WhatsApp. Cada caso de aquí fue un bug en producción:
 *
 *  - Luz mandaba el link de la pre-reserva a 10 dígitos → +55, Brasil.
 *  - En /agenda el envío corría en paralelo al guardado: el alumno no recibía nada.
 *  - El comprobante y la inscripción se pisaban: el depósito volvía a "pendiente".
 *  - Admin y alumno en paralelo generaban dos tokens para una ficha vieja.
 *
 * Las transacciones se emulan serializándolas, que es el resultado que garantiza
 * Firestore (reintenta la que choca).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

type Doc = Record<string, unknown>;
const store = new Map<string, Doc>();
let latencia = () => 0;
const espera = () => new Promise(r => setTimeout(r, latencia()));
const limpio = (d: Doc) => JSON.parse(JSON.stringify(d)) as Doc;

function docRef(path: string) {
  return {
    path,
    id: path.split('/').pop()!,
    async get() {
      await espera();
      const d = store.get(path);
      return { exists: !!d, id: path.split('/').pop(), data: () => (d ? structuredClone(d) : undefined) };
    },
    async set(data: Doc, opts?: { merge?: boolean }) {
      await espera();
      store.set(path, opts?.merge ? { ...(store.get(path) ?? {}), ...limpio(data) } : limpio(data));
    },
    async update(data: Doc) {
      await espera();
      store.set(path, { ...(store.get(path) ?? {}), ...limpio(data) });
    },
    collection: (n: string) => coleccion(`${path}/${n}`),
  };
}

function coleccion(prefijo: string) {
  const consulta = (filtros: [string, unknown][] = []) => ({
    where: (f: string, _op: string, v: unknown) => consulta([...filtros, [f, v]]),
    limit: () => consulta(filtros),
    orderBy: () => consulta(filtros),
    async get() {
      await espera();
      const docs = [...store.entries()]
        .filter(([k]) => k.startsWith(prefijo + '/') && !k.slice(prefijo.length + 1).includes('/'))
        .filter(([, d]) => filtros.every(([f, v]) => d[f] === v))
        .map(([k, d]) => ({ id: k.split('/').pop(), data: () => structuredClone(d) }));
      return { empty: docs.length === 0, docs };
    },
  });
  return { doc: (id?: string) => docRef(`${prefijo}/${id ?? Math.random().toString(36).slice(2)}`), ...consulta() };
}

let cola: Promise<unknown> = Promise.resolve();
function runTransaction<T>(fn: (tx: unknown) => Promise<T>): Promise<T> {
  const tx = {
    get: (ref: ReturnType<typeof docRef>) => ref.get(),
    set: (ref: ReturnType<typeof docRef>, d: Doc, o?: { merge?: boolean }) => {
      pendientes.push(() => ref.set(d, o));
    },
    update: (ref: ReturnType<typeof docRef>, d: Doc) => {
      pendientes.push(() => ref.update(d));
    },
  };
  let pendientes: (() => Promise<void>)[] = [];
  const corrida = cola.then(async () => {
    pendientes = [];
    const r = await fn(tx);
    for (const p of pendientes) await p();
    return r;
  });
  cola = corrida.catch(() => {});
  return corrida;
}

vi.mock('server-only', () => ({}));
vi.mock('firebase-admin/app', () => ({ initializeApp: () => {}, getApps: () => [1], getApp: () => ({}) }));
vi.mock('firebase-admin/firestore', () => ({
  getFirestore: () => ({ collection: coleccion, runTransaction }),
  Timestamp: { now: () => ({ toMillis: () => Date.now() }), fromMillis: (m: number) => ({ toMillis: () => m }) },
  FieldValue: {},
}));
const avisosAdmin: string[] = [];
vi.mock('@/lib/adminNotify', () => ({ notificarAdmin: async (t: string) => { avisosAdmin.push(t); } }));
vi.mock('@/ai/flows/create-calendar-event', () => ({ scheduleAndCreateEvents: async () => ({ message: 'ok' }) }));

const whatsapp: { to: string; body: string }[] = [];
process.env.META_WHATSAPP_TOKEN = 'token';
process.env.META_PHONE_NUMBER_ID = 'phone-id';
globalThis.fetch = (async (_url: string, init: { body: string }) => {
  const b = JSON.parse(init.body);
  whatsapp.push({ to: b.to, body: b.text?.body ?? '' });
  return { ok: true, text: async () => '' };
}) as unknown as typeof fetch;

const tokenDelMensaje = (s: string) => s.match(/\/ficha\/([\w-]+)/)?.[1];
const ficha = (tel: string) => store.get(`fichas/${tel}`) as Doc & { fichaToken?: string; depositoPagado?: boolean; estado?: string };

beforeEach(() => {
  store.clear();
  whatsapp.length = 0;
  avisosAdmin.length = 0;
  latencia = () => 0;
});

describe('ficha de punta a punta', () => {
  it('Luz, pre-reserva: el link va al número con 52, no a 10 dígitos', async () => {
    const { guardarFicha } = await import('@/lib/fichaLuz');
    // Lo mismo que hace guardarPreReservaTool: doc por 12 dígitos, campo a 10.
    await guardarFicha('525512345678', {
      studentName: 'Ana Pérez', curso: 'Estándar', precio: 3400,
      opcionesFechaHora: ['2026-10-12 10:00'], zona: 'Roma Sur', telefono: '5512345678',
    }, 'luz');

    expect(whatsapp.map(w => w.to)).toEqual(['525512345678']);
    expect(tokenDelMensaje(whatsapp[0].body)).toBe(ficha('525512345678').fichaToken);
  });

  it('web /agenda, alumno nuevo: recibe su link y el token es el de su ficha', async () => {
    latencia = () => 2 + Math.random() * 8;
    const { createCalendarEventsAction } = await import('@/app/agenda/actions');
    const r = await createCalendarEventsAction({
      name: 'Luis Gómez', phone: '55 1111 2222', address: 'Narvarte', transmission: 'Automático',
      dates: [{ date: '2026-10-13T12:00:00', time: '10:00' }],
    } as never);

    expect(r.success).toBe(true);
    const alAlumno = whatsapp.filter(w => w.to === '525511112222');
    expect(alAlumno).toHaveLength(1);
    expect(tokenDelMensaje(alAlumno[0].body)).toBe(ficha('525511112222').fichaToken);
    expect(avisosAdmin.some(a => a.includes('Sin ficha guardada'))).toBe(false);
  });

  it('comprobante e inscripción a la vez: el depósito no se pierde', async () => {
    const { guardarFicha, actualizarFicha } = await import('@/lib/fichaLuz');
    const { saveInscripcionData } = await import('@/lib/firestore');
    const tel = '525533334444';
    await guardarFicha(tel, {
      studentName: 'Eva', curso: 'Estándar', precio: 3400,
      opcionesFechaHora: ['2026-10-14 10:00'], zona: 'Del Valle', telefono: '5533334444',
    }, 'luz');
    latencia = () => 2 + Math.random() * 15;

    for (let i = 0; i < 15; i++) {
      store.set(`fichas/${tel}`, { ...ficha(tel), depositoPagado: false, comprobanteURL: null, estado: 'pendiente' });
      // Igual que el webhook: la subida del comprobante corre mientras se inscribe.
      await Promise.all([
        actualizarFicha(tel, { depositoPagado: true, comprobanteURL: '/api/admin/comprobante?path=x' }),
        saveInscripcionData(tel, {
          nombre: 'Eva', telefono: tel, zona: 'Del Valle', curso: 'Estándar', transmision: 'Estándar',
          fechas: [{ date: '2026-10-14', time: '10:00' }],
        }),
      ]);
      expect(ficha(tel).depositoPagado).toBe(true);
      expect(ficha(tel).estado).toBe('reservada');
    }
  });

  it('ficha vieja sin token, admin y alumno en paralelo: un solo token y ambos links abren', async () => {
    const tel = '525577778888';
    store.set(`fichas/${tel}`, { studentName: 'Pepe', telefono: '5577778888', estado: 'pendiente' });
    latencia = () => 2 + Math.random() * 10;
    const { enviarFicha } = await import('@/lib/ficha-enlace');
    const datos = { nombre: 'Pepe', telefono: tel, zona: 'Centro', fechas: [] };

    await Promise.all([enviarFicha(datos), enviarFicha(datos, tel)]);

    const guardado = ficha(tel).fichaToken;
    expect(guardado).toBeTruthy();
    expect(tokenDelMensaje(whatsapp.find(w => w.to === tel)!.body)).toBe(guardado);
    expect(tokenDelMensaje(avisosAdmin.find(a => a.includes('/ficha/'))!)).toBe(guardado);
  });

  it('el token del link encuentra la ficha (lo que hace /ficha/[token])', async () => {
    const { guardarFicha } = await import('@/lib/fichaLuz');
    await guardarFicha('525566667777', {
      studentName: 'Rosa', curso: 'Automático', precio: 3900,
      opcionesFechaHora: ['2026-10-15 16:00'], telefono: '5566667777',
    }, 'luz');
    const { db } = await import('@/lib/firestore');
    const tok = tokenDelMensaje(whatsapp[0].body)!;
    const snap = await db.collection('fichas').where('fichaToken', '==', tok).limit(1).get();

    expect(snap.empty).toBe(false);
    expect(snap.docs[0].data()).toMatchObject({ studentName: 'Rosa', precio: 3900 });
  });
});
