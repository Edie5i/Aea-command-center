import { describe, it, expect } from 'vitest';
import { checkCoverage } from '../coverage';

describe('checkCoverage — zonas a domicilio', () => {
  it('colonia Roma → domicilio', () => {
    expect(checkCoverage('Av. Sonora 45, Roma Norte', 'Roma Norte').tipo).toBe('domicilio');
  });
  it('colonia Narvarte → domicilio', () => {
    expect(checkCoverage('Calle Torreón 49, Narvarte', 'Narvarte').tipo).toBe('domicilio');
  });
  it('Del Valle → domicilio', () => {
    expect(checkCoverage('Del Valle', 'Del Valle').tipo).toBe('domicilio');
  });
  it('Polanco → domicilio', () => {
    expect(checkCoverage('Polanco').tipo).toBe('domicilio');
  });
  it('Coyoacán → domicilio', () => {
    expect(checkCoverage('Copilco 22, Coyoacán', 'Coyoacán').tipo).toBe('domicilio');
  });
});

describe('checkCoverage — puntos de encuentro fijo', () => {
  it('Cuajimalpa → La Mexicana', () => {
    const r = checkCoverage('Cuajimalpa', 'Cuajimalpa');
    expect(r.tipo).toBe('punto_fijo');
    if (r.tipo === 'punto_fijo') expect(r.punto).toContain('La Mexicana');
  });
  it('Santa Fe → La Mexicana', () => {
    const r = checkCoverage('Santa Fe');
    expect(r.tipo).toBe('punto_fijo');
    if (r.tipo === 'punto_fijo') expect(r.punto).toContain('La Mexicana');
  });
  it('Azcapotzalco → Irrigación o Polanco', () => {
    const r = checkCoverage('Azcapotzalco', 'Azcapotzalco');
    expect(r.tipo).toBe('punto_fijo');
    if (r.tipo === 'punto_fijo') expect(r.punto).toContain('Irrigación');
  });
  it('Iztapalapa → Metro Viveros', () => {
    const r = checkCoverage('Iztapalapa', 'Iztapalapa');
    expect(r.tipo).toBe('punto_fijo');
    if (r.tipo === 'punto_fijo') expect(r.punto).toContain('Viveros');
  });
  it('Tláhuac → Metro Viveros', () => {
    const r = checkCoverage('Tláhuac', 'Tláhuac');
    expect(r.tipo).toBe('punto_fijo');
    if (r.tipo === 'punto_fijo') expect(r.punto).toContain('Viveros');
  });
});

describe('checkCoverage — zona dudosa', () => {
  it('Ecatepec → dudosa', () => {
    expect(checkCoverage('Ecatepec', 'Ecatepec').tipo).toBe('dudosa');
  });
  it('Naucalpan → dudosa', () => {
    expect(checkCoverage('Naucalpan').tipo).toBe('dudosa');
  });
  it('zona vacía → dudosa', () => {
    expect(checkCoverage('', '').tipo).toBe('dudosa');
  });
});

describe('checkCoverage — colonia tiene prioridad sobre zona', () => {
  it('zona dice Narvarte pero colonia dice Azcapotzalco → punto_fijo', () => {
    // colonia estructurada siempre gana
    const r = checkCoverage('Narvarte 123', 'Azcapotzalco');
    expect(r.tipo).toBe('punto_fijo');
  });
});
