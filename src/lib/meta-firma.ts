/**
 * ¿Este POST lo mandó Meta?
 *
 * El webhook aceptaba cualquier cosa con la forma correcta. Bastaba armar a
 * mano un mensaje que dijera venir del número del admin para ejecutar
 * `!inscrito`, `!cerrar` o `!pausa`, o del número de un alumno para hablarle a
 * Luz en su nombre. Meta firma cada entrega: `X-Hub-Signature-256` es el
 * HMAC-SHA256 del cuerpo tal cual llegó, con el secreto de la app. Sin ese
 * secreto nadie puede fabricar la firma.
 *
 * Se compara sobre el cuerpo CRUDO: volver a serializar el JSON cambia bytes
 * (espacios, escapes de acentos y emojis) y la firma deja de coincidir.
 */

import { createHmac, timingSafeEqual } from 'crypto';

export type Firma = 'valida' | 'invalida' | 'sin_secreto';

export function revisarFirma(
  cuerpoCrudo: string,
  encabezado: string | null | undefined,
  secreto: string | null | undefined
): Firma {
  // Sin secreto configurado no hay con qué comprobar. Se deja pasar —si no, el
  // día que falte la variable Luz se queda muda— pero quien llama lo registra.
  if (!secreto) return 'sin_secreto';
  if (!encabezado || !encabezado.startsWith('sha256=')) return 'invalida';

  const esperada = createHmac('sha256', secreto).update(cuerpoCrudo, 'utf8').digest();
  const recibida = Buffer.from(encabezado.slice('sha256='.length), 'hex');
  if (recibida.length !== esperada.length) return 'invalida';
  return timingSafeEqual(recibida, esperada) ? 'valida' : 'invalida';
}
