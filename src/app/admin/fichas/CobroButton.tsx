'use client';

/**
 * Copia el mensaje de cobro de un alumno, listo para pegar en WhatsApp.
 *
 * Antes se escribía a mano cada vez: nombre, curso, monto, CLABE y tarjeta.
 * Ahí es donde se cuela un dígito mal en una cuenta bancaria.
 *
 * El texto se arma en `lib/pagos.ts`, que tiene pruebas. Aquí solo se copia.
 */

import { useState } from 'react';
import { Check, ClipboardCopy } from 'lucide-react';
import { mensajeCobro } from '@/lib/pagos';

export function CobroButton({ nombre, curso }: { nombre: string; curso?: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(mensajeCobro(nombre, curso));
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sin portapapeles (http, permiso denegado) no se finge que sí copió.
      alert('No se pudo copiar. Revisa los permisos del navegador.');
    }
  }

  return (
    <button
      type="button"
      onClick={copiar}
      className="w-full flex items-center justify-center gap-2 text-xs font-medium rounded-lg py-2 transition-colors"
      style={{
        background: copiado ? 'rgba(5,150,105,0.12)' : 'rgba(148,163,184,0.10)',
        border: `1px solid ${copiado ? 'rgba(5,150,105,0.4)' : 'rgba(148,163,184,0.3)'}`,
        color: copiado ? '#059669' : '#475569',
      }}
    >
      {copiado ? (
        <>
          <Check className="w-3.5 h-3.5" aria-hidden />
          Copiado
        </>
      ) : (
        <>
          <ClipboardCopy className="w-3.5 h-3.5" aria-hidden />
          Copiar datos de pago
        </>
      )}
    </button>
  );
}
