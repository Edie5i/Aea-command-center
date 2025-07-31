
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CalendarDays, List, Globe, FileText, CreditCard } from 'lucide-react';
import { PaymentDetails } from '@/components/payment-details';
import { AppFooter } from '@/components/footer';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function PagosPage() {
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
          Información de Pago
        </h1>
        <p className="mt-2 max-w-xl text-lg text-muted-foreground">
          Elige tu método de pago preferido. Aceptamos transferencias y pagos con tarjeta.
        </p>
      </div>
      
      <div className="container px-4 sm:px-6 md:px-8 pb-8 flex flex-col items-center">
        <div className="w-full max-w-3xl mb-4 flex flex-wrap justify-center gap-2">
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Inicio
            </Link>
          </Button>
           <Button asChild variant="outline">
              <Link href="/agenda">
                  <CalendarDays className="mr-2 h-4 w-4" />
                  Agenda
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
        
        <PaymentDetails />

        <Separator className="my-8" />
        
         <Card className="w-full max-w-3xl shadow-lg rounded-xl bg-secondary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-6 w-6 text-primary" />
              Pagar con Tarjeta (Crédito/Débito)
            </CardTitle>
            <CardDescription>
              Usa nuestro portal seguro de Openpay para pagar con tarjeta. Ofrecemos meses sin intereses con tarjetas participantes.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <Button asChild size="lg">
                <Link href="/pagos/openpay">
                    Ir al Portal de Pago con Tarjeta
                </Link>
            </Button>
          </CardContent>
        </Card>

      </div>
      
      <AppFooter />
    </main>
  );
}
