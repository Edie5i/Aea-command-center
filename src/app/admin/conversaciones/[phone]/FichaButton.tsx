'use client';

import type { InscripcionData } from '@/lib/firestore';
import { format, parse } from 'date-fns';
import { es } from 'date-fns/locale';

// AEA brand colors
const BLUE  = [0, 74, 173]   as const;
const INK   = [20, 24, 31]   as const;
const MUTED = [107, 99, 87]  as const;
const WHITE = [255, 255, 255] as const;
const LIGHT_BLUE = [235, 243, 255] as const;

export default function FichaButton({ data }: { data: InscripcionData }) {
  async function handleDownload() {
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

    const fmtDate = (dateStr: string) =>
      format(new Date(dateStr + 'T12:00:00'), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });

    const fmtTime = (timeStr: string) =>
      format(parse(timeStr, 'HH:mm', new Date()), 'h:mm a');

    // ── Banda azul superior ──────────────────────────────────────
    doc.setFillColor(...BLUE); doc.rect(0, 0, W, 5, 'F');

    // ── Header ──────────────────────────────────────────────────
    let y = M + 4;

    // Brand mark — cuadro azul con "A"
    doc.setFillColor(...BLUE); doc.rect(M, y, 14, 14, 'F');
    doc.setTextColor(...WHITE); doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
    doc.text('A', M + 7, y + 9.5, { align: 'center' });

    // Nombre de la escuela
    doc.setTextColor(...INK); doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
    doc.text('AUTO ESCUELA', M + 18, y + 5);
    doc.text('AMERICANA', M + 18, y + 9.5);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...MUTED);
    doc.text('APRENDE A MANEJAR · CDMX', M + 18, y + 13);

    // Folio y fecha (derecha)
    doc.setFontSize(7); doc.setTextColor(...BLUE); doc.setFont('helvetica', 'bold');
    doc.text('FOLIO', W - M, y + 3, { align: 'right' });
    doc.setTextColor(...INK); doc.setFont('courier', 'normal'); doc.setFontSize(9);
    doc.text(folio, W - M, y + 7, { align: 'right' });
    doc.setFontSize(7); doc.setTextColor(...BLUE); doc.setFont('helvetica', 'bold');
    doc.text('FECHA', W - M, y + 12, { align: 'right' });
    doc.setTextColor(...INK); doc.setFont('courier', 'normal'); doc.setFontSize(9);
    doc.text(fechaEmision, W - M, y + 16, { align: 'right' });

    // Línea divisora
    y += 20;
    doc.setDrawColor(...INK); doc.setLineWidth(0.6); doc.line(M, y, W - M, y);

    // ── Título ──────────────────────────────────────────────────
    y += 10;
    doc.setTextColor(...INK); doc.setFont('helvetica', 'bold'); doc.setFontSize(28);
    doc.text('FICHA DE', M, y);
    doc.text('INSCRIPCIÓN', M, y + 9);
    doc.setFont('helvetica', 'italic'); doc.setFontSize(10); doc.setTextColor(...MUTED);
    doc.text('Documento oficial de registro', W - M, y + 6, { align: 'right' });
    y += 22;

    // Helper: encabezado de sección
    const section = (num: string, title: string) => {
      doc.setFillColor(...BLUE);
      doc.rect(M, y - 3, 7, 4.5, 'F');
      doc.setTextColor(...WHITE); doc.setFont('helvetica', 'bold'); doc.setFontSize(7);
      doc.text(num, M + 3.5, y + 0.2, { align: 'center' });
      doc.setTextColor(...INK); doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
      doc.text(title.toUpperCase(), M + 10, y);
      doc.setDrawColor(...BLUE); doc.setLineWidth(0.3);
      const end = M + 10 + doc.getTextWidth(title.toUpperCase()) + 3;
      doc.line(end, y - 0.5, W - M, y - 0.5);
      y += 6;
    };

    // ── Sección 01 — Alumno ─────────────────────────────────────
    section('01', 'Datos del alumno');

    doc.setTextColor(...MUTED); doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
    doc.text('NOMBRE', M, y);
    doc.setTextColor(...INK); doc.setFont('helvetica', 'normal'); doc.setFontSize(11);
    doc.text(data.nombre, M, y + 5);
    doc.setDrawColor(180, 180, 180); doc.setLineDashPattern([0.5, 0.5], 0);
    doc.line(M, y + 6, W - M, y + 6); doc.setLineDashPattern([], 0);
    y += 12;

    doc.setTextColor(...MUTED); doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
    doc.text('TELÉFONO', M, y);
    doc.text('PUNTO DE ENCUENTRO', W / 2, y);
    doc.setTextColor(...INK); doc.setFont('courier', 'normal'); doc.setFontSize(10);
    // Show phone without country code prefix for readability
    const displayPhone = data.telefono.startsWith('52') && data.telefono.length === 12
      ? data.telefono.slice(2)
      : data.telefono;
    doc.text(displayPhone, M, y + 5);
    const zonaShort = doc.splitTextToSize(data.zona, W / 2 - 4)[0] ?? '';
    doc.text(zonaShort, W / 2, y + 5);
    doc.setDrawColor(180, 180, 180); doc.setLineDashPattern([0.5, 0.5], 0);
    doc.line(M, y + 6, W / 2 - 4, y + 6);
    doc.line(W / 2, y + 6, W - M, y + 6);
    doc.setLineDashPattern([], 0);
    y += 14;

    // ── Sección 02 — Curso (card azul) ──────────────────────────
    section('02', 'Curso elegido');

    const txLabel =
      data.transmision === 'Estándar' ? 'ESTÁNDAR 10H' :
      data.transmision === 'Automático' ? 'AUTOMÁTICO 10H' :
      data.transmision.toUpperCase();

    const firstFecha = data.fechas[0];
    const firstDateStr = firstFecha ? fmtDate(firstFecha.date).toUpperCase() : '—';
    const firstTimeStr = firstFecha ? fmtTime(firstFecha.time) : '—';

    doc.setFillColor(...BLUE); doc.rect(M, y, W - 2 * M, 22, 'F');
    doc.setTextColor(...WHITE); doc.setFont('helvetica', 'bold'); doc.setFontSize(15);
    doc.text(txLabel, M + 5, y + 9);
    doc.setFont('courier', 'normal'); doc.setFontSize(8);
    doc.setTextColor(180, 200, 240);
    doc.text(
      `${firstDateStr}  ·  ${firstTimeStr}  ·  ${data.fechas.length} SESIONES`,
      M + 5, y + 16
    );
    y += 28;

    // ── Sección 03 — Fechas ─────────────────────────────────────
    section('03', 'Fechas y horarios');

    doc.setFont('courier', 'normal'); doc.setFontSize(9); doc.setTextColor(...INK);
    data.fechas.forEach((f) => {
      if (y > H - 65) { doc.addPage(); y = 20; }
      doc.text(`•  ${fmtDate(f.date)}  ·  ${fmtTime(f.time)}`, M, y);
      doc.setDrawColor(180, 180, 180); doc.setLineDashPattern([0.5, 0.5], 0);
      doc.line(M, y + 1.5, W - M, y + 1.5); doc.setLineDashPattern([], 0);
      y += 6;
    });

    y += 6;

    // ── Términos ────────────────────────────────────────────────
    doc.setFillColor(...LIGHT_BLUE); doc.rect(M, y, W - 2 * M, 16, 'F');
    doc.setFillColor(...BLUE);       doc.rect(M, y, 1, 16, 'F');
    doc.setTextColor(...MUTED); doc.setFont('helvetica', 'italic'); doc.setFontSize(8);
    const termsText =
      'El apartado garantiza el lugar y fecha de inicio. El alumno se compromete a cubrir el ' +
      'saldo restante en máximo 3 mensualidades sin intereses. Cancelaciones con menos de 24 hrs ' +
      'de anticipación no son reembolsables.';
    doc.text(doc.splitTextToSize(termsText, W - 2 * M - 6), M + 4, y + 4.5);
    y += 22;

    // ── Firmas ──────────────────────────────────────────────────
    doc.setDrawColor(...INK); doc.setLineWidth(0.4);
    doc.line(M, y, M + 70, y);
    doc.line(W - M - 70, y, W - M, y);
    doc.setFont('courier', 'normal'); doc.setFontSize(7); doc.setTextColor(...MUTED);
    doc.text('FIRMA DEL ALUMNO', M, y + 4);
    doc.text('ASESOR / SELLO AEA', W - M, y + 4, { align: 'right' });

    // ── Footer ──────────────────────────────────────────────────
    const fy = H - 14;
    doc.setDrawColor(...INK); doc.setLineWidth(0.4); doc.line(M, fy, W - M, fy);
    doc.setFont('courier', 'normal'); doc.setFontSize(8); doc.setTextColor(...MUTED);
    doc.text('Torreón 49, Roma Sur, CDMX · 56 3443 3212', M, fy + 5);
    doc.setTextColor(...BLUE); doc.setFont('courier', 'bold');
    doc.text('app.autoescuelaamericana.com', W - M, fy + 5, { align: 'right' });

    doc.save(`${folio}-${data.nombre.replace(/\s+/g, '_')}.pdf`);
  }

  return (
    <button
      onClick={handleDownload}
      className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors"
    >
      ↓ Ficha PDF
    </button>
  );
}
