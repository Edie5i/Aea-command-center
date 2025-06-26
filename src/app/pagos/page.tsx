import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Banknote, CalendarDays, ShoppingBag } from 'lucide-react';
import { PaymentDetails } from '@/components/payment-details';

export default function PagosPage() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-background p-4 sm:p-6 md:p-8">
      <div className="flex flex-col items-center text-center my-8 px-4">
        <Link href="/" className="mb-4 text-sm text-primary hover:underline">
          Auto Escuela Americana
        </Link>
        <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tight text-foreground">
          Información de Pago
        </h1>
        <p className="mt-2 max-w-xl text-lg text-muted-foreground">
          Facilita a tus alumnos los detalles para realizar el pago de sus cursos de manejo.
        </p>
      </div>
      
      <div className="container px-4 sm:px-6 md:px-8 pb-8 flex flex-col items-center">
        <div className="w-full max-w-3xl mb-4 flex flex-wrap justify-center gap-2">
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Inicio
            </Link>
          </Button>
           <Button asChild variant="outline">
              <Link href="/agenda">
                  <CalendarDays className="mr-2 h-4 w-4" />
                  Ver Agenda
              </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="https://wa.me/c/5215634433212" target="_blank" rel="noopener noreferrer">
                <ShoppingBag className="mr-2 h-4 w-4" />
                Ver Catálogo y Precios
            </Link>
          </Button>
        </div>
        
        <PaymentDetails />
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
