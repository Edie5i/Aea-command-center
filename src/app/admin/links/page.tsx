'use client';

import { useState } from 'react';
import Link from 'next/link';

const SECTIONS = [
  {
    title: 'Admin',
    links: [
      { label: 'Panel principal', url: 'https://app.autoescuelaamericana.com/admin' },
      { label: 'Fichas', url: 'https://app.autoescuelaamericana.com/admin/fichas' },
      { label: 'Alumnos', url: 'https://app.autoescuelaamericana.com/admin/alumnos' },
      { label: 'Conversaciones', url: 'https://app.autoescuelaamericana.com/admin/conversaciones' },
      { label: 'Instructores', url: 'https://app.autoescuelaamericana.com/admin/instructores' },
    ],
  },
  {
    title: 'Para alumnos',
    links: [
      { label: 'Agendar clases', url: 'https://app.autoescuelaamericana.com/agenda' },
      { label: 'Registro', url: 'https://app.autoescuelaamericana.com/registro' },
      { label: 'Evaluación', url: 'https://app.autoescuelaamericana.com/evaluacion' },
      { label: 'Examen teórico', url: 'https://app.autoescuelaamericana.com/examen-teorico' },
      { label: 'Notas de alumno', url: 'https://app.autoescuelaamericana.com/notas-alumno' },
      { label: 'Chatbot Luz', url: 'https://app.autoescuelaamericana.com/chatbot' },
    ],
  },
  {
    title: 'Para ventas / leads',
    links: [
      { label: 'Catálogo de cursos', url: 'https://www.autoescuelaamericana.com/cursos' },
      { label: 'Programa del curso', url: 'https://www.autoescuelaamericana.com/programa' },
      { label: 'English course', url: 'https://www.autoescuelaamericana.com/english' },
      { label: 'Blog', url: 'https://www.autoescuelaamericana.com/blog' },
      { label: 'Inicio', url: 'https://www.autoescuelaamericana.com' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Términos y condiciones', url: 'https://www.autoescuelaamericana.com/terminos' },
      { label: 'Aviso de privacidad', url: 'https://www.autoescuelaamericana.com/aviso-privacidad' },
    ],
  },
];

const CARD: React.CSSProperties = {
  background: 'linear-gradient(145deg, rgba(30,41,59,0.9), rgba(15,23,42,0.95))',
  border: '1px solid rgba(148,163,184,0.1)',
};

function LinkRow({ url, label }: { url: string; label: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex items-center justify-between gap-3 py-2.5"
      style={{ borderBottom: '1px solid rgba(148,163,184,0.06)' }}>
      <div className="min-w-0 flex-1">
        <p className="text-xs mb-0.5" style={{ color: '#475569' }}>{label}</p>
        <a href={url} target="_blank" rel="noopener noreferrer"
          className="text-xs break-all transition-colors hover:underline"
          style={{ color: '#60a5fa' }}>
          {url}
        </a>
      </div>
      <button
        onClick={copy}
        className="shrink-0 text-xs px-3 py-1 rounded-lg font-semibold transition-all"
        style={copied
          ? { background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.25)' }
          : { background: 'rgba(148,163,184,0.08)', color: '#64748b', border: '1px solid rgba(148,163,184,0.12)' }}>
        {copied ? '✓' : 'Copiar'}
      </button>
    </div>
  );
}

export default function LinksPage() {
  return (
    <main className="min-h-screen"
      style={{ background: 'linear-gradient(160deg, #0c111d 0%, #111827 60%, #0f172a 100%)' }}>

      {/* Header */}
      <header className="sticky top-0 z-10 px-4 py-3 flex items-center gap-3"
        style={{ background: 'linear-gradient(180deg, #0f172a 0%, #111827 100%)', borderBottom: '1px solid rgba(148,163,184,0.08)', backdropFilter: 'blur(8px)' }}>
        <Link href="/admin" className="text-sm transition-colors" style={{ color: '#475569' }}>← Admin</Link>
        <h1 className="text-base font-bold text-white">Links del equipo</h1>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-4">

        {/* Hero button */}
        <a
          href="https://app.autoescuelaamericana.com/ficha"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between w-full rounded-2xl px-6 py-5 group transition-all"
          style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)', boxShadow: '0 4px 20px rgba(37,99,235,0.25)' }}>
          <div>
            <p className="text-xs mb-0.5" style={{ color: 'rgba(147,197,253,0.8)' }}>Sistema interno</p>
            <p className="text-lg font-bold text-white">Generador de Fichas</p>
            <p className="text-sm mt-0.5" style={{ color: 'rgba(147,197,253,0.7)' }}>app.autoescuelaamericana.com/ficha</p>
          </div>
          <span className="text-3xl text-white transition-transform group-hover:translate-x-1">→</span>
        </a>

        {/* Sections */}
        {SECTIONS.map((section) => (
          <div key={section.title} className="rounded-2xl overflow-hidden" style={CARD}>
            <div className="px-4 py-2.5"
              style={{ background: 'rgba(148,163,184,0.04)', borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
              <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#475569' }}>
                {section.title}
              </h2>
            </div>
            <div className="px-4 divide-y-0">
              {section.links.map((link) => (
                <LinkRow key={link.url} {...link} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
