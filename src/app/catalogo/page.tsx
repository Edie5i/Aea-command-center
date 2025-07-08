'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Info, 
  AlertCircle, 
  Plus,
  Loader2,
} from 'lucide-react';
import { getCourses, type Course } from '@/services/courseService';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AppFooter } from '@/components/footer';

export default function CatalogoPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCourses() {
      setIsLoading(true);
      setError(null);
      try {
        const fetchedCourses = await getCourses();
        setCourses(fetchedCourses);
      } catch (e) {
        console.error("Failed to fetch courses:", e);
        const errorMessage = e instanceof Error ? e.message : String(e);
        setError(`No se pudieron cargar los cursos. Error: ${errorMessage}`);
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

      <div className="container flex-grow p-4 sm:p-6 md:p-8 flex justify-center">
        <div className="w-full max-w-4xl">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 text-muted-foreground pt-10">
                <Loader2 className="h-5 w-5 animate-spin" />
                <p>Cargando cursos...</p>
            </div>
          ) : error ? (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error al Cargar Cursos</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : courses.length === 0 ? (
            <div className="text-center text-muted-foreground pt-10">
                <Info className="h-6 w-6 mx-auto mb-2" />
                <h3 className="text-lg font-semibold text-foreground">No se encontraron cursos</h3>
                <p>No hay cursos configurados actualmente.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {courses.map((course) => (
                <div key={course.id} className="flex items-start gap-4 p-4 border rounded-xl shadow-sm hover:bg-muted/50 transition-colors">
                  <div className="flex-grow">
                      <h3 className="font-bold text-lg leading-tight">{course.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{course.description}</p>
                      <p className="text-lg font-semibold text-primary mt-2">${course.price} MXN</p>
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
      
      <AppFooter />
    </main>
  );
}
