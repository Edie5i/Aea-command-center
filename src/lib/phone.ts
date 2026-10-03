/**
 * Normaliza cualquier variación de número mexicano a 52XXXXXXXXXX (12 dígitos).
 * Cubre: 521XXXXXXXXXX, +52XXXXXXXXXX, +521XXXXXXXXXX, 10 dígitos sin código.
 */
export function normalizePhone(raw: string): string {
  let p = raw.replace(/\D/g, '');
  if (p.startsWith('521') && p.length === 13) p = '52' + p.slice(3);
  if (p.startsWith('52') && p.length === 12) return p;
  if (p.length === 10) return '52' + p;
  return p;
}

/**
 * Los diez dígitos locales, sin lada. Es lo que se pega en Calendar, en Maps o
 * en la libreta del teléfono: `normalizePhone` hace el viaje de ida —a los doce
 * dígitos que quiere Meta—, y esto el de vuelta.
 *
 * Un número que no es mexicano sale como entró: la ficha guarda algunos
 * extranjeros y recortarles dos dígitos los rompería.
 */
export function celularLocal(raw: string): string {
  const p = normalizePhone(raw);
  return p.startsWith('52') && p.length === 12 ? p.slice(2) : p;
}

/**
 * 5634433212 → «56 3443 3212». Sólo para verlo de un vistazo: lo que se copia
 * es `celularLocal`, sin espacios, que es lo que aceptan las apps donde se pega.
 */
export function agruparCelular(raw: string): string {
  const d = celularLocal(raw);
  return d.length === 10 ? `${d.slice(0, 2)} ${d.slice(2, 6)} ${d.slice(6)}` : d;
}
