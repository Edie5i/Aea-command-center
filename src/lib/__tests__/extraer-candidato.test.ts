import { describe, it, expect } from 'vitest';
import { fusionar, faltan, CAMPOS } from '../extraer-candidato';

const vacio = {};
const completo = {
  nombre: 'Juan',
  aniosManejando: 6,
  rating: 4.8,
  transmisiones: 'ambas' as const,
  licenciaB: true,
  zonas: 'Coyoacán',
  disponibilidad: 'mañanas entre semana',
};

describe('faltan', () => {
  it('sin nada, faltan los siete', () => {
    expect(faltan(vacio)).toHaveLength(CAMPOS.length);
  });

  it('con todo, no falta ninguno — y ahí se deja de llamar al modelo', () => {
    expect(faltan(completo)).toEqual([]);
  });

  it('un false o un cero SÍ son dato', () => {
    expect(faltan({ licenciaB: false, aniosManejando: 0 })).not.toContain('licenciaB');
    expect(faltan({ licenciaB: false, aniosManejando: 0 })).not.toContain('aniosManejando');
  });
});

describe('fusionar — qué se escribe', () => {
  it('guarda lo que el candidato dijo', () => {
    expect(fusionar(vacio, { nombre: 'Juan', rating: 4.8, aniosManejando: 6 })).toEqual({
      nombre: 'Juan',
      rating: 4.8,
      aniosManejando: 6,
    });
  });

  it('lo que no se dijo (null) no se escribe', () => {
    expect(fusionar(vacio, { nombre: 'Juan', rating: null, licenciaB: null })).toEqual({
      nombre: 'Juan',
    });
  });

  it('nunca pisa un dato que ya estaba', () => {
    // Dijo 6 al preguntarle; una relectura del historial no lo cambia.
    expect(fusionar({ aniosManejando: 6 }, { aniosManejando: 5 })).toEqual({});
  });

  it('con todo lleno no escribe nada', () => {
    expect(fusionar(completo, { nombre: 'Otro', rating: 3 })).toEqual({});
  });

  it('sin extracción, nada', () => {
    expect(fusionar(vacio, null)).toEqual({});
    expect(fusionar(vacio, undefined)).toEqual({});
  });
});

describe('fusionar — descarta lo que el modelo aluciné', () => {
  it('un rating fuera de 0–5', () => {
    expect(fusionar(vacio, { rating: 9 })).toEqual({});
    expect(fusionar(vacio, { rating: -1 })).toEqual({});
  });

  it('años imposibles', () => {
    expect(fusionar(vacio, { aniosManejando: 200 })).toEqual({});
  });

  it('una transmisión que no existe', () => {
    // @ts-expect-error a propósito: el modelo puede devolver cualquier cosa
    expect(fusionar(vacio, { transmisiones: 'cvt' })).toEqual({});
  });

  it('una licencia que no es sí o no', () => {
    // @ts-expect-error a propósito
    expect(fusionar(vacio, { licenciaB: 'tal vez' })).toEqual({});
  });

  it('texto vacío o de puros espacios', () => {
    expect(fusionar(vacio, { nombre: '   ', zonas: '' })).toEqual({});
  });

  it('pero cero años y sin licencia SÍ se guardan: son respuestas', () => {
    expect(fusionar(vacio, { aniosManejando: 0, licenciaB: false })).toEqual({
      aniosManejando: 0,
      licenciaB: false,
    });
  });

  it('recorta los espacios del texto', () => {
    expect(fusionar(vacio, { zonas: '  Coyoacán, Tlalpan  ' })).toEqual({
      zonas: 'Coyoacán, Tlalpan',
    });
  });
});
