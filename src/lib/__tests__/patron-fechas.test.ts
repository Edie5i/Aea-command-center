import { describe, it, expect } from 'vitest';
import { calcularFechas, HORARIOS_INICIO, horaCorta, PATRONES } from '../patron-fechas';

describe('las cuatro clases de un patrón', () => {
  it('lunes a jueves son cuatro días seguidos', () => {
    const f = calcularFechas('lunes-jueves', '2026-10-05', '10:00');
    expect(f.map((x) => x.date.split('T')[0])).toEqual([
      '2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08',
    ]);
    expect(f[0].label).toBe('lunes 5 de octubre');
  });

  it('fin de semana son dos sábados y dos domingos, no cuatro días seguidos', () => {
    // +0, +1, +7, +8: si esto se rompe, se agendan clases entre semana a alguien
    // que sólo puede venir en sábado.
    const f = calcularFechas('fin-de-semana', '2026-10-03', '10:00');
    expect(f.map((x) => x.date.split('T')[0])).toEqual([
      '2026-10-03', '2026-10-04', '2026-10-10', '2026-10-11',
    ]);
  });

  it('todas llevan la hora acordada', () => {
    const f = calcularFechas('martes-viernes', '2026-10-06', '16:00');
    expect(f.every((x) => x.time === '16:00')).toBe(true);
    expect(f).toHaveLength(4);
  });
});

describe('las horas de inicio', () => {
  it('son las cinco reales, cada 3 horas desde las 7', () => {
    expect(HORARIOS_INICIO).toEqual(['07:00', '10:00', '13:00', '16:00', '19:00']);
  });

  it('se escriben como se dicen', () => {
    expect(horaCorta('07:00')).toBe('7am');
    expect(horaCorta('13:00')).toBe('1pm');
    expect(horaCorta('19:00')).toBe('7pm');
  });
});

describe('los patrones', () => {
  it('son los tres que se venden', () => {
    expect(PATRONES.map((p) => p.valor)).toEqual(['lunes-jueves', 'martes-viernes', 'fin-de-semana']);
  });
});
