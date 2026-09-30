'use client';

import { useState } from 'react';
import { Check, Share2 } from 'lucide-react';

/**
 * Pasar la ficha recién creada.
 *
 * Al alumno ya le llegó por WhatsApp al crearla, pero en el mostrador eso no
 * alcanza: hay quien viene con otro teléfono, quien quiere mandársela a su
 * mamá, o quien pide que se la pasen ahí mismo. Sin esto había que abrirla y
 * copiar la barra de direcciones, que en un celular es un trámite.
 *
 * `navigator.share` es lo que abre la hoja del sistema —WhatsApp, mensajes,
 * correo, AirDrop— y es lo que la gente entiende por «compartir». Donde no
 * exista (navegadores de escritorio, sobre todo) cae a copiar el enlace, que
 * resuelve lo mismo con un paso más.
 */
export function Compartir({ url, alumno }: { url: string; alumno: string }) {
  const [copiado, setCopiado] = useState(false);

  async function compartir() {
    const texto = `Ficha de inscripción${alumno ? ` de ${alumno}` : ''} — Auto Escuela Americana`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Ficha de inscripción', text: texto, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Cancelar la hoja de compartir lanza: no es un error que contar.
    }
  }

  return (
    <button type="button" className="plata" onClick={compartir}>
      {copiado ? <Check className="ico" aria-hidden /> : <Share2 className="ico" aria-hidden />}
      {copiado ? 'Enlace copiado' : 'Compartir la ficha'}
    </button>
  );
}
