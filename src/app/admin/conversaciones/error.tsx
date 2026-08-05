'use client';

import { useEffect } from 'react';

// Un deploy mientras el cel tenía la página abierta deja los Server Actions
// (StateActions.tsx) apuntando a una versión que el servidor ya no reconoce.
// En vez de mostrar la pantalla de error genérica, recargamos para traer el
// bundle nuevo.
export default function ConversacionesError({ error }: { error: Error & { digest?: string } }) {
  const isStaleDeploy = /Failed to find Server Action/i.test(error.message);

  useEffect(() => {
    if (isStaleDeploy) window.location.reload();
  }, [isStaleDeploy]);

  if (isStaleDeploy) return null;

  return (
    <main className="min-h-screen flex items-center justify-center p-8" style={{ background: '#0f172a', color: '#94a3b8' }}>
      <div className="text-center">
        <p className="text-lg font-semibold mb-2" style={{ color: '#f87171' }}>Error al cargar conversaciones</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 text-sm px-4 py-2 rounded-lg font-semibold"
          style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}
        >
          Reintentar
        </button>
      </div>
    </main>
  );
}
