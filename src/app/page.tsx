'use client';

import React from 'react';
import { Car, Globe, Lightbulb, BookOpen, Star, MapPin, FileText, Bike, CalendarCheck, List } from 'lucide-react';
import Link from 'next/link';
import { JsonLd } from '@/components/json-ld';

const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': 'DrivingSchool',
  name: 'Auto Escuela Americana',
  description: 'Escuela de manejo en CDMX con instructores certificados. Clases personalizadas 1 a 1 en Roma Sur y a domicilio en toda la ciudad.',
  url: 'https://www.autoescuelaamericana.com',
  telephone: '+525634433212',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Torreón #49',
    addressLocality: 'Roma Sur',
    addressRegion: 'Ciudad de México',
    addressCountry: 'MX',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: '19.4140064',
    longitude: '-99.1663567',
  },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],
      opens: '07:00',
      closes: '21:00',
    },
  ],
  priceRange: '$$',
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    reviewCount: '220',
    bestRating: '5',
    worstRating: '1',
  },
  sameAs: ['https://www.google.com/maps?cid=2053648174540417035'],
};

const CARD: React.CSSProperties = {
  background: 'linear-gradient(145deg, rgba(30,41,59,0.85), rgba(15,23,42,0.95))',
  border: '1px solid rgba(148,163,184,0.1)',
  boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset',
};

const courseCards = [
  {
    icon: CalendarCheck,
    title: 'Agenda tu Curso',
    desc: 'Selecciona fechas y reserva tu lugar en minutos.',
    href: '/agenda',
    label: 'Ir a la Agenda',
    accent: '#3b82f6',
    internal: true,
  },
  {
    icon: Lightbulb,
    title: 'Evalúa tus Habilidades',
    desc: 'Descubre qué curso es el ideal para ti.',
    href: '/evaluacion',
    label: 'Empezar Evaluación',
    accent: '#f59e0b',
    internal: true,
  },
  {
    icon: FileText,
    title: 'Examen Teórico',
    desc: 'Pon a prueba tus conocimientos del reglamento.',
    href: '/examen-teorico',
    label: 'Iniciar Examen',
    accent: '#8b5cf6',
    internal: true,
  },
  {
    icon: List,
    title: 'Catálogo de Cursos',
    desc: 'Explora todos los cursos que ofrecemos.',
    href: 'https://autoescuelaamericana.com/cursos',
    label: 'Ver Catálogo',
    accent: '#10b981',
    internal: false,
  },
  {
    icon: BookOpen,
    title: 'Programa del Curso',
    desc: 'Consulta el manual de conducción completo.',
    href: 'https://autoescuelaamericana.com/programa',
    label: 'Ver Programa',
    accent: '#14b8a6',
    internal: false,
  },
  {
    icon: Globe,
    title: 'English Course',
    desc: 'Comprehensive driving course for English speakers.',
    href: 'https://autoescuelaamericana.com/english',
    label: 'View Course',
    accent: '#60a5fa',
    internal: false,
  },
];

