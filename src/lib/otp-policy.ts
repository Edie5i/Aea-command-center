/**
 * Política de validación del OTP del portal de instructores.
 *
 * Vive aparte de firestore.ts —que arrastra firebase-admin— para poder probarse:
 * aquí se decide quién entra al portal, y un error se rompe hacia abierto.
 */

export const OTP_TTL_MS = 10 * 60 * 1000;
export const OTP_MAX_INTENTOS = 5;

export interface DatosOtp {
  portalOtp?: string | null;
  portalOtpExpires?: number | null;
  portalOtpIntentos?: number;
}

export type DecisionOtp =
  /** Código correcto: dejar entrar y consumirlo. */
  | { accion: 'aceptar' }
  /** Código incorrecto: guardar el intento fallido. */
  | { accion: 'rechazar'; intentos: number }
  /** Se agotaron los intentos o el código venció: invalidarlo. */
  | { accion: 'invalidar'; motivo: 'agotado' | 'expirado' }
  /** No hay código vigente que validar. */
  | { accion: 'ignorar' };

/**
 * Decide qué hacer con un intento de acceso. Sin efectos: quien llama traduce la
 * decisión a escrituras.
 *
 * El orden importa. La expiración se revisa ANTES que la coincidencia: si no, un
 * código vencido pero correcto entraría. Y los intentos sólo cuentan cuando el
 * código está vigente, para que nadie pueda quemarle el código a un instructor
 * disparando fallos contra uno ya expirado.
 */
export function decidirOtp(
  datos: DatosOtp,
  otpRecibido: string,
  ahora: number,
  maxIntentos: number = OTP_MAX_INTENTOS,
): DecisionOtp {
  if (!datos.portalOtp || !datos.portalOtpExpires) return { accion: 'ignorar' };
  if (ahora > datos.portalOtpExpires) return { accion: 'invalidar', motivo: 'expirado' };

  if (datos.portalOtp !== otpRecibido) {
    const intentos = (datos.portalOtpIntentos ?? 0) + 1;
    return intentos >= maxIntentos
      ? { accion: 'invalidar', motivo: 'agotado' }
      : { accion: 'rechazar', intentos };
  }

  return { accion: 'aceptar' };
}
