/**
 * «Importar ficha» ya no es una pantalla: es un botón de la ficha.
 *
 * Tenía su propio formulario y su propio camino —agendaba directo en Calendar
 * y dejaba una ficha distinta a la del resto del sistema—. La ficha es una
 * sola; subir una foto sólo la llena. Esta ruta se queda para no romper ligas
 * guardadas.
 */

import { redirect } from 'next/navigation';

export default function ImportarFichaPage() {
  redirect('/ficha');
}
