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
    collection: () => ({
      doc: () => ({
        get: async () => ({ exists: guardado !== null, data: () => guardado }),
        set: async (datos: Partial<Ficha>) => {
          guardado = { ...(guardado ?? {}), ...datos };
        },
      }),
    }),
  },
}));

vi.mock('../adminNotify', () => ({ notificarAdmin: async () => {} }));
vi.mock('../ficha-enlace', () => ({ enviarFicha: async () => {} }));

const { guardarFicha, APARTADO } = await import('../fichaLuz');

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

  it('el apartado prometido no se recalcula si cambia el de hoy', async () => {
    await guardarFicha('525512345678', datosDeLuz, 'luz');
    // La ficha vieja quedó con el apartado de su momento.
    guardado = { ...guardado, depositoMonto: 590 };

    const ficha = await guardarFicha('525512345678', datosDeLuz, 'luz');

    expect(ficha.depositoMonto).toBe(590);
    expect(APARTADO).not.toBe(590);
  });
});
