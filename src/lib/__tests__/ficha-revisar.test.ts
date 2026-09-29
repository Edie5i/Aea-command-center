import { describe, it, expect } from 'vitest';
import { revisarFicha, calcularDeposito, type Ficha } from '../ficha-reglas';

const completa: Partial<Ficha> = {
  studentName: 'María Fernanda López',
  curso: 'Automático',
  opcionesFechaHora: ['2026-09-22 10:00'],
  telefono: '5512345678',
  depositoPagado: true,
  comprobanteURL: '/api/admin/comprobante?path=x',
};

describe('revisarFicha', () => {
  it('no le falta nada a una ficha con comprobante', () => {
    expect(revisarFicha(completa)).toEqual([]);
  });

  it('un apartado registrado a mano cuenta, aunque la imagen no esté', () => {
    // En el mostrador se captura un depósito que ya entró —transferencia o
    // Oxxo— y que no siempre trae imagen. Antes la ficha se quedaba pendiente
    // para siempre y el alumno veía que le pedían pagar de nuevo.
    const mostrador = { ...completa, comprobanteURL: null, depositoRegistrado: 780 };
    expect(revisarFicha(mostrador)).toEqual([]);
  });

  it('sin comprobante ni apartado registrado, el depósito sigue faltando', () => {
    const { comprobanteURL, ...sinPago } = completa;
    expect(revisarFicha(sinPago)).toContain('depósito');
  });
});

describe('calcularDeposito', () => {
  it('es el 20% del curso', () => {
    expect(calcularDeposito(3900)).toBe(780);
  });

  it('nunca baja de los $690 del apartado', () => {
    expect(calcularDeposito(3400)).toBe(690);
  });
});
