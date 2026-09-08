'use client';

import { useState } from 'react';
import { Check, ClipboardCopy } from 'lucide-react';
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
  const [copied, setCopied] = useState(false);

  const waUrl = `https://wa.me/${phone}${message ? `?text=${encodeURIComponent(message)}` : ''}`;

  return (
    <div className="flex items-center gap-1.5">
      <span className="font-mono text-base font-semibold tracking-wider text-slate-800">
        {display}
      </span>

      <button
        type="button"
        onClick={() => {
          navigator.clipboard.writeText(display);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
        aria-label="Copiar número"
        title="Copiar número"
        className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border transition-colors"
        style={copied
          ? { background: 'rgba(16,185,129,0.12)', borderColor: 'rgba(16,185,129,0.35)', color: '#059669' }
          : { background: 'white', borderColor: 'rgba(148,163,184,0.3)', color: '#64748b' }}>
        {copied ? <Check className="w-4 h-4" /> : <ClipboardCopy className="w-4 h-4" />}
      </button>

      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Abrir chat directo en WhatsApp"
        title="Abrir chat directo en WhatsApp"
        className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-white transition-colors"
        style={{ background: '#25D366' }}>
        <WhatsAppIcon className="w-4 h-4" />
      </a>
    </div>
  );
}
