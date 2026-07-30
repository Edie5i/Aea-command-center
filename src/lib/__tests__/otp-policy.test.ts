import { describe, it, expect } from 'vitest';
import { decidirOtp, OTP_MAX_INTENTOS } from '../otp-policy';

const AHORA = 1_800_000_000_000;
const VIGENTE = { portalOtp: '123456', portalOtpExpires: AHORA + 60_000 };

describe('decidirOtp — acceso al portal', () => {
  it('código correcto y vigente → acepta', () => {
    expect(decidirOtp(VIGENTE, '123456', AHORA)).toEqual({ accion: 'aceptar' });
  });

  it('código incorrecto → rechaza y cuenta el intento', () => {
    expect(decidirOtp(VIGENTE, '000000', AHORA)).toEqual({ accion: 'rechazar', intentos: 1 });
  });

  it('los intentos se acumulan', () => {
    const conFallos = { ...VIGENTE, portalOtpIntentos: 2 };
    expect(decidirOtp(conFallos, '000000', AHORA)).toEqual({ accion: 'rechazar', intentos: 3 });
  });
});

describe('decidirOtp — el código se quema', () => {
  it(`al intento ${OTP_MAX_INTENTOS} se invalida`, () => {
    const alBorde = { ...VIGENTE, portalOtpIntentos: OTP_MAX_INTENTOS - 1 };
    expect(decidirOtp(alBorde, '000000', AHORA)).toEqual({ accion: 'invalidar', motivo: 'agotado' });
  });

  it('un intento antes todavía sólo rechaza', () => {
    const antes = { ...VIGENTE, portalOtpIntentos: OTP_MAX_INTENTOS - 2 };
    expect(decidirOtp(antes, '000000', AHORA).accion).toBe('rechazar');
  });
});

describe('decidirOtp — expiración', () => {
  it('código vencido → invalida aunque sea el correcto', () => {
    const vencido = { portalOtp: '123456', portalOtpExpires: AHORA - 1 };
    expect(decidirOtp(vencido, '123456', AHORA)).toEqual({ accion: 'invalidar', motivo: 'expirado' });
  });

  it('justo en el límite todavía es válido', () => {
    const alLimite = { portalOtp: '123456', portalOtpExpires: AHORA };
    expect(decidirOtp(alLimite, '123456', AHORA)).toEqual({ accion: 'aceptar' });
  });

  it('un código vencido NO consume intentos: nadie puede quemarle el código a un instructor', () => {
    const vencido = { portalOtp: '123456', portalOtpExpires: AHORA - 1, portalOtpIntentos: 0 };
    expect(decidirOtp(vencido, '000000', AHORA).accion).toBe('invalidar');
  });
});

describe('decidirOtp — sin código vigente', () => {
  it('documento sin OTP → ignora', () => {
    expect(decidirOtp({}, '123456', AHORA)).toEqual({ accion: 'ignorar' });
  });

  it('OTP ya consumido (null) → ignora', () => {
    expect(decidirOtp({ portalOtp: null, portalOtpExpires: null }, '123456', AHORA))
      .toEqual({ accion: 'ignorar' });
  });

  it('nunca acepta con código vacío', () => {
    expect(decidirOtp({ portalOtp: '', portalOtpExpires: AHORA + 60_000 }, '', AHORA).accion)
      .toBe('ignorar');
  });
});
