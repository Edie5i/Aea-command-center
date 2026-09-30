import { describe, it, expect } from 'vitest';
import { diasDeAtraso, VENCIDO_MS } from '../chat-state';

const DIA = 86400000;
const AHORA = Date.parse('2026-09-30T12:00:00-06:00');

describe('diasDeAtraso', () => {
  it('un follow-up recién cumplido sí se manda', () => {
    // El caso normal: el cron corre cada hora y recoge lo que venció hace un
    // rato. Eso no es atraso, es el trabajo del job.
    expect(diasDeAtraso(AHORA - 60 * 60 * 1000, AHORA)).toBeNull();
  });

  it('el de 131 días de atraso ya no se manda', () => {
    // El 2026-09-29 había 16 conversaciones así. Un lead de hace cuatro meses
    // recibía "¿sigues pensando en tomar clases?" como si acabara de escribir.
    expect(diasDeAtraso(AHORA - 131 * DIA, AHORA)).toBe(131);
  });

  it('el umbral son dos días, y justo encima todavía se manda', () => {
    expect(diasDeAtraso(AHORA - VENCIDO_MS, AHORA)).toBeNull();
    expect(diasDeAtraso(AHORA - VENCIDO_MS - 1000, AHORA)).toBe(2);
  });

  it('sin fecha programada no está vencido: le falta el dato', () => {
    // Darlo por vencido marcaría la conversación fría por un hueco de la base,
    // no por algo que haya pasado con ese lead.
    expect(diasDeAtraso(undefined, AHORA)).toBeNull();
    expect(diasDeAtraso(null, AHORA)).toBeNull();
    expect(diasDeAtraso(Number.NaN, AHORA)).toBeNull();
  });

  it('una fecha en el futuro tampoco está vencida', () => {
    // No debería llegar aquí —la consulta filtra por `nextFollowupAt <= now`—,
    // pero un reloj desfasado no puede marcar a nadie frío.
    expect(diasDeAtraso(AHORA + 3 * DIA, AHORA)).toBeNull();
  });

  it('los días van redondeados hacia abajo: es lo que se le escribe al admin', () => {
    // El motivo que queda guardado dice "quedó N días atrasado"; 5.9 días es
    // "5 días", no "6". Se cuenta lo cumplido, no lo que va corriendo.
    expect(diasDeAtraso(AHORA - (5 * DIA + 23 * 60 * 60 * 1000), AHORA)).toBe(5);
  });

  it('lo menos que puede devolver son 2 días, nunca 1', () => {
    // Se sigue del umbral: para vencer hay que pasar de dos días, así que el
    // piso es 2. El `chatReason` del cron trae un singular —"1 día"— que por
    // esto no lo alcanza nadie. No es un error, pero tampoco se va a ver.
    const minimos = [60_000, 3 * 60 * 60 * 1000, DIA - 1].map(extra =>
      diasDeAtraso(AHORA - (VENCIDO_MS + extra), AHORA)
    );
    expect(minimos).toEqual([2, 2, 2]);
  });
});
