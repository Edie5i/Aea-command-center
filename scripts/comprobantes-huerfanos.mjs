/**
 * Comprobantes que quedaron en el bucket sin colgarse de ninguna ficha.
 *
 * Hasta el 30 de septiembre de 2026, `actualizarFicha` escribía `zona:
 * undefined` cuando la ficha no traía dirección, y Firestore rechaza undefined
 * tirando el `set` completo. El webhook cuelga el comprobante con esa función,
 * así que cada imagen que llegó de un número sin ficha —o con una ficha vieja,
 * de antes de que existiera el campo— se subió al bucket y nunca se guardó en
 * la ficha. El `.catch` del webhook lo tapaba con "Error subiendo comprobante",
 * que es mentira: el archivo sí está.
 *
 * Ensaya por default. Con --aplicar cuelga en la ficha el comprobante más
 * reciente de cada teléfono que tenga ficha y no tenga comprobanteURL.
 * Nunca marca el depósito como pagado: eso lo confirma una persona mirando el
 * monto y el banco, en /admin/confirmar.
 */
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const APLICAR = process.argv.includes('--aplicar');
const app = initializeApp({ projectId: 'aea-25-85385059-83402' });
const db = getFirestore(app);

const [archivos] = await getStorage(app).bucket('aea-comprobantes').getFiles({ prefix: 'comprobantes/' });

// comprobantes/<telefono>/<millis>-<uuid>.<ext>
const porTelefono = new Map();
for (const f of archivos) {
  const [, telefono] = f.name.split('/');
  if (!telefono) continue;
  if (!porTelefono.has(telefono)) porTelefono.set(telefono, []);
  porTelefono.get(telefono).push(f.name);
}
for (const lista of porTelefono.values()) lista.sort();

const fichas = new Map();
for (const d of (await db.collection('fichas').get()).docs) fichas.set(d.id, d.data());

const colgar = [];
const sinFicha = [];
const yaTienen = [];

for (const [telefono, rutas] of porTelefono) {
  const ficha = fichas.get(telefono);
  if (!ficha) { sinFicha.push({ telefono, rutas }); continue; }
  if (ficha.comprobanteURL) { yaTienen.push(telefono); continue; }
  colgar.push({ telefono, ficha, ruta: rutas[rutas.length - 1], total: rutas.length });
}

console.log(`\nArchivos en el bucket: ${archivos.length} · teléfonos: ${porTelefono.size} · fichas: ${fichas.size}`);
console.log(`Ya colgados: ${yaTienen.length}`);

console.log(`\n── Con ficha y SIN comprobante colgado (${colgar.length}) ──`);
for (const c of colgar) {
  console.log(
    `${c.telefono} · ${c.ficha.studentName || 'sin nombre'} · ${c.ficha.estado}` +
    ` · ${c.ficha.curso || '¿curso?'}` +
    ` · ${c.total} archivo(s) · ${c.ruta}`
  );
}

console.log(`\n── Sin ficha en Firestore (${sinFicha.length}) ──`);
for (const s of sinFicha) console.log(`${s.telefono} · ${s.rutas.length} archivo(s) · ${s.rutas[s.rutas.length - 1]}`);

if (!APLICAR) {
  console.log('\nEnsayo. Nada escrito. Con --aplicar se cuelgan los de la primera lista.');
  process.exit(0);
}

for (const c of colgar) {
  await db.collection('fichas').doc(c.telefono).set(
    { comprobanteURL: `/api/admin/comprobante?path=${encodeURIComponent(c.ruta)}` },
    { merge: true }
  );
  console.log(`colgado: ${c.telefono} → ${c.ruta}`);
}
console.log(`\nListo: ${colgar.length} ficha(s). El depósito sigue sin confirmar, a propósito.`);
