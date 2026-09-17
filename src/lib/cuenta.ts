/**
 * A dónde deposita el alumno. Un solo lugar.
 *
 * Estos números estaban copiados en tres archivos —la página de pagos, lo que
 * Luz dicta por WhatsApp, y la ficha de reserva— con dos formatos distintos,
 * con y sin espacios. El 2026-09-16 la tarjeta llevaba tiempo desactualizada
 * en los tres.
 *
 * Ese es el peligro de tenerlo repetido: se cambia en la página, Luz sigue
 * dictando el viejo por semanas, y nadie se entera hasta que alguien deposita
 * a una cuenta que ya no es nuestra. Aquí se cambia una vez y cambia en todos
 * lados.
 *
 * ⚠️ Al modificar la tarjeta, verificar el dígito Luhn antes de desplegar.
 */

export const CUENTA = {
  banco: 'BBVA',
  titular: 'Eduardo W. Czaplewski (cuenta PYME)',
  /** Número de cuenta, 10 dígitos. */
  numero: '0484695739',
  /** 18 dígitos. */
  clabe: '012180004846957399',
  /** Tarjeta de débito para depósito en efectivo (Oxxo, Walmart, 7-Eleven). */
  tarjeta: '4152314683511045',
} as const;

/** En grupos de cuatro, como viene impreso en la tarjeta. */
export function tarjetaConEspacios(): string {
  return CUENTA.tarjeta.replace(/(\d{4})(?=\d)/g, '$1 ');
}

/** Dónde se puede depositar en efectivo, tal como se le dice al alumno. */
export const TIENDAS = 'Oxxo, Walmart o 7-Eleven';
