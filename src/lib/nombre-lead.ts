/**
 * Nombre a mostrar de un lead.
 *
 * El sistema guarda el nombre en dos lugares: contactName (el perfil de
 * WhatsApp, lo captura el webhook) e inscripcion.nombre (el alumno, lo pregunta
 * Luz o lo llena el formulario).
 *
 * Manda el de la inscripción. En una de cada cuatro inscripciones —menores, y
 * chavos de 18-20 cuyo papá hace el trámite— quien escribe no es quien toma la
 * clase: el perfil dice "Paulina" y la alumna es su hijo Rodrigo. Luz sí
 * pregunta por el alumno y lo guarda bien, pero el perfil le ganaba y el panel
 * mostraba a la mamá. El instructor llegaba preguntando por la persona
 * equivocada, y la ficha y la constancia de SEMOVI salían mal —esta última no
 * le sirve al alumno si no va a su nombre.
 *
 * Cuando los dos existen y difieren se devuelven ambos: el alumno para la clase
 * y la ficha, el contacto para saber quién contesta el WhatsApp.
 */

export interface FuentesNombre {
  contactName?: string | null;
  inscripcion?: { nombre?: string | null } | null;
}

/**
 * WhatsApp deja poner de nombre puros emojis, y varios contactos lo hacen. Como
 * nombre no sirve: no se puede leer en voz alta ni buscar, y la ficha queda con
 * una inicial vacía y un emoji suelto. Vale más el teléfono.
 */
function nombreUtil(raw: string | null | undefined): string | null {
  const n = raw?.trim();
  return n && /\p{L}|\p{N}/u.test(n) ? n : null;
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
): { nombre: string; tieneNombre: boolean; contacto: string | null } {
  const perfil = nombreUtil(fuentes.contactName);
  const inscrito = nombreUtil(fuentes.inscripcion?.nombre);

  if (inscrito) {
    // El perfil solo se reporta aparte si es otra persona; si es la misma,
    // repetirlo en pantalla es ruido.
    const otro = perfil && perfil.toLowerCase() !== inscrito.toLowerCase();
    return { nombre: inscrito, tieneNombre: true, contacto: otro ? perfil : null };
  }

  if (perfil) return { nombre: perfil, tieneNombre: true, contacto: null };

  return { nombre: telefonoVisible(phone), tieneNombre: false, contacto: null };
}
