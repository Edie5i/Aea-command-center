
'use client';

import React, { useState } from 'react';
import { Car, Bike, Info, Code, Image as ImageIcon, Copy, Check, Star, MapPin, MessageSquare, User } from 'lucide-react';
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


// Componentes de utilidad para la UI
const StepCard = ({ number, title, desc, children }: { number: string, title: string, desc: string, children?: React.ReactNode }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
        {number}
      </div>
      <h3 className="font-bold text-lg text-slate-800">{title}</h3>
    </div>
    <p className="text-slate-600 mb-4 pl-11 text-sm">{desc}</p>
    {children && <div className="pl-11">{children}</div>}
  </div>
);

const CodeBlock = ({ code }: { code: string }) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <div className="absolute right-2 top-2">
        <button 
          onClick={handleCopy}
          className="p-1.5 bg-slate-700 text-slate-300 rounded hover:bg-slate-600 transition-colors"
          title="Copiar código"
        >
          {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
        </button>
      </div>
      <pre className="bg-slate-900 text-slate-50 p-4 rounded-lg text-xs sm:text-sm font-mono overflow-x-auto whitespace-pre-wrap">
        <code>{code}</code>
      </pre>
    </div>
  );
};


export default function Home() {
  const [activeTab, setActiveTab] = useState('preview');

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* Navegación Simple */}
      <nav className="bg-white border-b border-slate-200 px-4 py-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="font-bold text-blue-900 flex items-center gap-2">
            <Car size={20} /> Auto Escuela Americana
          </div>
          <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
            <button 
              onClick={() => setActiveTab('preview')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'preview' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Vista Previa
            </button>
            <button 
              onClick={() => setActiveTab('code')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'code' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Código Firebase
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-6">
        {activeTab === 'preview' ? (
          <div className="animate-in fade-in duration-500">
            {/* Héroe con el Logo */}
            <div className="flex flex-col items-center justify-center py-10 gap-8">
              <LogoDigital size="large" />
              
              <div className="text-center max-w-lg space-y-4">
                <h2 className="text-2xl font-bold text-slate-800">Bienvenido a tu nueva App</h2>
                <p className="text-slate-600">
                  He recreado tu logotipo digitalmente (arriba) para que se vea perfecto. 
                  Si prefieres usar la imagen original (`.jpg`) subida a Firebase, ve a la pestaña 
                  <strong> "Código Firebase"</strong> para ver cómo integrarla.
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
        ) : (
          <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-8">
            <div className="bg-blue-50 border border-blue-100 p-6 rounded-xl flex gap-4 items-start">
              <Info className="text-blue-600 shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-blue-900 text-lg">Integración con Firebase Storage</h3>
                <p className="text-blue-700 mt-1 text-sm">
                  Sigue estos pasos para subir tu imagen <code>1000322698.jpg</code> a Firebase y mostrarla en tu aplicación.
                </p>
              </div>
            </div>

            {/* Paso 1 */}
            <StepCard 
              number="1" 
              title="Configura Firebase" 
              desc="Asegúrate de tener el SDK instalado e inicializado."
            >
              <CodeBlock code={`// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  // ... tus credenciales de firebase ...
  storageBucket: "tu-app.appspot.com" 
};

const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);`} />
            </StepCard>

            {/* Paso 2 */}
            <StepCard 
              number="2" 
              title="Sube la Imagen Manualmente (Opción Fácil)" 
              desc="Ve a tu Consola de Firebase > Storage > Files y sube tu archivo 'logo-escuela.jpg'. Copia el nombre exacto."
            />

            {/* Paso 3 */}
            <StepCard 
              number="3" 
              title="Código para mostrar la imagen" 
              desc="Usa este componente en tu React App para obtener la URL y mostrar la imagen."
            >
              <CodeBlock code={`import { useState, useEffect } from 'react';
import { ref, getDownloadURL } from "firebase/storage";
import { storage } from './firebaseConfig';

const LogoDesdeFirebase = () => {
  const [imageUrl, setImageUrl] = useState(null);

  useEffect(() => {
    // Referencia a tu imagen en Storage
    const logoRef = ref(storage, 'logo-escuela.jpg');

    getDownloadURL(logoRef)
      .then((url) => {
        setImageUrl(url);
      })
      .catch((error) => {
        console.error("Error al cargar el logo:", error);
      });
  }, []);

  if (!imageUrl) return <div>Cargando logo...</div>;

  return (
    <img 
      src={imageUrl} 
      alt="Auto Escuela Americana" 
      className="w-40 h-40 rounded-full object-cover" 
    />
  );
};`} />
            </StepCard>

          </div>
        )}
      </div>

      <AppFooter />
    </main>
  );
}

    