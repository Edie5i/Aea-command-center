'use client';

import { useState, useTransition } from 'react';
import { marcarConstanciaEntregada, deshacerConstanciaEntregada } from './actions';

/**
 * Botón de "Entregada" con deshacer.
 *
 * Esta lista es el único registro de las constancias que se deben, así que un
 * clic por error borraría el pendiente sin dejar rastro. En vez de un diálogo de
 * confirmación —que estorba en el caso normal, que es entregarla— la fila se
 * queda unos segundos ofreciendo deshacer.
 */
export function ConstanciaButton({ phone, nombre }: { phone: string; nombre: string }) {
  const [entregada, setEntregada] = useState(false);
  const [pending, startTransition] = useTransition();

  if (entregada) {
    return (
      <span className="shrink-0 flex items-center gap-2 text-xs">
        <span className="font-semibold text-emerald-700">Entregada ✓</span>
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(async () => {
            await deshacerConstanciaEntregada(phone);
            setEntregada(false);
          })}
          className="font-semibold text-slate-500 underline hover:text-slate-700 disabled:opacity-40">
          Deshacer
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      disabled={pending}
      aria-label={`Marcar la constancia de ${nombre} como entregada`}
      onClick={() => startTransition(async () => {
        await marcarConstanciaEntregada(phone);
        setEntregada(true);
      })}
      className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-40">
      {pending ? '…' : 'Entregada'}
    </button>
  );
}
