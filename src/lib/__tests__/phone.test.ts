import { describe, it, expect } from 'vitest';
import { normalizePhone } from '../phone';

describe('normalizePhone', () => {
  it('10 dígitos → agrega 52', () => {
    expect(normalizePhone('5512345678')).toBe('525512345678');
  });
  it('521XXXXXXXXXX (13 dígitos) → quita el 1', () => {
    expect(normalizePhone('5215512345678')).toBe('525512345678');
  });
  it('52XXXXXXXXXX ya correcto → sin cambios', () => {
    expect(normalizePhone('525512345678')).toBe('525512345678');
  });
  it('+52 con símbolo → normaliza', () => {
    expect(normalizePhone('+525512345678')).toBe('525512345678');
  });
  it('+521 con símbolo → normaliza', () => {
    expect(normalizePhone('+5215512345678')).toBe('525512345678');
  });
  it('número con espacios → normaliza', () => {
    expect(normalizePhone('55 1234 5678')).toBe('525512345678');
  });
  it('número con guiones → normaliza', () => {
    expect(normalizePhone('55-1234-5678')).toBe('525512345678');
  });
});
