import { describe, it, expect } from 'vitest';
import { esIntentInstructor, normalizar } from '../intent-instructor';

/**
 * Los dos lados importan igual. Un candidato que cae con Luz se pierde; un
 * cliente que cae con Marco es una venta secuestrada — y eso ya pasó en
 * producción.
 */

describe('candidatos: tienen que llegar a Marco', () => {
  const buscanTrabajo = [
    'Quiero ser instructor de manejo',
    'quiero ser maestro de manejo',
    'Vi su anuncio, me interesa la vacante',
    'hola, busco trabajo',
    'busco empleo de chofer',
    'necesito chamba',
    'quiero trabajar con ustedes',
    '¿están contratando?',
    'vi que reclutan instructores',
    'soy chofer de uber y quiero aplicar',
    'manejo uber, cuánto pagan',
    'cuanto pagan a los instructores',
    'vengo por lo del trabajo',
    'información del puesto de instructor',
    'quiero dar clases de manejo',
    'me interesa el trabajo',
    'trabajar como instructor',
    'hay vacantes?',
    'QUIERO SER INSTRUCTOR',
    'quiero ser instrúctor',
  ];

  for (const frase of buscanTrabajo) {
    it(`despierta con: "${frase}"`, () => {
      expect(esIntentInstructor(frase)).toBe(true);
    });
  }
});

describe('clientes: NO deben caer con Marco', () => {
  // Esto es lo que le escribe alguien que quiere aprender a manejar. Si
  // alguna de estas despierta a Marco, se secuestra una venta.
  const quierenClases = [
    'Hola, quiero aprender a manejar',
    'cuánto cuesta el curso de manejo',
    'quiero tomar clases de manejo',
    'me interesa el curso para automático',
    'necesito clases, soy principiante',
    'tienen clases los sábados?',
    '¿el instructor va a mi casa?',
    'quiero que me enseñen a manejar',
    'cuánto dura el curso',
    'ya hice mi depósito',
    'quiero agendar mi clase',
    'mi instructor no llegó',
    'buenas tardes, información de precios',
    'tengo licencia y quiero practicar',
    'manejo poco y quiero mejorar',
  ];

  for (const frase of quierenClases) {
    it(`NO despierta con: "${frase}"`, () => {
      expect(esIntentInstructor(frase)).toBe(false);
    });
  }
});

describe('normalizar', () => {
  it('quita acentos y baja a minúsculas', () => {
    expect(normalizar('INSTRUCTÓR de Manejó')).toBe('instructor de manejo');
  });
});

describe('el caso que ya rompió una venta', () => {
  it('"el instructor va a mi casa" habla de un instructor y sigue siendo cliente', () => {
    expect(esIntentInstructor('¿el instructor va a mi casa?')).toBe(false);
  });

  it('pero "cuánto le pagan al instructor" ya es contexto de trabajo', () => {
    expect(esIntentInstructor('cuánto le pagan al instructor')).toBe(true);
  });
});
