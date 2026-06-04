'use client';

import { useState } from 'react';
import { format, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';

const CURSOS = [
  'Automático', 'Estándar', 'Mixto', 'Reforzamiento',
  'Avanzado', 'Intensivo', 'Inglés', 'Moto',
];

const HORAS = [
  '07:00','08:00','09:00','10:00','11:00','12:00',
  '13:00','14:00','15:00','16:00','17:00','18:00','19:00',
];

interface Sesion {
  date: string;
  time: string;
}

function fmtDate(d: string) {
  if (!d) return '—';
  return format(new Date(d + 'T12:00:00'), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es }).toUpperCase();
}

function fmtTime(t: string) {
  if (!t) return '—';
  return format(parse(t, 'HH:mm', new Date()), 'h:mm a');
}

export default function FichaForm() {
  const [nombre, setNombre]     = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail]       = useState('');
  const [direccion, setDireccion] = useState('');
  const [curso, setCurso]       = useState('Automático');
  const [sesiones, setSesiones] = useState<Sesion[]>([{ date: '', time: '' }]);
  const [apartado, setApartado] = useState('');
  const [total, setTotal]       = useState('');
  const [notas, setNotas]       = useState('');
  const [loading, setLoading]   = useState(false);

  function addSesion() {
    if (sesiones.length < 6) setSesiones((prev: Sesion[]) => [...prev, { date: '', time: '' }]);
  }

  function removeSesion(i: number) {
    setSesiones(sesiones.filter((_: Sesion, idx: number) => idx !== i));
  }

  function updateSesion(i: number, field: 'date' | 'time', value: string) {
    const next = [...sesiones];
    next[i] = { ...next[i], [field]: value };
    setSesiones(next);
  }

  async function handleGenerar() {
    if (!nombre.trim()) { alert('Ingresa el nombre del alumno.'); return; }
    if (!telefono.trim()) { alert('Ingresa el teléfono.'); return; }
    if (!direccion.trim()) { alert('Ingresa la dirección.'); return; }

    setLoading(true);
    try {
      const { default: jsPDF } = await import('jspdf');

      const BLUE       = [0, 74, 173]    as const;
      const INK        = [20, 24, 31]    as const;
      const MUTED      = [107, 99, 87]   as const;
      const WHITE      = [255, 255, 255] as const;
      const LIGHT_BLUE = [235, 243, 255] as const;
      const DASH_GRAY  = [180, 180, 180] as const;

      const doc = new jsPDF({ unit: 'mm', format: 'letter' });
      const W = 215.9, H = 279.4, M = 18;

      const now = Date.now();
      const folio = 'AEA-' + new Date(now).getFullYear() + '-' + now.toString().slice(-4);
      const fechaEmision = new Date(now)
        .toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
        .toUpperCase();

      // Banda azul
      doc.setFillColor(...BLUE); doc.rect(0, 0, W, 5, 'F');

      // Header
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

      // Título
      y += 10;
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

      const dashLine = (x1: number, x2: number) => {
        doc.setDrawColor(...DASH_GRAY); doc.setLineDashPattern([0.5, 0.5], 0);
        doc.line(x1, y, x2, y); doc.setLineDashPattern([], 0);
      };

      // Sección 01
      section('01', 'Datos del alumno');

      doc.setTextColor(...MUTED); doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
      doc.text('NOMBRE', M, y);
      doc.setTextColor(...INK); doc.setFont('helvetica', 'normal'); doc.setFontSize(11);
      doc.text(nombre, M, y + 5);
      dashLine(M, W - M); y += 12;

      const colW = (W - 2 * M - 8) / 2;
      const displayPhone = telefono.replace(/\D/g, '').replace(/^52/, '');

      doc.setTextColor(...MUTED); doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
      doc.text('TELÉFONO', M, y);
      doc.setTextColor(...INK); doc.setFont('courier', 'normal'); doc.setFontSize(10);
      doc.text(displayPhone, M, y + 5);
      dashLine(M, M + colW);

      doc.setTextColor(...MUTED); doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
      doc.text('EMAIL  (opcional)', M + colW + 8, y);
      doc.setTextColor(...INK); doc.setFont('courier', 'normal'); doc.setFontSize(10);
      doc.text(email || '—', M + colW + 8, y + 5);
      dashLine(M + colW + 8, W - M);
      y += 12;

      doc.setTextColor(...MUTED); doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
      doc.text('DIRECCIÓN / PUNTO DE ENCUENTRO', M, y);
      doc.setTextColor(...INK); doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
      const zonaLines = doc.splitTextToSize(direccion, W - 2 * M);
      doc.text(zonaLines, M, y + 5);
      dashLine(M, W - M);
      if (zonaLines.length > 1) { y += 5; dashLine(M, W - M); }
      y += 16;

      // Sección 02
      section('02', 'Curso elegido');

      const sesionesValidas = sesiones.filter((s: Sesion) => s.date && s.time);
      const firstS = sesionesValidas[0];
      doc.setFillColor(...BLUE); doc.rect(M, y, W - 2 * M, 20, 'F');
      doc.setTextColor(...WHITE); doc.setFont('helvetica', 'bold'); doc.setFontSize(15);
      doc.text(curso.toUpperCase() + (sesionesValidas.length > 0 ? ` · ${sesionesValidas.length} SES.` : ''), M + 5, y + 8);
      doc.setFont('courier', 'normal'); doc.setFontSize(8); doc.setTextColor([180, 200, 240] as any);
      doc.text(
        firstS
          ? `Inicio: ${fmtDate(firstS.date)}  ·  ${fmtTime(firstS.time)}  ·  A domicilio — CDMX`
          : 'Fechas por confirmar  ·  A domicilio — CDMX',
        M + 5, y + 15
      );
      y += 26;

      // Sección 03
      section('03', 'Fechas y horarios');
      doc.setFont('courier', 'normal'); doc.setFontSize(9);

      for (let i = 0; i < 6; i++) {
        if (y > H - 75) { doc.addPage(); y = 20; }
        const s = sesiones[i];
        if (s?.date && s?.time) {
          doc.setTextColor(...INK);
          doc.text(`${i + 1}.  ${fmtDate(s.date)}  ·  ${fmtTime(s.time)}`, M, y);
        } else {
          doc.setTextColor(...MUTED);
          doc.text(`${i + 1}.`, M, y);
        }
        dashLine(M + 5, W - M); y += 7;
      }
      y += 4;

      // Pagos
      const apt = apartado ? `$${Number(apartado).toLocaleString('es-MX')}` : '$0';
      const tot = total ? `$${Number(total).toLocaleString('es-MX')}` : '—';
      const saldo = (apartado && total)
        ? `$${(Number(total) - Number(apartado)).toLocaleString('es-MX')}`
        : tot;

      const tercio = (W - 2 * M) / 3;
      doc.setTextColor(...MUTED); doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
      doc.text('APARTADO PAGADO',     M,               y);
      doc.text('SALDO RESTANTE',      M + tercio,      y);
      doc.text('TOTAL DEL CURSO',     M + tercio * 2,  y);
      doc.setTextColor(...INK); doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
      doc.text(apt,  M,              y + 7);
      doc.text(saldo, M + tercio,    y + 7);
      doc.setTextColor(...BLUE);
      doc.text(tot,  M + tercio * 2, y + 7);
      y += 14;

      // Notas
      if (notas.trim()) {
        doc.setFillColor(...LIGHT_BLUE); doc.rect(M, y, W - 2 * M, 14, 'F');
        doc.setFillColor(...BLUE); doc.rect(M, y, 1, 14, 'F');
        doc.setTextColor(...MUTED); doc.setFont('helvetica', 'bold'); doc.setFontSize(7);
        doc.text('NOTA', M + 4, y + 5);
        doc.setTextColor(...INK); doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
        doc.text(doc.splitTextToSize(notas, W - 2 * M - 8), M + 4, y + 10);
        y += 18;
      }

      // Términos
      doc.setFillColor(...LIGHT_BLUE); doc.rect(M, y, W - 2 * M, 20, 'F');
      doc.setFillColor(...BLUE); doc.rect(M, y, 1, 20, 'F');
      doc.setTextColor(...INK); doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
      doc.text('Al confirmar esta ficha, el alumno acepta los Términos y Condiciones de AEA:', M + 4, y + 5);
      doc.setTextColor(...BLUE); doc.setFont('courier', 'bold'); doc.setFontSize(8);
      doc.text('app.autoescuelaamericana.com/terminos', M + 4, y + 10);
      doc.setTextColor(...MUTED); doc.setFont('helvetica', 'italic'); doc.setFontSize(7.5);
      doc.text(doc.splitTextToSize(
        'El apartado garantiza el lugar y fecha de inicio. Cancelaciones con menos de 24 hrs de anticipación no son reembolsables. Documento generado electrónicamente.',
        W - 2 * M - 6
      ), M + 4, y + 15);
      y += 26;

      // Firmas
      doc.setDrawColor(...INK); doc.setLineWidth(0.4);
      doc.line(M, y, M + 70, y);
      doc.line(W - M - 70, y, W - M, y);
      doc.setFont('courier', 'normal'); doc.setFontSize(7); doc.setTextColor(...MUTED);
      doc.text('FIRMA DEL ALUMNO', M, y + 4);
      doc.text('ASESOR / SELLO AEA', W - M, y + 4, { align: 'right' });

      // Footer
      const fy = H - 14;
      doc.setDrawColor(...INK); doc.setLineWidth(0.4); doc.line(M, fy, W - M, fy);
      doc.setFont('courier', 'normal'); doc.setFontSize(8); doc.setTextColor(...MUTED);
      doc.text('Torreón 49, Roma Sur, CDMX · 56 3443 3212', M, fy + 5);
      doc.setTextColor(...BLUE); doc.setFont('courier', 'bold');
      doc.text('app.autoescuelaamericana.com', W - M, fy + 5, { align: 'right' });

      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${folio}-${nombre.trim().replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-gray-400 hover:text-gray-700 text-xl">←</Link>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Nueva Ficha</h1>
            <p className="text-xs text-gray-400">Ficha de Inscripción · AEA</p>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4 max-w-lg mx-auto pb-10">

        {/* 01 Datos del alumno */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
          <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">01 · Datos del alumno</p>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 font-medium">Nombre completo *</label>
              <input value={nombre} onChange={e => setNombre(e.target.value)}
                placeholder="Nombre completo"
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 font-medium">Teléfono *</label>
                <input value={telefono} onChange={e => setTelefono(e.target.value)}
                  placeholder="55 1234 5678" type="tel"
                  className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Email (opcional)</label>
                <input value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="correo@email.com" type="email"
                  className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Dirección / Punto de encuentro *</label>
              <textarea value={direccion} onChange={e => setDireccion(e.target.value)}
                placeholder="Calle, número, colonia, alcaldía"
                rows={2}
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
          </div>
        </section>

        {/* 02 Curso */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
          <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">02 · Curso elegido</p>
          <div>
            <label className="text-xs text-gray-500 font-medium">Tipo de curso</label>
            <select value={curso} onChange={e => setCurso(e.target.value)}
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              {CURSOS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </section>

        {/* 03 Fechas */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
          <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">03 · Fechas y horarios</p>
          <div className="space-y-2">
            {sesiones.map((s: Sesion, i: number) => (
              <div key={i} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                <span className="text-xs text-gray-400 w-4 shrink-0">{i + 1}.</span>
                <input type="date" value={s.date} onChange={e => updateSesion(i, 'date', e.target.value)}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <select value={s.time} onChange={e => updateSesion(i, 'time', e.target.value)}
                  className="w-full sm:w-32 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="">Hora</option>
                  {HORAS.map(h => <option key={h} value={h}>{fmtTime(h)}</option>)}
                </select>
                {sesiones.length > 1 && (
                  <button onClick={() => removeSesion(i)} className="text-red-400 hover:text-red-600 text-lg leading-none shrink-0">×</button>
                )}
              </div>
            ))}
          </div>
          {sesiones.length < 6 && (
            <button onClick={addSesion}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold">
              + Agregar sesión
            </button>
          )}
        </section>

        {/* Pagos */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
          <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">Pago</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 font-medium">Apartado pagado ($)</label>
              <input value={apartado} onChange={e => setApartado(e.target.value)}
                placeholder="0" type="number" min="0"
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Total del curso ($)</label>
              <input value={total} onChange={e => setTotal(e.target.value)}
                placeholder="0" type="number" min="0"
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          {apartado && total && (
            <p className="text-xs text-gray-500">
              Saldo restante: <span className="font-bold text-gray-900">
                ${(Number(total) - Number(apartado)).toLocaleString('es-MX')}
              </span>
            </p>
          )}
        </section>

        {/* Notas */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-2">
          <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">Nota (opcional)</p>
          <textarea value={notas} onChange={e => setNotas(e.target.value)}
            placeholder="Observaciones, condiciones especiales, etc."
            rows={2}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        </section>

        {/* Botón generar */}
        <button
          onClick={handleGenerar}
          disabled={loading}
          className="w-full bg-blue-700 text-white font-bold text-base py-4 rounded-2xl hover:bg-blue-800 disabled:opacity-50 transition-colors shadow-sm"
        >
          {loading ? 'Generando PDF…' : '↓ Generar Ficha PDF'}
        </button>

      </div>
    </main>
  );
}
