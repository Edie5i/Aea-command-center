/**
 * Los cursos como los enseña la captura de mostrador. Sale de aquí para que
 * /ficha y el dashboard, que traen el mismo formulario, no lleven dos listas.
 *
 * El catálogo sale de pagos.ts, no de una lista escrita a mano: es la misma
 * tabla que Luz dicta por WhatsApp y la que usa el botón de cobro del panel.
 *
 * Pero en el mostrador no se elige de una lista de nueve: se elige la
 * transmisión, que es la única decisión real del alumno —o maneja estándar o
 * maneja automático—. Los cursos de reforzamiento (Intermedio, Avanzado) no
 * dicen en qué va a manejar, así que puestos junto a los otros confunden en vez
 * de ayudar; no entran aquí. Luz los sigue vendiendo, y el catálogo no cambia.
 */

import { CURSOS } from '@/lib/pagos';
import { APARTADO } from '@/lib/ficha-reglas';

const REFORZAMIENTO = ['Intermedio', 'Avanzado'];
const TRANSMISIONES = ['Estándar', 'Automático'];

export function cursosDeMostrador() {
  const ficha = (c: (typeof CURSOS)[number]) => ({ nombre: c.nombre, total: c.total, deposito: APARTADO });
  return {
    transmisiones: CURSOS.filter((c) => TRANSMISIONES.includes(c.nombre)).map(ficha),
    otros: CURSOS
      .filter((c) => !REFORZAMIENTO.includes(c.nombre) && !TRANSMISIONES.includes(c.nombre))
      .map(ficha),
  };
}
