import { describe, it, expect } from 'vitest';
import { CUENTA, tarjetaConEspacios, TIENDAS } from '../cuenta';

/** El dígito de control de una tarjeta. Un dígito mal casi siempre lo revienta. */
function luhn(n: string): boolean {
  return (
    [...n].reverse().reduce((s, c, i) => {
      let x = Number(c);
      if (i % 2) { x *= 2; if (x > 9) x -= 9; }
      return s + x;
    }, 0) % 10 === 0
  );
}

describe('cuenta a la que deposita el alumno', () => {
  it('la tarjeta es válida', () => {
    expect(CUENTA.tarjeta).toHaveLength(16);
    expect(CUENTA.tarjeta).toMatch(/^\d{16}$/);
    expect(luhn(CUENTA.tarjeta), 'dígito Luhn').toBe(true);
  });

  it('la CLABE es válida', () => {
    expect(CUENTA.clabe).toHaveLength(18);
    expect(CUENTA.clabe).toMatch(/^\d{18}$/);
  });

  it('la cuenta son 10 dígitos', () => {
    expect(CUENTA.numero).toMatch(/^\d{10}$/);
  });

  it('se muestra en grupos de cuatro, como viene impresa', () => {
    expect(tarjetaConEspacios()).toBe('4152 3146 8351 1045');
    // Sin espacio al final: pegado en un campo tiene que quedar válido.
    expect(tarjetaConEspacios().replace(/ /g, '')).toBe(CUENTA.tarjeta);
  });

  it('la CLABE y la cuenta concuerdan entre sí', () => {
    // La CLABE lleva la cuenta dentro: 012(banco) 180(plaza) + cuenta + control.
    expect(CUENTA.clabe).toContain(CUENTA.numero.replace(/^0/, ''));
  });

  it('dice dónde se puede depositar', () => {
    expect(TIENDAS).toMatch(/Oxxo/i);
    expect(TIENDAS).toMatch(/Walmart/i);
  });
});

/**
 * La razón de existir de cuenta.ts: que nadie vuelva a escribir estos números
 * en otro archivo. Al 2026-09-28 seguían copiados a mano en la ficha del alumno
 * y en el prompt de Luz, los dos con espacios y por lo tanto invisibles a un
 * grep del número pegado.
 */
describe('los números no están copiados en ningún otro lado', () => {
  const EXENTOS = [
    'src/lib/cuenta.ts',
    'src/lib/__tests__/cuenta.test.ts',
    // Salida generada por `npm run cc`, no se escribe a mano.
    'scripts/command-center-artifact/command-center.html',
  ];

  function fuentes(dir: string): string[] {
    const { readdirSync, statSync, existsSync } = require('node:fs') as typeof import('node:fs');
    const { join } = require('node:path') as typeof import('node:path');
    if (!existsSync(dir)) return [];
    return readdirSync(dir).flatMap((nombre) => {
      const ruta = join(dir, nombre);
      if (statSync(ruta).isDirectory()) return fuentes(ruta);
      return /\.(ts|tsx|js|mjs|html)$/.test(nombre) ? [ruta] : [];
    });
  }

  it('sólo cuenta.ts los escribe', () => {
    const { readFileSync } = require('node:fs') as typeof import('node:fs');
    const culpables = [...fuentes('src'), ...fuentes('public'), ...fuentes('scripts')]
      .filter((f) => !EXENTOS.some((e) => f.endsWith(e)))
      .filter((f) => {
        // Sin espacios: así se detecta también "048 469 5739".
        const pegado = readFileSync(f, 'utf8').replace(/[  ]/g, '');
        return [CUENTA.numero, CUENTA.clabe, CUENTA.tarjeta].some((n) => pegado.includes(n));
      });
    expect(culpables, 'importa CUENTA en vez de escribir el número').toEqual([]);
  });
});
