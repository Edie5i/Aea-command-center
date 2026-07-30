import { describe, it, expect } from 'vitest';
import { nombreLead, telefonoVisible } from '../nombre-lead';

describe('nombreLead', () => {
  it('prefiere contactName', () => {
    const r = nombreLead({ contactName: 'Ana López', inscripcion: { nombre: 'Ana L.' } }, '525512345678');
    expect(r).toEqual({ nombre: 'Ana López', tieneNombre: true });
  });

  it('cae al nombre de la inscripción cuando falta contactName', () => {
    // El caso de Miguel Ángel Viedma Barocio: inscrito por una vía antigua, el
    // panel lo mostraba como un número teniendo el nombre guardado.
    const r = nombreLead({ inscripcion: { nombre: 'Miguel Ángel Viedma Barocio' } }, '525569018253');
    expect(r).toEqual({ nombre: 'Miguel Ángel Viedma Barocio', tieneNombre: true });
  });

  it('usa el teléfono cuando no hay ningún nombre', () => {
    expect(nombreLead({}, '525569018253')).toEqual({ nombre: '5569018253', tieneNombre: false });
  });

  it('trata como vacíos los nombres de puros espacios', () => {
    const r = nombreLead({ contactName: '   ', inscripcion: { nombre: '' } }, '525569018253');
    expect(r.tieneNombre).toBe(false);
  });

  it('tolera null en ambas fuentes', () => {
    expect(nombreLead({ contactName: null, inscripcion: null }, '525512345678').tieneNombre).toBe(false);
  });
});

describe('telefonoVisible', () => {
  it('quita el 52 de país', () => {
    expect(telefonoVisible('525512345678')).toBe('5512345678');
  });
  it('quita el 521 de país', () => {
    expect(telefonoVisible('5215512345678')).toBe('5512345678');
  });
  it('deja intacto un número que no reconoce', () => {
    expect(telefonoVisible('19012400340')).toBe('19012400340');
  });
});
