
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CreditCard, List, Globe, FileText, CalendarCheck } from 'lucide-react';
import { AppFooter } from '@/components/footer';
import { InlineWidget, PopupButton } from 'react-calendly';

export default function AgendaPage() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // IMPORTANT: Replace this with your actual Calendly link.
  const calendlyUrl = "https://calendly.com/your-username";

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <section className="relative w-full bg-muted py-12">
        <div className="relative z-10 flex flex-col items-center text-center px-4">
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            <Button asChild variant="outline" className="bg-background/80 backdrop-blur-sm hover:bg-background">
              <a href="https://www.autoescuelaamericana.com" target="_blank" rel="noopener noreferrer">
                <Globe className="mr-2 h-4 w-4" />
                www.autoescuelaamericana.com
              </a>
            </Button>
          </div>
          <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tight text-foreground">
            Agenda tu Curso
          </h1>
          <p className="mt-2 max-w-xl text-lg text-muted-foreground">
            Selecciona el tipo de curso y elige un horario disponible directamente en nuestro calendario.
          </p>
        </div>
      </section>
      <div className="container px-4 sm:px-6 md:px-8 py-8 flex flex-col items-center">
        <div className="mb-8 flex flex-wrap justify-center gap-2">
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Inicio
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/pagos">
              <CreditCard className="mr-2 h-4 w-4" />
              Pagos
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/catalogo">
                <List className="mr-2 h-4 w-4" />
                Catálogo
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/terminos">
                <FileText className="mr-2 h-4 w-4" />
                Términos
            </Link>
          </Button>
        </div>
        
        <div className="w-full max-w-4xl">
          <Card className="w-full shadow-lg rounded-xl mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarCheck className="h-6 w-6 text-primary" />
                Calendario de Reservas
              </CardTitle>
              <CardDescription>
                Elige tu curso y la fecha que más te convenga. Por favor, asegúrate de reemplazar el enlace de ejemplo con tu enlace real de Calendly en el código.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isClient ? (
                <div className="min-h-[700px] rounded-lg overflow-hidden">
                    <InlineWidget
                        url={calendlyUrl}
                        styles={{ height: '700px', width: '100%' }}
                    />
                </div>
              ) : (
                <div className="h-[700px] w-full bg-muted rounded-md animate-pulse flex items-center justify-center">
                  <p className="text-muted-foreground">Cargando calendario...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
       <AppFooter />
    </main>
  );
}
