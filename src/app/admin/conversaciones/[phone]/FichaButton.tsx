'use client';

import { useState } from 'react';
import type { InscripcionData } from '@/lib/firestore';

const BLUE       = [0, 74, 173]    as const;
const INK        = [20, 24, 31]    as const;
const MUTED      = [107, 99, 87]   as const;
const WHITE      = [255, 255, 255] as const;
const LIGHT_BLUE = [235, 243, 255] as const;
const DASH_GRAY  = [180, 180, 180] as const;

const MAX_SESSIONS = 6;

type CalStatus = 'idle' | 'loading' | 'ok' | 'error';
type WaStatus = 'idle' | 'loading' | 'ok' | 'error';

export default function FichaButton({ data }: { data: InscripcionData }) {
  const [calStatus, setCalStatus] = useState<CalStatus>('idle');
  const [calMsg, setCalMsg] = useState('');
  const [waStatus, setWaStatus] = useState<WaStatus>('idle');

  async function syncCalendar() {
    setCalStatus('loading');
    setCalMsg('');
    try {
      const res = await fetch('/api/ficha/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.nombre,
          phone: data.telefono,
          address: data.zona || 'Torreón 49, Roma Sur',
          transmission: data.transmision,
          dates: data.fechas.map(f => ({
            date: new Date(f.date + 'T12:00:00').toISOString(),
            time: f.time,
          })),
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setCalStatus('ok');
        setCalMsg(`${json.created} evento${json.created !== 1 ? 's' : ''}`);
      } else {
        setCalStatus('error');
        setCalMsg(json.error ?? 'Error');
      }
    } catch {
      setCalStatus('error');
      setCalMsg('Sin conexión');
    }
  }

  function buildHtml(): string {
    const folio = 'AEA-' + new Date(data.fechaConfirmacion).getFullYear() + '-' + data.fechaConfirmacion.toString().slice(-4);
    const fechaEmision = new Date(data.fechaConfirmacion).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase();
    const esPreReserva = data.status === 'pre_reserva';
    const displayPhone = data.telefono.startsWith('52') && data.telefono.length === 12 ? data.telefono.slice(2) : data.telefono;
    const cursoLabel = (data.curso ?? data.transmision ?? '').toUpperCase();

    const fmtDate = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
    const fmtTime = (t: string) => {
      if (!t) return '—';
      const [hh, mm] = t.split(':').map(Number);
      const ampm = hh >= 12 ? 'PM' : 'AM';
      const h12 = hh > 12 ? hh - 12 : hh === 0 ? 12 : hh;
      return `${h12}:${mm.toString().padStart(2, '0')} ${ampm}`;
    };

    const sesionesHtml = esPreReserva && data.fechas.length === 0
      ? `<div class="pre-nota">Tus fechas se confirman al realizar el apartado de $690. El instructor se asigna 24h antes de tu primera clase.</div>`
      : Array.from({ length: Math.max(data.fechas.length, 4) }, (_, i) => {
          const f = data.fechas[i];
          return f
            ? `<div class="sesion"><span class="num">${i + 1}</span><span class="fecha-txt">${fmtDate(f.date)}</span><span class="hora-txt">${fmtTime(f.time)}</span></div>`
            : `<div class="sesion vacia"><span class="num">${i + 1}</span><span class="linea"></span></div>`;
        }).join('');

    return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Ficha ${folio} — ${data.nombre}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Helvetica Neue',Arial,sans-serif;background:#f4f4f4;color:#14181f;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .page{background:#fff;max-width:720px;margin:24px auto;padding:32px 40px;border-radius:8px;box-shadow:0 2px 16px rgba(0,0,0,.08)}
  .top-bar{height:6px;background:#004AAD;margin:-32px -40px 0;border-radius:8px 8px 0 0}
  .header{display:flex;align-items:flex-start;justify-content:space-between;margin-top:24px;padding-bottom:16px;border-bottom:2px solid #14181f}
  .logo-box{display:flex;align-items:center;gap:12px}
  .logo-sq{background:#004AAD;color:#fff;font-weight:900;font-size:18px;width:44px;height:44px;display:flex;align-items:center;justify-content:center;border-radius:4px}
  .logo-txt h1{font-size:13px;font-weight:800;letter-spacing:.05em;color:#14181f}
  .logo-txt p{font-size:9px;color:#6b6357;letter-spacing:.08em}
  .meta{text-align:right}
  .meta .label{font-size:8px;font-weight:700;color:#004AAD;letter-spacing:.1em}
  .meta .val{font-family:'Courier New',monospace;font-size:11px;color:#14181f}
  .titulo{margin:24px 0 20px}
  .titulo h2{font-size:32px;font-weight:900;line-height:1.1;color:#14181f}
  .titulo p{font-size:11px;color:#6b6357;font-style:italic;margin-top:4px}
  .seccion{margin:20px 0 12px;display:flex;align-items:center;gap:8px}
  .sec-num{background:#004AAD;color:#fff;font-size:9px;font-weight:800;width:22px;height:18px;display:flex;align-items:center;justify-content:center;border-radius:3px;flex-shrink:0}
  .sec-tit{font-size:10px;font-weight:800;letter-spacing:.1em;color:#14181f;border-bottom:1px solid #004AAD;flex:1;padding-bottom:2px}
  .campo-label{font-size:9px;color:#6b6357;letter-spacing:.06em;margin-bottom:2px}
  .campo-val{font-family:'Courier New',monospace;font-size:13px;color:#14181f;border-bottom:1px dashed #b4b4b4;padding-bottom:4px;margin-bottom:12px}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:12px}
  .curso-box{background:#004AAD;color:#fff;padding:14px 18px;border-radius:6px;margin:8px 0 16px}
  .curso-box h3{font-size:18px;font-weight:800}
  .curso-box p{font-size:10px;color:#b4c8f0;margin-top:4px;font-family:'Courier New',monospace}
  .sesion{display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px dashed #d0d0d0}
  .sesion.vacia{opacity:.35}
  .num{background:#004AAD;color:#fff;font-size:9px;font-weight:800;width:20px;height:20px;display:flex;align-items:center;justify-content:center;border-radius:3px;flex-shrink:0}
  .fecha-txt{font-family:'Courier New',monospace;font-size:12px;flex:1;color:#14181f}
  .hora-txt{font-family:'Courier New',monospace;font-size:12px;font-weight:700;color:#004AAD;flex-shrink:0}
  .linea{flex:1;border-bottom:1px dashed #ccc}
  .pre-nota{background:#ebf3ff;border-left:3px solid #004AAD;padding:10px 14px;font-size:11px;color:#14181f;border-radius:0 4px 4px 0;margin:8px 0}
  .terminos{background:#ebf3ff;border-left:3px solid #004AAD;padding:12px 16px;border-radius:0 4px 4px 0;margin:20px 0}
  .terminos p{font-size:10px;color:#14181f;line-height:1.5}
  .terminos a{color:#004AAD;font-weight:700}
  .firmas{display:flex;justify-content:space-between;margin-top:28px;padding-top:16px}
  .firma{text-align:center;width:220px}
  .firma-linea{border-top:1px solid #14181f;padding-top:6px;font-size:9px;color:#6b6357;letter-spacing:.08em}
  .footer{margin-top:28px;padding-top:12px;border-top:1px solid #14181f;display:flex;justify-content:space-between;font-family:'Courier New',monospace;font-size:9px;color:#6b6357}
  .footer a{color:#004AAD;font-weight:700;text-decoration:none}
  @media print{body{background:#fff}.page{box-shadow:none;margin:0;border-radius:0;padding:24px 32px}}
</style>
</head><body>
<div class="page">
  <div class="top-bar"></div>
  <div class="header">
    <div class="logo-box">
      <div class="logo-sq">A</div>
      <div class="logo-txt"><h1>AUTO ESCUELA AMERICANA</h1><p>APRENDE A MANEJAR · CDMX</p></div>
    </div>
    <div class="meta">
      <div class="label">FOLIO</div><div class="val">${folio}</div>
      <div class="label" style="margin-top:6px">FECHA</div><div class="val">${fechaEmision}</div>
    </div>
  </div>
  <div class="titulo">
    <h2>${esPreReserva ? 'FICHA DE\nPRE-RESERVA' : 'FICHA DE\nINSCRIPCIÓN'}</h2>
    <p>${esPreReserva ? 'Aparta tu lugar con $690 para confirmar fechas' : 'Documento oficial de registro'}</p>
  </div>
  <div class="seccion"><div class="sec-num">01</div><div class="sec-tit">DATOS DEL ALUMNO</div></div>
  <div class="campo-label">NOMBRE</div>
  <div class="campo-val" style="font-size:16px">${data.nombre}</div>
  <div class="grid2">
    <div><div class="campo-label">TELÉFONO</div><div class="campo-val">${displayPhone}</div></div>
    <div><div class="campo-label">EMAIL (opcional)</div><div class="campo-val">&nbsp;</div></div>
  </div>
  <div class="campo-label">DIRECCIÓN / PUNTO DE ENCUENTRO</div>
  <div class="campo-val">${data.zona || '—'}</div>
  <div class="seccion"><div class="sec-num">02</div><div class="sec-tit">CURSO ELEGIDO</div></div>
  <div class="curso-box">
    <h3>${cursoLabel}</h3>
    <p>${esPreReserva && data.fechas.length === 0 ? 'Fechas por confirmar · Apartado $690' : `Inicio: ${data.fechas[0] ? fmtDate(data.fechas[0].date) : '—'} · ${data.fechas[0] ? fmtTime(data.fechas[0].time) : '—'} · ${data.fechas.length} sesiones`}</p>
  </div>
  <div class="seccion"><div class="sec-num">03</div><div class="sec-tit">FECHAS Y HORARIOS</div></div>
  ${sesionesHtml}
  <div class="terminos">
    <p>Al confirmar esta ficha, el alumno acepta los Términos y Condiciones de AEA:<br>
    <a href="https://autoescuelaamericana.com/terminos">autoescuelaamericana.com/terminos</a><br><br>
    El apartado garantiza el lugar y fecha de inicio. Cancelaciones con menos de 24 hrs de anticipación no son reembolsables. Documento generado electrónicamente.</p>
  </div>
  <div class="firmas">
    <div class="firma"><div class="firma-linea">FIRMA DEL ALUMNO</div></div>
    <div class="firma"><div class="firma-linea">ASESOR / SELLO AEA</div></div>
  </div>
  <div class="footer">
    <span>Torreón 49, Roma Sur, CDMX · 56 3443 3212</span>
    <a href="https://app.autoescuelaamericana.com">app.autoescuelaamericana.com</a>
  </div>
</div>
</body></html>`;
  }

  async function handleDownload() {
    const fechasIncompletas = data.fechas.filter(f => !f.date || !f.time);
    if (fechasIncompletas.length > 0) {
      alert(`⚠️ ${fechasIncompletas.length} sesión(es) sin fecha u horario completo. Corrige los datos antes de generar la ficha.`);
      return;
    }
    const html = buildHtml();
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  async function buildPdfBlob(): Promise<{ blob: Blob; folio: string; filename: string }> {
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'mm', format: 'letter' });
    const W = 215.9, H = 279.4;
    const M = 18;

    const folio =
      'AEA-' +
      new Date(data.fechaConfirmacion).getFullYear() +
      '-' +
      data.fechaConfirmacion.toString().slice(-4);

    const fechaEmision = new Date(data.fechaConfirmacion)
      .toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
      .toUpperCase();

    const { format: fmt, parse: prs } = await import('date-fns');
    const { es } = await import('date-fns/locale');
    const fmtDate = (d: string) =>
      fmt(new Date(d + 'T12:00:00'), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
    const fmtTime = (t: string) =>
      t ? fmt(prs(t, 'HH:mm', new Date()), 'h:mm a') : '—';

    // Reutilizar misma lógica de renderizado
    doc.setFillColor(...BLUE); doc.rect(0, 0, W, 5, 'F');
    let y = M + 4;
    doc.setFillColor(...BLUE); doc.rect(M, y, 14, 14, 'F');
    doc.setTextColor(...WHITE); doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
    doc.text('A', M + 7, y + 9.5, { align: 'center' });
    doc.setTextColor(...INK); doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
    doc.text('AUTO ESCUELA', M + 18, y + 5);
    doc.text('AMERICANA', M + 18, y + 9.5);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...MUTED);
    doc.text('APRENDE A MANEJAR · CDMX', M + 18, y + 13);
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
    const esPreReserva = data.status === 'pre_reserva';
    doc.setTextColor(...INK); doc.setFont('helvetica', 'bold'); doc.setFontSize(28);
    doc.text(esPreReserva ? 'FICHA DE' : 'FICHA DE', M, y);
    doc.text(esPreReserva ? 'PRE-RESERVA' : 'INSCRIPCIÓN', M, y + 9);
    doc.setFont('helvetica', 'italic'); doc.setFontSize(10); doc.setTextColor(...MUTED);
    doc.text(
      esPreReserva ? 'Aparta tu lugar con $690 para confirmar fechas' : 'Documento oficial de registro',
      W - M, y + 6, { align: 'right' }
    );
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
    const field = (label: string, value: string, x: number, w: number) => {
      doc.setTextColor(...MUTED); doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
      doc.text(label, x, y);
      doc.setTextColor(...INK); doc.setFont(value ? 'courier' : 'helvetica', 'normal');
      doc.setFontSize(value ? 10 : 9);
      doc.text(value || '—', x, y + 5);
      doc.setDrawColor(...DASH_GRAY); doc.setLineDashPattern([0.5, 0.5], 0);
      doc.line(x, y + 6, x + w, y + 6); doc.setLineDashPattern([], 0);
    };
    section('01', 'Datos del alumno');
    doc.setTextColor(...MUTED); doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
    doc.text('NOMBRE', M, y);
    doc.setTextColor(...INK); doc.setFont('helvetica', 'normal'); doc.setFontSize(11);
    doc.text(data.nombre, M, y + 5);
    doc.setDrawColor(...DASH_GRAY); doc.setLineDashPattern([0.5, 0.5], 0);
    doc.line(M, y + 6, W - M, y + 6); doc.setLineDashPattern([], 0);
    y += 12;
    const colW = (W - 2 * M - 8) / 2;
    const displayPhone = data.telefono.startsWith('52') && data.telefono.length === 12
      ? data.telefono.slice(2) : data.telefono;
    field('TELÉFONO', displayPhone, M, colW);
    field('EMAIL  (opcional)', '', M + colW + 8, colW);
    y += 12;
    doc.setTextColor(...MUTED); doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
    doc.text('DIRECCIÓN / PUNTO DE ENCUENTRO', M, y);
    if (data.zona) {
      doc.setTextColor(...INK); doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
      const zonaLines = doc.splitTextToSize(data.zona, W - 2 * M);
      doc.text(zonaLines, M, y + 5);
    }
    doc.setDrawColor(...DASH_GRAY); doc.setLineDashPattern([0.5, 0.5], 0);
    doc.line(M, y + 6, W - M, y + 6);
    doc.line(M, y + 11, W - M, y + 11);
    doc.setLineDashPattern([], 0);
    y += 16;
    section('02', 'Curso elegido');
    const cursoLabel = data.curso ?? data.transmision;
    const txLabel =
      cursoLabel === 'Estándar'   ? 'ESTÁNDAR 10H'   :
      cursoLabel === 'Automático' ? 'AUTOMÁTICO 10H' :
      cursoLabel.toUpperCase();
    const firstFecha = data.fechas[0];
    const firstDateStr = firstFecha ? fmtDate(firstFecha.date).toUpperCase() : '—';
    const firstTimeStr = firstFecha ? fmtTime(firstFecha.time) : '—';
    doc.setFillColor(...BLUE); doc.rect(M, y, W - 2 * M, 20, 'F');
    doc.setTextColor(...WHITE); doc.setFont('helvetica', 'bold'); doc.setFontSize(15);
    doc.text(txLabel, M + 5, y + 8);
    doc.setFont('courier', 'normal'); doc.setFontSize(8); doc.setTextColor(180, 200, 240);
    const subtitleCurso = esPreReserva && data.fechas.length === 0
      ? 'Fechas por confirmar  ·  Apartado $690'
      : `Inicio: ${firstDateStr}  ·  ${firstTimeStr}  ·  ${data.fechas.length} sesiones`;
    doc.text(subtitleCurso, M + 5, y + 15);
    y += 26;
    section('03', 'Fechas y horarios');
    doc.setFont('courier', 'normal'); doc.setFontSize(9);
    if (esPreReserva && data.fechas.length === 0) {
      // Pre-reserva sin fechas asignadas aún
      doc.setFillColor(235, 243, 255);
      doc.rect(M, y - 2, W - 2 * M, 14, 'F');
      doc.setFillColor(...BLUE); doc.rect(M, y - 2, 1, 14, 'F');
      doc.setTextColor(...BLUE); doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
      doc.text('Tus fechas se confirman al realizar el apartado de $690', M + 4, y + 4);
      doc.setTextColor(...MUTED); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
      doc.text('El instructor se asigna 24h antes de tu primera clase.', M + 4, y + 9);
      y += 18;
    } else {
      for (let i = 0; i < MAX_SESSIONS; i++) {
        if (y > H - 65) { doc.addPage(); y = 20; }
        const f = data.fechas[i];
        if (f) {
          doc.setTextColor(...INK);
          doc.text(`${i + 1}.  ${fmtDate(f.date)}  ·  ${fmtTime(f.time)}`, M, y);
        } else {
          doc.setTextColor(...MUTED);
          doc.text(`${i + 1}.`, M, y);
        }
        doc.setDrawColor(...DASH_GRAY); doc.setLineDashPattern([0.5, 0.5], 0);
        doc.line(M + 5, y + 1.5, W - M, y + 1.5); doc.setLineDashPattern([], 0);
        y += 7;
      }
    }
    y += 4;
    doc.setFillColor(...LIGHT_BLUE); doc.rect(M, y, W - 2 * M, 20, 'F');
    doc.setFillColor(...BLUE);       doc.rect(M, y, 1, 20, 'F');
    doc.setTextColor(...INK); doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
    doc.text('Al confirmar esta ficha, el alumno acepta los Términos y Condiciones de AEA:', M + 4, y + 5);
    doc.setTextColor(...BLUE); doc.setFont('courier', 'bold'); doc.setFontSize(8);
    doc.text('autoescuelaamericana.com/terminos', M + 4, y + 10);
    doc.setTextColor(...MUTED); doc.setFont('helvetica', 'italic'); doc.setFontSize(7.5);
    const termsText = 'El apartado garantiza el lugar y fecha de inicio. Cancelaciones con menos de 24 hrs de anticipación no son reembolsables. Documento generado electrónicamente.';
    doc.text(doc.splitTextToSize(termsText, W - 2 * M - 6), M + 4, y + 15);
    y += 26;
    doc.setDrawColor(...INK); doc.setLineWidth(0.4);
    doc.line(M, y, M + 70, y);
    doc.line(W - M - 70, y, W - M, y);
    doc.setFont('courier', 'normal'); doc.setFontSize(7); doc.setTextColor(...MUTED);
    doc.text('FIRMA DEL ALUMNO', M, y + 4);
    doc.text('ASESOR / SELLO AEA', W - M, y + 4, { align: 'right' });
    const fy = H - 14;
    doc.setDrawColor(...INK); doc.setLineWidth(0.4); doc.line(M, fy, W - M, fy);
    doc.setFont('courier', 'normal'); doc.setFontSize(8); doc.setTextColor(...MUTED);
    doc.text('Torreón 49, Roma Sur, CDMX · 56 3443 3212', M, fy + 5);
    doc.setTextColor(...BLUE); doc.setFont('courier', 'bold');
    doc.text('app.autoescuelaamericana.com', W - M, fy + 5, { align: 'right' });

    const blob = doc.output('blob');
    const filename = `${folio}-${data.nombre.replace(/\s+/g, '_')}.pdf`;
    return { blob, folio, filename };
  }

  async function handleSendWA() {
    setWaStatus('loading');
    try {
      const { blob, filename } = await buildPdfBlob();
      const arrayBuffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      const pdfBase64 = btoa(binary);
      const isPreReserva = data.status === 'pre_reserva';
      const res = await fetch('/api/ficha/send-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: data.telefono,
          pdfBase64,
          filename,
          caption: isPreReserva
            ? '📋 Tu ficha de pre-reserva — Auto Escuela Americana\n\nAparta tu lugar con $690 y te asignamos fechas de inmediato 🚗'
            : '📋 Tu ficha de inscripción — Auto Escuela Americana\n\nGuárdala, ahí están tus clases y datos.',
        }),
      });
      const json = await res.json();
      setWaStatus(json.ok ? 'ok' : 'error');
    } catch {
      setWaStatus('error');
    }
  }

  const btnBase = "text-xs px-3 py-1.5 rounded-lg font-medium transition-all disabled:opacity-50";

  const waStyle =
    waStatus === 'ok'    ? { background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.25)' } :
    waStatus === 'error' ? { background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' } :
    { background: 'linear-gradient(135deg, #15803d, #16a34a)', color: 'white' };

  const calStyle =
    calStatus === 'ok'    ? { background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.25)' } :
    calStatus === 'error' ? { background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' } :
    { background: 'rgba(148,163,184,0.1)', color: '#64748b', border: '1px solid rgba(148,163,184,0.15)' };

  return (
    <div className="flex gap-2 items-center shrink-0 flex-wrap">
      <button
        onClick={handleDownload}
        className={btnBase}
        style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)', color: 'white' }}
      >
        📄 Ver Ficha
      </button>
      <button
        onClick={handleSendWA}
        disabled={waStatus === 'loading'}
        title="Enviar ficha PDF por WhatsApp al lead"
        className={btnBase}
        style={waStyle}
      >
        {waStatus === 'loading' ? '⏳' : waStatus === 'ok' ? '✅ Enviado' : waStatus === 'error' ? '⚠️ Error' : '📤 Enviar WA'}
      </button>
      <button
        onClick={syncCalendar}
        disabled={calStatus === 'loading'}
        title="Crear/sincronizar clases en Google Calendar"
        className={btnBase}
        style={calStyle}
      >
        {calStatus === 'loading'
          ? '⏳'
          : calStatus === 'ok'
          ? `✅ ${calMsg}`
          : calStatus === 'error'
          ? `⚠️ ${calMsg}`
          : '📅 Calendar'}
      </button>
    </div>
  );
}
