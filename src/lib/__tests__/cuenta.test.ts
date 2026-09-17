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
