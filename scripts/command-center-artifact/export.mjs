/**
 * Paso 1 de 2: saca de Firestore la foto de conversaciones que consume el
 * artifact "pista de enfriamiento" del command center.
 *
 * Escribe leads.json y corte.txt junto a este archivo; después corre build.mjs.
 * Usa las credenciales por defecto (gcloud auth application-default login).
 *
 *   node scripts/command-center-artifact/export.mjs
 */
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));

initializeApp({ projectId: 'aea-25-85385059-83402' });
const db = getFirestore();

const CORTE = Date.now();

// La tarjeta sólo muestra el último mensaje y la hoja de detalle recorta a
// pocas líneas: más de esto sólo engorda el HTML.
const MAX_TEXTO = 240;
const MSGS_POR_HILO = 3;

/** Mismo criterio que src/lib/nombre-lead.ts. */
function telefonoVisible(phone) {
  if (phone.startsWith('521') && phone.length === 13) return phone.slice(3);
  if (phone.startsWith('52') && phone.length === 12) return phone.slice(2);
  return phone;
}

/** Mismo formato que la función horas() de la plantilla. */
function horas(h) {
  if (h < 1) return Math.max(1, Math.round(h * 60)) + ' min';
  if (h < 48) return Math.round(h) + ' h';
  return Math.round(h / 24) + ' d';
}

const ms = (t) => (t?.toMillis ? t.toMillis() : null);
const silencio = (millis) => (millis == null ? 0 : Math.round(((CORTE - millis) / 3.6e6) * 10) / 10);

const snap = await db.collection('conversations').get();
const leads = [];

for (const doc of snap.docs) {
  const c = doc.data();
  const phone = doc.id;
  const ins = c.inscripcion ?? null;

  // Docs de inscripción creados por el formulario, sin chat: no tienen
  // lastActivity y caerían en el "ahora" de la pista con el hilo vacío.
  if (!c.lastActivity) continue;

  const contacto = c.contactName?.trim();
  const inscrito = ins?.nombre?.trim();
  const tel = telefonoVisible(phone);

  const msgs = await doc.ref
    .collection('messages')
    .orderBy('timestamp', 'desc')
    .limit(MSGS_POR_HILO)
    .get();

  const hilo = msgs.docs.reverse().map((m) => {
    const d = m.data();
    const t = ms(d.timestamp);
    return {
      de: d.role === 'bot' ? 'luz' : 'cliente',
      texto: String(d.text ?? '').slice(0, MAX_TEXTO),
      cuando: t == null ? '—' : horas((CORTE - t) / 3.6e6),
    };
  });

  leads.push({
    id: phone,
    nombre: contacto || inscrito || '+' + tel,
    anon: !contacto && !inscrito,
    tel,
    zona: ins?.zona || null,
    curso: ins?.curso || c.courseInterest || null,
    precio: c.coursePrice || null,
    estado: c.chatState ?? 'luz_atendiendo',
    motivo: c.chatReason ?? null,
    silH: silencio(ms(c.lastActivity)),
    fechas: ins?.fechas?.length ?? 0,
    hilo,
  });
}

leads.sort((a, b) => a.silH - b.silH);

fs.writeFileSync(path.join(AQUI, 'leads.json'), JSON.stringify(leads));
fs.writeFileSync(path.join(AQUI, 'corte.txt'), String(CORTE));

const est = {};
leads.forEach((l) => (est[l.estado] = (est[l.estado] || 0) + 1));
console.error(`${leads.length} conversaciones · corte ${new Date(CORTE).toISOString()}`);
console.error(est);
