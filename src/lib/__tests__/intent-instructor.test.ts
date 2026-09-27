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

/**
 * Lo que de verdad llegó por WhatsApp y se fue con Luz. Van con la errata
 * original: así escribe la gente, y el detector tiene que aguantarlo.
 */
describe('los dos que se perdieron en producción', () => {
  it('«Oh yo aplique para instructor» (26 sep 2026, 525532676217)', () => {
    // Luz: «Esa parte no la manejo yo. Te conecto con un asesor…»
    expect(esIntentInstructor('Oh yo aplique para instructor')).toBe(true);
  });

  it('«Pero yo m estoy registrando como instructor» (27 sep 2026, 525559913940)', () => {
    // Luz le vendió el curso Avanzado media conversación antes de decirle
    // «nosotros solo vendemos cursos para alumnos».
    expect(esIntentInstructor('Pero yo m estoy registrando como instructor')).toBe(true);
  });

  const mismasGanas = [
    'aplique para la vacante',
    'apliqué como instructor',
    'me quiero registrar como instructor',
    'quiero inscribirme como instructor',
    'me postulé de instructor',
    'dónde me anoto como chofer',
    'quiero darme de alta como maestro de manejo',
    'ya solicité el puesto',
  ];
  for (const frase of mismasGanas) {
    it(`y también: "${frase}"`, () => {
      expect(esIntentInstructor(frase)).toBe(true);
    });
  }
});

/**
 * El precio de haber ampliado: `registrar`, `inscribir` y `aplicar` son
 * vocabulario diario de un alumno. Solo despiertan a Marco cuando van pegadas
 * a «como/de/para instructor» — estas lo comprueban.
 */
describe('ampliar no puede secuestrar al alumno que se inscribe', () => {
  const siguenSiendoClientes = [
    'quiero inscribirme al curso',
    'cómo me registro para las clases',
    'ya me inscribí y quiero agendar',
    'me registré en su página',
    'dónde me anoto para el sábado',
    'quiero inscribir a mi hija',
    'solicito información del curso',
    'me inscribo con el instructor de automático',
    'ya apliqué mi descuento',
  ];
  for (const frase of siguenSiendoClientes) {
    it(`NO despierta con: "${frase}"`, () => {
      expect(esIntentInstructor(frase)).toBe(false);
    });
  }
});
