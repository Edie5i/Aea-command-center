/**
 * Lo que un re-guardado NO debe borrar.
 *
 * `guardarPreReserva` vuelve a llamar a `guardarFicha` cada vez que Luz toca la
 * pre-reserva —cuando el alumno cambia fechas, por ejemplo— y manda sólo los
 * datos de la clase. Cuando esas llamadas pisaban el apartado, un alumno que ya
 * había pagado volvía a 'pendiente': su ficha le pedía otra vez los $690 y al
 * admin le llegaba "Falta: depósito". Por eso esto se prueba.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Ficha } from '../ficha-reglas';

// Firestore de mentiras: un solo documento en memoria, con el merge de `set`.
let guardado: Partial<Ficha> | null = null;

vi.mock('../firestore', () => ({
  db: {
    // Las transacciones de mentira: leen y escriben sobre el mismo doble.
    runTransaction: async <T,>(
      fn: (tx: {
        get: (ref: { get: () => unknown }) => unknown;
        set: (ref: { set: (d: Partial<Ficha>) => Promise<void> }, d: Partial<Ficha>) => void;
      }) => Promise<T>
    ): Promise<T> => {
      const escrituras: Promise<void>[] = [];
      const r = await fn({
        get: (ref) => ref.get(),
        set: (ref, d) => { escrituras.push(ref.set(d)); },
      });
      await Promise.all(escrituras);
      return r;
    },
    collection: () => ({
      doc: () => ({
        get: async () => ({ exists: guardado !== null, data: () => guardado }),
        set: async (datos: Partial<Ficha>) => {
          // El de verdad rechaza `undefined` y tira el `set` COMPLETO, no el
          // campo. Sin esto, este doble aceptaba lo que en producción truena:
          // una ficha sin dirección se guardaba aquí y en Firestore no, y el
          // error se lo comían los `.catch` de los llamadores.
          const vacio = Object.entries(datos).find(([, v]) => v === undefined);
          if (vacio) {
            throw new Error(
              `Cannot use "undefined" as a Firestore value (found in field "${vacio[0]}")`
            );
          }
          guardado = { ...(guardado ?? {}), ...datos };
        },
      }),
    }),
  },
}));

vi.mock('../adminNotify', () => ({ notificarAdmin: async () => {} }));
vi.mock('../ficha-enlace', () => ({ enviarFicha: async () => {} }));
vi.mock('../ficha-reservada', () => ({ alReservarse: async () => {} }));

const { guardarFicha, actualizarFicha, APARTADO } = await import('../fichaLuz');

const datosDeLuz = {
  studentName: 'María Fernanda López',
  curso: 'Automático',
  precio: 3900,
  opcionesFechaHora: ['2026-10-05 10:00'],
  telefono: '5512345678',
};

beforeEach(() => {
  guardado = null;
});

describe('guardarFicha — re-guardado sobre una ficha que ya pagó', () => {
  it('no desaparta a quien ya mandó comprobante', async () => {
    await guardarFicha('525512345678', datosDeLuz, 'luz');
    // Lo confirma una persona en /admin/reservas.
    guardado = { ...guardado, depositoPagado: true, comprobanteURL: '/api/admin/comprobante?path=x', estado: 'reservada' };

    // Luz vuelve a guardar porque el alumno cambió de día: no manda el depósito.
    const ficha = await guardarFicha('525512345678', { ...datosDeLuz, opcionesFechaHora: ['2026-10-07 16:00'] }, 'luz');

    expect(ficha.depositoPagado).toBe(true);
    expect(ficha.comprobanteURL).toBe('/api/admin/comprobante?path=x');
    expect(ficha.estado).toBe('reservada');
    expect(ficha.faltantes).toEqual([]);
  });

  it('tampoco al que pagó en el mostrador, sin imagen del comprobante', async () => {
    await guardarFicha('525512345678', { ...datosDeLuz, depositoPagado: true, depositoRegistrado: 690 }, 'mostrador');
    const ficha = await guardarFicha('525512345678', datosDeLuz, 'luz');

    expect(ficha.estado).toBe('reservada');
    expect(ficha.depositoRegistrado).toBe(690);
  });

  it('una ficha sin dirección se guarda igual', async () => {
    // Luz cierra muchas veces antes de tener la dirección, y /api/ficha/crear
    // manda '' cuando el mostrador la deja vacía. Firestore no acepta que el
    // campo vaya como undefined: tiraba el documento entero.
    const ficha = await guardarFicha('525512345678', datosDeLuz, 'luz');

    expect(ficha.zona).toBeUndefined();
    expect(guardado).not.toBeNull();
    expect(guardado?.studentName).toBe('María Fernanda López');
  });

  it('la dirección que llega después no se pierde, y no reaparece vacía', async () => {
    await guardarFicha('525512345678', datosDeLuz, 'luz');
    await guardarFicha('525512345678', { ...datosDeLuz, zona: 'Calle Puebla 345, Roma' }, 'luz');

    // Un re-guardado sin dirección no la borra.
    const ficha = await guardarFicha('525512345678', datosDeLuz, 'luz');
    expect(ficha.zona).toBe('Calle Puebla 345, Roma');
  });

  it('el apartado prometido no se recalcula si cambia el de hoy', async () => {
    await guardarFicha('525512345678', datosDeLuz, 'luz');
    // La ficha vieja quedó con el apartado de su momento.
    guardado = { ...guardado, depositoMonto: 590 };

    const ficha = await guardarFicha('525512345678', datosDeLuz, 'luz');

    expect(ficha.depositoMonto).toBe(590);
    expect(APARTADO).not.toBe(590);
  });
});

describe('actualizarFicha — fichas viejas, de antes de que existiera un campo', () => {
  it('confirmar el apartado de una ficha sin dirección no truena', async () => {
    // Hay fichas de antes de que existiera `zona` (como las 7 de 17 que no
    // tenían token). Con `zona: undefined` en el set, el botón de
    // /admin/reservas fallaba sobre ellas y el apartado no se confirmaba.
    guardado = {
      studentName: 'Ana Ruiz',
      curso: 'Estándar',
      precio: 3900,
      opcionesFechaHora: ['2026-10-05 10:00'],
      telefono: '5598765432',
      depositoMonto: APARTADO,
      depositoPagado: false,
      comprobanteURL: '/api/admin/comprobante?path=x',
      estado: 'pendiente',
      creada: Date.now(),
    };

    const ficha = await actualizarFicha('525598765432', { depositoPagado: true });

    expect(ficha.estado).toBe('reservada');
    expect(ficha.zona).toBeUndefined();
  });
});
