'use client';

import { useState, useTransition } from 'react';
import { marcarRequiereConstancia } from '../actions';

/**
 * Marca desde el panel que el alumno necesita la constancia de SEMOVI.
 *
 * Luz la detecta sola cuando la edad sale en la conversación, pero los menores
 * que ya estaban inscritos antes no tienen edad guardada y no aparecen solos en
 * los pendientes del tablero. Esto los da de alta a mano.
 */
export function ConstanciaToggle({ phone, requiere }: { phone: string; requiere: boolean }) {
  const [activa, setActiva] = useState(requiere);
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(async () => {
        await marcarRequiereConstancia(phone, !activa);
        setActiva(!activa);
      })}
      className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-40"
      style={activa
        ? { background: '#fffbeb', borderColor: '#fcd34d', color: '#b45309' }
        : { background: 'white', borderColor: 'rgba(148,163,184,0.3)', color: '#64748b' }}>
      📜 {pending ? '…' : activa ? 'Constancia pendiente' : 'Necesita constancia'}
    </button>
  );
}
