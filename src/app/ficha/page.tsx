/**
 * Captura de ficha en la sede. Vive en /ficha: una liga simple, la de siempre.
 *
 * Es el reemplazo del "Generador de Fichas" (`public/ficha.html`): mismos
 * campos, pero en vez de bajar un PDF crea la ficha real y devuelve su enlace
 * —el mismo que reciben los alumnos de Luz y los de /agenda—. Una sola versión
 * de la ficha, la que se actualiza sola.
 *
 * La dirección es /ficha porque es la que se teclea y la que está en los
 * bookmarks. Estuvo un rato en /admin/ficha-nueva —esa ruta sigue viva, redirige
 * acá— y en medio /ficha fue un 404 y luego un rebote al login, que es lo mismo
 * que no servir: el PIN sigue, pero ahora se pide en el camino y te deja en el
 * formulario, no en el panel.
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { CURSOS } from '@/lib/pagos';
import { APARTADO } from '@/lib/fichaLuz';
import FormMostrador from './FormMostrador';
import './aea.css';

const ADMIN_PIN = (process.env.ADMIN_PIN ?? '1234').trim();

export default async function FichaPage() {
  const cookieStore = await cookies();
  if (cookieStore.get('admin_pin')?.value !== ADMIN_PIN) {
    // Con ?next: después del PIN se regresa aquí, no al panel. Un solo link que
    // acaba donde decía que iba.
    redirect('/admin/conversaciones/login?next=/ficha');
  }

  // El catálogo sale de pagos.ts, no de una lista escrita a mano en el
  // formulario: es la misma tabla que Luz dicta por WhatsApp y la que usa el
  // botón de cobro del panel.
  //
  // Pero en el mostrador no se elige de una lista de nueve: se elige la
  // transmisión, que es la única decisión real del alumno —o maneja estándar o
  // maneja automático—. Los cursos de reforzamiento (Intermedio, Avanzado) no
  // dicen en qué va a manejar, así que puestos junto a los otros confunden en vez
  // de ayudar; no entran aquí. Luz los sigue vendiendo, y el catálogo no cambia.
  const REFORZAMIENTO = ['Intermedio', 'Avanzado'];
  const ficha = (c: (typeof CURSOS)[number]) => ({
    nombre: c.nombre,
    total: c.total,
    deposito: APARTADO,
  });
  const transmisiones = CURSOS.filter((c) => c.nombre === 'Estándar' || c.nombre === 'Automático').map(ficha);
  const otros = CURSOS
    .filter((c) => !REFORZAMIENTO.includes(c.nombre) && c.nombre !== 'Estándar' && c.nombre !== 'Automático')
    .map(ficha);

  return (
    <main className="ficha" style={{ padding: 0 }}>
      <header className="barra">
        <Link href="/admin">← Admin</Link>
        <h1>Ficha nueva</h1>
        <span className="aparte">Captura en sede</span>
      </header>

      <div className="hoja" style={{ padding: '1rem', maxWidth: '36rem' }}>
        <FormMostrador transmisiones={transmisiones} otros={otros} />
      </div>
    </main>
  );
}
