'use client';

import { useState } from 'react';

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

function LinkRow({ url, label }: { url: string; label: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-gray-100 last:border-0">
      <div className="min-w-0">
        <p className="text-xs text-gray-500 mb-0.5">{label}</p>
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline break-all">
          {url}
        </a>
      </div>
      <button
        onClick={copy}
        className="shrink-0 text-xs px-3 py-1 rounded border border-gray-300 hover:bg-gray-100 transition-colors"
      >
        {copied ? '✓' : 'Copiar'}
      </button>
    </div>
  );
}

export default function LinksPage() {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Links del equipo</h1>

      {/* Botón principal */}
      <a
        href="https://app.autoescuelaamericana.com/ficha"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between w-full bg-[#004aad] hover:bg-blue-700 text-white rounded-2xl px-6 py-5 mb-6 transition-colors group"
      >
        <div>
          <p className="text-xs text-blue-200 mb-0.5">Sistema interno</p>
          <p className="text-lg font-bold">Generador de Fichas</p>
          <p className="text-sm text-blue-200 mt-0.5">app.autoescuelaamericana.com/ficha</p>
        </div>
        <span className="text-3xl group-hover:translate-x-1 transition-transform">→</span>
      </a>

      <div className="space-y-6">
        {SECTIONS.map((section) => (
          <div key={section.title} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h2 className="font-semibold text-sm text-gray-700">{section.title}</h2>
            </div>
            <div className="px-4 py-1">
              {section.links.map((link) => (
                <LinkRow key={link.url} {...link} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
