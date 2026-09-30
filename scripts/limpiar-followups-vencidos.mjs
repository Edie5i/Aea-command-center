/**
 * Borra los follow-ups de venta que quedaron vencidos.
 *
 * El cron `advance-chat-states` manda el siguiente mensaje de Luz a toda
 * conversación con `chatState: 'esperando_cliente'` y `nextFollowupAt <= ahora`.
 * No mira qué tan atrasado está: un lead de hace dos meses recibe hoy un
 * "¿sigues pensando en tomar clases?" como si acabara de escribir.
 *
 * Esto limpia la cola: quita el `nextFollowupAt` vencido por más de CORTE_DIAS
 * y, si la conversación seguía en 'esperando_cliente', la pasa a 'frio' —que es
 * lo que el propio cron hace cuando se agota la secuencia— dejando el motivo en
 * `state_history`.
 *
 * Uso:
 *   node scripts/limpiar-followups-vencidos.mjs            # sólo enseña qué haría
 *   node scripts/limpiar-followups-vencidos.mjs --aplicar  # escribe
 */
import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

if (!getApps().length) initializeApp({ projectId: 'aea-25-85385059-83402' });
const db = getFirestore(getApp());

const APLICAR = process.argv.includes('--aplicar');
const CORTE_DIAS = 7;
const now = Date.now();

const snap = await db.collection('conversations').get();
let tocadas = 0;
let enfriadas = 0;

for (const d of snap.docs) {
  const c = d.data();
  const nf = c.nextFollowupAt?.toMillis?.();
  if (!nf || nf > now) continue;

  const dias = Math.floor((now - nf) / 86400000);
  if (dias <= CORTE_DIAS) {
    console.log(`· ${d.id.slice(-4)} vencido hace ${dias}d → se deja, el seguimiento sigue vigente`);
    continue;
  }

  // Sólo 'esperando_cliente' entra al cron; los demás estados ya no reciben
  // nada, pero su nextFollowupAt vencido se limpia igual para que no reviva si
  // la conversación vuelve a ese estado.
  const enfriar = (c.chatState ?? '') === 'esperando_cliente';
  const razon = `Seguimiento vencido: el follow-up quedó ${dias} días atrasado y ya no se manda`;

  console.log(`${APLICAR ? '✓' : '→'} ${d.id.slice(-4)} vencido hace ${dias}d · ${c.chatState ?? '(sin estado)'}${enfriar ? ' → frio' : ''}`);

  if (APLICAR) {
    await d.ref.set(
      enfriar
        ? { nextFollowupAt: null, chatState: 'frio', chatReason: razon, chatUrgency: 'ninguna' }
        : { nextFollowupAt: null },
      { merge: true }
    );
    if (enfriar) {
      await d.ref.collection('state_history').add({
        from: c.chatState ?? null,
        to: 'frio',
        reason: razon,
        timestamp: Timestamp.now(),
        trigger: 'manual',
      });
    }
  }

  tocadas++;
  if (enfriar) enfriadas++;
}

console.log(`\n${APLICAR ? 'limpiadas' : 'se limpiarían'}: ${tocadas} conversaciones (${enfriadas} pasan a frío)`);
