// Comprobantes de depósito: descarga el media de WhatsApp (Meta) y lo guarda
// en el bucket privado aea-comprobantes. El panel los sirve vía
// /api/admin/comprobante (valida PIN) — nunca hay URL pública.
import 'server-only';
import { getApp } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { randomUUID } from 'crypto';

const WA_TOKEN = process.env.META_WHATSAPP_TOKEN ?? '';
export const BUCKET_COMPROBANTES = 'aea-comprobantes';

/**
 * Sube el comprobante al bucket y regresa la ruta del objeto
 * (ej. "comprobantes/5215512345678/1751900000-ab12cd34.jpg").
 */
export async function subirComprobante(mediaId: string, telefono: string): Promise<string> {
  // 1. Metadata del media (URL temporal de Meta)
  const meta = await fetch(`https://graph.facebook.com/v21.0/${mediaId}`, {
    headers: { Authorization: `Bearer ${WA_TOKEN}` },
  }).then((r) => r.json());
  if (!meta?.url) throw new Error(`media sin url: ${JSON.stringify(meta).slice(0, 150)}`);

  // 2. Binario
  const res = await fetch(meta.url, { headers: { Authorization: `Bearer ${WA_TOKEN}` } });
  if (!res.ok) throw new Error(`descarga media falló: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());

  // 3. Subida al bucket privado
  const mime: string = meta.mime_type ?? 'image/jpeg';
  const ext = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg';
  const path = `comprobantes/${telefono}/${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
  await getStorage(getApp()).bucket(BUCKET_COMPROBANTES).file(path).save(buf, {
    contentType: mime,
    resumable: false,
  });
  return path;
}
