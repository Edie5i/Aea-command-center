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
        // Un "0 eventos" seco parecía un fallo e invitaba a volver a hacer clic,
        // que es justo como se llenó el calendario de duplicados.
        setCalMsg(
          json.created === 0 && json.omitidos > 0
            ? 'ya estaban'
            : `${json.created} evento${json.created !== 1 ? 's' : ''}` +
              (json.omitidos > 0 ? ` (+${json.omitidos} ya estaban)` : '')
        );
      } else {
        setCalStatus('error');
        setCalMsg(json.error ?? 'Error');
      }
    } catch {
      setCalStatus('error');
      setCalMsg('Sin conexión');
    }
  }

  async function handleDownload() {
    const fechasIncompletas = data.fechas.filter(f => !f.date || !f.time);
    if (fechasIncompletas.length > 0) {
      alert(`⚠️ ${fechasIncompletas.length} sesión(es) sin fecha u horario completo. Corrige los datos antes de generar la ficha.`);
      return;
    }
    // La pestaña se abre ANTES de generar el PDF. Si se abre después del await
    // —jsPDF y date-fns se cargan dinámicamente— el navegador ya perdió el
    // gesto del usuario, bloquea el popup y la ficha se quedaba en una pestaña
    // en blanco con una URL blob: que no abría nada.
    const ventana = window.open('', '_blank');

    const { blob, filename } = await buildPdfBlob();
    // Se fuerza el tipo: sin él, el visor del navegador no reconoce el PDF.
    const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));

    if (ventana && !ventana.closed) {
      ventana.location.href = url;
    } else {
      // Popup bloqueado: al menos que se la pueda descargar.
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
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
