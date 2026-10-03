'use client';

import { useEffect, useState } from 'react';
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
 *
 * `hecho` es el acuse, y existe porque también se copian cosas masculinas —el
 * celular, el folio—: «Copiada» leído junto a un teléfono se nota.
 */
export function Copiar({
  valor,
  que,
  hecho = 'Copiada',
}: {
  valor: string;
  que: string;
  hecho?: string;
}) {
  const [copiado, setCopiado] = useState(false);

  // El acuse se borra solo, pero el temporizador vive atado al componente: si la
  // fila se desmonta antes —la lista se revalida, la ficha cambia de estado— el
  // `clearTimeout` evita escribirle estado a algo que ya no está.
  useEffect(() => {
    if (!copiado) return;
    const t = setTimeout(() => setCopiado(false), 2000);
    return () => clearTimeout(t);
  }, [copiado]);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(valor);
          setCopiado(true);
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
          {hecho}
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
