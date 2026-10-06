/**
 * Lo que ocupa un horario además de Calendar.
 *
 * El 6 de octubre de 2026 cuatro fichas distintas tenían el sábado 10 a las
 * 10:00 —y dos alumnos pagados el mismo bloque de lunes a jueves— porque la
 * disponibilidad se medía sólo con los eventos de Calendar, donde una ficha
 * apartada no aparece. Estas son las reglas de quién se queda el lugar.
 */

import { describe, it, expect } from 'vitest';
import { slotsApartados, HORAS_APARTADO_SIN_PAGAR, type FichaApartada } from '../apartados';

// Un jueves cualquiera a mediodía en CDMX.
const AHORA = new Date('2026-10-08T18:00:00Z').getTime();
const HORAS = (h: number) => h * 3_600_000;

const ficha = (f: Partial<FichaApartada>): FichaApartada => ({
  estado: 'pendiente',
  studentName: 'Alguien',
  opcionesFechaHora: [],
  creada: AHORA,
  ...f,
});

describe('slotsApartados', () => {
  it('una ficha pagada ocupa su horario para siempre', () => {
    const vieja = AHORA - HORAS(24 * 30);
    const tomados = slotsApartados(
      [ficha({ estado: 'reservada', studentName: 'Lucia', creada: vieja, opcionesFechaHora: ['2026-10-10 07:00'] })],
      { ahora: AHORA }
    );
    expect(tomados.get('2026-10-10 07:00')).toBe('Lucia');
  });

  it('un apartado sin pagar aguanta 48h y después suelta el lugar', () => {
    const fresca = ficha({ studentName: 'Leonardo', creada: AHORA - HORAS(HORAS_APARTADO_SIN_PAGAR - 1), opcionesFechaHora: ['2026-10-10 07:00'] });
    const rancia = ficha({ studentName: 'Hilario', creada: AHORA - HORAS(HORAS_APARTADO_SIN_PAGAR + 1), opcionesFechaHora: ['2026-10-11 10:00'] });
    const tomados = slotsApartados([fresca, rancia], { ahora: AHORA });
    expect(tomados.get('2026-10-10 07:00')).toBe('Leonardo');
    expect(tomados.has('2026-10-11 10:00')).toBe(false);
  });

  it('una ficha marcada perdida no guarda nada', () => {
    const tomados = slotsApartados(
      [ficha({ estado: 'perdida', opcionesFechaHora: ['2026-10-10 13:00'] })],
      { ahora: AHORA }
    );
    expect(tomados.size).toBe(0);
  });

  it('las fechas que ya pasaron no ocupan', () => {
    const tomados = slotsApartados(
      [ficha({ estado: 'reservada', opcionesFechaHora: ['2026-10-05 10:00', '2026-10-10 10:00'] })],
      { ahora: AHORA }
    );
    expect([...tomados.keys()]).toEqual(['2026-10-10 10:00']);
  });

  it('el horario del día de hoy sigue contando', () => {
    const tomados = slotsApartados(
      [ficha({ estado: 'reservada', opcionesFechaHora: ['2026-10-08 19:00'] })],
      { ahora: AHORA }
    );
    expect(tomados.has('2026-10-08 19:00')).toBe(true);
  });

  it('el apartado del propio alumno no es un conflicto, con lada o sin ella', () => {
    const suya = ficha({ estado: 'reservada', studentName: 'Ali', telefono: '5619855208', opcionesFechaHora: ['2026-10-09 16:00'] });
    const ajena = ficha({ estado: 'reservada', studentName: 'Valeria', telefono: '5582124998', opcionesFechaHora: ['2026-10-10 16:00'] });
    const tomados = slotsApartados([suya, ajena], { ahora: AHORA, excluirTelefono: '525619855208' });
    expect(tomados.has('2026-10-09 16:00')).toBe(false);
    expect(tomados.get('2026-10-10 16:00')).toBe('Valeria');
  });

  it('excluye también cuando el teléfono sólo está en el id del documento', () => {
    const suya = ficha({ estado: 'reservada', id: '525619855208', telefono: '', opcionesFechaHora: ['2026-10-09 16:00'] });
    const tomados = slotsApartados([suya], { ahora: AHORA, excluirTelefono: '5619855208' });
    expect(tomados.size).toBe(0);
  });

  it('dos fichas sobre el mismo horario: sigue ocupado', () => {
    const tomados = slotsApartados(
      [
        ficha({ estado: 'reservada', studentName: 'Tomas', opcionesFechaHora: ['2026-10-09 10:00'] }),
        ficha({ estado: 'reservada', studentName: 'Daina', opcionesFechaHora: ['2026-10-09 10:00'] }),
      ],
      { ahora: AHORA }
    );
    expect(tomados.get('2026-10-09 10:00')).toBe('Tomas');
  });
});
