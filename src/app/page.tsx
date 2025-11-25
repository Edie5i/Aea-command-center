
'use client';

import React from 'react';
import { Car, Bike, Info, Check, Star, MapPin } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AppFooter } from '@/components/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
                He recreado tu logotipo digitalmente (arriba) para que se vea perfecto.
                Esta es la vista principal de tu aplicación de producción.
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
            {[
              { title: 'Clases Teóricas', desc: 'Reglamento de tránsito actualizado.', icon: <Info className="text-blue-500" /> },
              { title: 'Práctica de Manejo', desc: 'Vehículos doble comando y seguros.', icon: <Car className="text-blue-500" /> },
              { title: 'Licencia', desc: 'Te ayudamos con el trámite oficial.', icon: <Check className="text-blue-500" /> }
            ].map((item, i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="mb-4 bg-blue-50 w-10 h-10 flex items-center justify-center rounded-lg">
                  {item.icon}
                </div>
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-slate-500 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
           <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 mx-auto">
            <Card className="shadow-lg rounded-xl h-full flex flex-col">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center gap-2 justify-center">
                  <MapPin className="h-6 w-6 text-primary" />
                  Nuestra Ubicación
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-center text-muted-foreground mb-4">
                    Torreón #49, Roma Sur, CDMX. ¡Te esperamos!
                </p>
                  <div className="aspect-video w-full overflow-hidden rounded-lg border">
                    <iframe
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3762.910334861842!2d-99.1650399256956!3d19.41584284067989!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85d1ff394a4f8999%3A0x89223c21a3295b9c!2sTorre%C3%B3n%2049%2C%20Roma%20Sur%2C%20Cuauht%C3%A9moc%2C%2006760%20Ciudad%20de%20M%C3%A9xico%2C%20CDMX!5e0!3m2!1sen!2smx!4v1719524940549!5m2!1sen!2smx"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen={true}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    ></iframe>
                  </div>
              </CardContent>
            </Card>
             <Card className="w-full max-w-3xl mt-0 bg-secondary">
              <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-center text-center sm:text-left sm:justify-between gap-4">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="bg-white p-3 rounded-full shadow-md">
                    <Star className="h-8 w-8 text-yellow-400 fill-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Calificación de 5 Estrellas</h3>
                    <p className="text-muted-foreground mt-1">Descubre por qué nuestros alumnos nos recomiendan en Google.</p>
                  </div>
                </div>
                <Button asChild className="shrink-0 mt-4 sm:mt-0">
                  <a
                    href="https://g.co/kgs/6Ks1oGz"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Star className="mr-2 h-4 w-4 fill-current" />
                    Leer Reseñas
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <AppFooter />
    </main>
  );
}
