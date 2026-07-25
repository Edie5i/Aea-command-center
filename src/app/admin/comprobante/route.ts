// Alias bajo /admin para que la cookie admin_pin llegue sin re-login.
// Las sesiones viejas tienen la cookie con path '/admin', que NO alcanza
// /api/admin/comprobante (bajo /api). Esta ruta vive bajo /admin, así que la
// cookie existente la cubre. La lógica real (valida PIN + sirve del bucket
// privado) vive en /api/admin/comprobante; aquí solo se reexporta.
export { GET } from '@/app/api/admin/comprobante/route';
