/**
 * Captura de ficha en la sede.
 *
 * Es el reemplazo del "Generador de Fichas" (`public/ficha.html`): mismos
 * campos, pero en vez de bajar un PDF crea la ficha real y devuelve su enlace
 * —el mismo que reciben los alumnos de Luz y los de /agenda—. Una sola versión
 * de la ficha, la que se actualiza sola.
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { CURSOS } from '@/lib/pagos';
import { APARTADO } from '@/lib/fichaLuz';
import FormMostrador from './FormMostrador';

const ADMIN_PIN = (process.env.ADMIN_PIN ?? '1234').trim();

export default async function FichaNuevaPage() {
  const cookieStore = await cookies();
  if (cookieStore.get('admin_pin')?.value !== ADMIN_PIN) {
    redirect('/admin/conversaciones/login');
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
    <main className="min-h-screen" style={{ background: 'linear-gradient(160deg, #f8fafc 0%, #f1f5f9 60%, #e2e8f0 100%)' }}>
      <header className="sticky top-0 z-10 px-4 py-3 flex items-center gap-3"
        style={{ background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)', borderBottom: '1px solid rgba(148,163,184,0.25)' }}>
        <Link href="/admin" className="text-sm" style={{ color: '#475569' }}>← Admin</Link>
        <h1 className="text-base font-bold" style={{ color: '#1e293b' }}>Ficha nueva</h1>
        <span className="ml-auto text-xs" style={{ color: '#475569' }}>Captura en sede</span>
      </header>

      <div className="max-w-xl mx-auto p-4">
        <FormMostrador transmisiones={transmisiones} otros={otros} />
      </div>
    </main>
  );
}
