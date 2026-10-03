'use client';

import { useEffect, useState } from 'react';
import { Check, ClipboardCopy, TriangleAlert } from 'lucide-react';
import { WhatsAppIcon } from '@/components/whatsapp-icon';

// El número se copiaba a mano para abrir un chat directo. Aquí va en mono y
// con contraste para que se lea de un vistazo, con las dos salidas al lado:
// copiar, o abrir WhatsApp sin pasar por el portapapeles.
export function PhoneActions({
  phone,
  display,
  message,
}: {
  /** Número completo con lada, para el enlace wa.me. */
  phone: string;
  /** Número como se le muestra al usuario, y lo que se copia. */
  display: string;
  message?: string;
}) {
  const [estado, setEstado] = useState<'idle' | 'ok' | 'error'>('idle');

  // El acuse se borra solo, con el temporizador atado al componente: si la
  // pantalla se revalida —un mensaje nuevo, un cambio de estado— la fila se
  // desmonta y el `clearTimeout` evita escribirle estado a algo que ya no está.
  useEffect(() => {
    if (estado === 'idle') return;
    const t = setTimeout(() => setEstado('idle'), 2000);
    return () => clearTimeout(t);
  }, [estado]);

  const waUrl = `https://wa.me/${phone}${message ? `?text=${encodeURIComponent(message)}` : ''}`;

  // Sin `await` ni `catch`, un portapapeles no disponible —el panel abierto por
  // http en la red local, o el permiso denegado— dejaba una promesa rechazada
  // sin manejar y el botón decía ✅ de todos modos. Ahora el botón dice la
  // verdad, y el número sigue a la vista para copiarlo a mano.
  async function copiar() {
    try {
      await navigator.clipboard.writeText(display);
      setEstado('ok');
    } catch {
      setEstado('error');
    }
  }

  const etiqueta =
    estado === 'error' ? 'No se pudo copiar — selecciónalo' : 'Copiar número';

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-xl font-bold tracking-wider text-slate-800">
        {display}
      </span>

      <button
        type="button"
        onClick={copiar}
        aria-label={etiqueta}
        title={etiqueta}
        className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center border transition-colors"
        style={
          estado === 'ok'
            ? { background: 'rgba(16,185,129,0.12)', borderColor: 'rgba(16,185,129,0.35)', color: '#059669' }
            : estado === 'error'
            ? { background: 'rgba(245,158,11,0.12)', borderColor: 'rgba(245,158,11,0.4)', color: '#b45309' }
            : { background: 'white', borderColor: 'rgba(148,163,184,0.3)', color: '#64748b' }
        }>
        {estado === 'ok' ? (
          <Check className="w-[18px] h-[18px]" />
        ) : estado === 'error' ? (
          <TriangleAlert className="w-[18px] h-[18px]" />
        ) : (
          <ClipboardCopy className="w-[18px] h-[18px]" />
        )}
      </button>

      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Abrir chat directo en WhatsApp"
        title="Abrir chat directo en WhatsApp"
        className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-white transition-colors"
        style={{ background: '#25D366' }}>
        <WhatsAppIcon className="w-[18px] h-[18px]" />
      </a>
    </div>
  );
}
