import { describe, it, expect } from 'vitest';
import { createHmac } from 'crypto';
import { revisarFirma } from '../meta-firma';

const SECRETO = 'secreto-de-prueba';
const cuerpo = '{"entry":[{"changes":[{"value":{"messages":[{"from":"5215512345678","text":{"body":"¡Hola! 🚗"}}]}}]}]}';
const firmar = (texto: string, secreto = SECRETO) =>
  'sha256=' + createHmac('sha256', secreto).update(texto, 'utf8').digest('hex');

describe('revisarFirma', () => {
  it('acepta lo que firmó Meta', () => {
    expect(revisarFirma(cuerpo, firmar(cuerpo), SECRETO)).toBe('valida');
  });

  it('rechaza un cuerpo que no es el que se firmó', () => {
    const falso = cuerpo.replace('5215512345678', '525634433212');
    expect(revisarFirma(falso, firmar(cuerpo), SECRETO)).toBe('invalida');
  });

  it('rechaza una firma hecha con otro secreto', () => {
    expect(revisarFirma(cuerpo, firmar(cuerpo, 'otro'), SECRETO)).toBe('invalida');
  });

  it('rechaza cuando falta el encabezado o viene con otra forma', () => {
    expect(revisarFirma(cuerpo, null, SECRETO)).toBe('invalida');
    expect(revisarFirma(cuerpo, 'sha1=abc', SECRETO)).toBe('invalida');
    expect(revisarFirma(cuerpo, 'sha256=no-es-hex', SECRETO)).toBe('invalida');
  });

  it('sin secreto configurado lo dice, no lo da por bueno ni por malo', () => {
    expect(revisarFirma(cuerpo, firmar(cuerpo), '')).toBe('sin_secreto');
    expect(revisarFirma(cuerpo, null, undefined)).toBe('sin_secreto');
  });
});
