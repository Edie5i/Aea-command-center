/**
 * Pone el apartado de las fichas viejas en $690.
 *
 * Hasta el 2026-09 el apartado se calculaba como `max(20% del curso, 690)` y ese
 * número se guardó en cada ficha: hay fichas con 780, 960 y 1120. Ese cálculo ya
 * no existe —el apartado es $690 para todos, y es lo que Luz dicta por WhatsApp—,
 * pero la página de la ficha enseña lo guardado: al alumno le pide $780 mientras
 * Luz le promete $690.
 *
 * Antes, cualquier re-guardado de Luz los normalizaba de paso, sin querer. Al
 * arreglar eso (el monto ahora se preserva, porque es la promesa que se le hizo
 * al alumno) esos números viejos se quedarían congelados para siempre. De ahí
 * este script, que corre UNA vez.
 *
 * Las fichas 'reservada' NO se tocan: ya pagaron y su ficha es el registro de lo
 * que pasó, no una promesa pendiente.
 *
 * Uso:
 *   node scripts/normalizar-apartado-fichas.mjs                      # sólo enseña
 *   node scripts/normalizar-apartado-fichas.mjs --aplicar            # escribe
 *   node scripts/normalizar-apartado-fichas.mjs --respaldo b.json    # guarda los valores previos
 */
import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { writeFileSync } from 'node:fs';

if (!getApps().length) initializeApp({ projectId: 'aea-25-85385059-83402' });
const db = getFirestore(getApp());

const APLICAR = process.argv.includes('--aplicar');
const respaldoIdx = process.argv.indexOf('--respaldo');
const RESPALDO = respaldoIdx > -1 ? process.argv[respaldoIdx + 1] : null;
const APARTADO = 690;

const snap = await db.collection('fichas').get();
const previos = [];
let tocadas = 0;

for (const d of snap.docs) {
  const f = d.data();
  if (f.estado === 'reservada') continue;
  if (typeof f.depositoMonto !== 'number' || f.depositoMonto === APARTADO) continue;

  console.log(`${APLICAR ? '✓' : '→'} ${d.id.slice(-4)} · ${f.estado ?? '(sin estado)'} · ${f.depositoMonto} → ${APARTADO}`);
  previos.push({ id: d.id, estado: f.estado ?? null, depositoMonto: f.depositoMonto });

  if (APLICAR) await d.ref.set({ depositoMonto: APARTADO }, { merge: true });
  tocadas++;
}

if (RESPALDO) {
  writeFileSync(RESPALDO, JSON.stringify(previos, null, 1));
  console.log('respaldo →', RESPALDO);
}
console.log(`\n${APLICAR ? 'normalizadas' : 'se normalizarían'}: ${tocadas} fichas (las 'reservada' no se tocan)`);
