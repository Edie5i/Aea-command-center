import { describe, it, expect } from 'vitest';
import { quienEscribioAlFinal } from '../chat-state';

describe('quienEscribioAlFinal', () => {
  it('deriva del mensaje real cuando no hay valor guardado', () => {
    expect(quienEscribioAlFinal(undefined, 'user')).toBe('cliente');
    expect(quienEscribioAlFinal(undefined, 'bot')).toBe('luz');
  });

  it('el valor guardado NO gana sobre el mensaje real', () => {
    // El caso de Mario (525560666078): chatLastBy se quedó en 'cliente' aunque
    // el último mensaje era de Luz. Con el valor pegajoso, la Regla 6 nunca
    // podía pasarlo a 'esperando_cliente' y quedó 10 días sin un follow-up.
    expect(quienEscribioAlFinal('cliente', 'bot')).toBe('luz');
  });

  it('corrige también el desfase inverso', () => {
    // 25 conversaciones decían 'luz' habiendo escrito el cliente: seguían en
    // 'esperando_cliente' recibiendo follow-ups de venta ya habiendo contestado.
    expect(quienEscribioAlFinal('luz', 'user')).toBe('cliente');
  });

  it('conserva humano mientras el cliente no vuelva a escribir', () => {
    // El cron salta los 'humano' para no encimar follow-ups automáticos sobre
    // una atención manual del equipo (advance-chat-states/route.ts:118).
    expect(quienEscribioAlFinal('humano', 'bot')).toBe('humano');
    expect(quienEscribioAlFinal('humano', undefined)).toBe('humano');
  });

  it('suelta humano en cuanto el cliente responde', () => {
    expect(quienEscribioAlFinal('humano', 'user')).toBe('cliente');
  });

  it('sin mensajes asume que habló Luz', () => {
    expect(quienEscribioAlFinal(undefined, undefined)).toBe('luz');
    expect(quienEscribioAlFinal(null, undefined)).toBe('luz');
  });

  it('es idempotente: aplicarlo dos veces da lo mismo', () => {
    const casos: Array<['user' | 'bot' | undefined, ReturnType<typeof quienEscribioAlFinal>]> = [
      ['user', 'cliente'], ['bot', 'luz'], [undefined, 'luz'],
    ];
    for (const [rol, esperado] of casos) {
      const una = quienEscribioAlFinal('cliente', rol);
      expect(una).toBe(esperado);
      expect(quienEscribioAlFinal(una, rol)).toBe(esperado);
    }
  });
});
