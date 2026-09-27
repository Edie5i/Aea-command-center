import { describe, it, expect } from 'vitest';
import {
  esNumeroDeLaEscuela,
  numerosDeLaEscuela,
  candidatoBloqueaVentas,
  yaPago,
  EXPLICACION,
} from '../ventas-excluidos';

/**
 * Los dos errores cuestan distinto. Dejar fuera a un prospecto real es perder
 * una venta; meter en el embudo a quien no lo es le manda mensajes de venta a
 * un instructor —o al propio teléfono de la escuela— y encima le avisa al
 * admin en cada paso.
 */

describe('números de la escuela', () => {
  const propios = ['525634433212', '525586163794'];

  it('reconoce el número del admin', () => {
    expect(esNumeroDeLaEscuela('525634433212', propios)).toBe(true);
  });

  it('lo reconoce con el 1 que mete WhatsApp', () => {
    // El webhook manda `from` sin el 1, pero `wa_id` lo trae: 5215634433212.
    expect(esNumeroDeLaEscuela('5215634433212', propios)).toBe(true);
  });

  it('lo reconoce escrito como lo teclea una persona', () => {
    expect(esNumeroDeLaEscuela('+52 56 3443 3212', propios)).toBe(true);
    expect(esNumeroDeLaEscuela('5634433212', propios)).toBe(true);
  });

  it('no confunde a un cliente cualquiera', () => {
    expect(esNumeroDeLaEscuela('525516998936', propios)).toBe(false);
  });

  it('sin lista configurada, al menos protege al admin', () => {
    const lista = numerosDeLaEscuela({});
    expect(esNumeroDeLaEscuela('525634433212', lista)).toBe(true);
  });

  it('la lista extra del entorno se suma, separada por comas', () => {
    const lista = numerosDeLaEscuela({
      ADMIN_NOTIFICATION_PHONE: '525634433212',
      NUMEROS_DE_LA_ESCUELA: '525586163794, 5215526836188',
    });
    expect(esNumeroDeLaEscuela('525586163794', lista)).toBe(true);
    expect(esNumeroDeLaEscuela('525526836188', lista)).toBe(true);
  });

  it('una lista con basura no rompe nada', () => {
    const lista = numerosDeLaEscuela({ NUMEROS_DE_LA_ESCUELA: ' , ,, ' });
    expect(esNumeroDeLaEscuela('525516998936', lista)).toBe(false);
  });
});

describe('candidatos a instructor', () => {
  it('un candidato en proceso sale del embudo de ventas', () => {
    expect(candidatoBloqueaVentas('calificando')).toBe(true);
    expect(candidatoBloqueaVentas('agendado')).toBe(true);
    expect(candidatoBloqueaVentas('activo')).toBe(true);
  });

  it('un candidato RECHAZADO vuelve a ventas', () => {
    // Los cinco rechazos que hay dicen "falso positivo del detector — es
    // cliente de curso". Excluirlos sería castigar dos veces el mismo error.
    expect(candidatoBloqueaVentas('rechazado')).toBe(false);
  });

  it('quien no tiene registro no bloquea nada', () => {
    expect(candidatoBloqueaVentas(null)).toBe(false);
    expect(candidatoBloqueaVentas(undefined)).toBe(false);
    expect(candidatoBloqueaVentas('')).toBe(false);
  });
});

describe('explicaciones', () => {
  it('cada motivo se puede escribir en un registro sin quedar en blanco', () => {
    for (const texto of Object.values(EXPLICACION)) {
      expect(texto.length).toBeGreaterThan(0);
    }
  });
});

describe('quien ya pagó', () => {
  it('con inscripción confirmada', () => {
    expect(yaPago({ inscripcion: { status: 'confirmado' } })).toBe(true);
  });

  it('con solo el comprobante recibido, sin confirmar todavía', () => {
    // Entre depositar y confirmar puede pasar rato: dirección incompleta,
    // conflicto de horario. En esa ventana no se le persigue.
    expect(yaPago({ comprobanteRecibidoAt: { seconds: 1 } })).toBe(true);
  });

  it('una inscripción a medias no cuenta', () => {
    expect(yaPago({ inscripcion: { status: 'pendiente' } })).toBe(false);
  });

  it('un prospecto pelón no cuenta', () => {
    expect(yaPago({})).toBe(false);
    expect(yaPago(null)).toBe(false);
    expect(yaPago(undefined)).toBe(false);
  });

  it('un comprobante nulo no cuenta como pago', () => {
    expect(yaPago({ comprobanteRecibidoAt: null })).toBe(false);
  });
});
