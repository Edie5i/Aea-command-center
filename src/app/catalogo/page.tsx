
'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Info, AlertCircle, Search } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getCourses, type Course } from '@/services/courseService';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const MopedIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-6 w-6"
  >
    <path d="M12 18.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
    <path d="M19 18.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
    <path d="m5 11 2.5 2.5" />
    <path d="M6 13.5h1l2 2" />
    <path d="m10.5 11.5 2-2 2.5 2.5" />
    <path d="m14 8 2 2" />
    <path d="M12 11.5V6a2 2 0 0 0-2-2h-1a2 2 0 0 0-2 2v2" />
  </svg>
);


export default function CatalogoPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [maxPrice, setMaxPrice] = useState<string>('');

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

  const filteredCourses = useMemo(() => {
    if (!maxPrice) {
      return courses;
    }
    const priceLimit = parseFloat(maxPrice);
    if (isNaN(priceLimit)) {
      return courses;
    }
    return courses.filter(course => {
      const coursePrice = parseFloat(course.price.replace(/,/g, ''));
      return !isNaN(coursePrice) && coursePrice <= priceLimit;
    });
  }, [courses, maxPrice]);

  return (
    <main className="flex min-h-screen flex-col items-center bg-background p-4 sm:p-6 md:p-8">
      <div className="flex flex-col items-center text-center my-8 px-4">
        <Link href="/" className="mb-4 text-sm text-primary hover:underline">
          Auto Escuela Americana
        </Link>
        <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tight text-foreground">
          Catálogo de Cursos
        </h1>
        <p className="mt-2 max-w-xl text-lg text-muted-foreground">
          Elige el curso que mejor se adapte a tus necesidades. Todos los precios son en MXN.
        </p>
      </div>
      
      <div className="container px-4 sm:px-6 md:px-8 pb-8 flex flex-col items-center">
        <div className="w-full max-w-5xl mb-6 flex flex-wrap justify-center items-center gap-4">
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Inicio
            </Link>
          </Button>
           <div className="flex-grow max-w-xs">
            <Label htmlFor="price-filter" className="sr-only">Filtrar por precio máximo</Label>
            <div className="relative">
                 <Input
                    id="price-filter"
                    type="number"
                    placeholder="Filtrar por precio máximo..."
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="pl-10"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </div>
        
        <div className="w-full max-w-5xl">
          {isLoading ? (
            <p className="text-center text-muted-foreground">Cargando cursos...</p>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error al Cargar Cursos</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : filteredCourses.length === 0 ? (
            <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>No se encontraron cursos</AlertTitle>
                <AlertDescription>
                    No hay cursos que coincidan con tu búsqueda. Intenta con otro precio o revisa que la colección 'courses' en Firestore no esté vacía.
                </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <Card key={course.id} className="flex flex-col overflow-hidden shadow-lg rounded-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {course.title.includes('Motocicleta') && <MopedIcon />}
                      {course.title}
                    </CardTitle>
                    <CardDescription>{course.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-3xl font-bold text-primary">${course.price}</p>
                  </CardContent>
                  <CardFooter>
                    <Button asChild className="w-full">
                        <Link href="/#contact-form">
                            <Info className="mr-2 h-4 w-4" />
                            Solicitar Información
                        </Link>
                    </Button>
                  </CardFooter>
                </Card>
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
