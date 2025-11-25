
'use client';

import React from 'react';
import { Car, Bike, Check, FileText, Globe, Lightbulb, BookOpen, Star, MapPin } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AppFooter } from '@/components/footer';
import { Card, CardContent } from '@/components/ui/card';

// Este componente recrea tu logo usando CSS puro para que sea escalable
const LogoDigital = ({ size = "large" }: { size?: "large" | "small" }) => {
  const containerClasses = size === "large" 
    ? "w-80 h-80 sm:w-96 sm:h-96" 
    : "w-40 h-40";

  return (
    <div className={`${containerClasses} rounded-full bg-[#004aad] flex flex-col items-center justify-center relative shadow-xl border-4 border-blue-800 overflow-hidden mx-auto transition-transform`}>
      {/* Decoración de fondo sutil */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-gradient-to-br from-white to-transparent pointer-events-none"></div>

      <div className="flex items-center justify-between w-full px-6 mb-2 z-10">
        <Bike className="text-black w-12 h-12 sm:w-16 sm:h-16 drop-shadow-lg" fill="currentColor" />
        <div className="flex flex-col items-center text-center">
          <h1 className="text-white font-black text-3xl sm:text-4xl leading-tight tracking-tight drop-shadow-md">
            AUTO<br />ESCUELA<br />AMERICANA
          </h1>
        </div>
        <Car className="text-black w-12 h-12 sm:w-16 sm:h-16 drop-shadow-lg" fill="currentColor" />
      </div>

      {/* Línea decorativa */}
      <div className="w-2/3 h-1.5 bg-cyan-400 rounded-full my-2 shadow-sm z-10"></div>

      {/* Subtítulo */}
      <div className="text-center px-8 z-10">
        <p className="text-amber-400 font-bold text-xs sm:text-sm tracking-wider drop-shadow-sm">
          CAPACITACION INICIAL Y
        </p>
        <p className="text-amber-400 font-bold text-xs sm:text-sm tracking-wider drop-shadow-sm">
          ESPECIALIZADA
        </p>
      </div>
    </div>
  );
};

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* Navegación Simple */}
      <nav className="bg-white border-b border-slate-200 px-4 py-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="font-bold text-blue-900 flex items-center gap-2">
            <Car size={20} /> Auto Escuela Americana
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-in fade-in duration-500">
          {/* Héroe con el Logo */}
          <div className="flex flex-col items-center justify-center py-10 gap-8">
            <LogoDigital size="large" />
            
            <div className="text-center max-w-lg space-y-4">
              <h2 className="text-2xl font-bold text-slate-800">Bienvenido a tu nueva App</h2>
              <p className="text-slate-600">
                Cursos de manejo para todos los niveles
              </p>
              <div className="flex gap-3 justify-center pt-4">
                  <Button asChild className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-2 rounded-full font-semibold transition-colors shadow-lg shadow-blue-700/20">
                    <Link href="/agenda">Inscribirse Ahora</Link>
                  </Button>
                  <Button asChild variant="outline" className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-6 py-2 rounded-full font-semibold transition-colors">
                    <Link href="/catalogo">Ver Cursos</Link>
                  </Button>
              </div>
            </div>
          </div>

          {/* Grid de características demo */}
          <div className="grid md:grid-cols-3 gap-6 mt-10 border-t border-slate-200 pt-10">
            <Link href="/programa" className="block bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all">
              <div className="mb-4 bg-blue-50 w-10 h-10 flex items-center justify-center rounded-lg">
                <BookOpen className="text-blue-500" />
              </div>
              <h3 className="font-bold text-lg mb-2">Programa del Curso</h3>
              <p className="text-slate-500 text-sm">Consulta el manual de conducción completo.</p>
            </Link>
             <Link href="/examen-teorico" className="block bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all">
              <div className="mb-4 bg-blue-50 w-10 h-10 flex items-center justify-center rounded-lg">
                <FileText className="text-blue-500" />
              </div>
              <h3 className="font-bold text-lg mb-2">Examen Teórico</h3>
              <p className="text-slate-500 text-sm">Pon a prueba tus conocimientos del reglamento.</p>
            </Link>
            <Link href="/evaluacion" className="block bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all">
              <div className="mb-4 bg-blue-50 w-10 h-10 flex items-center justify-center rounded-lg">
                <FileText className="text-blue-500" />
              </div>
              <h3 className="font-bold text-lg mb-2">Evalúa tus Habilidades</h3>
              <p className="text-slate-500 text-sm">Descubre qué curso es el ideal para ti.</p>
            </Link>
            <Link href="/consejos" className="block bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all">
              <div className="mb-4 bg-blue-50 w-10 h-10 flex items-center justify-center rounded-lg">
                <Lightbulb className="text-blue-500" />
              </div>
              <h3 className="font-bold text-lg mb-2">Consejos de Manejo</h3>
              <p className="text-slate-500 text-sm">Obtén tips de conducción de nuestra IA.</p>
            </Link>

            <Link href="/english-course" className="block bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all">
              <div className="mb-4 bg-blue-50 w-10 h-10 flex items-center justify-center rounded-lg">
                <Globe className="text-blue-500" />
              </div>
              <h3 className="font-bold text-lg mb-2">English Driving Course</h3>
              <p className="text-slate-500 text-sm">Comprehensive course for English speakers.</p>
            </Link>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="mb-4 bg-blue-50 w-10 h-10 flex items-center justify-center rounded-lg">
                  <Check className="text-blue-500" />
                </div>
                <h3 className="font-bold text-lg mb-2">Licencia</h3>
                <p className="text-slate-500 text-sm">Te ayudamos con el trámite oficial.</p>
            </div>
          </div>

          {/* Sección de Google Maps */}
          <div className="mt-16 border-t border-slate-200 pt-10">
            <h2 className="text-2xl font-bold text-center text-slate-800 mb-2 flex items-center justify-center gap-2"><MapPin className="text-blue-500" /> Dónde Encontrarnos</h2>
            <p className="text-center text-slate-600 mb-6">Visítanos en nuestra sucursal de la Colonia Roma Sur.</p>
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="w-full aspect-video">
                    <iframe
                        className="w-full h-full"
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3762.9649175317183!2d-99.16635672568777!3d19.41400644053912!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85d1ff3b16555555%3A0x1c80842f1f13380b!2sAuto%20Escuela%20Americana!5e0!3m2!1ses-419!2smx!4v1700000000000"
                        style={{ border: 0 }}
                        allowFullScreen={true}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Ubicación de Auto Escuela Americana"
                    ></iframe>
                </div>
              </CardContent>
            </Card>
            <div className="text-center mt-4">
                 <Button asChild variant="link">
                    <a href="https://maps.app.goo.gl/yYv8DqS3bApt2jQW7" target="_blank" rel="noopener noreferrer">
                        Ver en Google Maps
                    </a>
                </Button>
            </div>
          </div>

          {/* Sección de Testimonios */}
          <div className="mt-16 border-t border-slate-200 pt-10">
             <h2 className="text-2xl font-bold text-center text-slate-800 mb-6">Lo que dicen nuestros alumnos</h2>
             <div className="grid md:grid-cols-3 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex gap-1 text-yellow-500 mb-3">
                            <Star className="fill-current" /><Star className="fill-current" /><Star className="fill-current" /><Star className="fill-current" /><Star className="fill-current" />
                        </div>
                        <p className="text-slate-600 text-sm mb-4">"¡Excelente servicio! El instructor fue súper paciente y profesional. Aprendí muchísimo y ahora me siento con total confianza para manejar en la ciudad."</p>
                        <p className="font-bold text-sm text-slate-800">- Sofía H.</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardContent className="p-6">
                        <div className="flex gap-1 text-yellow-500 mb-3">
                            <Star className="fill-current" /><Star className="fill-current" /><Star className="fill-current" /><Star className="fill-current" /><Star className="fill-current" />
                        </div>
                        <p className="text-slate-600 text-sm mb-4">"Recomendado al 100%. Me daba pánico manejar en Periférico, pero con las técnicas que me enseñaron, ahora lo hago sin problema. ¡Gracias!"</p>
                        <p className="font-bold text-sm text-slate-800">- Carlos M.</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardContent className="p-6">
                        <div className="flex gap-1 text-yellow-500 mb-3">
                           <Star className="fill-current" /><Star className="fill-current" /><Star className="fill-current" /><Star className="fill-current" /><Star className="fill-current" />
                        </div>
                        <p className="text-slate-600 text-sm mb-4">"Tomé el curso en inglés y fue una maravilla. El instructor hablaba perfecto y me ayudó a entender todas las reglas de tránsito de México."</p>
                        <p className="font-bold text-sm text-slate-800">- John S.</p>
                    </CardContent>
                </Card>
             </div>
             <div className="text-center mt-6">
                 <Button asChild variant="outline">
                    <a href="https://search.google.com/local/reviews?placeid=ChIJ-ZlSikb-0YUR0JmS3w-4O3A" target="_blank" rel="noopener noreferrer">
                        Leer más reseñas en Google
                    </a>
                </Button>
             </div>
          </div>
        </div>
      </div>

      <AppFooter />
    </main>
  );
}
