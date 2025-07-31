
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Globe, FileText } from 'lucide-react';
import { AppFooter } from '@/components/footer';
import { OpenpayForm } from './form';

export default function OpenpayPage() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-background p-4 sm:p-6 md:p-8">
      <div className="flex flex-col items-center text-center my-8 px-4">
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          <Button asChild variant="outline">
            <a href="https://www.autoescuelaamericana.com" target="_blank" rel="noopener noreferrer">
              <Globe className="mr-2 h-4 w-4" />
              www.autoescuelaamericana.com
            </a>
          </Button>
        </div>
        <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tight text-foreground">
          Pago con Tarjeta
        </h1>
        <p className="mt-2 max-w-xl text-lg text-muted-foreground">
          Completa el formulario para recibir tu enlace de pago seguro de Openpay.
        </p>
      </div>
      
      <div className="container px-4 sm:px-6 md:px-8 pb-8 flex flex-col items-center">
        <div className="w-full max-w-3xl mb-4 flex flex-wrap justify-center gap-2">
          <Button asChild variant="outline">
            <Link href="/pagos">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Métodos de Pago
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/terminos">
                <FileText className="mr-2 h-4 w-4" />
                Términos
            </Link>
          </Button>
        </div>
        
        <OpenpayForm />

      </div>
      
      <AppFooter />
    </main>
  );
}
