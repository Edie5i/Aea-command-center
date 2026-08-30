'use client';

import { Globe, Lightbulb, BookOpen, Star, MapPin, FileText, CalendarCheck, List, CheckCircle2, ShieldCheck } from 'lucide-react';
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

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col sm:p-6 md:p-8 font-sans selection:bg-blue-200">
      <JsonLd data={localBusinessSchema} />

      {/* Decorative Outer Background (Mesh / Aurora effect outside the frame) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] rounded-full bg-slate-300/40 blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] w-[50%] h-[70%] rounded-full bg-blue-200/50 blur-[120px]" />
        <div className="absolute -bottom-[10%] left-[20%] w-[60%] h-[60%] rounded-full bg-slate-400/20 blur-[120px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-200/50" />
      </div>

      {/* ENCUADERNADO / THE FRAME */}
      <main className="flex-1 w-full max-w-6xl mx-auto bg-white/70 backdrop-blur-3xl border border-white shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] sm:rounded-[2.5rem] overflow-hidden relative z-10 flex flex-col">
        
        {/* Top Gradient Banner inside the frame */}
        <div className="w-full bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400 text-white text-center py-2.5 px-4 text-xs font-bold tracking-wide shadow-sm flex items-center justify-center gap-2">
          <span className="animate-pulse">🔥</span> PROMOCIÓN ESPECIAL: APARTA TU LUGAR ESTA SEMANA DESDE $690 MXN
        </div>

        <div className="relative z-10 flex flex-col flex-1 pb-12 pt-8">
          {/* HERO */}
          <header className="text-center px-4 pt-4 pb-12 flex flex-col items-center max-w-3xl mx-auto">
            
            {/* Rating Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-slate-200 shadow-sm mb-10 hover:scale-105 transition-transform cursor-default">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="text-sm font-bold text-slate-800">4.8 en Google</span>
              <span className="text-sm text-slate-500 font-medium"> (220+ reseñas)</span>
            </div>

            {/* Logo Element */}
            <div className="relative mb-10 group">
              <div className="absolute inset-0 bg-blue-500/10 blur-2xl rounded-2xl group-hover:bg-blue-500/20 transition-all duration-700" />
              <div className="w-64 sm:w-72 md:w-80 h-auto bg-transparent relative z-10 hover:scale-105 transition-transform duration-700">
                <img src="/logo.jpg" alt="Logo Auto Escuela Americana" className="w-full h-auto object-contain drop-shadow-xl" />
              </div>
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tighter text-slate-800 mb-6 leading-[1.05]">
              Aprende a <br className="sm:hidden" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-500 via-slate-400 to-slate-600 drop-shadow-sm">
                manejar hoy.
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl mb-10 max-w-md mx-auto text-slate-500 font-medium leading-relaxed">
              Instructores pacientes, autos seguros y servicio a domicilio en CDMX.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full px-4 sm:px-0">
              <Link href="/agenda"
                className="group relative w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-white transition-all hover:scale-[1.02] active:scale-95 overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
                  boxShadow: '0 8px 25px -4px rgba(59, 130, 246, 0.4)'
                }}>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <CalendarCheck className="w-5 h-5 relative z-10" />
                <span className="relative z-10 text-base">Agendar Curso</span>
                <span className="relative z-10 bg-white/20 px-2 py-1 rounded text-xs ml-1 font-bold">Desde $690</span>
              </Link>
              <a href="https://autoescuelaamericana.com/cursos"
                className="w-full sm:w-auto text-center px-8 py-4 rounded-2xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-95 bg-white border border-slate-200 text-slate-700 shadow-sm hover:shadow-md">
                Ver paquetes y precios
              </a>
            </div>
          </header>

          {/* Módulos (Tarjetas Alargadas Modernas) */}
          <section className="px-4 pb-12 max-w-4xl mx-auto w-full relative z-10">
            <div className="flex flex-col gap-4">
              {courseCards.map(({ icon: Icon, title, desc, href, label, internal }) => {
                const content = (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6 rounded-[2rem] p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group bg-white/80 backdrop-blur-md border shadow-[0_4px_20px_-4px_rgba(148,163,184,0.3)] relative overflow-hidden"
                       style={{ borderImage: 'linear-gradient(to bottom right, #94a3b8, #64748b, #cbd5e1) 1' }}>
                    {/* Inner metallic glow for silver effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-100/40 via-transparent to-slate-200/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    
                    {/* Metallic border inside (optional but adds depth) */}
                    <div className="absolute inset-0 rounded-[2rem] border border-white/50 pointer-events-none" />
                    
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-300 relative z-10 shadow-inner">
                      <Icon className="w-7 h-7 text-blue-600" />
                    </div>
                    
                    <div className="flex-1 relative z-10">
                      <h3 className="font-black text-xl leading-tight text-slate-800 mb-1">{title}</h3>
                      <p className="text-sm leading-relaxed text-slate-500 font-medium">{desc}</p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto mt-2 sm:mt-0 relative z-10 pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                      <div className="flex items-center gap-1.5 text-sm font-bold text-slate-600 group-hover:text-blue-600 transition-colors bg-slate-50 sm:bg-transparent px-4 py-2 sm:p-0 rounded-xl border border-slate-200 sm:border-transparent">
                        {label} <span className="group-hover:translate-x-1 transition-transform">→</span>
                      </div>
                    </div>
                  </div>
                );
                return internal ? (
                  <Link key={href} href={href} className="flex flex-col">{content}</Link>
                ) : (
                  <a key={href} href={href} className="flex flex-col" target="_blank" rel="noopener noreferrer">{content}</a>
                );
              })}
            </div>
          </section>

          {/* Mapa y Reseñas */}
          <section className="px-4 pb-12 max-w-5xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
            {/* Columna Izquierda: Mapa y Value Props */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div className="rounded-[2rem] p-6 flex flex-col bg-white/80 backdrop-blur-md border shadow-[0_4px_20px_-4px_rgba(148,163,184,0.3)] relative overflow-hidden group hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                style={{ borderImage: 'linear-gradient(to bottom right, #94a3b8, #64748b, #cbd5e1) 1' }}>
                <div className="absolute inset-0 rounded-[2rem] border border-white/50 pointer-events-none" />
                
                <div className="flex items-center gap-4 mb-5 relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-300 flex items-center justify-center shadow-inner">
                    <MapPin className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-800 leading-tight">Dónde Encontrarnos</h2>
                    <a href="https://www.google.com/maps/search/?api=1&query=Torreón+49,+Roma+Sur,+Cuauhtémoc,+06700+Ciudad+de+México,+CDMX"
                      target="_blank" rel="noopener noreferrer"
                      className="text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors">
                      Torreón #49, Roma Sur, CDMX
                    </a>
                  </div>
                </div>
                
                <div className="rounded-2xl overflow-hidden flex-1 border border-slate-200 shadow-inner bg-slate-50 relative z-10 min-h-[250px] mb-5">
                  <iframe
                    className="w-full h-full min-h-[250px]"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3762.9649175317183!2d-99.1663567!3d19.4140064!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85d1ff3b16555555%3A0x1c80842f1f13380b!2sAuto%20Escuela%20Americana!5e0!3m2!1ses-419!2smx"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Ubicación Auto Escuela Americana"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm font-semibold text-slate-600 relative z-10 pt-2 border-t border-slate-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Instructores Certificados
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-500" />
                    Vehículos Asegurados
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    4.8/5 en Reseñas
                  </div>
                </div>
              </div>
            </div>

            {/* Columna Derecha: Tarjeta de Testimonio Modernizada */}
            <div className="lg:col-span-5 relative flex flex-col justify-center">
              {/* Glow de fondo */}
              <div className="absolute -top-6 -right-6 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-6 -left-6 w-72 h-72 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none" />

              <div className="relative rounded-[2rem] bg-white/80 backdrop-blur-xl border p-8 shadow-[0_8px_30px_-4px_rgba(148,163,184,0.4)] hover:shadow-[0_12px_40px_-4px_rgba(148,163,184,0.5)] transition-all duration-300 hover:-translate-y-1 h-full flex flex-col"
                style={{ borderImage: 'linear-gradient(to bottom right, #94a3b8, #64748b, #cbd5e1) 1' }}>
                <div className="absolute inset-0 rounded-[2rem] border border-white/50 pointer-events-none" />
                
                <div className="flex items-center justify-between mb-8 relative z-10">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-100 px-3 py-1 text-xs font-bold text-blue-600 shadow-sm">
                    <Star className="w-3.5 h-3.5 fill-blue-500" /> Reseña Destacada
                  </span>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>

                <p className="text-base sm:text-lg font-medium italic text-slate-700 mb-8 leading-relaxed relative z-10 flex-1">
                  "¡Excelente servicio! Me daba pánico manejar en Periférico, pero con las técnicas que me enseñaron ahora lo hago sin problema. El instructor fue súper paciente."
                </p>

                <div className="flex items-center justify-between pt-6 border-t border-slate-200 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-300 flex items-center justify-center text-sm font-bold text-slate-600 shadow-inner">
                      CM
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 leading-none mb-1">Carlos M.</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Alumno Graduado</p>
                    </div>
                  </div>
                  <a href="https://g.page/r/CXb43zwsdca7EBE/review" target="_blank" rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-white hover:shadow-sm transition-all group">
                    <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* Footer inside frame */}
          <footer className="mt-auto px-4 pt-6 pb-4 text-center border-t border-slate-200/60 mx-4 relative z-10">
            <p className="text-xs font-bold text-slate-400 tracking-wide">
              © {new Date().getFullYear()} AUTO ESCUELA AMERICANA · CDMX
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}
