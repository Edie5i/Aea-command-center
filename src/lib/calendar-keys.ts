/**
 * Claves de identidad de una clase, para no crear dos veces el mismo evento.
 *
 * Vive aparte de calendarService.ts —que es server-only y arrastra googleapis—
 * porque aquí está el punto frágil del candado anti-duplicados: la clave que se
 * construye desde la fecha pedida y la que se lee de un evento ya existente
 * TIENEN que coincidir carácter por carácter. Si divergen, el candado deja de
 * detectar y los duplicados vuelven sin que nadie se entere.
 */

export const ZONA_HORARIA = 'America/Mexico_City';

/**
 * Clave desde los datos de entrada: "YYYY-MM-DDTHH:mm" en hora de CDMX.
 * La fecha llega como ISO desde el cliente y hay que bajarla a día local — el
 * servidor corre en UTC, así que sin la zona horaria una clase de las 19:00 se
 * registraría al día siguiente.
 */
export function claveDesdeEntrada(fechaISO: string, hora: string): string {
  const dia = new Date(fechaISO).toLocaleDateString('en-CA', { timeZone: ZONA_HORARIA });
  return `${dia}T${hora}`;
}

/**
 * Clave desde un evento de Google Calendar, cuyo start.dateTime viene como
 * "2026-08-01T07:00:00-06:00". Los primeros 16 caracteres son ya la hora local.
 */
export function claveDesdeEvento(startDateTime: string): string {
  return startDateTime.slice(0, 16);
}

/**
 * Nombre del alumno comparable entre Firestore y Calendar.
 *
 * En Calendar los títulos llevan anotaciones a mano —"Rosa Loredana — 4ª
 * TENTATIVA (reagendar)"— que en Firestore no existen. Sin recortarlas, el
 * chequeo de salud reportaba como faltante una clase que sí estaba agendada, y
 * un monitor que grita en falso se deja de leer.
 */
export function normalizarAlumno(nombre: string): string {
  return nombre
    .replace(/^Clase:\s*/i, '')
    .split(/\s+[—–-]\s+/)[0]   // corta la anotación tras un guion largo
    .trim()
    .toLocaleLowerCase('es-MX');
}
