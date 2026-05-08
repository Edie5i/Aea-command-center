// Uso: node scripts/seed-ficha.mjs
import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

if (!getApps().length) {
  initializeApp({ projectId: 'aea-25-85385059-83402' });
}
const db = getFirestore(getApp(), 'default');

const phone = '5215586163794';

const inscripcion = {
  nombre: 'Fernando Martinez',
  telefono: phone,
  zona: 'Calle Puebla 345, Colonia Roma',
  transmision: 'Automático',
  fechas: [
    { date: '2026-05-11', time: '10:00' },
    { date: '2026-05-12', time: '10:00' },
    { date: '2026-05-13', time: '10:00' },
    { date: '2026-05-14', time: '10:00' },
  ],
  fechaConfirmacion: Timestamp.now(),
};

await db
  .collection('conversations')
  .doc(phone)
  .set({ inscripcion }, { merge: true });

console.log('✅ Inscripción guardada para', phone);
console.log('   Abre: https://aea-25-85385059-83402.web.app/admin/conversaciones/' + phone);
