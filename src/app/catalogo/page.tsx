
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Info } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const courses = [
  {
    title: 'Curso Principiante (Automático)',
    description: 'Perfecto si nunca has manejado. Aprende a conducir un coche automático con facilidad y confianza, enfocándote en las reglas de tránsito y maniobras esenciales. Para menores de edad, se puede tramitar la constancia para el permiso de conducir por $500 adicionales.',
    price: '3,900.00',
  },
  {
    title: 'Curso Principiante (Estándar)',
    description: 'Aprende a dominar la transmisión manual desde cero. Este curso cubre el control del clutch, cambios de marcha y los fundamentos de la conducción segura. Para menores de edad, se puede tramitar la constancia para el permiso de conducir por $500 adicionales.',
    price: '3,400.00',
  },
  {
    title: 'Curso Intermedio',
    description: 'Para personas que ya saben manejar pero quieren perfeccionar su técnica y ganar confianza.',
    price: '2,600.00',
  },
  {
    title: 'Curso de Reforzamiento',
    description: '¿Dejaste de manejar por un tiempo? Retoma la confianza y actualiza tus conocimientos.',
    price: '1,800.00',
  },
  {
    title: 'Curso para Personas Nerviosas',
    description: 'Un programa especial con paciencia y técnicas para superar la ansiedad al volante.',
    price: '5,100.00',
  },
  {
    title: 'Curso Mixto (Automático y Estándar)',
    description: 'Aprende a dominar ambos tipos de transmisión y amplía tus habilidades de conducción.',
    price: '5,100.00',
  },
  {
    title: 'Curso en Coche Propio',
    description: 'Clases personalizadas en tu propio vehículo para que te familiarices completamente con él.',
    price: '3,900.00',
  },
  {
    title: 'English Driving Course',
    description: 'Complete driving lessons for all levels, conducted entirely in English.',
    price: '4,800.00',
  },
  {
    title: 'Curso de Motocicleta',
    description: 'Curso de 8 horas para aprender a manejar motocicleta de forma segura y dominar las técnicas de conducción en la ciudad.',
    price: '4,300.00',
  },
];

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
        <div className="w-full max-w-5xl mb-4 flex flex-wrap justify-center gap-2">
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Inicio
            </Link>
          </Button>
        </div>
        
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card key={course.title} className="flex flex-col overflow-hidden shadow-lg rounded-xl">
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
