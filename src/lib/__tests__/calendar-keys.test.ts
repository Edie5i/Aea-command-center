import { describe, it, expect } from 'vitest';
import { claveDesdeEntrada, claveDesdeEvento } from '../calendar-keys';

describe('claves de clase — el candado anti-duplicados', () => {
  // La invariante que sostiene todo: la clave construida desde la fecha pedida
  // y la leída del evento ya creado deben ser IDÉNTICAS. Si divergen, el candado
  // deja de detectar y vuelven los duplicados en silencio.
  it('la clave de entrada coincide con la del evento que Google devuelve', () => {
    const entrada = claveDesdeEntrada('2026-08-01T12:00:00.000Z', '07:00');
    const evento = claveDesdeEvento('2026-08-01T07:00:00-06:00');
    expect(entrada).toBe(evento);
  });

  it('mismo día y hora → misma clave, aunque el ISO venga distinto', () => {
    const a = claveDesdeEntrada('2026-08-01T12:00:00.000Z', '11:00');
    const b = claveDesdeEntrada('2026-08-01T18:30:00.000Z', '11:00');
    expect(a).toBe(b);
  });

  it('distinta hora → distinta clave', () => {
    expect(claveDesdeEntrada('2026-08-01T12:00:00.000Z', '07:00'))
      .not.toBe(claveDesdeEntrada('2026-08-01T12:00:00.000Z', '10:00'));
  });

  it('distinto día → distinta clave', () => {
    expect(claveDesdeEntrada('2026-08-01T12:00:00.000Z', '07:00'))
      .not.toBe(claveDesdeEntrada('2026-08-02T12:00:00.000Z', '07:00'));
  });

  it('formato estable YYYY-MM-DDTHH:mm', () => {
    expect(claveDesdeEntrada('2026-08-01T12:00:00.000Z', '07:00')).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });

  it('usa el día de CDMX, no el UTC: 19:00 no se corre al día siguiente', () => {
    // 2026-08-02T01:00Z es todavía el 1 de agosto a las 19:00 en CDMX
    expect(claveDesdeEntrada('2026-08-02T01:00:00.000Z', '19:00')).toBe('2026-08-01T19:00');
  });

  it('recorta el offset del evento de Google', () => {
    expect(claveDesdeEvento('2026-12-25T16:00:00-06:00')).toBe('2026-12-25T16:00');
  });
});
