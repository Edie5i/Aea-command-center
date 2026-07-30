/**
 * Formateo de avisos al admin. Vive aparte de adminNotify.ts —que es
 * server-only— para poder probarse: es la pieza donde un error rompe el único
 * canal garantizado de notificación.
 */

/** Meta rechaza el parámetro si trae saltos de línea, tabuladores o 4+ espacios seguidos. */
export const LIMITE_PARAM_PLANTILLA = 700;

export interface ResumenPlantilla {
  /** Parámetro {{1}}: el aviso completo aplanado a una línea. */
  tipo: string;
  /** Parámetro {{2}}: el teléfono del lead, o 'N/D' si el texto no trae ninguno. */
  contacto: string;
}

/**
 * Convierte un aviso multilínea en los 2 parámetros de la plantilla `alerta_aea`.
 *
 * La plantilla es la vía que SIEMPRE llega (no depende de la ventana de 24h), así
 * que carga todo el detalle: nombre, curso, dirección y link de cierre. Antes iba
 * sólo la primera línea cortada a 80 caracteres y había que entrar al panel.
 */
export function resumenParaPlantilla(texto: string): ResumenPlantilla {
  const aplanado = texto
    .replace(/[*_~`>#]/g, '')   // markdown de WhatsApp
    .replace(/\n+/g, ' · ')     // Meta rechaza saltos de línea
    .replace(/\s+/g, ' ')       // …y 4+ espacios consecutivos
    .replace(/ · ·/g, ' ·')     // separadores dobles por líneas vacías
    .trim();

  // Un texto de puros espacios dejaba sólo separadores ("·"): no está vacío, así
  // que no caía al respaldo, y el admin recibía un aviso sin información.
  const tipo = /[\p{L}\p{N}]/u.test(aplanado)
    ? aplanado.slice(0, LIMITE_PARAM_PLANTILLA)
    : 'Alerta AEA';

  const phoneMatch = texto.match(/\+?\d[\d\s]{8,}\d/);
  const contacto = phoneMatch ? phoneMatch[0].replace(/\s+/g, '') : 'N/D';

  return { tipo, contacto };
}