const testimonials = [
  {
    text: '"¡Excelente servicio! El instructor fue súper paciente y profesional. Aprendí muchísimo y ahora me siento con total confianza para manejar en la ciudad."',
    author: 'Sofía H.',
  },
  {
    text: '"Recomendado al 100%. Me daba pánico manejar en Periférico, pero con las técnicas que me enseñaron, ahora lo hago sin problema. ¡Gracias!"',
    author: 'Carlos M.',
  },
  {
    text: '"Tomé el curso en inglés y fue una maravilla. El instructor hablaba perfecto y me ayudó a entender todas las reglas de tránsito de México."',
    author: 'John S.',
  },
];

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(160deg, #0c111d 0%, #111827 60%, #0f172a 100%)' }}>
      <JsonLd data={localBusinessSchema} />

      {/* Header */}
      <header className="text-center px-4 pt-12 pb-8">
        {/* Logo circular */}
        <div className="relative mx-auto w-44 h-44 rounded-full flex flex-col items-center justify-center mb-8"
          style={{
            background: 'linear-gradient(135deg, #004aad, #003580)',
            boxShadow: '0 0 0 4px rgba(59,130,246,0.15), 0 20px 40px rgba(0,74,173,0.35)',
            border: '2px solid rgba(59,130,246,0.3)',
          }}>
          <div className="absolute inset-0 rounded-full opacity-10"
            style={{ background: 'linear-gradient(135deg, white, transparent)' }} />
          <div className="flex items-center gap-3 mb-1 z-10">
            <Bike className="w-7 h-7 text-black" fill="currentColor" />
            <div className="text-center">
              <p className="text-white font-black text-base leading-none tracking-tight">AUTO</p>
              <p className="text-white font-black text-base leading-none tracking-tight">ESCUELA</p>
              <p className="text-white font-black text-base leading-none tracking-tight">AMERICANA</p>
            </div>
            <Car className="w-7 h-7 text-black" fill="currentColor" />
          </div>
          <div className="w-2/3 h-0.5 rounded-full my-1.5 z-10" style={{ background: '#22d3ee' }} />
          <div className="text-center z-10">
            <p className="font-bold text-[9px] tracking-wider" style={{ color: '#fbbf24' }}>CAPACITACIÓN INICIAL Y</p>
            <p className="font-bold text-[9px] tracking-wider" style={{ color: '#fbbf24' }}>ESPECIALIZADA</p>
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-2">
          Auto Escuela Americana
        </h1>
        <p className="text-base mb-6 max-w-sm mx-auto" style={{ color: '#64748b' }}>
          Tu camino hacia la confianza al volante comienza aquí.
        </p>
        <Link href="/agenda"
          className="inline-block px-8 py-3 rounded-xl font-semibold text-white transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)', boxShadow: '0 4px 20px rgba(37,99,235,0.35)' }}>
          Agendar Curso
        </Link>
      </header>

      {/* Cards de módulos */}
      <section className="px-4 pb-8 max-w-2xl mx-auto w-full">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {courseCards.map(({ icon: Icon, title, desc, href, label, accent, internal }) => {
            const content = (
              <div className="rounded-2xl p-4 flex flex-col gap-3 h-full transition-transform active:scale-95" style={CARD}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}>
                  <Icon className="w-5 h-5" style={{ color: accent }} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm leading-tight text-white">{title}</p>
                  <p className="text-xs mt-1 leading-snug" style={{ color: '#475569' }}>{desc}</p>
                </div>
                <span className="text-xs font-semibold" style={{ color: accent }}>{label} →</span>
              </div>
            );
            return internal ? (
              <Link key={href} href={href} className="flex">{content}</Link>
            ) : (
              <a key={href} href={href} className="flex" target="_blank" rel="noopener noreferrer">{content}</a>
            );
          })}
        </div>
      </section>

      {/* Mapa */}
      <section className="px-4 pb-8 max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-4 h-4" style={{ color: '#3b82f6' }} />
          <h2 className="text-base font-bold text-white">Dónde Encontrarnos</h2>
        </div>
        <a
          href="https://www.google.com/maps/search/?api=1&query=Torreón+49,+Roma+Sur,+Cuauhtémoc,+06700+Ciudad+de+México,+CDMX"
          target="_blank"
          rel="noopener noreferrer"
          className="block text-sm mb-3"
          style={{ color: '#60a5fa' }}
        >
          Torreón #49, Roma Sur, Cuauhtémoc, CDMX
        </a>
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(148,163,184,0.1)' }}>
          <div className="aspect-video w-full">
            <iframe
              className="w-full h-full"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3762.9649175317183!2d-99.1663567!3d19.4140064!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85d1ff3b16555555%3A0x1c80842f1f13380b!2sAuto%20Escuela%20Americana!5e0!3m2!1ses-419!2smx"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Ubicación de Auto Escuela Americana en Torreón #49, Roma Sur, CDMX"
            />
          </div>
        </div>
      </section>

      {/* Testimonios */}
      <section className="px-4 pb-8 max-w-2xl mx-auto w-full">
        <h2 className="text-base font-bold text-white mb-4">Lo que dicen nuestros alumnos</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          {testimonials.map(({ text, author }) => (
            <div key={author} className="rounded-2xl p-4" style={CARD}>
              <div className="flex gap-0.5 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-current" style={{ color: '#fbbf24' }} />
                ))}
              </div>
              <p className="text-xs leading-relaxed mb-3" style={{ color: '#64748b' }}>{text}</p>
              <p className="text-xs font-bold text-white">{author}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-4">
          <a
            href="https://www.google.com/search?q=Auto+Escuela+Americana&ludocid=2053648174540417035#lrd=0x85d1ff3b16555555:0x1c80842f1f13380b,1"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium"
            style={{ color: '#60a5fa' }}
          >
            Leer más reseñas en Google →
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto px-4 py-6 text-center"
        style={{ borderTop: '1px solid rgba(148,163,184,0.07)' }}>
        <p className="text-xs" style={{ color: '#334155' }}>
          © {new Date().getFullYear()} Auto Escuela Americana · CDMX
        </p>
      </footer>
    </main>
  );
}
