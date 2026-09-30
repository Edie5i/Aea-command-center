import { describe, it, expect } from 'vitest';
import { revisarFicha, apartadoRecibido, APARTADO, type Ficha } from '../ficha-reglas';
import { RESERVA } from '../pagos';

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

describe('el apartado', () => {
  it('es el mismo que cobra el mensaje de pago', () => {
    // Si estos dos se separan, Luz promete una cifra y la ficha cobra otra.
    expect(APARTADO).toBe(RESERVA);
  });

  it('no depende del curso', () => {
    expect(APARTADO).toBe(690);
  });
});

describe('apartadoRecibido', () => {
  const reservada = { estado: 'reservada' as const, depositoMonto: APARTADO };

  it('quien abonó una parte y mandó el resto ya cubrió el apartado completo', () => {
    // El caso que le inflaba el saldo: $400 registrados en el mostrador, el
    // resto por WhatsApp. Confirmar sólo pone depositoPagado —depositoRegistrado
    // se queda en 400— y su ficha le restaba nomás esos 400.
    expect(apartadoRecibido({ ...reservada, depositoRegistrado: 400 })).toBe(APARTADO);
  });

  it('el que transfirió más de lo pedido, cuenta por lo que transfirió', () => {
    expect(apartadoRecibido({ ...reservada, depositoRegistrado: 1500 })).toBe(1500);
  });

  it('sin registro a mano, el apartado prometido es lo que entró', () => {
    expect(apartadoRecibido(reservada)).toBe(APARTADO);
  });

  it('antes de reservar, sólo cuenta lo que de verdad se vio en la cuenta', () => {
    const pendiente = { estado: 'pendiente' as const, depositoMonto: APARTADO };
    expect(apartadoRecibido({ ...pendiente, depositoRegistrado: 400 })).toBe(400);
    expect(apartadoRecibido(pendiente)).toBe(0);
  });
});
