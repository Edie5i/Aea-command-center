import { describe, it, expect } from 'vitest';
import { CURSOS, RESERVA, RECARGO_MSI, buscarCurso, pesos, mensajeCobro } from '../pagos';
import { CUENTA } from '../cuenta';

describe('tabla de precios', () => {
  it('ningún curso cuesta menos que la reserva', () => {
    for (const c of CURSOS) {
      expect(c.total, c.nombre).toBeGreaterThan(RESERVA);
    }
  });

  it('cada curso cobra su recargo de 3 MSI, salvo los de promoción', () => {
    // Un monto de Openpay mal escrito se paga en comisión de cada venta. Esto
    // lo caza antes de que llegue a un mensaje.
    const mal: string[] = [];

    for (const c of CURSOS) {
      if (c.sinRecargo) continue;
      const esperado = (c.total - RESERVA) * (1 + RECARGO_MSI);
      // ±1.5% para absorber redondeos a peso cerrado.
      if (Math.abs(c.openpay - esperado) / esperado > 0.015) {
        mal.push(`${c.nombre}: openpay ${c.openpay}, se esperaba ~${Math.round(esperado)}`);
      }
    }

    expect(mal).toEqual([]);
  });

  it('un curso en promoción cobra el saldo limpio', () => {
    // Si alguien le quita la promoción a Intermedio, que sea a propósito: esta
    // prueba falla y lo obliga a mirar el precio.
    const promos = CURSOS.filter(c => c.sinRecargo);
    expect(promos.map(c => c.nombre)).toEqual(['Intermedio']);

    for (const c of promos) {
      expect(c.openpay, c.nombre).toBe(c.total - RESERVA);
    }
  });

  it('los tres cursos de $5,600 cotizan igual', () => {
    const caros = CURSOS.filter(c => c.total === 5600);
    expect(caros).toHaveLength(3);
    expect(new Set(caros.map(c => c.openpay)).size).toBe(1);
  });
});

describe('buscarCurso', () => {
  it('encuentra el curso como lo escribe la ficha', () => {
    expect(buscarCurso('Curso Principiante (Automático)')?.nombre).toBe('Automático');
    expect(buscarCurso('automatico')?.nombre).toBe('Automático');
    expect(buscarCurso('ESTÁNDAR')?.nombre).toBe('Estándar');
    expect(buscarCurso('Curso Intermedio')?.nombre).toBe('Intermedio');
  });

  it('sin curso, o uno que no existe, devuelve null', () => {
    expect(buscarCurso(undefined)).toBeNull();
    expect(buscarCurso('')).toBeNull();
    expect(buscarCurso('Curso de Submarinismo')).toBeNull();
  });
});

describe('pesos', () => {
  it('lleva separador de miles', () => {
    expect(pesos(3900)).toBe('$3,900');
    expect(pesos(690)).toBe('$690');
  });
});

describe('mensajeCobro', () => {
  const m = mensajeCobro('María Fernanda López', 'Curso Principiante (Automático)');

  it('saluda por el nombre de pila', () => {
    expect(m).toMatch(/^Hola María,/);
  });

  it('trae las tres cifras del curso', () => {
    expect(m).toContain('Curso Automático — $3,900');
    expect(m).toContain('Para apartar tu lugar: $690');
    expect(m).toContain('Saldo restante: $3,210');
  });

  it('trae los datos de depósito, de una sola fuente', () => {
    expect(m).toContain(CUENTA.clabe);
    expect(m).toContain('4152 3146 8351 1045');
    expect(m).toContain(CUENTA.titular);
  });

  it('ofrece los meses sin intereses con su monto', () => {
    expect(m).toContain('$3,500');
    expect(m).toMatch(/3 meses sin intereses/);
  });

  it('sin curso reconocido NO inventa cifras', () => {
    // Es un mensaje con el que alguien va a depositar: mejor sin monto que
    // con uno adivinado.
    const sinCurso = mensajeCobro('Pedro', 'Curso de Submarinismo');
    expect(sinCurso).toContain(CUENTA.clabe);
    expect(sinCurso).not.toMatch(/\$\d/);
    expect(sinCurso).not.toMatch(/sin intereses/);
  });

  it('aguanta un nombre vacío', () => {
    expect(() => mensajeCobro('', undefined)).not.toThrow();
  });
});

describe('promoción en el mensaje', () => {
  it('a Intermedio se le dice que no lleva recargo', () => {
    const m = mensajeCobro('Ana', 'Curso Intermedio');
    expect(m).toContain('sin recargo');
    expect(m).toContain('$2,210');
  });

  it('a los demás no se les promete eso', () => {
    const m = mensajeCobro('Ana', 'Curso Principiante (Automático)');
    expect(m).not.toContain('sin recargo');
  });
});
