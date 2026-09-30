/**
 * Alias de /ficha.
 *
 * La captura vive en /ficha, que es la liga que se teclea y la que está en los
 * bookmarks. Esta ruta existió primero, así que se queda apuntando allá: los
 * links viejos y el botón del panel siguen funcionando.
 */

import { redirect } from 'next/navigation';

export default function FichaNuevaPage() {
  redirect('/ficha');
}
