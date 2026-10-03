import { describe, it, expect } from 'vitest';
import { agruparCelular, celularLocal, normalizePhone } from '../phone';

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

describe('celularLocal', () => {
  it('ficha a 10 dígitos → igual', () => {
    expect(celularLocal('5512345678')).toBe('5512345678');
  });
  it('id de ficha a 12 dígitos → sin lada', () => {
    expect(celularLocal('525512345678')).toBe('5512345678');
  });
  it('521 a 13 dígitos → sin lada ni el 1', () => {
    expect(celularLocal('5215512345678')).toBe('5512345678');
  });
  it('local que empieza con 52 → viaje de ida y vuelta completo', () => {
    expect(celularLocal('5212345678')).toBe('5212345678');
  });
  it('con espacios y + → limpio', () => {
    expect(celularLocal('+52 55 1234 5678')).toBe('5512345678');
  });
  it('extranjero → sale como entró, sin recortarle dígitos', () => {
    expect(celularLocal('34689303362')).toBe('34689303362');
    expect(celularLocal('12155860897')).toBe('12155860897');
  });
});

describe('agruparCelular', () => {
  it('agrupa 2-4-4', () => {
    expect(agruparCelular('5634433212')).toBe('56 3443 3212');
  });
  it('el id de 12 dígitos también se agrupa', () => {
    expect(agruparCelular('525634433212')).toBe('56 3443 3212');
  });
  it('extranjero → sin agrupar, pero sin lada inventada', () => {
    expect(agruparCelular('34689303362')).toBe('34689303362');
  });
  it('incompleto → se muestra tal cual, no se finge formato', () => {
    expect(agruparCelular('55123')).toBe('55123');
  });
});
