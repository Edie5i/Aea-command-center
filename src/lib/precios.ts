// Fuente única de precios por curso — catálogo oficial AEA 2026.
// Antes vivía duplicado (e incompleto) en aea-tools.ts y agenda/actions.ts;
// un curso nuevo en uno se te olvidaba actualizar en el otro.
export const PRECIO_CURSO: Record<string, number> = {
  'Estándar': 3400,
  'Automático': 3900,
  'Intermedio': 2900,
  'Avanzado': 1900,
  'Moto': 4300,
  'English Drive': 4800,
  'Personas Nerviosas': 5600,
  'Intensivo': 5600,
  'Mixto': 5600,
  'Coche Propio': 3900,
};
