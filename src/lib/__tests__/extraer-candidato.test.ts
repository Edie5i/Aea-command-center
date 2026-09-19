import { describe, it, expect } from 'vitest';
import { fusionar, faltan, motivoDescarte, CAMPOS } from '../extraer-candidato';

const vacio = {};
const completo = {
  nombre: 'Juan',
  aniosManejando: 6,
  rating: 4.8,
  transmisiones: 'ambas' as const,
  licenciaB: true,
  coche: true,
  zonas: 'Coyoacán',
  disponibilidad: 'mañanas entre semana',
};

describe('faltan', () => {
  it('sin nada, faltan todos', () => {
    expect(faltan(vacio)).toHaveLength(CAMPOS.length);
  });

  it('con todo, no falta ninguno — y ahí se deja de llamar al modelo', () => {
    expect(faltan(completo)).toEqual([]);
  });

  it('un false o un cero SÍ son dato', () => {
    expect(faltan({ licenciaB: false, aniosManejando: 0 })).not.toContain('licenciaB');
    expect(faltan({ licenciaB: false, aniosManejando: 0 })).not.toContain('aniosManejando');
    // "no tengo coche" es una respuesta, y de las que descartan: si contara
    // como faltante, Marco se la volvería a preguntar.
    expect(faltan({ coche: false })).not.toContain('coche');
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

describe('el coche', () => {
  it('se guarda dicho o negado', () => {
    expect(fusionar(vacio, { coche: true })).toEqual({ coche: true });
    expect(fusionar(vacio, { coche: false })).toEqual({ coche: false });
  });

  it('si no se habló del tema, no se escribe', () => {
    expect(fusionar(vacio, { coche: null })).toEqual({});
  });

  it('lo que no sea un sí o un no se descarta', () => {
    expect(fusionar(vacio, { coche: 'tal vez' } as never)).toEqual({});
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

/**
 * El estado se decidía leyendo frases fijas en lo que Marco escribió, y el
 * modelo no repite frases: al candidato sin coche le dijo "por ahora no
 * podrías aplicar" y se quedó en `calificando`, atrapado con Marco.
 */
describe('motivoDescarte — lo que se lee del dato, no del texto', () => {
  it('sin licencia B descarta', () => {
    expect(motivoDescarte({ licenciaB: false })).toMatch(/licencia/i);
  });

  it('sin coche descarta', () => {
    expect(motivoDescarte({ coche: false })).toMatch(/coche/i);
  });

  it('quien cumple los dos no se descarta aquí', () => {
    expect(motivoDescarte(completo)).toBeNull();
  });

  it('lo que todavía no contesta no descarta a nadie', () => {
    expect(motivoDescarte({})).toBeNull();
    expect(motivoDescarte({ nombre: 'Ana' })).toBeNull();
    expect(motivoDescarte(null)).toBeNull();
  });

  /**
   * Los años y el rating tienen margen —"no lo descartes si solo falta un
   * punto menor"— y esa decisión vive en Vía Urb, con sus umbrales. Aquí
   * solo lo que no admite criterio.
   */
  it('un rating bajo no se decide aquí', () => {
    expect(motivoDescarte({ ...completo, rating: 3.1, aniosManejando: 1 })).toBeNull();
  });
});
