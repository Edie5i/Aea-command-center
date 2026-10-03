'use client';

/**
 * El celular y la dirección de la ficha, listos para pegar.
 *
 * Son los datos que más se mueven de la pantalla hacia afuera —Calendar, Maps,
 * el WhatsApp del instructor— y había que sacarlos a mano. Los usa la tarjeta
 * de /admin/reservas con los dos, y la conversación sólo con la dirección: ahí
 * el celular ya tiene su propio renglón en `PhoneActions`.
 *
 * El agrupado y los diez dígitos que se copian salen de `lib/phone`, el mismo
 * módulo que usa la ficha del alumno: si algún día las fichas guardan la lada,
 * las dos pantallas cambian juntas.
 */

import { useEffect, useState } from 'react';
import { Check, ClipboardCopy, TriangleAlert } from 'lucide-react';
import { agruparCelular, celularLocal } from '@/lib/phone';

type Estado = 'idle' | 'ok' | 'error';

function Fila({
  icono,
  texto,
  valor,
  que,
}: {
  icono: string;
  texto: string;
  valor: string;
  que: string;
}) {
  const [estado, setEstado] = useState<Estado>('idle');

  // El acuse se borra solo, y el temporizador vive atado al componente: la
  // lista se revalida al confirmar un apartado y la fila se desmonta.
  useEffect(() => {
    if (estado === 'idle') return;
    const t = setTimeout(() => setEstado('idle'), 2000);
    return () => clearTimeout(t);
  }, [estado]);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(valor);
      setEstado('ok');
    } catch {
      // Sin portapapeles —el panel abierto por http en la red local, o permiso
      // denegado— el aviso va en el botón. Un `alert` por toque, en una lista
      // de decenas de fichas, es peor que el problema: el valor sigue a la
      // vista y es `select-all`, que es la salida.
      setEstado('error');
    }
  }

  const estilo =
    estado === 'ok'
      ? { background: 'rgba(5,150,105,0.12)', border: '1px solid rgba(5,150,105,0.4)', color: '#059669' }
      : estado === 'error'
      ? { background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.4)', color: '#b45309' }
      : { background: 'rgba(148,163,184,0.10)', border: '1px solid rgba(148,163,184,0.3)', color: '#64748b' };

  const titulo =
    estado === 'error' ? `No se pudo copiar ${que} — selecciónalo` : `Copiar ${que}`;

  return (
    <div className="flex items-start gap-2 text-xs">
      <span aria-hidden>{icono}</span>
      {/* `select-all` para quien prefiera copiar a mano: un toque agarra el
          valor completo, sin arrastrar las manijas de selección. Y es el plan B
          cuando el portapapeles no está disponible. */}
      <span className="select-all break-words min-w-0 flex-1" style={{ color: '#475569' }}>
        {texto}
      </span>
      <button
        type="button"
        onClick={copiar}
        aria-label={titulo}
        title={titulo}
        className="shrink-0 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 transition-colors"
        style={estilo}
      >
        {estado === 'ok' ? (
          <Check className="w-3 h-3" aria-hidden />
        ) : estado === 'error' ? (
          <TriangleAlert className="w-3 h-3" aria-hidden />
        ) : (
          <ClipboardCopy className="w-3 h-3" aria-hidden />
        )}
      </button>
    </div>
  );
}

export function DatosCopiables({ telefono, zona }: { telefono?: string; zona?: string }) {
  if (!telefono && !zona) return null;

  return (
    <div className="mt-2 space-y-1.5">
      {telefono && (
        <Fila
          icono="📱"
          texto={agruparCelular(telefono)}
          valor={celularLocal(telefono)}
          que="el celular"
        />
      )}
      {zona && <Fila icono="📍" texto={zona} valor={zona} que="la dirección" />}
    </div>
  );
}
