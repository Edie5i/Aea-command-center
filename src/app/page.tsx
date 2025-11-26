
'use client';

import React from 'react';
import { Car, Globe, Lightbulb, BookOpen, Star, MapPin, FileText, Bike, CalendarCheck, BookUser } from 'lucide-react';
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
    <main className="flex min-h-screen flex-col items-center bg-secondary p-4 sm:p-6 md:p-8">
      <div className="flex flex-col items-center text-center my-8 px-4">
        <LogoDigital size="large" />
        <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tight text-foreground mt-8">
          Auto Escuela Americana
        </h1>
        <p className="mt-2 max-w-xl text-lg text-muted-foreground">
          Cursos de manejo para todos los niveles
        </p>
        <div className="mt-6">
            <Button asChild size="lg">
                <Link href="/agenda">Agendar Curso</Link>
            </Button>
        </div>
      </div>

      <div className="container px-4 sm:px-6 md:px-8 pb-8 flex flex-col items-center gap-8">
        
        <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <Card className="flex flex-col">
            <CardContent className="p-6 flex-grow">
              <BookOpen className="h-8 w-8 text-primary mb-4" />
              <h3 className="font-bold text-lg mb-2">Programa del Curso</h3>
              <p className="text-muted-foreground text-sm">Consulta el manual de conducción completo.</p>
            </CardContent>
            <div className="p-6 pt-0">
              <Button asChild className="w-full">
                <Link href="/programa">Ver Programa</Link>
              </Button>
            </div>
          </Card>
          
          <Card className="flex flex-col">
            <CardContent className="p-6 flex-grow">
              <FileText className="h-8 w-8 text-primary mb-4" />
              <h3 className="font-bold text-lg mb-2">Examen Teórico</h3>
              <p className="text-muted-foreground text-sm">Pon a prueba tus conocimientos del reglamento.</p>
            </CardContent>
            <div className="p-6 pt-0">
              <Button asChild className="w-full">
                <Link href="/examen-teorico">Iniciar Examen</Link>
              </Button>
            </div>
          </Card>

          <Card className="flex flex-col">
            <CardContent className="p-6 flex-grow">
              <Lightbulb className="h-8 w-8 text-primary mb-4" />
              <h3 className="font-bold text-lg mb-2">Evalúa tus Habilidades</h3>
              <p className="text-muted-foreground text-sm">Descubre qué curso es el ideal para ti.</p>
            </CardContent>
            <div className="p-6 pt-0">
              <Button asChild className="w-full">
                <Link href="/evaluacion">Empezar Evaluación</Link>
              </Button>
            </div>
          </Card>

          <Card className="flex flex-col">
            <CardContent className="p-6 flex-grow">
              <Globe className="h-8 w-8 text-primary mb-4" />
              <h3 className="font-bold text-lg mb-2">English Driving Course</h3>
              <p className="text-muted-foreground text-sm">Comprehensive course for English speakers.</p>
            </CardContent>
            <div className="p-6 pt-0">
              <Button asChild className="w-full">
                <Link href="/english-course">View Course</Link>
              </Button>
            </div>
          </Card>

           <Card className="flex flex-col">
            <CardContent className="p-6 flex-grow">
              <BookUser className="h-8 w-8 text-primary mb-4" />
              <h3 className="font-bold text-lg mb-2">Notas de Alumno</h3>
              <p className="text-muted-foreground text-sm">Crea y comparte el avance de un alumno.</p>
            </CardContent>
            <div className="p-6 pt-0">
               <Button asChild className="w-full">
                <Link href="/notas-alumno">Crear Nota</Link>
              </Button>
            </div>
          </Card>
          
           <Card className="flex flex-col">
            <CardContent className="p-6 flex-grow">
              <CalendarCheck className="h-8 w-8 text-primary mb-4" />
              <h3 className="font-bold text-lg mb-2">Agenda tu Curso</h3>
              <p className="text-muted-foreground text-sm">Selecciona fechas y completa el formulario.</p>
            </CardContent>
            <div className="p-6 pt-0">
              <Button asChild className="w-full">
                <Link href="/agenda">Ir a la Agenda</Link>
              </Button>
            </div>
          </Card>

        </div>
      </div>

        {/* Sección de Google Maps */}
        <div className="w-full max-w-4xl mt-8">
            <h2 className="text-2xl font-bold text-center text-foreground mb-2 flex items-center justify-center gap-2"><MapPin className="text-primary" /> Dónde Encontrarnos</h2>
            <p className="text-center text-muted-foreground mb-6">Visítanos en nuestra sucursal de la Colonia Roma Sur.</p>
            <Card className="overflow-hidden shadow-lg">
              <CardContent className="p-0">
                <div className="w-full aspect-video">
                    <iframe
                        className="w-full h-full"
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3762.9649175317183!2d-99.16635672568777!3d19.41400644053912!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85d1ff3b16555555%3A0x1c80842f1f13380b!2sAuto%20Escuela%20Americana!5e0!3m2!1ses-419!2smx!4v1721856191011!5m2!1ses-419!2smx"
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
        <div className="w-full max-w-4xl mt-8">
             <h2 className="text-2xl font-bold text-center text-foreground mb-6">Lo que dicen nuestros alumnos</h2>
             <div className="grid md:grid-cols-3 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex gap-1 text-yellow-400 mb-3">
                            <Star className="fill-current h-5 w-5" /><Star className="fill-current h-5 w-5" /><Star className="fill-current h-5 w-5" /><Star className="fill-current h-5 w-5" /><Star className="fill-current h-5 w-5" />
                        </div>
                        <p className="text-muted-foreground text-sm mb-4">"¡Excelente servicio! El instructor fue súper paciente y profesional. Aprendí muchísimo y ahora me siento con total confianza para manejar en la ciudad."</p>
                        <p className="font-bold text-sm text-foreground">- Sofía H.</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardContent className="p-6">
                        <div className="flex gap-1 text-yellow-400 mb-3">
                            <Star className="fill-current h-5 w-5" /><Star className="fill-current h-5 w-5" /><Star className="fill-current h-5 w-5" /><Star className="fill-current h-5 w-5" /><Star className="fill-current h-5 w-5" />
                        </div>
                        <p className="text-muted-foreground text-sm mb-4">"Recomendado al 100%. Me daba pánico manejar en Periférico, pero con las técnicas que me enseñaron, ahora lo hago sin problema. ¡Gracias!"</p>
                        <p className="font-bold text-sm text-foreground">- Carlos M.</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardContent className="p-6">
                        <div className="flex gap-1 text-yellow-400 mb-3">
                           <Star className="fill-current h-5 w-5" /><Star className="fill-current h-5 w-5" /><Star className="fill-current h-5 w-5" /><Star className="fill-current h-5 w-5" /><Star className="fill-current h-5 w-5" />
                        </div>
                        <p className="text-muted-foreground text-sm mb-4">"Tomé el curso en inglés y fue una maravilla. El instructor hablaba perfecto y me ayudó a entender todas las reglas de tránsito de México."</p>
                        <p className="font-bold text-sm text-foreground">- John S.</p>
                    </CardContent>
                </Card>
             </div>
             <div className="text-center mt-6">
                 <Button asChild variant="outline">
                    <a href="https://g.page/r/CRI_tGNI-_xNEB0/review" target="_blank" rel="noopener noreferrer">
                        Leer más reseñas en Google
                    </a>
                </Button>
             </div>
        </div>

      <AppFooter />
    </main>
  );
}
