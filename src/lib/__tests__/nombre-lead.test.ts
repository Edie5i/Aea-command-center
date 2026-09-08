import { describe, it, expect } from 'vitest';
import { nombreLead, telefonoVisible } from '../nombre-lead';

describe('nombreLead', () => {
  it('prefiere el nombre de la inscripción sobre el perfil de WhatsApp', () => {
    // El caso de los menores: contrata la mamá desde su WhatsApp, pero quien
    // toma la clase es el hijo. El perfil dice Paulina; la alumna es Rodrigo.
    const r = nombreLead({ contactName: 'Paulina', inscripcion: { nombre: 'Rodrigo' } }, '525512345678');
    expect(r).toEqual({ nombre: 'Rodrigo', tieneNombre: true, contacto: 'Paulina' });
  });

  it('no reporta contacto aparte cuando es la misma persona', () => {
    const r = nombreLead({ contactName: 'Ana López', inscripcion: { nombre: 'ana lópez' } }, '525512345678');
    expect(r.contacto).toBeNull();
  });

  it('cae al nombre de la inscripción cuando falta contactName', () => {
    // El caso de Miguel Ángel Viedma Barocio: inscrito por una vía antigua, el
    // panel lo mostraba como un número teniendo el nombre guardado.
    const r = nombreLead({ inscripcion: { nombre: 'Miguel Ángel Viedma Barocio' } }, '525569018253');
    expect(r).toEqual({ nombre: 'Miguel Ángel Viedma Barocio', tieneNombre: true, contacto: null });
  });

  it('usa el teléfono cuando no hay ningún nombre', () => {
    expect(nombreLead({}, '525569018253')).toEqual({ nombre: '5569018253', tieneNombre: false, contacto: null });
  });

  it('trata como vacíos los nombres de puros espacios', () => {
    const r = nombreLead({ contactName: '   ', inscripcion: { nombre: '' } }, '525569018253');
    expect(r.tieneNombre).toBe(false);
  });

  it('descarta un contactName de puros emojis y cae al teléfono', () => {
    // Casos reales del corte: "👋✨" y "🏋🏾‍♂️" como nombre de WhatsApp.
    const r = nombreLead({ contactName: '👋✨' }, '525586499324');
    expect(r).toEqual({ nombre: '5586499324', tieneNombre: false, contacto: null });
  });

  it('prefiere el nombre de la inscripción sobre un contactName de emojis', () => {
    const r = nombreLead({ contactName: '🏋🏾‍♂️', inscripcion: { nombre: 'Kevin' } }, '525575129633');
    expect(r).toEqual({ nombre: 'Kevin', tieneNombre: true, contacto: null });
  });

  it('conserva el emoji cuando acompaña a un nombre de verdad', () => {
    const r = nombreLead({ contactName: 'Mar🦇' }, '525570668464');
    expect(r).toEqual({ nombre: 'Mar🦇', tieneNombre: true, contacto: null });
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
