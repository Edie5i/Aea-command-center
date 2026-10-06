/**
 * Reservar una ficha tiene que crear las clases.
 *
 * Confirmar el apartado sólo ponía `depositoPagado: true`: el alumno leía
 * "lugar confirmado" y en Calendar no existía ninguna clase. El 6 de octubre de
 * 2026 cuatro alumnos pagados estaban así, dos de ellos ya en curso. Lo que se
 * prueba aquí es que las clases se piden en la transición a 'reservada' —una
 * vez, no en cada re-guardado— y que si Calendar falla, el aviso lo dice.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Ficha } from '../ficha-reglas';

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

const avisos: string[] = [];
vi.mock('../adminNotify', () => ({
  notificarAdmin: async (texto: string) => { avisos.push(texto); },
}));
vi.mock('../ficha-enlace', () => ({ enviarFicha: async () => {} }));

const agendar = vi.fn(async (id: string, ficha: Ficha) => `\n🗓️ 4 clases en Calendar ✅ (${id}, ${ficha.estado})`);
vi.mock('../agendar-ficha', () => ({
  agendarClasesDeFicha: (id: string, ficha: Ficha) => agendar(id, ficha),
}));

const { guardarFicha, actualizarFicha } = await import('../fichaLuz');

const pendiente = {
  studentName: 'Lizbeth Viridiana Mejía Barrera',
  curso: 'Estándar',
  precio: 3400,
  opcionesFechaHora: ['2026-10-07 13:00', '2026-10-08 13:00', '2026-10-09 13:00', '2026-10-10 13:00'],
  telefono: '5586146401',
};

beforeEach(() => {
  guardado = null;
  avisos.length = 0;
  agendar.mockClear();
});

describe('la ficha que acaba de reservarse', () => {
  it('pide sus clases al confirmarse el apartado, y el aviso las menciona', async () => {
    await guardarFicha('525586146401', pendiente, 'mostrador');
    expect(agendar).not.toHaveBeenCalled();

    await actualizarFicha('525586146401', { depositoPagado: true, depositoRegistrado: 690 });
    expect(agendar).toHaveBeenCalledTimes(1);
    expect(agendar.mock.calls[0][0]).toBe('525586146401');
    const reservada = avisos.find(a => a.includes('FICHA RESERVADA'));
    expect(reservada).toContain('4 clases en Calendar');
  });

  it('las pide también cuando el alta de mostrador ya entra pagada', async () => {
    await guardarFicha(
      '525586146401',
      { ...pendiente, depositoPagado: true, depositoRegistrado: 690 },
      'mostrador'
    );
    expect(agendar).toHaveBeenCalledTimes(1);
  });

  it('no las vuelve a pedir en un re-guardado de una ficha ya reservada', async () => {
    await guardarFicha('525586146401', { ...pendiente, depositoPagado: true, depositoRegistrado: 690 }, 'mostrador');
    agendar.mockClear();
    await actualizarFicha('525586146401', { zona: 'Circle K, La Mexicana' });
    expect(agendar).not.toHaveBeenCalled();
  });

  it('si Calendar truena, el aviso de la reserva lo grita', async () => {
    agendar.mockRejectedValueOnce(new Error('invalid_grant'));
    await guardarFicha('525586146401', { ...pendiente, depositoPagado: true, depositoRegistrado: 690 }, 'mostrador');
    const reservada = avisos.find(a => a.includes('FICHA RESERVADA'));
    expect(reservada).toContain('NO se pudieron crear sus clases');
  });
});
