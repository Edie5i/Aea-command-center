/**
 * Nombre a mostrar de un lead.
 *
 * El sistema guarda el nombre en dos lugares: contactName (lo captura el
 * webhook) e inscripcion.nombre (lo captura Luz o el formulario). Un alumno
 * inscrito por una vía antigua puede tener el segundo y no el primero, y el
 * panel lo mostraba como un número anónimo teniendo el nombre a la mano.
 */

export interface FuentesNombre {
  contactName?: string | null;
  inscripcion?: { nombre?: string | null } | null;
}

/** Teléfono legible: quita el 52 o 521 de país. */
export function telefonoVisible(phone: string): string {
  if (phone.startsWith('521') && phone.length === 13) return phone.slice(3);
  if (phone.startsWith('52') && phone.length === 12) return phone.slice(2);
  return phone;
}

/**
 * Devuelve el mejor nombre disponible, o el teléfono si no hay ninguno.
 * `tieneNombre` distingue "se llama así" de "sólo tenemos su número", que es lo
 * que decide si vale la pena mostrar el teléfono como segunda línea.
 */
export function nombreLead(
  fuentes: FuentesNombre,
  phone: string,
): { nombre: string; tieneNombre: boolean } {
  const contacto = fuentes.contactName?.trim();
  if (contacto) return { nombre: contacto, tieneNombre: true };

  const inscrito = fuentes.inscripcion?.nombre?.trim();
  if (inscrito) return { nombre: inscrito, tieneNombre: true };

  return { nombre: telefonoVisible(phone), tieneNombre: false };
}
