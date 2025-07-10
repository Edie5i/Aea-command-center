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
  List,
} from 'lucide-react';
import { getCourses, type Course } from '@/services/courseService';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AppFooter } from '@/components/footer';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

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
    <main className="flex min-h-screen flex-col bg-secondary">
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
          <div className="text-center mb-12">
            <List className="mx-auto h-12 w-12 text-primary" />
            <h2 className="text-3xl font-bold tracking-tight mt-4">Nuestros Cursos</h2>
            <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
              Diseñados para cada nivel de experiencia. Encuentra el curso perfecto para ti y comienza a conducir con confianza.
            </p>
          </div>
          
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {courses.map((course) => (
                <Card key={course.id} className="flex flex-col shadow-lg rounded-xl hover:shadow-xl transition-shadow duration-300">
                  <CardHeader>
                      <CardTitle className="leading-tight text-xl">{course.title}</CardTitle>
                      <CardDescription className="text-primary font-semibold text-2xl pt-2">${course.price} MXN</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                      <p className="text-sm text-muted-foreground">{course.description}</p>
                  </CardContent>
                  <CardFooter>
                      <Button asChild className="w-full">
                          <Link href="/#contact-form">
                              <Plus className="mr-2 h-4 w-4" />
                              Solicitar Información
                          </Link>
                      </Button>
                  </CardFooter>
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
