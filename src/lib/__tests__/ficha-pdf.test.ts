import { describe, it, expect } from 'vitest';
import { generarFichaPdfBuffer } from '../ficha-pdf-server';

describe('generarFichaPdfBuffer', () => {
  it('genera un buffer PDF válido (empieza con %PDF)', async () => {
    const buf = await generarFichaPdfBuffer({
      nombre: 'Ana García',
      telefono: '525512345678',
      zona: 'Calle Sonora 45, Roma Norte',
      transmision: 'Estándar',
      fechas: [
        { date: '2026-07-07', time: '10:00' },
        { date: '2026-07-08', time: '10:00' },
        { date: '2026-07-09', time: '10:00' },
        { date: '2026-07-10', time: '10:00' },
      ],
    });
    expect(buf.length).toBeGreaterThan(1000);
    expect(buf.slice(0, 4).toString()).toBe('%PDF');
  }, 10000);
});
