'use client';

import { useState } from 'react';
import type { InscripcionData } from '@/lib/firestore';


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

  function handleDownload() {
    const fechasIncompletas = data.fechas.filter(f => !f.date || !f.time);
    if (fechasIncompletas.length > 0) {
      alert(`⚠️ ${fechasIncompletas.length} sesión(es) sin fecha u horario completo. Corrige los datos antes de generar la ficha.`);
      return;
    }
    // La ficha abre en HTML, no en PDF: se ve igual en cualquier teléfono, no
    // depende de un lector de archivos, y muestra el estado de HOY. Es la
    // misma página que recibe el alumno.
    window.open(`/api/ficha/abrir?phone=${encodeURIComponent(data.telefono)}`, '_blank');
  }

  async function handleSendWA() {
    setWaStatus('loading');
    try {
      // Solo el teléfono: el servidor arma el mensaje con lo que hay guardado.
      // Antes esta pantalla mandaba nombre, zona y fechas, y si llevaba horas
      // abierta le mandaba al alumno información vieja.
      const res = await fetch('/api/ficha/send-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: data.telefono }),
      });
      const json = await res.json();
      setWaStatus(json.ok ? 'ok' : 'error');
    } catch {
      setWaStatus('error');
    }
  }

  const btnBase = "text-xs px-3 py-1.5 rounded-lg font-medium transition-all disabled:opacity-50";

  const waStyle =
    waStatus === 'ok'    ? { background: 'rgba(52,211,153,0.15)', color: '#059669', border: '1px solid rgba(52,211,153,0.25)' } :
    waStatus === 'error' ? { background: 'rgba(239,68,68,0.15)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.25)' } :
    { background: 'linear-gradient(135deg, #15803d, #16a34a)', color: 'white' };

  const calStyle =
    calStatus === 'ok'    ? { background: 'rgba(52,211,153,0.15)', color: '#059669', border: '1px solid rgba(52,211,153,0.25)' } :
    calStatus === 'error' ? { background: 'rgba(239,68,68,0.15)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.25)' } :
    { background: 'rgba(148,163,184,0.25)', color: '#64748b', border: '1px solid rgba(148,163,184,0.3)' };

  return (
    <div className="flex gap-2 items-center shrink-0 flex-wrap">
      <button
        onClick={handleDownload}
        className={btnBase}
        style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)', color: 'white' }}
      >
        📋 Ver ficha
      </button>
      <button
        onClick={handleSendWA}
        disabled={waStatus === 'loading'}
        title="Mandarle al alumno el enlace de su ficha por WhatsApp"
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
