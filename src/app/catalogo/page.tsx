
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Info, 
  AlertCircle, 
  Plus
} from 'lucide-react';
import { getCourses, type Course } from '@/services/courseService';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function CatalogoPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCourses() {
      try {
        const fetchedCourses = await getCourses();
        setCourses(fetchedCourses);
      } catch (e) {
        console.error("Failed to fetch courses:", e);
        const errorMessage = e instanceof Error ? e.message : String(e);

        if (errorMessage.includes('PERMISSION_DENIED') && errorMessage.includes('YOUR_PROJECT_ID')) {
            setError("Parece que tu proyecto de Firebase no está configurado correctamente. El error indica que se está intentando conectar con 'YOUR_PROJECT_ID'. Por favor, ve al archivo `.env` en la raíz de tu proyecto y reemplaza los valores de ejemplo con las credenciales reales de tu proyecto de Firebase. Puedes encontrarlas en la configuración de tu proyecto en la consola de Firebase.");
        } else if (errorMessage.includes('PERMISSION_DENIED')) {
            setError("Se ha denegado el permiso para acceder a los cursos. Por favor, revisa las reglas de seguridad de tu base de datos Firestore en la Consola de Firebase para asegurar que la lectura de la colección 'courses' está permitida.");
        } else {
            setError("No se pudieron cargar los cursos. Por favor, verifica tu conexión y asegúrate de que la configuración de Firebase en el archivo .env sea correcta y que la colección 'courses' exista en Firestore.");
        }
      } finally {
        setIsLoading(false);
      }
    }
    fetchCourses();
  }, []);

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 w-full border-b bg-background/80 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="icon">
              <Link href="/">
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Volver al inicio</span>
              </Link>
            </Button>
            <h1 className="text-xl font-bold">Catálogo de Cursos</h1>
          </div>
        </div>
      </header>

      <div className="container flex-grow p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-5xl">
          {isLoading ? (
            <p className="text-center text-muted-foreground">Cargando cursos...</p>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error al Cargar Cursos</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : courses.length === 0 ? (
            <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>No se encontraron cursos</AlertTitle>
                <AlertDescription>
                    Actualmente no hay cursos disponibles. Por favor, revisa que la colección 'courses' en Firestore no esté vacía.
                </AlertDescription>
            </Alert>
          ) : (
            <div className="flex flex-col gap-4">
              {courses.map((course) => (
                <div key={course.id} className="flex items-center gap-4 p-3 border rounded-xl shadow-sm hover:bg-muted/50 transition-colors">
                  <Image
                      src={course.imageUrl || `https://placehold.co/100x100.png`}
                      alt={course.title}
                      width={80}
                      height={80}
                      className="rounded-lg object-cover aspect-square"
                      data-ai-hint="driving course"
                  />
                  <div className="flex-grow overflow-hidden">
                      <h3 className="font-bold text-lg leading-tight truncate">{course.title}</h3>
                      <p className="text-sm text-muted-foreground truncate">{course.description}</p>
                      <p className="text-lg font-semibold text-primary mt-1">${course.price} MXN</p>
                  </div>
                  <Button asChild size="icon" className="rounded-full flex-shrink-0">
                      <Link href="/#contact-form">
                          <Plus className="h-5 w-5" />
                          <span className="sr-only">Solicitar Información</span>
                      </Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <footer className="w-full mt-auto py-8 text-center text-sm text-muted-foreground border-t">
        <p>
          <a href="https://www.autoescuelaamericana.com" target="_blank" rel="noopener noreferrer" className="hover:underline">
            www.autoescuelaamericana.com
          </a>
        </p>
        <p className="mt-2">
          <Link href="/terminos" className="hover:underline">
            Términos y Condiciones
          </Link>
        </p>
        <p className="mt-2">
          Powered by Next.js and Genkit.
        </p>
      </footer>
    </main>
  );
}
