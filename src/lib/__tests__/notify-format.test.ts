import { describe, it, expect } from 'vitest';
import { resumenParaPlantilla, LIMITE_PARAM_PLANTILLA } from '../notify-format';

// Aviso real de ficha de Luz, tal como lo arma fichaLuz.notificarCambios
const AVISO_FICHA =
  '🟡 *Ficha PENDIENTE* — Angel García\n' +
  '🚗 Estándar · Falta: depósito\n' +
  '📍 Calle Torreón 49, Col. Roma Sur\n' +
  '💬 Luz · 📱 5537964559\n' +
  '👉 Cerrar: wa.me/525537964559';

describe('resumenParaPlantilla — restricciones de Meta', () => {
  // Si alguna de estas se rompe, Meta rechaza la plantilla y se pierde el ÚNICO
  // canal que atraviesa la ventana de 24h.
  it('no deja saltos de línea', () => {
    expect(resumenParaPlantilla(AVISO_FICHA).tipo).not.toMatch(/\n/);
  });

  it('no deja tabuladores', () => {
    expect(resumenParaPlantilla('uno\tdos').tipo).not.toMatch(/\t/);
  });

  it('no deja 4 o más espacios seguidos', () => {
    expect(resumenParaPlantilla('uno     dos').tipo).not.toMatch(/ {4,}/);
  });

  it('respeta el límite de longitud', () => {
    const largo = 'x'.repeat(5000);
    expect(resumenParaPlantilla(largo).tipo.length).toBeLessThanOrEqual(LIMITE_PARAM_PLANTILLA);
  });

  it('nunca devuelve un parámetro vacío (Meta lo rechaza)', () => {
    expect(resumenParaPlantilla('').tipo).toBe('Alerta AEA');
    expect(resumenParaPlantilla('   \n\n  ').tipo).toBe('Alerta AEA');
  });
});

describe('resumenParaPlantilla — el detalle que evita entrar al panel', () => {
  it('conserva la dirección del lead', () => {
    expect(resumenParaPlantilla(AVISO_FICHA).tipo).toContain('Calle Torreón 49, Col. Roma Sur');
  });

  it('conserva nombre y curso', () => {
    const { tipo } = resumenParaPlantilla(AVISO_FICHA);
    expect(tipo).toContain('Angel García');
    expect(tipo).toContain('Estándar');
  });

  it('conserva qué falta para cerrar', () => {
    expect(resumenParaPlantilla(AVISO_FICHA).tipo).toContain('Falta: depósito');
  });

  it('quita el markdown de WhatsApp', () => {
    expect(resumenParaPlantilla(AVISO_FICHA).tipo).not.toMatch(/[*_~`]/);
  });

  it('une las líneas con separador legible', () => {
    expect(resumenParaPlantilla('uno\ndos').tipo).toBe('uno · dos');
  });
});

describe('resumenParaPlantilla — extracción del teléfono', () => {
  it('saca el teléfono del cuerpo del aviso', () => {
    expect(resumenParaPlantilla(AVISO_FICHA).contacto).toBe('5537964559');
  });

  it('quita espacios de un teléfono formateado', () => {
    expect(resumenParaPlantilla('Lead nuevo\n📱 55 3796 4559').contacto).toBe('5537964559');
  });

  it('devuelve N/D cuando no hay teléfono', () => {
    expect(resumenParaPlantilla('Aviso sin número').contacto).toBe('N/D');
  });
});
