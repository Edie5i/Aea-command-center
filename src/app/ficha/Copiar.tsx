'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

/**
 * Copiar la CLABE de un toque.
 *
 * Dieciocho dígitos tecleados a mano desde un teléfono, cambiando de app a la
 * del banco, es donde se cae una transferencia. Seleccionar texto en móvil
 * tampoco es fácil: o agarras de más o de menos.
 *
 * Si el navegador no deja copiar —contexto sin permiso, o un navegador viejo—
 * no pasa nada: el número sigue completo y a la vista, que es lo que importa.
 */
export function Copiar({ valor, que }: { valor: string; que: string }) {
  const [copiado, setCopiado] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(valor);
          setCopiado(true);
          setTimeout(() => setCopiado(false), 2000);
        } catch {
          // Sin portapapeles no hay nada que avisar: el valor está impreso.
        }
      }}
      aria-label={`Copiar ${que}`}
      className="copiar"
    >
      {copiado ? (
        <>
          <Check className="ico" aria-hidden />
          Copiada
        </>
      ) : (
        <>
          <Copy className="ico" aria-hidden />
          Copiar
        </>
      )}
    </button>
  );
}
