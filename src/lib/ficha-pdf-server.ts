const BLUE       = [0, 74, 173]   as const;
const INK        = [20, 24, 31]   as const;
const MUTED      = [107, 99, 87]  as const;
const WHITE      = [255, 255, 255] as const;
const LIGHT_BLUE = [235, 243, 255] as const;
const DASH_GRAY  = [180, 180, 180] as const;

const DIAS_ES  = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
const MESES_ES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

function fmtDateLong(d: string): string {
  if (!d) return '—';
  const dt = new Date(d + 'T12:00:00');
  return `${DIAS_ES[dt.getDay()]}, ${dt.getDate()} de ${MESES_ES[dt.getMonth()]} de ${dt.getFullYear()}`.toUpperCase();
}

function fmtTime12(t: string): string {
  if (!t) return '—';
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'p.m.' : 'a.m.'}`;
}

export interface FichaData {
  nombre: string;
  telefono: string;
  zona: string;
  curso?: string;
  transmision?: string;
  fechas: { date: string; time: string; nota?: string }[];
  nota?: string;
  folio?: string;
}

export async function generarFichaPdfBuffer(data: FichaData): Promise<Buffer> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { jsPDF } = require('jspdf/dist/jspdf.node.js');
  const doc = new jsPDF({ unit: 'mm', format: 'letter' });
  const W = 215.9, H = 279.4, M = 18;

  const folio = data.folio ?? ('AEA-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000));
  const fechaEmision = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
  const cursoLabel = (() => {
    const c = data.curso ?? data.transmision ?? 'Estándar';
    if (c === 'Estándar')   return 'ESTÁNDAR 10H';
    if (c === 'Automático') return 'AUTOMÁTICO 10H';
    return c.toUpperCase();
  })();

  // Top stripe
  doc.setFillColor(...BLUE); doc.rect(0, 0, W, 5, 'F');
  let y = M + 4;

  // Logo
  doc.setFillColor(...BLUE); doc.rect(M, y, 14, 14, 'F');
  doc.setTextColor(...WHITE); doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
  doc.text('A', M + 7, y + 9.5, { align: 'center' });
  doc.setTextColor(...INK); doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
  doc.text('AUTO ESCUELA', M + 18, y + 5);
  doc.text('AMERICANA', M + 18, y + 9.5);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...MUTED);
  doc.text('APRENDE A MANEJAR · CDMX', M + 18, y + 13);

  // Folio / Fecha
  doc.setFontSize(7); doc.setTextColor(...BLUE); doc.setFont('helvetica', 'bold');
  doc.text('FOLIO', W - M, y + 3, { align: 'right' });
  doc.setTextColor(...INK); doc.setFont('courier', 'normal'); doc.setFontSize(9);
  doc.text(folio, W - M, y + 7, { align: 'right' });
  doc.setFontSize(7); doc.setTextColor(...BLUE); doc.setFont('helvetica', 'bold');
  doc.text('FECHA', W - M, y + 12, { align: 'right' });
  doc.setTextColor(...INK); doc.setFont('courier', 'normal'); doc.setFontSize(9);
  doc.text(fechaEmision, W - M, y + 16, { align: 'right' });
  y += 20;

  doc.setDrawColor(...INK); doc.setLineWidth(0.6); doc.line(M, y, W - M, y);
  y += 10;

  // Title
  doc.setTextColor(...INK); doc.setFont('helvetica', 'bold'); doc.setFontSize(28);
  doc.text('FICHA DE', M, y);
  doc.text('INSCRIPCIÓN', M, y + 9);
  doc.setFont('helvetica', 'italic'); doc.setFontSize(10); doc.setTextColor(...MUTED);
  doc.text('Documento oficial de registro', W - M, y + 6, { align: 'right' });
  y += 22;

  const section = (num: string, title: string) => {
    doc.setFillColor(...BLUE); doc.rect(M, y - 3, 7, 4.5, 'F');
    doc.setTextColor(...WHITE); doc.setFont('helvetica', 'bold'); doc.setFontSize(7);
    doc.text(num, M + 3.5, y + 0.2, { align: 'center' });
    doc.setTextColor(...INK); doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
    doc.text(title.toUpperCase(), M + 10, y);
    doc.setDrawColor(...BLUE); doc.setLineWidth(0.3);
    const end = M + 10 + doc.getTextWidth(title.toUpperCase()) + 3;
    doc.line(end, y - 0.5, W - M, y - 0.5);
    y += 6;
  };

  const dashed = (x1: number, x2: number, offset = 6) => {
    doc.setDrawColor(...DASH_GRAY); doc.setLineDashPattern([0.5, 0.5], 0);
    doc.line(x1, y + offset, x2, y + offset); doc.setLineDashPattern([], 0);
  };

  // 01 Datos
  section('01', 'Datos del alumno');
  doc.setTextColor(...MUTED); doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
  doc.text('NOMBRE', M, y);
  doc.setTextColor(...INK); doc.setFont('helvetica', 'normal'); doc.setFontSize(11);
  doc.text(data.nombre, M, y + 5);
  dashed(M, W - M); y += 12;

  const colW = (W - 2 * M - 8) / 2;
  const displayPhone = data.telefono.startsWith('52') && data.telefono.length === 12
    ? data.telefono.slice(2) : data.telefono;
  doc.setTextColor(...MUTED); doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
  doc.text('TELÉFONO', M, y);
  doc.setTextColor(...INK); doc.setFont('courier', 'normal'); doc.setFontSize(10);
  doc.text(displayPhone, M, y + 5);
  dashed(M, M + colW);
  doc.setTextColor(...MUTED); doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
  doc.text('EMAIL  (opcional)', M + colW + 8, y);
  doc.setTextColor(...MUTED); doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  doc.text('—', M + colW + 8, y + 5);
  dashed(M + colW + 8, W - M); y += 12;

  doc.setTextColor(...MUTED); doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
  doc.text('DIRECCIÓN / PUNTO DE ENCUENTRO', M, y);
  doc.setTextColor(...INK); doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
  const zonaLines = doc.splitTextToSize(data.zona, W - 2 * M);
  doc.text(zonaLines, M, y + 5);
  dashed(M, W - M);
  dashed(M, W - M, 11);
  y += 16;

  // 02 Curso
  section('02', 'Curso elegido');
  const firstFecha = data.fechas.find(f => f.date && f.time);
  const subtitle = firstFecha
    ? `Inicio: ${fmtDateLong(firstFecha.date)}  ·  ${fmtTime12(firstFecha.time)}  ·  ${data.fechas.filter(f => f.date).length} sesiones`
    : 'Sede — Torreón 49, Roma Sur';
  doc.setFillColor(...BLUE); doc.rect(M, y, W - 2 * M, 20, 'F');
  doc.setTextColor(...WHITE); doc.setFont('helvetica', 'bold'); doc.setFontSize(15);
  doc.text(cursoLabel, M + 5, y + 8);
  doc.setFont('courier', 'normal'); doc.setFontSize(8); doc.setTextColor(180, 200, 240);
  doc.text(subtitle, M + 5, y + 15);
  y += 26;

  // 03 Fechas
  section('03', 'Fechas y horarios');
  doc.setFont('courier', 'normal'); doc.setFontSize(9);
  for (let i = 0; i < data.fechas.length; i++) {
    const f = data.fechas[i];
    if (f.date && f.time) {
      doc.setTextColor(...INK);
      doc.text(`${i + 1}.  ${fmtDateLong(f.date)}  ·  ${fmtTime12(f.time)}`, M, y);
    } else {
      doc.setTextColor(...MUTED);
      doc.text(`${i + 1}.  ${f.nota || 'Tentativo — por confirmar'}`, M, y);
    }
    doc.setDrawColor(...DASH_GRAY); doc.setLineDashPattern([0.5, 0.5], 0);
    doc.line(M + 5, y + 1.5, W - M, y + 1.5); doc.setLineDashPattern([], 0);
    y += 7;
  }
  y += 4;

  // Nota adicional
  if (data.nota) {
    doc.setFillColor(250, 250, 245); doc.rect(M, y, W - 2 * M, 12, 'F');
    doc.setFillColor(...BLUE); doc.rect(M, y, 1, 12, 'F');
    doc.setTextColor(...MUTED); doc.setFont('helvetica', 'bold'); doc.setFontSize(7);
    doc.text('NOTA', M + 4, y + 5);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...INK);
    doc.text(doc.splitTextToSize(data.nota, W - 2 * M - 8), M + 4, y + 10);
    y += 18;
  }

  // Terms
  doc.setFillColor(...LIGHT_BLUE); doc.rect(M, y, W - 2 * M, 20, 'F');
  doc.setFillColor(...BLUE); doc.rect(M, y, 1, 20, 'F');
  doc.setTextColor(...INK); doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
  doc.text('Al confirmar esta ficha, el alumno acepta los Términos y Condiciones de AEA:', M + 4, y + 5);
  doc.setTextColor(...BLUE); doc.setFont('courier', 'bold'); doc.setFontSize(8);
  doc.text('autoescuelaamericana.com/terminos', M + 4, y + 10);
  doc.setTextColor(...MUTED); doc.setFont('helvetica', 'italic'); doc.setFontSize(7.5);
  doc.text(doc.splitTextToSize(
    'El apartado garantiza el lugar y fecha de inicio. Cancelaciones con menos de 24 hrs de anticipación no son reembolsables. Documento generado electrónicamente.',
    W - 2 * M - 6
  ), M + 4, y + 15);
  y += 26;

  // Firmas
  if (y < H - 40) {
    doc.setDrawColor(...INK); doc.setLineWidth(0.4);
    doc.line(M, y, M + 70, y);
    doc.line(W - M - 70, y, W - M, y);
    doc.setFont('courier', 'normal'); doc.setFontSize(7); doc.setTextColor(...MUTED);
    doc.text('FIRMA DEL ALUMNO', M, y + 4);
    doc.text('ASESOR / SELLO AEA', W - M, y + 4, { align: 'right' });
  }

  // Footer
  const fy = H - 14;
  doc.setDrawColor(...INK); doc.setLineWidth(0.4); doc.line(M, fy, W - M, fy);
  doc.setFont('courier', 'normal'); doc.setFontSize(8); doc.setTextColor(...MUTED);
  doc.text('Torreón 49, Roma Sur, CDMX · 56 3443 3212', M, fy + 5);
  doc.setTextColor(...BLUE); doc.setFont('courier', 'bold');
  doc.text('app.autoescuelaamericana.com', W - M, fy + 5, { align: 'right' });

  return Buffer.from(doc.output('arraybuffer'));
}

export async function enviarFichaAdminWhatsApp(data: FichaData, to?: string): Promise<void> {
  const waToken  = process.env.META_WHATSAPP_TOKEN ?? '';
  const phoneId  = process.env.META_PHONE_NUMBER_ID ?? '';
  const adminPhone = to ?? (process.env.ADMIN_NOTIFICATION_PHONE ?? '525634433212').trim();

  console.log('[ficha-admin] iniciando envío para', data.nombre, '→', adminPhone, '| token:', waToken ? 'ok' : 'FALTA', '| phoneId:', phoneId || 'FALTA');
  if (!waToken || !phoneId) {
    console.error('[ficha-admin] Faltan credenciales WhatsApp');
    return;
  }

  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await generarFichaPdfBuffer(data);
    console.log('[ficha-admin] PDF generado:', pdfBuffer.length, 'bytes');
  } catch (e) {
    console.error('[ficha-admin] Error generando PDF:', e);
    return;
  }
  const folio = data.folio ?? 'AEA';
  const filename = `${folio}-${data.nombre.replace(/\s+/g, '_')}.pdf`;

  const formData = new FormData();
  formData.append('messaging_product', 'whatsapp');
  formData.append('type', 'application/pdf');
  formData.append('file', new Blob([pdfBuffer], { type: 'application/pdf' }), filename);

  const uploadRes = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/media`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${waToken}` },
    body: formData,
  });

  if (!uploadRes.ok) {
    console.error('[ficha-admin] Upload error:', await uploadRes.text());
    return;
  }

  const { id: mediaId } = await uploadRes.json() as { id: string };
  console.log('[ficha-admin] PDF subido, mediaId:', mediaId);

  const sendRes = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${waToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: adminPhone,
      type: 'document',
      document: {
        id: mediaId,
        filename,
        caption: `📋 Nueva ficha — ${data.nombre}\n📱 +${data.telefono}\n📍 ${data.zona}`,
      },
    }),
  }).catch((e) => {
    console.error('[ficha-admin] Error de red enviando documento:', e);
    return null;
  });

  if (sendRes?.ok) {
    console.log('[ficha-admin] Ficha aceptada por Meta para', adminPhone, '(200 no garantiza entrega — ver WA-STATUS)');
  } else if (sendRes) {
    console.error('[ficha-admin] Send error:', sendRes.status, await sendRes.text());
  }

  // Un 200 al mandar el documento NO garantiza entrega — Meta puede rechazarlo
  // después por la ventana de 24h y eso sólo se ve en el callback [WA-STATUS],
  // no aquí. Por eso, para el admin, el link de respaldo se manda SIEMPRE (no
  // sólo si el envío del documento falló en el momento) — mismo patrón de
  // "mirror garantizado" que notificarAdmin ya usa para texto. Subir el PDF y
  // mandar el link directo por el canal de texto garantizado — así no hace
  // falta ir a buscarla a mano en /admin/fichas.
  if (!to) {
    const { notificarAdmin } = await import('@/lib/adminNotify');
    let linkTexto = 'No se pudo entregar el PDF por WhatsApp — ábrela en /admin/fichas';
    try {
      const { subirFichaPdf } = await import('@/lib/comprobantes');
      const path = await subirFichaPdf(pdfBuffer, data.telefono, filename);
      linkTexto = `https://app.autoescuelaamericana.com/api/admin/comprobante?path=${encodeURIComponent(path)}`;
    } catch (e) {
      console.error('[ficha-admin] Error subiendo PDF de respaldo:', e);
    }
    await notificarAdmin(
      `📋 *Ficha nueva* — ${data.nombre}\n📱 +${data.telefono}\n📍 ${data.zona}\n\n${linkTexto}`
    );
  }
}
